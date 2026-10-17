import React, { useState, useEffect, useRef } from 'react';
import { sound } from '../utils/audio';
import { getWordMeta } from '../utils/wordImages';

const TOTAL_TIME_SEC = 60; // 1 minute (60 seconds)

export default function HintsScreen({ gameState, playerId, myRole, onSubmitHint }) {
  const [hint, setHint] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [showIntel, setShowIntel] = useState(true);
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_TIME_SEC);

  const isMyTurn = gameState.currentTurn === playerId;
  const word = myRole?.word;
  const meta = getWordMeta(word);
  const autoSubmittedRef = useRef(false);

  // Synchronize 2-minute timer on every turn change
  useEffect(() => {
    setSubmitted(false);
    setHint('');
    setError('');
    autoSubmittedRef.current = false;

    if (isMyTurn) {
      sound.playTurnDing();
    }

    const calculateRemaining = () => {
      if (gameState.turnEndTime) {
        const diff = Math.ceil((gameState.turnEndTime - Date.now()) / 1000);
        return Math.max(0, Math.min(TOTAL_TIME_SEC, diff));
      }
      return TOTAL_TIME_SEC;
    };

    setSecondsLeft(calculateRemaining());

    const timer = setInterval(() => {
      const remaining = calculateRemaining();
      setSecondsLeft(remaining);

      if (remaining <= 0) {
        clearInterval(timer);
        // Time expired! Auto submit if it's player's turn and hasn't submitted yet
        if (isMyTurn && !autoSubmittedRef.current) {
          autoSubmittedRef.current = true;
          setSubmitted(true);
          const autoHint = hint.trim() || 'Silence';
          onSubmitHint(autoHint, () => {});
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState.currentTurn, gameState.turnEndTime, isMyTurn]);

  const handleSubmit = () => {
    const trimmed = hint.trim();
    if (!trimmed) {
      return setError('Enter a word.');
    }
    const words = trimmed.split(/\s+/);
    if (words.length > 1) {
      return setError('One word only!');
    }

    onSubmitHint(trimmed, (res) => {
      if (res?.success) {
        setSubmitted(true);
      } else {
        setError(res?.error || 'Error submitting.');
      }
    });
  };

  const currentTurnPlayer = gameState.players.find(
    (p) => p.id === gameState.currentTurn
  );

  // Format seconds into MM:SS
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const progressPercent = Math.max(0, Math.min(100, (secondsLeft / TOTAL_TIME_SEC) * 100));
  const isUrgent = secondsLeft <= 15;

  return (
    <div className="screen hints-screen">
      <div className="phase-header">
        <span className="phase-tag">HINT ROUND</span>
        <h2>Give Your Clue</h2>
      </div>

      {/* Secret Word Intel Card Reminder */}
      {word ? (
        <div className="hint-intel-banner">
          <div
            className="hint-intel-header"
            onClick={() => setShowIntel(!showIntel)}
          >
            <div className="hint-intel-title">
              <span className="hint-intel-badge">YOUR WORD:</span>
              <span className="hint-intel-word">
                {meta.emoji} {word}
              </span>
            </div>
            <button type="button" className="hint-intel-toggle">
              {showIntel ? '▲ Hide' : '▼ Picture & Intel'}
            </button>
          </div>

          {showIntel && (
            <div className="hint-intel-content fade-in">
              <div className="hint-intel-visual">
                <img
                  src={meta.image}
                  alt={word}
                  className="hint-intel-img"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
                <div className="hint-intel-meta">
                  <p className="hint-intel-desc">{meta.desc}</p>
                  {meta.tags && (
                    <div className="hint-tags-pills">
                      {meta.tags.map((t) => (
                        <span key={t} className="hint-tag-mini">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="hint-intel-banner mr-white-banner">
          <div className="hint-intel-header">
            <div className="hint-intel-title">
              <span className="hint-intel-badge">STATUS:</span>
              <span className="hint-intel-word">MR. WHITE (NO WORD)</span>
            </div>
          </div>
          <p className="hint-intel-desc" style={{ padding: '0 12px 10px' }}>
            Listen to the clues given by others to figure out the secret word!
          </p>
        </div>
      )}

      {/* 2-Minute Think & Type HUD Timer */}
      <div className={`turn-timer-hud ${isUrgent ? 'urgent' : ''} ${isMyTurn ? 'my-turn' : ''}`}>
        <div className="timer-hud-header">
          <span className="timer-hud-label">
            {isMyTurn ? '⚡ YOUR TURN TO THINK & TYPE' : `⏳ WAITING FOR ${currentTurnPlayer?.name?.toUpperCase() || 'PLAYER'}`}
          </span>
          <span className="timer-hud-digits">{formatTime(secondsLeft)}</span>
        </div>
        <div className="timer-bar-track">
          <div
            className="timer-bar-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="timer-hud-footer">
          <span className="timer-hint-text">
            {isMyTurn
              ? 'You have 1 minute to inspect your word, brainstorm, and type 1 clue.'
              : `${currentTurnPlayer?.name || 'Player'} has up to 1 minute to submit a clue.`}
          </span>
        </div>
      </div>

      {/* Clues progress list */}
      <div className="hints-list">
        {gameState.players.map((p) => (
          <div
            key={p.id}
            className={`hint-row ${p.id === gameState.currentTurn ? 'active' : ''} ${
              p.isAlive ? '' : 'dead'
            }`}
          >
            <span className="hint-player">
              {p.name}
              {p.id === playerId ? ' (you)' : ''}
            </span>
            {p.hint ? (
              <span className="hint-word">"{p.hint}"</span>
            ) : p.id === gameState.currentTurn ? (
              <span className="hint-thinking">
                thinking ({formatTime(secondsLeft)})…
              </span>
            ) : (
              <span className="hint-pending">—</span>
            )}
          </div>
        ))}
      </div>

      {/* Clue Input Block */}
      {isMyTurn && !submitted && (
        <div className="hint-input-block fade-in">
          <p className="your-turn-label">SUBMIT YOUR CLUE</p>
          <div className="hint-input-row">
            <input
              className="input"
              placeholder="One word clue…"
              value={hint}
              onChange={(e) => {
                setHint(e.target.value);
                setError('');
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              maxLength={30}
              autoFocus
            />
            <button className="btn btn-primary btn-sm" onClick={handleSubmit}>
              →
            </button>
          </div>
          {error && <p className="error-text">{error}</p>}
        </div>
      )}

      {!isMyTurn && currentTurnPlayer && (
        <p className="waiting-text">
          Waiting for <strong>{currentTurnPlayer.name}</strong> to give a clue ({formatTime(secondsLeft)})…
        </p>
      )}
    </div>
  );
}
