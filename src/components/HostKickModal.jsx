import React, { useState } from 'react';

export default function HostKickModal({ gameState, playerId, onKickPlayer }) {
  const [open, setOpen] = useState(false);
  const [confirmId, setConfirmId] = useState(null);

  const me = gameState?.players?.find((p) => p.id === playerId);
  const isHost = me?.isHost;

  // Only render controls if current player is host
  if (!isHost) return null;

  const otherPlayers = (gameState?.players || []).filter((p) => p.id !== playerId);

  const handleKick = (target) => {
    if (confirmId === target.id) {
      onKickPlayer(target.id, target.name);
      setConfirmId(null);
    } else {
      setConfirmId(target.id);
    }
  };

  return (
    <>
      {/* Top Bar Trigger Button for Host */}
      <div className="host-quick-controls">
        <button
          type="button"
          className="host-roster-btn"
          onClick={() => setOpen(true)}
          title="Manage Players & Kick Permissions"
        >
          <span className="roster-badge-icon">🛡️</span>
          <span>ROSTER / KICK</span>
        </button>
      </div>

      {/* Cyber Roster & Kick Modal */}
      {open && (
        <div className="modal-overlay fade-in" onClick={() => setOpen(false)}>
          <div
            className="modal-card host-kick-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-title-wrap">
                <span className="phase-tag danger">HOST SECURITY</span>
                <h2>MISSION ROSTER & KICK</h2>
              </div>
              <button
                type="button"
                className="chat-close-btn"
                onClick={() => {
                  setOpen(false);
                  setConfirmId(null);
                }}
              >
                ✕
              </button>
            </div>

            <p className="roster-desc">
              As host, you can remove disruptive players or bots anytime. If kicked in the middle of a turn, the turn auto-advances.
            </p>

            <div className="roster-list">
              {otherPlayers.length === 0 ? (
                <p className="chat-empty">No other players in the room.</p>
              ) : (
                otherPlayers.map((p) => (
                  <div key={p.id} className="roster-player-row">
                    <div className="roster-player-info">
                      <span className={`player-dot ${p.isBot ? 'bot' : ''}`} />
                      <div className="roster-names">
                        <span className="roster-name">{p.name}</span>
                        <div className="roster-badges">
                          {p.isBot && <span className="bot-badge">AI BOT</span>}
                          {!p.isAlive && (
                            <span className="eliminated-badge">ELIMINATED</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="roster-action">
                      {confirmId === p.id ? (
                        <div className="confirm-kick-row">
                          <button
                            type="button"
                            className="btn btn-danger btn-sm confirm-kick-btn"
                            onClick={() => handleKick(p)}
                          >
                            Confirm Kick!
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => setConfirmId(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="btn-kick-action"
                          onClick={() => handleKick(p)}
                        >
                          ✕ Kick
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary btn-large"
                style={{ width: '100%' }}
                onClick={() => {
                  setOpen(false);
                  setConfirmId(null);
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
