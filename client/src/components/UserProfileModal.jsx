import React from "react";
import { motion } from "framer-motion";

function UserProfileModal({
  user: profileUser, isOnline, onClose, onMessage, onAddFriend,
  onRemoveFriend, onBlock, onUnblock, isFriend, isBlocked, isFavorite, onToggleFavorite,
}) {
  const getInitials = (name) => name?.charAt(0).toUpperCase() || "?";
  const formatLastSeen = (date) => {
    if (!date) return "Unknown";
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (d.toDateString() === now.toDateString()) return `Today at ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    return d.toLocaleDateString();
  };

  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="modal-content"
        style={{ maxWidth: 400 }}
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>Profile</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="profile-header">
          <div
            className="profile-avatar"
            style={{ background: `linear-gradient(135deg, #4F46E5, #6366F1)` }}
          >
            {profileUser.avatar ? (
              <img src={profileUser.avatar} alt="" style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover" }} />
            ) : (
              getInitials(profileUser.name)
            )}
          </div>
          <h3>{profileUser.name}</h3>
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            fontSize: 13, color: isOnline ? "var(--emerald)" : "var(--text-muted)",
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%",
              background: isOnline ? "var(--emerald)" : "var(--text-muted)",
            }} />
            {isOnline ? "Online" : `Last seen ${formatLastSeen(profileUser.lastSeen)}`}
          </div>
        </div>

        <div className="profile-details">
          <div className="profile-detail">
            <span className="profile-detail-label">Email</span>
            <span className="profile-detail-value">{profileUser.email}</span>
          </div>
          <div className="profile-detail">
            <span className="profile-detail-label">Status</span>
            <span className="profile-detail-value">{profileUser.status || "Hey there! I am using JD-Chats"}</span>
          </div>
        </div>

        <div className="profile-actions">
          <button className="btn-primary" style={{ flex: 1 }} onClick={onMessage}>
            💬 Message
          </button>
          {isFriend ? (
            <button className="btn-secondary" onClick={onRemoveFriend}>
              Remove Friend
            </button>
          ) : (
            <button className="btn-secondary" onClick={onAddFriend}>
              Add Friend
            </button>
          )}
          <button className="btn-secondary" onClick={onToggleFavorite}>
            {isFavorite ? "⭐" : "☆"}
          </button>
          {isBlocked ? (
            <button className="btn-secondary" onClick={onUnblock}>
              Unblock
            </button>
          ) : (
            <button className="btn-danger" onClick={onBlock}>
              Block
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default UserProfileModal;
