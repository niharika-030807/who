import React, { useState } from 'react';
import { sound } from '../utils/audio';
import { getWordMeta } from '../utils/wordImages';

export default function RoleRevealScreen({ myRole, onReady }) {
  const [revealed, setRevealed] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const isImposter = myRole?.role === 'imposter';
  const isMrWhite = isImposter && myRole?.mrWhiteMode;
  const word = myRole?.word;
  const meta = getWordMeta(word);

  const handleReveal = () => {
    if (isImposter) {
      sound.playRoleReveal(); // Among us sound for Imposter
    } else {
      sound.playGameStart(); // Chalo for Civilians
    }
    setRevealed(true);
  };

  return (
    <div className="screen role-reveal-screen">
      <h2 className="reveal-title">YOUR ROLE & INTEL</h2>
      <p className="reveal-sub">Keep it classified — do not let anyone see!</p>

      {revealed ? (
        <div className="card-flip-area revealed">
          <div className={`role-card front ${isImposter ? 'imposter' : 'civilian'}`}>
            <div className="role-header-badge">
              <span className="role-label">
                {isImposter ? (isMrWhite ? 'GHOST' : 'IMPOSTER') : 'CIVILIAN'}
              </span>
            </div>

            {word ? (
              <div className="role-intel-body">
                <p className="role-word-label">YOUR SECRET WORD</p>
                <div className="role-word-container">
                  <span className="role-word-emoji">{meta.emoji}</span>
                  <span className="role-word">{word}</span>
                </div>

                {/* Picture Illustration */}
                <div className="word-image-frame">
                  <img
                    src={meta.image}
                    alt={word}
                    className="word-illustration-img"
                    onError={(e) => {
                      // Fallback to placeholder if offline
                      e.target.style.display = 'none';
                    }}
                  />
                  <div className="word-image-overlay">
                    <p className="word-desc-text">{meta.desc}</p>
                  </div>
                </div>

                {/* Clue Inspiration Tags */}
                {meta.tags && meta.tags.length > 0 && (
                  <div className="clue-tags-container">
                    <span className="clue-tag-title">Clue inspiration:</span>
                    <div className="clue-tags-row">
                      {meta.tags.map((tag) => (
                        <span key={tag} className="clue-tag-pill">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="role-intel-body">
                <p className="role-word-label">YOUR STATUS</p>
                <div className="role-word-container">
                  <span className="role-word-emoji">❓</span>
                  <span className="role-word">NO WORD</span>
                </div>

                <div className="word-image-frame mr-white-frame">
                  <img
                    src="/bg-cyber.png"
                    alt="Classified"
                    className="word-illustration-img mr-white-img"
                  />
                  <div className="word-image-overlay">
                    <p className="word-desc-text">
                      You are the Ghost! 👻 You have NO secret word. Pay close attention to others' clues, fake your way through, or guess their word to steal victory!
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="card-flip-area" onClick={handleReveal}>
          <div className="role-card back">
            <span className="card-eye">?</span>
            <p>Tap to reveal intel</p>
          </div>
        </div>
      )}

      {revealed && (
        <button
          className="btn btn-primary fade-in"
          onClick={() => {
            setIsReady(true);
            onReady();
          }}
          disabled={isReady}
        >
          {isReady ? '✓ Ready! Waiting for other agents…' : "I'm Ready →"}
        </button>
      )}
    </div>
  );
}
