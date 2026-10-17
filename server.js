const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const wordPairs = require('./words');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static frontend if dist exists
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Rooms state storage: roomCode -> roomData
const rooms = new Map();

// Helper to generate unique 5-letter room codes
function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  do {
    code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  } while (rooms.has(code));
  return code;
}

// Bot hint generator vocabulary for fun contextual play
const botClues = {
  "Coffee": ["caffeine", "morning", "brew", "espresso", "beans", "hot", "roast", "mug"],
  "Tea": ["leaves", "herbal", "kettle", "afternoon", "cup", "green", "steep", "infusion"],
  "Pizza": ["crust", "cheese", "slice", "dough", "oven", "pepperoni", "italian", "delivery"],
  "Burger": ["patty", "bun", "grill", "fastfood", "beef", "sesame", "onion", "ketchup"],
  "Sun": ["bright", "daylight", "heat", "star", "solar", "sky", "yellow", "dawn"],
  "Moon": ["night", "crater", "lunar", "orbit", "glow", "silver", "tide", "crescent"],
  "Ocean": ["waves", "saltwater", "deep", "tide", "marine", "vast", "current", "atlantic"],
  "Lake": ["freshwater", "shore", "calm", "dock", "shallow", "fishing", "inland", "canoe"],
  "Dog": ["bark", "puppy", "leash", "canine", "tail", "fetch", "faithful", "fur"],
  "Cat": ["meow", "purr", "whiskers", "feline", "claws", "paws", "nap", "scratch"],
  "default": ["mysterious", "intriguing", "vibrant", "essential", "classic", "distinct", "curious"]
};

function getBotClue(word) {
  if (word && botClues[word]) {
    const list = botClues[word];
    return list[Math.floor(Math.random() * list.length)];
  }
  const generic = botClues.default;
  return generic[Math.floor(Math.random() * generic.length)];
}

const TURN_DURATION_MS = 60000; // 1 minute (60 seconds) to think and type

// Clean sanitized room state for broadcast
function getPublicGameState(room) {
  return {
    phase: room.phase,
    roomCode: room.roomCode,
    players: room.players.map(p => ({
      id: p.id,
      name: p.name,
      isHost: p.id === room.hostId,
      isAlive: p.isAlive,
      hint: p.hint || null,
      votes: p.votes || 0,
      isBot: !!p.isBot,
      // Only reveal role and word if game is over
      role: room.phase === 'result' ? p.role : undefined,
      word: room.phase === 'result' ? p.word : undefined
    })),
    settings: room.settings,
    currentTurn: room.currentTurn,
    turnEndTime: room.turnEndTime || null,
    turnDuration: TURN_DURATION_MS,
    mrWhitePlayerId: room.mrWhitePlayerId || null,
    winner: room.winner
  };
}

function broadcastRoomState(room) {
  io.to(room.roomCode).emit('game-state', getPublicGameState(room));
}

function startHintsRound(room) {
  if (room.turnTimeout) {
    clearTimeout(room.turnTimeout);
    room.turnTimeout = null;
  }
  room.phase = 'hints';
  room.players.forEach(p => { 
    p.hint = null; 
    p.votedFor = null; 
    p.votes = 0; 
  });

  // Randomize turn sequence among alive players
  const alive = room.players.filter(p => p.isAlive);
  const shuffled = [...alive].sort(() => Math.random() - 0.5);
  room.players.sort((a, b) => {
    const idxA = shuffled.indexOf(a);
    const idxB = shuffled.indexOf(b);
    return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
  });

  advanceTurn(room);
}

function advanceTurn(room) {
  if (room.turnTimeout) {
    clearTimeout(room.turnTimeout);
    room.turnTimeout = null;
  }

  const alivePlayers = room.players.filter(p => p.isAlive);
  const remaining = alivePlayers.filter(p => !p.hint);

  if (remaining.length === 0) {
    // All alive players gave hints -> Discussion phase!
    room.phase = 'discussion';
    room.currentTurn = null;
    room.turnEndTime = null;
    broadcastRoomState(room);
  } else {
    // Set next turn
    const nextPlayer = remaining[0];
    room.currentTurn = nextPlayer.id;
    room.turnEndTime = Date.now() + TURN_DURATION_MS;
    broadcastRoomState(room);

    // If current turn is a bot, handle hint automatically after brief delay
    if (nextPlayer.isBot) {
      room.turnTimeout = setTimeout(() => {
        if (room.phase === 'hints' && room.currentTurn === nextPlayer.id) {
          const clue = nextPlayer.word ? getBotClue(nextPlayer.word) : "subtle";
          nextPlayer.hint = clue;
          advanceTurn(room);
        }
      }, 1500);
    } else {
      // 2-minute timer for human player to think and type
      room.turnTimeout = setTimeout(() => {
        if (room.phase === 'hints' && room.currentTurn === nextPlayer.id && !nextPlayer.hint) {
          nextPlayer.hint = "Time Expired";
          advanceTurn(room);
        }
      }, TURN_DURATION_MS);
    }
  }
}

function checkWinConditions(room) {
  const aliveCivilians = room.players.filter(p => p.isAlive && p.role === 'civilian');
  const aliveImposters = room.players.filter(p => p.isAlive && p.role === 'imposter');

  if (aliveImposters.length === 0) {
    // Civilians eliminated all imposters!
    room.winner = 'civilians';
    finishGame(room);
    return true;
  }

  if (aliveImposters.length >= aliveCivilians.length) {
    // Imposters outnumber or equal civilians!
    room.winner = 'imposters';
    finishGame(room);
    return true;
  }

  return false;
}

function finishGame(room, mrWhiteGuessInfo = null) {
  room.phase = 'result';
  room.currentTurn = null;

  const revealData = {
    players: room.players.map(p => ({
      id: p.id,
      name: p.name,
      role: p.role,
      word: p.word
    })),
    civilianWord: room.civilianWord,
    imposterWord: room.imposterWord,
    mrWhiteGuess: mrWhiteGuessInfo ? mrWhiteGuessInfo.guess : null,
    mrWhiteGuessCorrect: mrWhiteGuessInfo ? mrWhiteGuessInfo.correct : null
  };

  io.to(room.roomCode).emit('reveal-all-roles', revealData);
  broadcastRoomState(room);
}

io.on('connection', (socket) => {
  let currentRoomCode = null;
  let currentPlayerId = socket.id;

  // Create room
  socket.on('create-room', ({ playerName, settings }, callback) => {
    const name = (playerName || '').trim();
    if (!name) {
      return callback && callback({ success: false, error: "Player name is required." });
    }

    const roomCode = generateRoomCode();
    const newRoom = {
      roomCode,
      hostId: socket.id,
      phase: 'lobby',
      settings: {
        mrWhiteMode: !!(settings && settings.mrWhiteMode),
        imposterCount: (settings && settings.imposterCount) || 1
      },
      players: [{
        id: socket.id,
        name: name.slice(0, 20),
        isHost: true,
        isAlive: true,
        hint: null,
        votes: 0,
        role: null,
        word: null
      }],
      currentTurn: null,
      winner: null,
      civilianWord: null,
      imposterWord: null,
      chatMessages: []
    };

    rooms.set(roomCode, newRoom);
    currentRoomCode = roomCode;
    socket.join(roomCode);

    callback && callback({ success: true, playerId: socket.id, roomCode });
    broadcastRoomState(newRoom);
  });

  // Join room
  socket.on('join-room', ({ roomCode, playerName }, callback) => {
    const code = (roomCode || '').trim().toUpperCase();
    const name = (playerName || '').trim();

    if (!code || !name) {
      return callback && callback({ success: false, error: "Room code and player name are required." });
    }

    const room = rooms.get(code);
    if (!room) {
      return callback && callback({ success: false, error: "Room not found. Check your room code." });
    }

    if (room.phase !== 'lobby') {
      return callback && callback({ success: false, error: "Game already in progress." });
    }

    // Check duplicate name
    if (room.players.some(p => p.name.toLowerCase() === name.toLowerCase())) {
      return callback && callback({ success: false, error: "A player with that name is already in the room." });
    }

    const newPlayer = {
      id: socket.id,
      name: name.slice(0, 20),
      isHost: false,
      isAlive: true,
      hint: null,
      votes: 0,
      role: null,
      word: null
    };

    room.players.push(newPlayer);
    currentRoomCode = code;
    socket.join(code);

    callback && callback({ success: true, playerId: socket.id });
    broadcastRoomState(room);

    // Send existing chat history
    if (room.chatMessages.length > 0) {
      socket.emit('chat-history', room.chatMessages);
    }
  });

  // Optional Add Bot (for testing with solo players)
  socket.on('add-bot', (data, callback) => {
    if (!currentRoomCode) return;
    const room = rooms.get(currentRoomCode);
    if (!room || room.hostId !== socket.id || room.phase !== 'lobby') return;

    const botNames = ['Agent Smith', 'Neo', 'Trinity', 'Morpheus', 'Cipher', 'Oracle', 'Ghost'];
    const usedNames = new Set(room.players.map(p => p.name));
    const available = botNames.filter(n => !usedNames.has(n));
    const botName = available[0] || `Bot ${room.players.length + 1}`;
    const botId = 'bot_' + Math.random().toString(36).substring(2, 9);

    room.players.push({
      id: botId,
      name: botName,
      isHost: false,
      isAlive: true,
      hint: null,
      votes: 0,
      role: null,
      word: null,
      isBot: true
    });

    callback && callback({ success: true });
    broadcastRoomState(room);
  });

  // Update Settings
  socket.on('update-settings', ({ settings }) => {
    if (!currentRoomCode) return;
    const room = rooms.get(currentRoomCode);
    if (!room || room.hostId !== socket.id || room.phase !== 'lobby') return;

    if (settings) {
      if (typeof settings.mrWhiteMode === 'boolean') {
        room.settings.mrWhiteMode = settings.mrWhiteMode;
      }
      if (typeof settings.imposterCount === 'number') {
        const maxImposters = Math.max(1, room.players.length - 1);
        room.settings.imposterCount = Math.max(1, Math.min(maxImposters, settings.imposterCount));
      }
      broadcastRoomState(room);
    }
  });

  // Start Game
  socket.on('start-game', (callback) => {
    if (!currentRoomCode) return;
    const room = rooms.get(currentRoomCode);
    if (!room || room.hostId !== socket.id) {
      return callback && callback({ success: false, error: "Only the host can start the game." });
    }

    if (room.players.length < 3) {
      return callback && callback({ success: false, error: "At least 3 players are required to start." });
    }

    // Pick random word pair
    const pair = wordPairs[Math.floor(Math.random() * wordPairs.length)];
    // Randomize which is civilian and which is imposter
    const swap = Math.random() < 0.5;
    room.civilianWord = swap ? pair.imposter : pair.civilian;
    room.imposterWord = swap ? pair.civilian : pair.imposter;

    // Pick imposter(s)
    const count = Math.min(room.settings.imposterCount || 1, room.players.length - 1);
    const shuffled = [...room.players].sort(() => Math.random() - 0.5);
    const imposterIds = new Set(shuffled.slice(0, count).map(p => p.id));

    room.players.forEach(p => {
      p.isAlive = true;
      p.hint = null;
      p.votes = 0;
      p.ready = false;
      const isImposter = imposterIds.has(p.id);
      p.role = isImposter ? 'imposter' : 'civilian';

      if (isImposter) {
        p.word = room.settings.mrWhiteMode ? null : room.imposterWord;
      } else {
        p.word = room.civilianWord;
      }
    });

    room.phase = 'role-reveal';
    room.winner = null;

    // Send each player their secret role
    room.players.forEach(p => {
      if (!p.isBot) {
        io.to(p.id).emit('your-role', {
          role: p.role,
          word: p.word,
          mrWhiteMode: room.settings.mrWhiteMode
        });
      }
    });

    callback && callback({ success: true });
    broadcastRoomState(room);
  });

  // Player Ready (from Role Reveal)
  socket.on('player-ready', () => {
    if (!currentRoomCode) return;
    const room = rooms.get(currentRoomCode);
    if (!room || room.phase !== 'role-reveal') return;

    const player = room.players.find(p => p.id === socket.id);
    if (player) {
      player.ready = true;
    }

    // When all human players are ready (or bots auto-ready), begin Hint round!
    const humans = room.players.filter(p => !p.isBot);
    const allHumansReady = humans.every(p => p.ready);

    if (allHumansReady) {
      startHintsRound(room);
    }
  });

  // Submit Hint
  socket.on('submit-hint', ({ hint }, callback) => {
    if (!currentRoomCode) return;
    const room = rooms.get(currentRoomCode);
    if (!room || room.phase !== 'hints') {
      return callback && callback({ success: false, error: "Not in hints phase." });
    }

    if (room.currentTurn !== socket.id) {
      return callback && callback({ success: false, error: "It's not your turn." });
    }

    const trimmed = (hint || '').trim();
    if (!trimmed) {
      return callback && callback({ success: false, error: "Enter a word." });
    }
    if (trimmed.split(/\s+/).length > 1) {
      return callback && callback({ success: false, error: "One word only!" });
    }

    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;

    player.hint = trimmed;
    callback && callback({ success: true });

    advanceTurn(room);
  });

  // Start Vote (by host during discussion)
  socket.on('start-vote', () => {
    if (!currentRoomCode) return;
    const room = rooms.get(currentRoomCode);
    if (!room || room.hostId !== socket.id || room.phase !== 'discussion') return;

    room.phase = 'vote';
    room.players.forEach(p => {
      p.votes = 0;
      p.votedFor = null;
    });

    broadcastRoomState(room);

    // If bots exist, make them cast votes after realistic stagger
    const bots = room.players.filter(p => p.isAlive && p.isBot);
    bots.forEach((bot, index) => {
      setTimeout(() => {
        if (room.phase === 'vote' && bot.isAlive) {
          const suspects = room.players.filter(p => p.isAlive && p.id !== bot.id);
          if (suspects.length > 0) {
            const target = suspects[Math.floor(Math.random() * suspects.length)];
            bot.votedFor = target.id;
            target.votes = (target.votes || 0) + 1;
            broadcastRoomState(room);
            checkAllVotesCast(room);
          }
        }
      }, 1000 + index * 1200);
    });
  });

  // Cast Vote
  socket.on('cast-vote', ({ targetId }, callback) => {
    if (!currentRoomCode) return;
    const room = rooms.get(currentRoomCode);
    if (!room || room.phase !== 'vote') {
      return callback && callback({ success: false, error: "Not in voting phase." });
    }

    const voter = room.players.find(p => p.id === socket.id);
    if (!voter || !voter.isAlive || voter.votedFor) {
      return callback && callback({ success: false, error: "Already voted or not eligible." });
    }

    const target = room.players.find(p => p.id === targetId && p.isAlive);
    if (!target) {
      return callback && callback({ success: false, error: "Invalid vote target." });
    }

    voter.votedFor = targetId;
    target.votes = (target.votes || 0) + 1;

    callback && callback({ success: true });
    broadcastRoomState(room);

    checkAllVotesCast(room);
  });

  function checkAllVotesCast(room) {
    const alivePlayers = room.players.filter(p => p.isAlive);
    const votesCast = alivePlayers.filter(p => p.votedFor).length;

    if (votesCast >= alivePlayers.length) {
      // All votes cast! Evaluate outcome
      // Find highest votes
      let maxVotes = -1;
      let topCandidates = [];

      alivePlayers.forEach(p => {
        const v = p.votes || 0;
        if (v > maxVotes) {
          maxVotes = v;
          topCandidates = [p];
        } else if (v === maxVotes) {
          topCandidates.push(p);
        }
      });

      if (topCandidates.length > 1) {
        // Tie vote!
        io.to(room.roomCode).emit('tie-vote');
        // Reset hints and start new hint round with 2-minute timer
        startHintsRound(room);
      } else {
        // Clear elimination!
        const eliminated = topCandidates[0];
        eliminated.isAlive = false;

        // If a civilian was eliminated, broadcast to all players so everyone hears the HUH?! sound
        if (eliminated.role === 'civilian') {
          io.to(room.roomCode).emit('civilian-eliminated', {
            playerName: eliminated.name,
            playerId: eliminated.id
          });
        }

        // Check if eliminated is Mr. White (imposter in Mr. White mode)
        if (eliminated.role === 'imposter' && room.settings.mrWhiteMode) {
          room.phase = 'mr-white-guess';
          room.mrWhitePlayerId = eliminated.id;

          if (eliminated.isBot) {
            // Bot guesses automatically after 2s
            setTimeout(() => {
              const correct = Math.random() < 0.35;
              const guess = correct ? room.civilianWord : "Mystery";
              handleMrWhiteGuess(room, guess);
            }, 2000);
          } else {
            io.to(eliminated.id).emit('mr-white-guess-prompt');
          }
          broadcastRoomState(room);
        } else {
          // Check win conditions
          const won = checkWinConditions(room);
          if (!won) {
            // New round with 2-minute timer!
            startHintsRound(room);
          }
        }
      }
    }
  }

  function handleMrWhiteGuess(room, guess) {
    const cleanGuess = (guess || '').trim().toLowerCase();
    const cleanTarget = (room.civilianWord || '').trim().toLowerCase();
    const isCorrect = cleanGuess === cleanTarget;

    if (isCorrect) {
      room.winner = 'imposters';
    } else {
      room.winner = 'civilians';
    }

    finishGame(room, { guess, correct: isCorrect });
  }

  // Mr White Guess submission
  socket.on('mr-white-guess', ({ guess }, callback) => {
    if (!currentRoomCode) return;
    const room = rooms.get(currentRoomCode);
    if (!room || room.phase !== 'mr-white-guess') return;

    handleMrWhiteGuess(room, guess);
    callback && callback({ success: true });
  });

  // Play Again
  socket.on('play-again', () => {
    if (!currentRoomCode) return;
    const room = rooms.get(currentRoomCode);
    if (!room) return;

    room.phase = 'lobby';
    room.winner = null;
    room.civilianWord = null;
    room.imposterWord = null;
    room.currentTurn = null;
    room.players.forEach(p => {
      p.isAlive = true;
      p.hint = null;
      p.votes = 0;
      p.role = null;
      p.word = null;
      p.ready = false;
      p.votedFor = null;
    });

    broadcastRoomState(room);
  });

  // Chat
  socket.on('send-chat', ({ text }) => {
    if (!currentRoomCode) return;
    const room = rooms.get(currentRoomCode);
    if (!room) return;

    const trimmed = (text || '').trim();
    if (!trimmed) return;

    const player = room.players.find(p => p.id === socket.id);
    const msg = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      playerId: socket.id,
      playerName: player ? player.name : 'Unknown',
      text: trimmed.slice(0, 200)
    };

    room.chatMessages.push(msg);
    if (room.chatMessages.length > 50) {
      room.chatMessages.shift();
    }

    io.to(room.roomCode).emit('chat-message', msg);
  });

  // Host Kicking a Player
  socket.on('kick-player', ({ targetPlayerId }, callback) => {
    if (!currentRoomCode) return callback && callback({ success: false, error: "No room active." });
    const room = rooms.get(currentRoomCode);
    if (!room) return callback && callback({ success: false, error: "Room not found." });

    if (room.hostId !== socket.id) {
      return callback && callback({ success: false, error: "Only the host can kick players." });
    }
    if (targetPlayerId === socket.id) {
      return callback && callback({ success: false, error: "You cannot kick yourself." });
    }

    const targetIndex = room.players.findIndex(p => p.id === targetPlayerId);
    if (targetIndex === -1) {
      return callback && callback({ success: false, error: "Player not found." });
    }

    const targetPlayer = room.players[targetIndex];
    room.players.splice(targetIndex, 1);

    // Notify kicked player if human
    if (!targetPlayer.isBot) {
      io.to(targetPlayerId).emit('kicked-from-game', {
        message: 'You were removed from the game by the host.'
      });
      const targetSocket = io.sockets.sockets.get(targetPlayerId);
      if (targetSocket) {
        targetSocket.leave(room.roomCode);
      }
    }

    io.to(room.roomCode).emit('player-left', {
      message: `${targetPlayer.name} was kicked from the room by the host.`
    });

    // If game in progress
    if (room.phase === 'hints') {
      if (room.currentTurn === targetPlayerId) {
        advanceTurn(room);
      } else {
        broadcastRoomState(room);
      }
    } else if (room.phase === 'vote') {
      checkAllVotesCast(room);
    } else {
      broadcastRoomState(room);
    }

    // Check win conditions if active game
    if (room.phase !== 'lobby' && room.phase !== 'result') {
      checkWinConditions(room);
    }

    callback && callback({ success: true, kickedName: targetPlayer.name });
  });

  // Disconnect handler
  socket.on('disconnect', () => {
    if (!currentRoomCode) return;
    const room = rooms.get(currentRoomCode);
    if (!room) return;

    const leavingPlayer = room.players.find(p => p.id === socket.id);
    if (!leavingPlayer) return;

    room.players = room.players.filter(p => p.id !== socket.id);

    // If host left, reassign host
    if (room.hostId === socket.id && room.players.length > 0) {
      room.hostId = room.players[0].id;
      room.players[0].isHost = true;
    }

    io.to(room.roomCode).emit('player-left', {
      message: `${leavingPlayer.name} left the game.`
    });

    if (room.players.length === 0) {
      rooms.delete(currentRoomCode);
    } else {
      // If player disconnected during hints turn, advance turn
      if (room.phase === 'hints' && room.currentTurn === socket.id) {
        advanceTurn(room);
      } else if (room.phase === 'vote') {
        checkAllVotesCast(room);
      } else {
        broadcastRoomState(room);
      }
    }
  });
});

// Fallback to index.html for SPA client routes
app.get('*', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  res.sendFile(indexPath, err => {
    if (err) {
      res.send(`
        <!doctype html>
        <html>
          <head><title>WHO? Game Server</title></head>
          <body style="font-family:sans-serif; background:#030712; color:#fff; text-align:center; padding:40px;">
            <h1>WHO? — The Imposter Game Server</h1>
            <p>Server is running on port ${PORT}. Run <code>npm run build</code> to serve the Vite frontend from here.</p>
          </body>
        </html>
      `);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🎮 WHO? Game Server running on port ${PORT}`);
});
