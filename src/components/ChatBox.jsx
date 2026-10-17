import React, { useState, useRef, useEffect } from 'react';

export default function ChatBox({ messages = [], playerId, onSend }) {
  const [text, setText] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (text.trim()) {
      onSend(text.trim());
      setText('');
    }
  };

  return (
    <div className="chat-box">
      <p className="section-label">CHAT</p>
      <div className="chat-messages">
        {messages.length === 0 && (
          <p className="chat-empty">No messages yet. Say hi! 👋</p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`chat-msg ${m.playerId === playerId ? 'mine' : 'theirs'}`}
          >
            {m.playerId !== playerId && (
              <span className="chat-name">{m.playerName}</span>
            )}
            <span className="chat-bubble">{m.text}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="chat-input-row">
        <input
          className="input chat-input"
          placeholder="Type a message…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          maxLength={200}
        />
        <button className="btn btn-primary btn-sm" onClick={handleSend}>
          ↑
        </button>
      </div>
    </div>
  );
}
