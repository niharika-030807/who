import React from 'react';
import ChatBox from './ChatBox';
import { sound } from '../utils/audio';

export default function LobbyScreen({
  gameState,
  playerId,
  onStartGame,
  onUpdateSettings,
  onAddBot,
  onKickPlayer,
  chatMessages,
  onSendChat
}) {
  const me = gameState.players.find((p) => p.id === playerId);
  const isHost = me?.isHost;
  const settings = gameState.settings || { imposterCount: 1, mrWhiteMode: false };
  const mrWhiteMode = settings.mrWhiteMode;
  const imposterCount = settings.imposterCount || 1;
  const maxImposters = Math.max(1, gameState.players.length - 1);

  return (
    <div className="screen lobby-screen">
      <div className="lobby-header">
        <span className="logo-eye small">?</span>
        <h2>WHO</h2>
      </div>

      <div className="room-code-block">
        <p className="room-code-label">ROOM CODE</p>
        <p className="room-code">{gameState.roomCode}</p>
        <p className="room-code-hint">Share this with your friends</p>
      </div>

      <div className="players-list">
        <p className="section-label">PLAYERS ({gameState.players.length})</p>
        {gameState.players.map((p) => (
          <div key={p.id} className={`player-row ${p.id === playerId ? 'me' : ''}`}>
            <span className={`player-dot ${p.isBot ? 'bot' : ''}`} />
            <span className="player-name">
              {p.name}
              {p.id === playerId ? ' (you)' : ''}
            </span>
            {p.isHost && <span className="host-badge">HOST</span>}
            {p.isBot && <span className="bot-badge">AI BOT</span>}
            {isHost && p.id !== playerId && onKickPlayer && (
              <button
                type="button"
                className="btn-kick-inline"
                onClick={() => onKickPlayer(p.id, p.name)}
                title={`Kick ${p.name}`}
              >
                ✕ Kick
              </button>
            )}
          </div>
        ))}

        {isHost && onAddBot && (
          <div className="bot-btn-row">
            <button className="btn btn-secondary btn-sm" onClick={onAddBot} style={{ width: '100%', fontSize: '13px' }}>
              + Add Bot Player (for solo testing)
            </button>
          </div>
        )}
      </div>

      {isHost ? (
        <div className="settings-block">
          <p className="section-label">SETTINGS</p>
          <div className="setting-row">
            <span className="setting-label">Imposters</span>
            <div className="stepper">
              <button
                className="stepper-btn"
                onClick={() =>
                  onUpdateSettings({ imposterCount: Math.max(1, imposterCount - 1) })
                }
                disabled={imposterCount <= 1}
              >
                −
              </button>
              <span className="stepper-val">{imposterCount}</span>
              <button
                className="stepper-btn"
                onClick={() =>
                  onUpdateSettings({
                    imposterCount: Math.min(maxImposters, imposterCount + 1)
                  })
                }
                disabled={imposterCount >= maxImposters}
              >
                +
              </button>
            </div>
          </div>

          <label
            className="toggle-row"
            onClick={() => onUpdateSettings({ mrWhiteMode: !mrWhiteMode })}
          >
            <span>👻 Ghost Mode (Spy gets no word)</span>
            <div className={`toggle ${mrWhiteMode ? 'on' : ''}`} />
          </label>
        </div>
      ) : (
        <div className="settings-view">
          <p className="section-label">SETTINGS</p>
          <div className="setting-row">
            <span className="setting-label">Imposters</span>
            <span className="setting-value">{imposterCount}</span>
          </div>
          <div className="setting-row">
            <span className="setting-label">Ghost Mode</span>
            <span className="setting-value">{mrWhiteMode ? 'ON' : 'OFF'}</span>
          </div>
        </div>
      )}

      <ChatBox
        messages={chatMessages}
        playerId={playerId}
        onSend={onSendChat}
      />

      {isHost ? (
        <button
          className="btn btn-primary btn-large"
          onClick={onStartGame}
          disabled={gameState.players.length < 3}
        >
          {gameState.players.length < 3 ? 'Need 3+ Players' : 'Start Game'}
        </button>
      ) : (
        <p className="waiting-text">Waiting for host to start…</p>
      )}
    </div>
  );
}
