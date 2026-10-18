import React, { useState, useRef, useEffect } from 'react';

export default function InGameChatWidget({ messages = [], playerId, onSend }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);
  const lastMsgCountRef = useRef(messages.length);

  // Track unread messages when widget is closed
  useEffect(() => {
    if (!open && messages.length > lastMsgCountRef.current) {
      const diff = messages.length - lastMsgCountRef.current;
      setUnreadCount((prev) => prev + diff);
    }
    lastMsgCountRef.current = messages.length;

    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

  const handleToggle = () => {
    if (!open) {
      setUnreadCount(0);
    }
    setOpen(!open);
  };

  const handleSend = () => {
    const trimmed = text.trim();
    if (trimmed) {
      onSend(trimmed);
      setText('');
    }
  };

  return (
    <div className={`in-game-chat-widget ${open ? 'is-open' : ''}`}>
      {/* Floating Toggle Button */}
      <button
        type="button"
        className={`in-game-chat-trigger ${unreadCount > 0 ? 'has-unread' : ''}`}
        onClick={handleToggle}
        title="Open In-Game Chat"
      >
        <span className="chat-trigger-icon">💬</span>
        <span className="chat-trigger-label">Chat</span>
        {unreadCount > 0 && (
          <span className="chat-unread-badge">{unreadCount}</span>
        )}
      </button>

      {/* Expandable Chat Drawer */}
      {open && (
        <div className="in-game-chat-card fade-in">
          <div className="in-game-chat-header">
            <div className="chat-header-title">
              <span className="chat-dot online" />
              <span>MISSION COMMS</span>
            </div>
            <button
              type="button"
              className="chat-close-btn"
              onClick={() => setOpen(false)}
              title="Minimize chat"
            >
              ✕
            </button>
          </div>

          <div className="in-game-chat-body">
            {messages.length === 0 ? (
              <p className="chat-empty">No comms yet. Share intel or bluff! 🕵️</p>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className={`chat-msg ${m.playerId === playerId ? 'mine' : 'theirs'}`}
                >
                  {m.playerId !== playerId && (
                    <span className="chat-name">{m.playerName}</span>
                  )}
                  <span className="chat-bubble">{m.text}</span>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="in-game-chat-footer">
            <input
              className="input in-game-chat-input"
              placeholder="Type in-game message…"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              maxLength={200}
            />
            <button
              type="button"
              className="btn btn-primary btn-sm chat-send-btn"
              onClick={handleSend}
            >
              ↑
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
