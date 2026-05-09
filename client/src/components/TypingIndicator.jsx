import React from "react";

function TypingIndicator({ typingUser }) {
  if (!typingUser) return <div className="typing-indicator-wrap" />;

  return (
    <div className="typing-indicator-wrap">
      <div className="typing-indicator">
        <span>{typingUser} is typing</span>
        <div className="typing-dots">
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  );
}

export default TypingIndicator;
