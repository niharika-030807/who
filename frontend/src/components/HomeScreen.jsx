import React, { useState } from 'react';

const CUTE_NAMES = [
  'Mochi',
  'Pikachu',
  'Boba',
  'Cookie',
  'Kitten',
  'Panda',
  'Bunny',
  'Otter',
  'Sprout',
  'Marshmallow',
  'Pixel',
  'Noodle'
];

export default function HomeScreen({ onCreateRoom, onJoinRoom }) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [activeTab, setActiveTab] = useState('create'); // 'create' | 'join'
  const [imposterCount, setImposterCount] = useState(1);
  const [mrWhiteMode, setMrWhiteMode] = useState(false);
  const [error, setError] = useState('');
  const [showRules, setShowRules] = useState(false);

  const handleRandomizeName = () => {
    const random = CUTE_NAMES[Math.floor(Math.random() * CUTE_NAMES.length)];
    const num = Math.floor(1 + Math.random() * 99);
    setName(`${random}${num}`);
    setError('');
  };

  const handleCreate = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      return setError('Please pick a nickname first! ✨');
    }
    setError('');
    onCreateRoom(trimmed, { imposterCount, mrWhiteMode });
  };

  const handleJoin = () => {
    const trimmedName = name.trim();
    const trimmedCode = code.trim().toUpperCase();

    if (!trimmedName) {
      return setError('Please pick a nickname first! ✨');
    }
    if (!trimmedCode) {
      return setError('Please enter the Room Code! 🏷️');
    }
    setError('');
    onJoinRoom(trimmedName, trimmedCode);
  };

  const handlePasteCode = async () => {
    try {
      if (navigator.clipboard) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setCode(text.trim().toUpperCase().slice(0, 6));
          setError('');
        }
      }
    } catch {
      // Ignore clipboard read permission failures
    }
  };

  return (
    <div className="screen home-screen">
      <div className="home-bg" />
      <div className="home-content">
        {/* Brand Header */}
        <div className="logo-block">
          <span className="logo-eye cute-bounce">👀</span>
          <h1 className="logo-title">WHO</h1>
          <p className="logo-sub">FIND THE IMPOSTER</p>
        </div>

        {/* Cute & Simple Card */}
        <div className="hub-card cute-card fade-in">
          {/* Nickname Input Section */}
          <div className="cute-field-group">
            <div className="cute-label-row">
              <span className="cute-label">YOUR NICKNAME</span>
              <button
                type="button"
                className="cute-dice-btn"
                onClick={handleRandomizeName}
                title="Random cute name"
              >
                🎲 Random
              </button>
            </div>
            <input
              className="cute-input"
              placeholder="e.g. Mochi, Panda..."
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              maxLength={16}
              autoFocus
            />
          </div>

          {/* Action Row: Create Room and Join Room side by side */}
          <div className="cute-action-row">
            <button
              type="button"
              className="cute-action-btn create-btn"
              onClick={handleCreate}
            >
              <span>✨ Create Room</span>
            </button>
            <button
              type="button"
              className="cute-action-btn join-btn"
              onClick={handleJoin}
            >
              <span>🚀 Join Room</span>
            </button>
          </div>

          {/* Join Code Input (Always accessible directly) */}
          <div className="cute-code-direct-block">
            <div className="cute-label-row">
              <span className="cute-label">ENTER ROOM CODE (TO JOIN)</span>
              <button
                type="button"
                className="cute-paste-btn"
                onClick={handlePasteCode}
                title="Paste code"
              >
                📋 Paste
              </button>
            </div>
            <input
              className="cute-input cute-code-input"
              placeholder="e.g. AB12C"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setError('');
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              maxLength={6}
            />
          </div>

          {/* Error Message */}
          {error && <p className="cute-error">{error}</p>}

          {/* Room Settings Box */}
          <div className="cute-options-box">
            {/* Imposter count row */}
            <div className="cute-option-row">
              <div>
                <span className="cute-option-title">🕵️ Imposters</span>
                <span className="cute-option-desc">Secret spy players</span>
              </div>
              <div className="cute-stepper">
                <button
                  type="button"
                  className="cute-step-btn"
                  onClick={() => setImposterCount(Math.max(1, imposterCount - 1))}
                  disabled={imposterCount <= 1}
                >
                  −
                </button>
                <span className="cute-step-num">{imposterCount}</span>
                <button
                  type="button"
                  className="cute-step-btn"
                  onClick={() => setImposterCount(Math.min(3, imposterCount + 1))}
                  disabled={imposterCount >= 3}
                >
                  +
                </button>
              </div>
            </div>

            {/* Ghost Mode (formerly Mr. White) toggle row */}
            <div
              className="cute-option-row cute-clickable"
              onClick={() => setMrWhiteMode(!mrWhiteMode)}
            >
              <div>
                <span className="cute-option-title">👻 Ghost Mode</span>
                <span className="cute-option-desc">Imposter has NO secret word at all</span>
              </div>
              <div className={`cute-toggle ${mrWhiteMode ? 'on' : ''}`}>
                <div className="cute-toggle-circle" />
              </div>
            </div>
          </div>
        </div>

        {/* How to Play Collapsible Button */}
        <div className="rules-section">
          <button
            type="button"
            className="btn btn-ghost rules-toggle-btn"
            onClick={() => setShowRules(!showRules)}
          >
            <span>{showRules ? '▲ HIDE INTEL' : 'ℹ️ MISSION INTEL (HOW TO PLAY)'}</span>
          </button>

          {showRules && (
            <div className="rules-card fade-in">
              <h3 className="rules-heading">MISSION DIRECTIVES</h3>
              <div className="rules-item">
                <span className="role-tag civilian">CIVILIANS</span>
                <p>
                  Share the <strong>same secret word</strong>. Give subtle single-word clues without exposing the word to the spy!
                </p>
              </div>
              <div className="rules-item">
                <span className="role-tag imposter">IMPOSTER</span>
                <p>
                  Gets a <strong>slightly different word</strong>. Listen to others, blend in, and frame someone else!
                </p>
              </div>
              <div className="rules-item">
                <span className="role-tag mr-white">GHOST</span>
                <p>
                  Has <strong>NO word at all</strong>! Bluff completely, survive voting, or guess the civilians' secret word to steal victory!
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
