import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import {
  updateProfile, changePassword, updateSettings, deleteAccount,
} from "../services/messageService";

const AVATAR_COLORS = ["#4F46E5", "#7C3AED", "#EC4899"];

function Settings() {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  const [activeTab, setActiveTab] = useState("profile");
  const [name, setName] = useState(user?.name || "");
  const [status, setStatus] = useState(user?.status || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [notifications, setNotifications] = useState(user?.notifications !== false);
  const [notificationSound, setNotificationSound] = useState(user?.notificationSound !== false);
  const [privacyLastSeen, setPrivacyLastSeen] = useState(user?.privacyLastSeen !== false);
  const [privacyReadReceipts, setPrivacyReadReceipts] = useState(user?.privacyReadReceipts !== false);
  const [saving, setSaving] = useState(false);

  const getUserColor = (id) => {
    let hash = 0;
    for (let i = 0; i < (id || "").length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await updateProfile({ name: name.trim(), status: status.trim() });
      updateUser(updated);
      toast.success("Profile updated");
    } catch { toast.error("Failed to update profile"); }
    finally { setSaving(false); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      toast.error("Fill in both fields");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    setSaving(true);
    try {
      await changePassword(currentPassword, newPassword);
      toast.success("Password changed");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to change password");
    }
    finally { setSaving(false); }
  };

  const handleUpdateSettings = async (key, value) => {
    try {
      await updateSettings({ [key]: value });
      if (key === "theme") setTheme(value);
      toast.success("Settings updated");
    } catch { toast.error("Failed to update settings"); }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("Are you sure you want to delete your account? This cannot be undone.")) return;
    try {
      await deleteAccount();
      toast.success("Account deleted");
      logout();
      navigate("/login");
    } catch { toast.error("Failed to delete account"); }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const tabs = [
    { id: "profile", label: "👤 Profile", icon: "👤" },
    { id: "password", label: "🔒 Password", icon: "🔒" },
    { id: "notifications", label: "🔔 Notifications", icon: "🔔" },
    { id: "privacy", label: "🛡️ Privacy", icon: "🛡️" },
    { id: "theme", label: "🎨 Theme", icon: "🎨" },
    { id: "danger", label: "⚠️ Danger Zone", icon: "⚠️" },
  ];

  return (
    <div className="settings-page">
      <aside className="settings-sidebar">
        <div className="settings-sidebar-header">
          <h2>Settings</h2>
          <div
            style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 16, cursor: "pointer" }}
            onClick={() => navigate("/chat")}
          >
            <span style={{ fontSize: 14 }}>← Back to Chat</span>
          </div>
        </div>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`settings-nav-item ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </aside>

      <div className="settings-content">
        <div className="settings-section">
          {activeTab === "profile" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <h3>Edit Profile</h3>
              <div className="settings-card">
                <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
                  <div
                    style={{
                      width: 64, height: 64, borderRadius: "50%",
                      background: getUserColor(user?.id),
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 28, fontWeight: 700, color: "#fff",
                    }}
                  >
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 600 }}>{user?.name}</div>
                    <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{user?.email}</div>
                  </div>
                </div>
                <form onSubmit={handleUpdateProfile}>
                  <div className="form-group">
                    <label className="form-label">Display Name</label>
                    <input
                      className="form-input"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status Message</label>
                    <input
                      className="form-input"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      placeholder="Hey there! I am using JD-Chats"
                    />
                  </div>
                  <button className="btn-primary" type="submit" disabled={saving} style={{ width: "auto" }}>
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {activeTab === "password" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <h3>Change Password</h3>
              <div className="settings-card">
                <form onSubmit={handleChangePassword}>
                  <div className="form-group">
                    <label className="form-label">Current Password</label>
                    <input
                      className="form-input"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">New Password</label>
                    <input
                      className="form-input"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                    />
                  </div>
                  <button className="btn-primary" type="submit" disabled={saving} style={{ width: "auto" }}>
                    {saving ? "Changing..." : "Change Password"}
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {activeTab === "notifications" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <h3>Notification Settings</h3>
              <div className="settings-card">
                <div className="settings-row">
                  <div>
                    <div className="settings-row-label">Push Notifications</div>
                    <div className="settings-row-desc">Receive notifications for new messages</div>
                  </div>
                  <button
                    className={`toggle-switch ${notifications ? "active" : ""}`}
                    onClick={() => {
                      setNotifications(!notifications);
                      handleUpdateSettings("notifications", !notifications);
                    }}
                  />
                </div>
                <div className="settings-row">
                  <div>
                    <div className="settings-row-label">Notification Sound</div>
                    <div className="settings-row-desc">Play sound for incoming messages</div>
                  </div>
                  <button
                    className={`toggle-switch ${notificationSound ? "active" : ""}`}
                    onClick={() => {
                      setNotificationSound(!notificationSound);
                      handleUpdateSettings("notificationSound", !notificationSound);
                    }}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "privacy" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <h3>Privacy Settings</h3>
              <div className="settings-card">
                <div className="settings-row">
                  <div>
                    <div className="settings-row-label">Last Seen</div>
                    <div className="settings-row-desc">Show when you were last active</div>
                  </div>
                  <button
                    className={`toggle-switch ${privacyLastSeen ? "active" : ""}`}
                    onClick={() => {
                      setPrivacyLastSeen(!privacyLastSeen);
                      handleUpdateSettings("privacyLastSeen", !privacyLastSeen);
                    }}
                  />
                </div>
                <div className="settings-row">
                  <div>
                    <div className="settings-row-label">Read Receipts</div>
                    <div className="settings-row-desc">Show when you've read messages</div>
                  </div>
                  <button
                    className={`toggle-switch ${privacyReadReceipts ? "active" : ""}`}
                    onClick={() => {
                      setPrivacyReadReceipts(!privacyReadReceipts);
                      handleUpdateSettings("privacyReadReceipts", !privacyReadReceipts);
                    }}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "theme" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <h3>Theme</h3>
              <div className="settings-card">
                <div className="settings-row">
                  <div>
                    <div className="settings-row-label">Light Mode</div>
                    <div className="settings-row-desc">Clean, bright interface</div>
                  </div>
                  <button
                    className={`toggle-switch ${theme === "light" ? "active" : ""}`}
                    onClick={() => handleUpdateSettings("theme", "light")}
                  />
                </div>
                <div className="settings-row">
                  <div>
                    <div className="settings-row-label">Dark Mode</div>
                    <div className="settings-row-desc">Easy on the eyes at night</div>
                  </div>
                  <button
                    className={`toggle-switch ${theme === "dark" ? "active" : ""}`}
                    onClick={() => handleUpdateSettings("theme", "dark")}
                  />
                </div>
                <div className="settings-row">
                  <div>
                    <div className="settings-row-label">Auto (System)</div>
                    <div className="settings-row-desc">Follow your system theme</div>
                  </div>
                  <button
                    className={`toggle-switch ${theme === "auto" ? "active" : ""}`}
                    onClick={() => handleUpdateSettings("theme", "auto")}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "danger" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <h3>Danger Zone</h3>
              <div className="settings-card" style={{ borderColor: "#FECACA" }}>
                <h4 style={{ color: "var(--error)" }}>Delete Account</h4>
                <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 16 }}>
                  Once you delete your account, there is no going back. Please be certain.
                </p>
                <button className="btn-danger" onClick={handleDeleteAccount}>
                  🗑 Delete My Account
                </button>
              </div>
              <div className="settings-card">
                <h4>Logout</h4>
                <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 16 }}>
                  Sign out of your account on this device.
                </p>
                <button className="btn-secondary" onClick={handleLogout}>
                  ⇦ Logout
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Settings;
