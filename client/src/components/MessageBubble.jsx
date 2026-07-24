import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";

const REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

function MessageBubble({
  message, isOwn, showSender, onReply, onEdit, onDelete, onStar, onPin, onReact,
  onForward, onProfileClick, onImageClick, currentUserId, isMine,
}) {
  const [showActions, setShowActions] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const actionsRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (actionsRef.current && !actionsRef.current.contains(e.target)) {
        setShowActions(false);
        setShowReactionPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (message.deletedForEveryone) {
    return (
      <div className={`msg-group ${isOwn ? "own" : "other"}`}>
        <div className="msg-bubble deleted">
          <em>This message was deleted</em>
        </div>
      </div>
    );
  }

  const isStarred = message.starredBy?.includes(currentUserId);
  const isEdited = message.edited;

  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const renderStatus = () => {
    if (!isOwn) return null;
    const status = message.status || "sent";
    return (
      <span className={`msg-status ${status}`}>
        {status === "sending" && <span className="msg-status-icon">○</span>}
        {status === "sent" && <span className="msg-status-icon">✓</span>}
        {status === "delivered" && <span className="msg-status-icon">✓✓</span>}
        {status === "read" && <span className="msg-status-icon" style={{ color: "var(--sky)" }}>✓✓</span>}
      </span>
    );
  };

  const renderFileContent = () => {
    if (message.messageType === "image" && message.fileUrl) {
      return (
        <img
          src={message.fileUrl}
          alt={message.fileName || "Image"}
          className="msg-image"
          onClick={() => onImageClick?.(message.fileUrl)}
          loading="lazy"
        />
      );
    }
    if (message.messageType === "video" && message.fileUrl) {
      return (
        <video controls className="msg-image" preload="metadata">
          <source src={message.fileUrl} />
        </video>
      );
    }
    if (message.messageType === "audio" && message.fileUrl) {
      return (
        <audio controls style={{ width: "100%", maxWidth: 250, borderRadius: 8 }}>
          <source src={message.fileUrl} />
        </audio>
      );
    }
    if (message.fileUrl) {
      return (
        <div className="msg-file" onClick={() => window.open(message.fileUrl, "_blank")}>
          <span className="msg-file-icon">📎</span>
          <div className="msg-file-info">
            <div className="msg-file-name">{message.fileName || "File"}</div>
            <div className="msg-file-size">
              {message.fileSize ? `${(message.fileSize / 1024).toFixed(1)} KB` : ""}
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const renderReplyPreview = () => {
    if (!message.replyTo) return null;
    const reply = message.replyTo;
    return (
      <div className="reply-preview">
        <div className="reply-sender">
          {reply.senderName || (reply.sender?.name) || "Unknown"}
        </div>
        <div className="reply-content">
          {reply.content || (reply.messageType !== "text" ? `[${reply.messageType}]` : "")}
        </div>
      </div>
    );
  };

  const renderReactions = () => {
    if (!message.reactions || message.reactions.length === 0) return null;
    const grouped = {};
    message.reactions.forEach((r) => {
      grouped[r.emoji] = (grouped[r.emoji] || 0) + 1;
    });
    return (
      <div className="msg-reactions">
        {Object.entries(grouped).map(([emoji, count]) => (
          <span
            key={emoji}
            className={`msg-reaction ${message.reactions.some((r) => r.user === currentUserId && r.emoji === emoji) ? "active" : ""}`}
            onClick={() => onReact?.(message, emoji)}
          >
            {emoji}
            {count > 1 && <span className="msg-reaction-count">{count}</span>}
          </span>
        ))}
        <span className="msg-reaction" onClick={() => setShowReactionPicker(!showReactionPicker)}>+</span>
      </div>
    );
  };

  return (
    <motion.div
      className={`msg-group ${isOwn ? "own" : "other"}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      data-msg-id={message._id}
    >
      {!isOwn && showSender && (
        <div className="msg-sender-name" onClick={() => onProfileClick?.(message.sender?._id || message.senderId)}>
          {message.senderName || message.sender?.name || message.sender}
        </div>
      )}

      <div className="msg-bubble-wrap" ref={actionsRef}>
        <div
          className="msg-actions-trigger"
          onClick={() => setShowActions(!showActions)}
        >
          ⋯
        </div>

        {showActions && (
          <div className="msg-actions">
            {onReply && (
              <button className="msg-action-btn" onClick={() => { onReply(message); setShowActions(false); }} title="Reply">
                ↩
              </button>
            )}
            {isMine && onEdit && (
              <button className="msg-action-btn" onClick={() => { onEdit(message); setShowActions(false); }} title="Edit">
                ✏️
              </button>
            )}
            {onStar && (
              <button
                className="msg-action-btn"
                onClick={() => { onStar(message); setShowActions(false); }}
                title={isStarred ? "Unstar" : "Star"}
                style={isStarred ? { color: "#F59E0B" } : {}}
              >
                {isStarred ? "⭐" : "☆"}
              </button>
            )}
            {onPin && (
              <button className="msg-action-btn" onClick={() => { onPin(message); setShowActions(false); }} title="Pin">
                📌
              </button>
            )}
            {onForward && (
              <button className="msg-action-btn" onClick={() => { onForward(message); setShowActions(false); }} title="Forward">
                ↗
              </button>
            )}
            {isMine && onDelete && (
              <button
                className="msg-action-btn danger"
                onClick={() => { onDelete(message, true); setShowActions(false); }}
                title="Delete for everyone"
              >
                🗑
              </button>
            )}
            {!isMine && onDelete && (
              <button
                className="msg-action-btn danger"
                onClick={() => { onDelete(message, false); setShowActions(false); }}
                title="Delete"
              >
                🗑
              </button>
            )}
            <button
              className="msg-action-btn"
              onClick={() => { navigator.clipboard.writeText(message.content || ""); setShowActions(false); }}
              title="Copy"
            >
              📋
            </button>
          </div>
        )}

        <div className="msg-bubble">
          {message.forwarded && (
            <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 4 }}>
              ↪ Forwarded
            </div>
          )}
          {renderReplyPreview()}
          {renderFileContent()}
          {message.content && message.messageType === "text" && (
            <div style={{ whiteSpace: "pre-wrap" }}>{message.content}</div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end", marginTop: 2 }}>
            <span className="msg-time">
              {formatTime(message.createdAt)}
              {isEdited && <span style={{ fontSize: 10, marginLeft: 4, opacity: 0.6 }}>(edited)</span>}
            </span>
            {renderStatus()}
          </div>
        </div>

        {renderReactions()}

        {showReactionPicker && (
          <div
            style={{
              display: "flex", gap: 4, marginTop: 4, padding: "4px 8px",
              background: "var(--bg-card)", border: "1px solid var(--border)",
              borderRadius: "var(--radius-full)", boxShadow: "var(--shadow-md)",
              position: "absolute", zIndex: 10,
              ...(isOwn ? { right: 0 } : { left: 0 }),
            }}
          >
            {REACTIONS.map((emoji) => (
              <span
                key={emoji}
                style={{ cursor: "pointer", fontSize: 18, transition: "transform 0.15s" }}
                onClick={() => { onReact?.(message, emoji); setShowReactionPicker(false); }}
                onMouseEnter={(e) => e.target.style.transform = "scale(1.3)"}
                onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
              >
                {emoji}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default MessageBubble;
