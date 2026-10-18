import React from 'react';

export default function DiscussionScreen({ gameState, playerId, onStartVote }) {
  const me = gameState.players.find((p) => p.id === playerId);
  const isHost = me?.isHost;

  return (
    <div className="screen discussion-screen">
      <div className="phase-header">
        <span className="phase-tag">DISCUSSION</span>
        <h2>Who's the Imposter?</h2>
      </div>

      <div className="hints-summary">
        {gameState.players
          .filter((p) => p.isAlive)
          .map((p) => (
            <div key={p.id} className="summary-row">
              <span className="summary-name">
                {p.name}
                {p.id === playerId ? ' (you)' : ''}
              </span>
              <span className="summary-hint">"{p.hint}"</span>
            </div>
          ))}
      </div>

      <p className="discussion-text">
        Debate! Who gave a suspicious hint? When ready, the host starts the vote.
      </p>

      {isHost ? (
        <button className="btn btn-danger btn-large" onClick={onStartVote}>
          Start Vote
        </button>
      ) : (
        <p className="waiting-text">Waiting for host to start the vote…</p>
      )}
    </div>
  );
}
