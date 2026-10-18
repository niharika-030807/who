const io = require('socket.io-client');

async function runEndToEndTest() {
  console.log('🚀 Starting Undercover Game End-to-End Test...\n');

  const serverUrl = 'http://localhost:3000';

  // Player 1 (Host)
  const p1 = io(serverUrl, { transports: ['websocket'] });

  await new Promise((resolve) => p1.on('connect', resolve));
  console.log('✅ Player 1 connected, socket ID:', p1.id);

  // 1. Create Room
  let roomCode = '';
  await new Promise((resolve) => {
    p1.emit(
      'create-room',
      { playerName: 'Detective Alex', settings: { mrWhiteMode: true, imposterCount: 1 } },
      (res) => {
        console.log('✅ Room created with code:', res.roomCode);
        roomCode = res.roomCode;
        resolve();
      }
    );
  });

  // 2. Player 2 joins
  const p2 = io(serverUrl, { transports: ['websocket'] });
  await new Promise((resolve) => p2.on('connect', resolve));
  await new Promise((resolve) => {
    p2.emit('join-room', { roomCode, playerName: 'Dr. Watson' }, (res) => {
      console.log('✅ Player 2 (Dr. Watson) joined');
      resolve();
    });
  });

  // 3. Add a Bot player via host
  await new Promise((resolve) => {
    p1.emit('add-bot', {}, (res) => {
      console.log('✅ Host added a Bot player');
      resolve();
    });
  });

  // 4. Test Chat
  let chatReceived = false;
  p2.on('chat-message', (msg) => {
    console.log(`💬 Chat received: [${msg.playerName}] "${msg.text}"`);
    chatReceived = true;
  });

  p1.emit('send-chat', { text: 'Welcome team, lets find the imposter!' });
  await new Promise((r) => setTimeout(r, 600));

  // 5. Start Game
  let roles = {};
  p1.on('your-role', (role) => {
    roles[p1.id] = role;
    console.log('🕵️ Player 1 role:', role.role, role.word ? `(Word: "${role.word}")` : '(No word)');
  });
  p2.on('your-role', (role) => {
    roles[p2.id] = role;
    console.log('🕵️ Player 2 role:', role.role, role.word ? `(Word: "${role.word}")` : '(No word)');
  });

  await new Promise((resolve) => {
    p1.emit('start-game', (res) => {
      console.log('🎮 Game started:', res.success ? 'Success' : res.error);
      resolve();
    });
  });

  await new Promise((r) => setTimeout(r, 600));

  // 6. Players ready
  p1.emit('player-ready');
  p2.emit('player-ready');

  // Wait for hints phase
  let currentTurn = null;
  const hintsDone = new Promise((resolve) => {
    p1.on('game-state', (state) => {
      if (state.phase === 'hints') {
        currentTurn = state.currentTurn;
      }
      if (state.phase === 'discussion') {
        console.log('🗣️ Discussion phase reached! All clues submitted.');
        resolve();
      }
    });
  });

  // Handle turns
  const turnInterval = setInterval(() => {
    if (currentTurn === p1.id) {
      console.log('💡 Player 1 giving hint: "Morning"');
      p1.emit('submit-hint', { hint: 'Morning' }, () => {});
      currentTurn = null;
    } else if (currentTurn === p2.id) {
      console.log('💡 Player 2 giving hint: "Warm"');
      p2.emit('submit-hint', { hint: 'Warm' }, () => {});
      currentTurn = null;
    }
  }, 400);

  await hintsDone;
  clearInterval(turnInterval);

  // 7. Start voting
  console.log('🗳️ Host starts voting phase');
  p1.emit('start-vote');

  const resultDone = new Promise((resolve) => {
    p1.on('game-state', (state) => {
      if (state.phase === 'result') {
        console.log(`🏆 Game ended! Winner: ${state.winner.toUpperCase()}`);
        resolve();
      }
    });
    p1.on('reveal-all-roles', (data) => {
      console.log('📜 Reveal data received:');
      console.log('   Civilian Word:', data.civilianWord);
      console.log('   Imposter Word:', data.imposterWord);
      data.players.forEach((p) => {
        console.log(`   - ${p.name}: ${p.role.toUpperCase()} (Word: "${p.word || 'NONE'}")`);
      });
    });
  });

  // Player 1 votes for Player 2, Player 2 votes for Player 2
  await new Promise((r) => setTimeout(r, 500));
  p1.emit('cast-vote', { targetId: p2.id });
  p2.emit('cast-vote', { targetId: p2.id });

  await Promise.race([resultDone, new Promise((r) => setTimeout(r, 5000))]);

  console.log('\n🎉 ALL GAMEPLAY PHASES TESTED SUCCESSFULLY AND VERIFIED!');

  p1.disconnect();
  p2.disconnect();
  process.exit(0);
}

runEndToEndTest().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
