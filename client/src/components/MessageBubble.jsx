import React from "react";

function MessageBubble({ message, isOwn, showSender }) {
  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className={`msg-group ${isOwn ? "own" : "other"}`}>
      {/* Show sender name only for other people's messages */}
      {!isOwn && showSender && (
        <div className="msg-sender-name">{message.sender}</div>
      )}

      <div className="msg-bubble">{message.message}</div>

      <div className="msg-time">{formatTime(message.createdAt)}</div>
    </div>
  );
}

export default MessageBubble;
