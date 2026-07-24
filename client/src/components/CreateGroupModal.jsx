import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { searchUsers } from "../services/messageService";
const AVATAR_COLORS = ["#4F46E5", "#7C3AED", "#EC4899", "#EF4444", "#F59E0B", "#10B981", "#06B6D4"];

function CreateGroupModal({ onClose, onCreate }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const results = await searchUsers(searchQuery);
        setSearchResults(results.filter((r) => !selectedUsers.find((s) => s._id === r._id)));
      } catch { setSearchResults([]); }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedUsers]);

  const handleAddUser = (u) => {
    setSelectedUsers((prev) => [...prev, u]);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleRemoveUser = (userId) => {
    setSelectedUsers((prev) => prev.filter((u) => u._id !== userId));
  };

  const handleCreate = () => {
    if (!name.trim()) return;
    if (selectedUsers.length === 0) return;
    onCreate({
      name: name.trim(),
      description: description.trim(),
      members: selectedUsers.map((u) => u._id),
    });
  };

  const getUserColor = (id) => {
    let hash = 0;
    for (let i = 0; i < (id || "").length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
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
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>Create Group</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Group Name</label>
            <input
              className="form-input"
              placeholder="Enter group name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description (optional)</label>
            <input
              className="form-input"
              placeholder="What's this group about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Add Members</label>
            <input
              className="form-input"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {selectedUsers.length > 0 && (
            <div className="selected-users">
              {selectedUsers.map((u) => (
                <span key={u._id} className="selected-user-chip">
                  {u.name}
                  <button onClick={() => handleRemoveUser(u._id)}>✕</button>
                </span>
              ))}
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="search-results" style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-md)", marginTop: 8 }}>
              {searchResults.map((u) => (
                <div
                  key={u._id}
                  className="search-result-item"
                  onClick={() => handleAddUser(u)}
                >
                  <div className="search-result-avatar" style={{ background: getUserColor(u._id) }}>
                    {u.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="search-result-name">{u.name}</div>
                    <div className="search-result-email">{u.email}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn-primary"
            style={{ width: "auto" }}
            onClick={handleCreate}
            disabled={!name.trim() || selectedUsers.length === 0}
          >
            Create Group
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default CreateGroupModal;
