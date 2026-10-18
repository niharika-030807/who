import React, { useEffect } from 'react';
import { sound } from '../utils/audio';

export default function ResultScreen({
  gameState,
  revealData,
  playerId,
  onPlayAgain
}) {
  const me = gameState?.players?.find((p) => p.id === playerId);
  const myPlayer = (revealData?.players || gameState?.players || []).find((p) => p.id === playerId);
  const isHost = myPlayer?.isHost || me?.isHost;
  const myRole = myPlayer?.role || me?.role;
  const isCivilian = myRole === 'civilian';
  const isImposter = myRole === 'imposter';
  const civiliansWon = gameState?.winner === 'civilians';
  const impostersWon = gameState?.winner === 'imposters';

  useEffect(() => {
    if (civiliansWon) {
      // Civilians win:
      // dun dun dun dun dunnn audible to civilians only
      // sponge bob fail audible to imposter
      if (isCivilian) {
        sound.playDramatic();
      } else if (isImposter) {
        sound.playFail();
      }
    } else if (impostersWon) {
      // Imposter wins:
      // dun dun dun dun dunnn audible to imposter only
      // sponge bob fail audible to civilians
      if (isImposter) {
        sound.playDramatic();
      } else if (isCivilian) {
        sound.playFail();
      }
    }
  }, [civiliansWon, impostersWon, isCivilian, isImposter]);

  const playersList = revealData?.players || gameState.players;

  return (
    <div className="screen result-screen">
      <div
        className={`result-banner ${
          civiliansWon ? 'civilians-win' : 'imposters-win'
        }`}
      >
        <span className="result-emoji">{civiliansWon ? '🎉' : '🕵️'}</span>
        <h1 className="result-title">
          {civiliansWon ? 'CIVILIANS WIN!' : 'IMPOSTER WINS!'}
        </h1>
      </div>

      {revealData?.mrWhiteGuess && (
        <div className="mr-white-result">
          <p>
            👻 Ghost guessed: <strong>"{revealData.mrWhiteGuess}"</strong>
          </p>
          <p>
            {revealData.mrWhiteGuessCorrect ? '✅ Correct! Ghost stole the victory!' : '❌ Wrong guess!'}
          </p>
        </div>
      )}

      <div className="words-reveal">
        <div className="word-reveal-item">
          <p className="word-reveal-label">CIVILIAN WORD</p>
          <p className="word-reveal-value">{revealData?.civilianWord}</p>
        </div>
        {revealData?.imposterWord && (
          <div className="word-reveal-item">
            <p className="word-reveal-label">IMPOSTER WORD</p>
            <p className="word-reveal-value imposter">
              {revealData.imposterWord}
            </p>
          </div>
        )}
      </div>

      <div className="roles-reveal-list">
        <p className="section-label">WHO WAS WHO</p>
        {playersList.map((p) => (
          <div
            key={p.id}
            className={`reveal-row ${
              p.role === 'imposter' ? 'imposter-reveal' : ''
            }`}
          >
            <span className="reveal-name">
              {p.name}
              {p.id === playerId ? ' (you)' : ''}
            </span>
            <span className={`reveal-role ${p.role}`}>
              {p.role?.toUpperCase()}
            </span>
            {p.word && <span className="reveal-word">"{p.word}"</span>}
          </div>
        ))}
      </div>

      {isHost ? (
        <button className="btn btn-primary btn-large" onClick={onPlayAgain}>
          Play Again
        </button>
      ) : (
        <p className="waiting-text">Waiting for host to start a new game…</p>
      )}
    </div>
  );
}
