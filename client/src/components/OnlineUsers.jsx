import React from "react";
import { useAuth } from "../context/AuthContext";

function OnlineUsers({ onlineUsers }) {
  const { user } = useAuth();

  return (
    <div className="online-users-list">
      {onlineUsers.length === 0 ? (
        <p style={{ fontSize: "12px", color: "var(--text-muted)", padding: "4px" }}>
          No users online
        </p>
      ) : (
        onlineUsers.map((u, idx) => (
          <div key={idx} className="online-user-item">
            <div className="online-dot" />
            <span
              className={`online-user-name ${
                u.userId === user?.id ? "is-you" : ""
              }`}
            >
              {u.username}
              {u.userId === user?.id ? " (you)" : ""}
            </span>
          </div>
        ))
      )}
    </div>
  );
}

export default OnlineUsers;
