import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";

import socket from "../socket";
import { fetchMessages } from "../services/messageService";
import { useAuth } from "../context/AuthContext";

import MessageBubble from "../components/MessageBubble";
import OnlineUsers from "../components/OnlineUsers";
import TypingIndicator from "../components/TypingIndicator";
import EmojiPicker from "../components/EmojiPicker";

function Chat() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUser, setTypingUser] = useState(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const textareaRef = useRef(null);

  // ─── Auto-scroll to bottom ───────────────────────────────────
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // ─── Load chat history ────────────────────────────────────────
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const data = await fetchMessages();
        setMessages(data);
      } catch (err) {
        setError("Failed to load chat history.");
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, []);

  // ─── Socket lifecycle ─────────────────────────────────────────
  useEffect(() => {
    if (!user) return;

    // Connect the socket (autoConnect was false)
    socket.connect();

    // Announce this user to the server
    socket.emit("join", { username: user.name, userId: user.id });

    // Listen for new messages
    const onReceiveMessage = (msg) => {
      setMessages((prev) => [...prev, msg]);
    };

    // Listen for online users list updates
    const onOnlineUsers = (users) => {
      setOnlineUsers(users);
    };

    // Typing events
    const onUserTyping = ({ username }) => {
      setTypingUser(username);
    };

    const onUserStopTyping = () => {
      setTypingUser(null);
    };

    socket.on("receiveMessage", onReceiveMessage);
    socket.on("onlineUsers", onOnlineUsers);
    socket.on("userTyping", onUserTyping);
    socket.on("userStopTyping", onUserStopTyping);

    // Cleanup on unmount — remove only OUR listeners, then disconnect
    return () => {
      socket.off("receiveMessage", onReceiveMessage);
      socket.off("onlineUsers", onOnlineUsers);
      socket.off("userTyping", onUserTyping);
      socket.off("userStopTyping", onUserStopTyping);
      socket.disconnect();
    };
  }, [user]);

  // ─── Send message ─────────────────────────────────────────────
  const handleSend = useCallback(() => {
    const text = inputText.trim();
    if (!text || !user) return;

    socket.emit("sendMessage", {
      sender: user.name,
      senderId: user.id,
      message: text,
    });

    setInputText("");

    // Stop typing after sending
    socket.emit("stopTyping");
    clearTimeout(typingTimeoutRef.current);

    // Refocus input
    textareaRef.current?.focus();
  }, [inputText, user]);

  // ─── Typing indicator ─────────────────────────────────────────
  const handleInputChange = (e) => {
    setInputText(e.target.value);

    // Emit typing
    socket.emit("typing", { username: user.name });

    // Stop typing after 2s of inactivity
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stopTyping");
    }, 2000);
  };

  // ─── Enter key to send ────────────────────────────────────────
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ─── Emoji insert ─────────────────────────────────────────────
  const handleEmojiSelect = (emoji) => {
    setInputText((prev) => prev + emoji);
    setShowEmoji(false);
    textareaRef.current?.focus();
  };

  // ─── Logout ───────────────────────────────────────────────────
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // ─── Helpers ─────────────────────────────────────────────────
  const formatDay = (dateStr) => {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString(undefined, { month: "long", day: "numeric" });
  };

  // Group messages by day to show day separators
  const renderMessages = () => {
    let lastDay = null;

    return messages.map((msg, idx) => {
      const msgDay = new Date(msg.createdAt).toDateString();
      const showDaySep = msgDay !== lastDay;
      lastDay = msgDay;

      const isOwn = msg.senderId === user?.id;

      // Show sender name only if previous message is from someone else
      const prevMsg = messages[idx - 1];
      const showSender =
        !isOwn &&
        (!prevMsg ||
          prevMsg.senderId !== msg.senderId ||
          new Date(msg.createdAt) - new Date(prevMsg.createdAt) > 60000);

      return (
        <React.Fragment key={msg._id || idx}>
          {showDaySep && (
            <div className="day-separator">{formatDay(msg.createdAt)}</div>
          )}
          <MessageBubble
            message={msg}
            isOwn={isOwn}
            showSender={showSender}
          />
        </React.Fragment>
      );
    });
  };

  // ─── Render ───────────────────────────────────────────────────
  return (
    <div className="chat-page">
      {/* ── SIDEBAR ── */}
      <aside className="chat-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">💬</div>
            <div className="sidebar-logo-name">
              JD<span>Chats</span>
            </div>
          </div>

          {/* Current user info */}
          <div className="sidebar-user-info">
            <div className="sidebar-avatar">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <span className="sidebar-username">{user?.name}</span>
          </div>
        </div>

        <div className="sidebar-body">
          <div className="sidebar-section-title">
            Online — {onlineUsers.length}
          </div>
          <OnlineUsers onlineUsers={onlineUsers} />
        </div>

        <div className="sidebar-footer">
          <button id="logout-btn" className="btn-logout" onClick={handleLogout}>
            <span>⇦</span> Logout
          </button>
        </div>
      </aside>

      {/* ── MAIN CHAT AREA ── */}
      <main className="chat-main">
        {/* Top bar */}
        <div className="chat-topbar">
          <div className="chat-topbar-icon">🌐</div>
          <div className="chat-topbar-info">
            <h2>Global Chat</h2>
            <p>{onlineUsers.length} online now</p>
          </div>
        </div>

        {/* Messages */}
        <div className="messages-area">
          {loading ? (
            <div className="loading-wrap">
              <div className="spinner" />
            </div>
          ) : error ? (
            <div className="messages-empty">
              <div className="empty-icon">⚠️</div>
              <p>{error}</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="messages-empty">
              <div className="empty-icon">💬</div>
              <p>No messages yet. Say hello!</p>
            </div>
          ) : (
            renderMessages()
          )}

          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>

        {/* Typing indicator */}
        <TypingIndicator typingUser={typingUser} />

        {/* Input bar */}
        <div className="chat-input-bar">
          <div className="chat-input-row">
            {/* Emoji toggle */}
            <div className="emoji-picker-wrap">
              <button
                id="emoji-toggle-btn"
                className="emoji-btn"
                type="button"
                onClick={() => setShowEmoji((v) => !v)}
                title="Emojis"
              >
                😊
              </button>

              {showEmoji && (
                <EmojiPicker
                  onSelect={handleEmojiSelect}
                  onClose={() => setShowEmoji(false)}
                />
              )}
            </div>

            {/* Text input */}
            <textarea
              id="chat-input"
              ref={textareaRef}
              placeholder="Type a message... (Enter to send)"
              value={inputText}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              rows={1}
              style={{
                height: "auto",
                overflow: "hidden",
              }}
              onInput={(e) => {
                // Auto-resize textarea
                e.target.style.height = "auto";
                e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
              }}
            />

            {/* Send button */}
            <button
              id="send-btn"
              className="send-btn"
              type="button"
              onClick={handleSend}
              disabled={!inputText.trim()}
              title="Send message"
            >
              ➤
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Chat;