import React, { useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import HomeScreen from './components/HomeScreen';
import LobbyScreen from './components/LobbyScreen';
import RoleRevealScreen from './components/RoleRevealScreen';
import HintsScreen from './components/HintsScreen';
import DiscussionScreen from './components/DiscussionScreen';
import VoteScreen from './components/VoteScreen';
import MrWhiteGuessScreen from './components/MrWhiteGuessScreen';
import ResultScreen from './components/ResultScreen';
import TopRightControls from './components/TopRightControls';
import HostKickModal from './components/HostKickModal';
import InGameChatWidget from './components/InGameChatWidget';
import { sound } from './utils/audio';

// Default to same origin or fallback to local / cloud server
const DEFAULT_SERVER =
  typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:3000'
    : 'https://imposter-gameserver.onrender.com';

export default function App() {
  const [serverUrl, setServerUrl] = useState(DEFAULT_SERVER);
  const [connected, setConnected] = useState(false);
  const [screen, setScreen] = useState('home');
  const [gameState, setGameState] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [myRole, setMyRole] = useState(null);
  const [toast, setToast] = useState(null);
  const [revealData, setRevealData] = useState(null);
  const [isMrWhitePrompt, setIsMrWhitePrompt] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);

  const socketRef = useRef(null);

  const showToast = useCallback((msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // Connect / Reconnect socket when serverUrl changes
  useEffect(() => {
    const socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      showToast('Connected to server', 'info');
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('game-state', (state) => {
      setGameState(state);

      switch (state.phase) {
        case 'lobby':
          setScreen('lobby');
          break;
        case 'role-reveal':
          setScreen('role-reveal');
          break;
        case 'hints':
          setScreen('hints');
          break;
        case 'discussion':
          setScreen('discussion');
          break;
        case 'vote':
          setScreen('vote');
          break;
        case 'mr-white-guess':
          if (state.mrWhitePlayerId === socket.id) {
            setScreen('mr-white-guess');
          } else {
            setScreen('vote-result-wait');
          }
          break;
        case 'result':
          setScreen('result');
          break;
        default:
          break;
      }
    });

    socket.on('your-role', (roleData) => {
      setMyRole(roleData);
    });

    socket.on('civilian-eliminated', ({ playerName }) => {
      sound.playHuh();
      showToast(`HUH?! ${playerName || 'A civilian'} was eliminated!`, 'warning');
    });

    socket.on('tie-vote', () => {
      sound.playFah();
      showToast("It's a tie! No one is eliminated. New hint round starts.", 'warning');
    });

    socket.on('reveal-all-roles', (data) => {
      setRevealData(data);
    });

    socket.on('player-left', ({ message }) => {
      showToast(message, 'warning');
    });

    socket.on('kicked-from-game', ({ message }) => {
      showToast(message || 'You were removed from the room by the host.', 'error');
      setScreen('home');
      setGameState(null);
      setPlayerId(null);
      setMyRole(null);
      setChatMessages([]);
    });

    socket.on('mr-white-guess-prompt', () => {
      sound.playDramatic();
      setIsMrWhitePrompt(true);
      setScreen('mr-white-guess');
    });

    socket.on('chat-message', (msg) => {
      setChatMessages((prev) => [...prev, msg]);
    });

    socket.on('chat-history', (history) => {
      setChatMessages(history);
    });

    return () => {
      socket.disconnect();
    };
  }, [serverUrl, showToast]);

  const activePlayerId = playerId || socketRef.current?.id;

  // Toggle server between local and cloud
  const toggleServer = () => {
    const nextUrl =
      serverUrl === 'https://imposter-gameserver.onrender.com'
        ? 'http://localhost:3000'
        : 'https://imposter-gameserver.onrender.com';
    setServerUrl(nextUrl);
    setScreen('home');
    setGameState(null);
    setPlayerId(null);
    setMyRole(null);
    setChatMessages([]);
  };

  const handleKickPlayer = useCallback((targetPlayerId, targetPlayerName) => {
    socketRef.current?.emit('kick-player', { targetPlayerId }, (res) => {
      if (res?.success) {
        showToast(`Kicked ${targetPlayerName || 'player'} from the mission`, 'info');
      } else {
        showToast(res?.error || 'Failed to kick player', 'error');
      }
    });
  }, [showToast]);

  return (
    <div className="app">
      {/* Top Right Quick Controls: Light/Dark Mode + Audio Mute/Unmute */}
      <TopRightControls />

      {/* Host Controls: Kick Players during game or in lobby */}
      {gameState && (
        <HostKickModal
          gameState={gameState}
          playerId={activePlayerId}
          onKickPlayer={handleKickPlayer}
        />
      )}

      {/* In-Game Chat Widget (accessible across all screens except home) */}
      {screen !== 'home' && (
        <InGameChatWidget
          messages={chatMessages}
          playerId={activePlayerId}
          onSend={(text) => {
            socketRef.current?.emit('send-chat', { text });
          }}
        />
      )}

      {!connected && (
        <div className="connection-banner">Connecting to server…</div>
      )}

      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}

      {screen === 'home' && (
        <div className="top-nav">
          <div className="server-badge" onClick={toggleServer} title="Click to switch server">
            <span className={`status-dot ${connected ? 'online' : ''}`} />
            <span>
              Server: {serverUrl.includes('render') ? 'Cloud (Render)' : 'Localhost:3000'}
            </span>
          </div>
        </div>
      )}

      {screen === 'home' && (
        <HomeScreen
          onCreateRoom={(name, customSettings) => {
            const socket = socketRef.current;
            if (!socket) return;
            socket.emit(
              'create-room',
              {
                playerName: name,
                settings: customSettings || { mrWhiteMode: false, imposterCount: 1 }
              },
              (res) => {
                if (res?.success) {
                  setPlayerId(res.playerId || socket.id);
                } else {
                  showToast(res?.error || 'Error creating room.', 'error');
                }
              }
            );
          }}
          onJoinRoom={(name, code) => {
            const socket = socketRef.current;
            if (!socket) return;
            socket.emit(
              'join-room',
              { roomCode: code, playerName: name },
              (res) => {
                if (res?.success) {
                  setPlayerId(res.playerId || socket.id);
                } else {
                  showToast(res?.error || 'Error joining room.', 'error');
                }
              }
            );
          }}
        />
      )}

      {screen === 'lobby' && gameState && (
        <LobbyScreen
          gameState={gameState}
          playerId={activePlayerId}
          onStartGame={() => {
            socketRef.current?.emit('start-game', (res) => {
              if (!res?.success) {
                showToast(res?.error || 'Error starting game.', 'error');
              }
            });
          }}
          onUpdateSettings={(settings) => {
            socketRef.current?.emit('update-settings', { settings });
          }}
          onAddBot={() => {
            socketRef.current?.emit('add-bot', {}, (res) => {
              if (res?.success) {
                showToast('Bot player added!', 'info');
              }
            });
          }}
          onKickPlayer={handleKickPlayer}
          chatMessages={chatMessages}
          onSendChat={(text) => {
            socketRef.current?.emit('send-chat', { text });
          }}
        />
      )}

      {screen === 'role-reveal' && (
        <RoleRevealScreen
          myRole={myRole}
          onReady={() => {
            socketRef.current?.emit('player-ready');
          }}
        />
      )}

      {screen === 'hints' && gameState && (
        <HintsScreen
          gameState={gameState}
          playerId={activePlayerId}
          myRole={myRole}
          onSubmitHint={(hint, cb) => {
            socketRef.current?.emit('submit-hint', { hint }, cb);
          }}
        />
      )}

      {screen === 'discussion' && gameState && (
        <DiscussionScreen
          gameState={gameState}
          playerId={activePlayerId}
          onStartVote={() => {
            socketRef.current?.emit('start-vote');
          }}
        />
      )}

      {screen === 'vote' && gameState && (
        <VoteScreen
          gameState={gameState}
          playerId={activePlayerId}
          onCastVote={(targetId) => {
            socketRef.current?.emit('cast-vote', { targetId }, (res) => {
              if (!res?.success) {
                showToast(res?.error || 'Vote error.', 'error');
              }
            });
          }}
        />
      )}

      {screen === 'mr-white-guess' && (
        <MrWhiteGuessScreen socketRef={socketRef} />
      )}

      {screen === 'vote-result-wait' && (
        <div className="screen" style={{ justifyContent: 'center' }}>
          <div className="lobby-header" style={{ border: 'none' }}>
            <span className="logo-eye small">?</span>
            <h2>WHO</h2>
          </div>
          <p className="waiting-text" style={{ fontSize: '16px', marginTop: '20px' }}>
            👻 Waiting for Ghost's guess…
          </p>
        </div>
      )}

      {screen === 'result' && gameState && (
        <ResultScreen
          gameState={gameState}
          revealData={revealData}
          playerId={activePlayerId}
          onPlayAgain={() => {
            socketRef.current?.emit('play-again');
            setRevealData(null);
            setMyRole(null);
            setIsMrWhitePrompt(false);
            setChatMessages([]);
          }}
        />
      )}

      {/* Fallback to prevent blank screen during any transition or reconnect */}
      {screen !== 'home' && !gameState && (
        <div className="screen" style={{ justifyContent: 'center', textAlign: 'center' }}>
          <span className="logo-eye small">?</span>
          <p className="waiting-text" style={{ fontSize: '16px', marginTop: '16px' }}>
            Syncing mission data with server…
          </p>
        </div>
      )}
    </div>
  );
}
