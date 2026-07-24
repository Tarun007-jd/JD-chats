import React from "react";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";

function OnlineUsers({ onlineUsers }) {
  const { user } = useAuth();

  if (!onlineUsers || onlineUsers.length === 0) {
    return (
      <div style={{ padding: "0 20px", fontSize: "13px", color: "var(--text-muted)" }}>
        No users online
      </div>
    );
  }

  return (
    <div style={{ padding: "0 20px" }}>
      {onlineUsers.map((u, idx) => (
        <motion.div
          key={idx}
          className="online-user-item"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.03 }}
          style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0" }}
        >
          <div style={{
            width: 8, height: 8, background: "var(--online-dot)",
            borderRadius: "50%", flexShrink: 0,
            animation: "pulse 2s infinite",
          }} />
          <span style={{
            fontSize: 13, fontWeight: 500,
            color: u.userId === user?.id ? "var(--accent)" : "var(--text-primary)",
          }}>
            {u.username}{u.userId === user?.id ? " (you)" : ""}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

export default OnlineUsers;
