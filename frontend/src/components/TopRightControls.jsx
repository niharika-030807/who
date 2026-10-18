import React, { useState, useEffect } from 'react';
import { sound } from '../utils/audio';

export default function TopRightControls() {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('who_theme') || 'dark';
    }
    return 'dark';
  });

  const [muted, setMuted] = useState(!sound.enabled);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('who_theme', theme);
    } catch (e) {}
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const toggleMute = () => {
    const isEnabled = sound.toggleMute();
    setMuted(!isEnabled);
  };

  return (
    <div className="top-right-controls">
      {/* Theme Toggle (Light / Dark Mode) */}
      <button
        type="button"
        className="ctrl-icon-btn"
        onClick={toggleTheme}
        title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        aria-label="Toggle theme mode"
      >
        <span className="ctrl-icon">{theme === 'dark' ? '☀️' : '🌙'}</span>
        <span className="ctrl-label">{theme === 'dark' ? 'LIGHT' : 'DARK'}</span>
      </button>

      {/* Audio Mute / Unmute Toggle */}
      <button
        type="button"
        className={`ctrl-icon-btn ${muted ? 'is-muted' : ''}`}
        onClick={toggleMute}
        title={muted ? 'Unmute Audio' : 'Mute Audio'}
        aria-label="Toggle audio mute"
      >
        <span className="ctrl-icon">{muted ? '🔇' : '🔊'}</span>
        <span className="ctrl-label">{muted ? 'MUTED' : 'SFX'}</span>
      </button>
    </div>
  );
}
