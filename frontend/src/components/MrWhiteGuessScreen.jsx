import React, { useState } from 'react';

export default function MrWhiteGuessScreen({ socketRef }) {
  const [guess, setGuess] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (guess.trim() && !submitted) {
      socketRef.current?.emit('mr-white-guess', { guess: guess.trim() }, () => {
        setSubmitted(true);
      });
    }
  };

  return (
    <div className="screen mr-white-screen">
      <div className="phase-header">
        <span className="phase-tag danger">YOU'RE CAUGHT</span>
        <h2>👻 Ghost's Last Chance</h2>
      </div>

      <p className="discussion-text">
        Guess the civilians' secret word to steal victory as the Ghost!
      </p>

      {submitted ? (
        <p className="waiting-text">Guess submitted! Waiting for result…</p>
      ) : (
        <div className="hint-input-block">
          <input
            className="input"
            placeholder="Guess the word…"
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            autoFocus
          />
          <button className="btn btn-primary btn-large" onClick={handleSubmit}>
            Submit Guess
          </button>
        </div>
      )}
    </div>
  );
}
