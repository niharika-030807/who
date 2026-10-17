import React, { useState } from 'react';
import { sound } from '../utils/audio';

export default function VoteScreen({ gameState, playerId, onCastVote }) {
  const [hasVoted, setHasVoted] = useState(false);

  const alivePlayers = gameState.players.filter((p) => p.isAlive);
  const eligibleTargets = alivePlayers.filter((p) => p.id !== playerId);
  const totalAlive = alivePlayers.length;
  const votesCast = alivePlayers.reduce((acc, p) => acc + (p.votes || 0), 0);

  const handleVote = (targetId) => {
    if (hasVoted) return;
    sound.playVote();
    setHasVoted(true);
    onCastVote(targetId);
  };

  return (
    <div className="screen vote-screen">
      <div className="phase-header">
        <span className="phase-tag">VOTE</span>
        <h2>Cast Your Vote</h2>
      </div>

      <p className="votes-cast-text">
        {votesCast} / {totalAlive} votes cast
      </p>

      {hasVoted ? (
        <p className="waiting-text">Vote cast! Waiting for others…</p>
      ) : (
        <div className="vote-list">
          {eligibleTargets.map((p) => (
            <button
              key={p.id}
              className="btn btn-vote"
              onClick={() => handleVote(p.id)}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
