import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import socket from "../socket";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import {
  fetchMessages, fetchConversations, createOrGetConversation,
  markConversationRead, searchUsers, addFriend, removeFriend,
  blockUser, unblockUser, getUserProfile, toggleFavorite,
  getFriends, uploadFile, pinConversation, archiveConversation,
  searchMessages, editMessage, deleteMessage,
  pinMessage, starMessage, reactToMessage, forwardMessage,
  createGroup,
} from "../services/messageService";

import MessageBubble from "../components/MessageBubble";
import EmojiPicker from "../components/EmojiPicker";
import UserProfileModal from "../components/UserProfileModal";
import CreateGroupModal from "../components/CreateGroupModal";
import LoadingSkeleton from "../components/LoadingSkeleton";
import ImagePreview from "../components/ImagePreview";

const AVATAR_COLORS = [
  "#4F46E5", "#7C3AED", "#EC4899", "#EF4444",
  "#F59E0B", "#10B981", "#06B6D4", "#6366F1",
];

function Chat() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toggleTheme, theme } = useTheme();

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const [showEmoji, setShowEmoji] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSidebar, setShowSidebar] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileUser, setProfileUser] = useState(null);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewImage, setPreviewImage] = useState(null);
  const [messageSearchQuery, setMessageSearchQuery] = useState("");
  const [messageSearchResults, setMessageSearchResults] = useState([]);
  const [showMessageSearch, setShowMessageSearch] = useState(false);
  const [friendsList, setFriendsList] = useState([]);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [favoriteContacts, setFavoriteContacts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const textareaRef = useRef(null);
  const messagesAreaRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, scrollToBottom]);

  const getUserColor = (id) => {
    let hash = 0;
    for (let i = 0; i < (id || "").length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
  };

  const getInitials = (name) => name?.charAt(0).toUpperCase() || "?";

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    if (diff < 86400000 * 2) return "Yesterday";
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const formatDay = (dateStr) => {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
  };

  const getConversationName = (conv) => {
    if (conv.type === "group" && conv.group?.name) return conv.group.name;
    const other = conv.participants?.find((p) => p._id !== user?.id);
    return other?.name || "Unknown";
  };

  const getConversationAvatar = (conv) => {
    if (conv.type === "group") return conv.group?.avatar || "👥";
    const other = conv.participants?.find((p) => p._id !== user?.id);
    return other?.avatar || null;
  };

  const getConversationInitials = (conv) => {
    return getInitials(getConversationName(conv));
  };

  const getConversationColor = (conv) => {
    if (conv.type === "group") return "#6366F1";
    const other = conv.participants?.find((p) => p._id !== user?.id);
    return getUserColor(other?._id);
  };

  const getOtherUser = (conv) => {
    return conv.participants?.find((p) => p._id !== user?.id);
  };

  const isUserOnline = (userId) => {
    return onlineUsers.some((u) => u.userId === userId);
  };

  // ─── LOAD CONVERSATIONS ────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const data = await fetchConversations();
        setConversations(data);
      } catch (err) {
        console.error("Failed to load conversations");
      }
    };
    load();
  }, [user]);

  // ─── LOAD FRIENDS ──────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    getFriends().then((data) => {
      if (data) {
        setFriendsList(data.friends || []);
        setBlockedUsers(data.blockedUsers || []);
        setFavoriteContacts(data.favoriteContacts || []);
      }
    }).catch(() => {});
  }, [user]);

  // ─── LOAD MESSAGES ─────────────────────────────────────────
  const loadMessages = useCallback(async (convId, pageNum = 1) => {
    if (!convId) return;
    if (pageNum === 1) setMessagesLoading(true);
    else setLoadingMore(true);
    setError("");
    try {
      const data = await fetchMessages(convId, pageNum);
      if (pageNum === 1) {
        setMessages(data.messages || []);
      } else {
        setMessages((prev) => [...(data.messages || []), ...prev]);
      }
      setHasMore(data.hasMore || false);
      setPage(pageNum);
      if (pageNum === 1) {
        setTimeout(() => scrollToBottom(false), 100);
      }
    } catch (err) {
      setError("Failed to load messages");
    } finally {
      setMessagesLoading(false);
      setLoadingMore(false);
    }
  }, [scrollToBottom]);

  useEffect(() => {
    if (activeConversation) {
      loadMessages(activeConversation._id, 1);
      markConversationRead(activeConversation._id).catch(() => {});
      setMessageSearchResults([]);
      setShowMessageSearch(false);
    }
  }, [activeConversation, loadMessages]);

  // ─── SOCKET ────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    socket.connect();
    socket.emit("join", { username: user.name, userId: user.id });

    const onReceiveMessage = (msg) => {
      if (activeConversation && msg.conversation === activeConversation._id) {
        setMessages((prev) => [...prev, msg]);
        if (msg.sender._id !== user.id) {
          socket.emit("messageDelivered", {
            messageIds: [msg._id],
            userId: user.id,
          });
          socket.emit("messageSeen", {
            conversationId: activeConversation._id,
            userId: user.id,
            messageIds: [msg._id],
          });
        }
      }
      setConversations((prev) => {
        const updated = [...prev];
        const idx = updated.findIndex((c) => c._id === msg.conversation);
        if (idx > -1) {
          updated[idx].lastMessage = msg;
          updated[idx].lastMessageAt = msg.createdAt;
          if (msg.sender._id !== user.id && msg.conversation !== activeConversation?._id) {
            updated[idx].unreadCount = updated[idx].unreadCount || {};
            updated[idx].unreadCount[user.id] = (updated[idx].unreadCount[user.id] || 0) + 1;
          }
          const [item] = updated.splice(idx, 1);
          updated.unshift(item);
        }
        return updated;
      });
    };

    const onOnlineUsers = (users) => setOnlineUsers(users);

    const onUserTyping = ({ conversationId, username }) => {
      if (conversationId === activeConversation?._id) {
        setTypingUsers((prev) => ({ ...prev, [username]: true }));
      }
    };

    const onUserStopTyping = ({ conversationId }) => {
      setTypingUsers({});
    };

    const onMessagesRead = ({ conversationId, userId: readUserId }) => {
      if (conversationId === activeConversation?._id) {
        setMessages((prev) =>
          prev.map((m) =>
            m.sender._id === user.id && m.sender._id !== readUserId
              ? { ...m, status: "read", readBy: [...(m.readBy || []), { user: readUserId }] }
              : m
          )
        );
      }
    };

    const onMessageUpdated = (msg) => {
      if (msg.conversation === activeConversation?._id) {
        setMessages((prev) => prev.map((m) => (m._id === msg._id ? msg : m)));
      }
    };

    const onMessageRemoved = ({ messageId, conversationId }) => {
      if (conversationId === activeConversation?._id) {
        setMessages((prev) =>
          prev.map((m) => (m._id === messageId ? { ...m, deleted: true, deletedForEveryone: true, content: "" } : m))
        );
      }
    };

    const onMessageReactionUpdate = ({ messageId, reactions }) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, reactions } : m))
      );
    };

    const onNewMessageNotification = ({ conversationId, senderName, content, messageType }) => {
      if (Notification.permission === "granted") {
        new Notification("JD-Chats", {
          body: `${senderName}: ${content || `Sent a ${messageType}`}`,
          icon: "/logo192.png",
        });
      }
    };

    socket.on("receiveMessage", onReceiveMessage);
    socket.on("onlineUsers", onOnlineUsers);
    socket.on("userTyping", onUserTyping);
    socket.on("userStopTyping", onUserStopTyping);
    socket.on("messagesRead", onMessagesRead);
    socket.on("messageUpdated", onMessageUpdated);
    socket.on("messageRemoved", onMessageRemoved);
    socket.on("messageReactionUpdate", onMessageReactionUpdate);
    socket.on("newMessageNotification", onNewMessageNotification);

    if (activeConversation) {
      socket.emit("joinConversation", { conversationId: activeConversation._id });
    }

    return () => {
      socket.off("receiveMessage", onReceiveMessage);
      socket.off("onlineUsers", onOnlineUsers);
      socket.off("userTyping", onUserTyping);
      socket.off("userStopTyping", onUserStopTyping);
      socket.off("messagesRead", onMessagesRead);
      socket.off("messageUpdated", onMessageUpdated);
      socket.off("messageRemoved", onMessageRemoved);
      socket.off("messageReactionUpdate", onMessageReactionUpdate);
      socket.off("newMessageNotification", onNewMessageNotification);
      if (activeConversation) {
        socket.emit("leaveConversation", { conversationId: activeConversation._id });
      }
      socket.disconnect();
    };
  }, [user, activeConversation]);

  // ─── SEARCH USERS ─────────────────────────────────────────
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const results = await searchUsers(searchQuery);
        setSearchResults(results);
      } catch { setSearchResults([]); }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // ─── HANDLERS ──────────────────────────────────────────────
  const handleSend = useCallback(() => {
    const text = inputText.trim();
    if ((!text && !uploading) || !user || !activeConversation) return;

    if (editingMessage) {
      socket.emit("messageEdited", {
        messageId: editingMessage._id,
        content: text,
        conversationId: activeConversation._id,
      });
      editMessage(editingMessage._id, text).catch(() => {});
      setEditingMessage(null);
      setInputText("");
      return;
    }

    socket.emit("sendMessage", {
      conversationId: activeConversation._id,
      sender: user.name,
      senderId: user.id,
      senderName: user.name,
      content: text,
      messageType: "text",
      replyTo: replyingTo?._id || null,
    });

    setInputText("");
    setReplyingTo(null);
    socket.emit("stopTyping", { conversationId: activeConversation._id });
    clearTimeout(typingTimeoutRef.current);
    textareaRef.current?.focus();
  }, [inputText, user, activeConversation, uploading, editingMessage, replyingTo]);

  const handleInputChange = (e) => {
    setInputText(e.target.value);
    if (activeConversation) {
      socket.emit("typing", { conversationId: activeConversation._id, username: user.name });
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("stopTyping", { conversationId: activeConversation._id });
      }, 2000);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEmojiSelect = (emoji) => {
    setInputText((prev) => prev + emoji);
    setShowEmoji(false);
    textareaRef.current?.focus();
  };

  const handleConversationClick = async (conv) => {
    setActiveConversation(conv);
    setShowSidebar(false);
    socket.emit("joinConversation", { conversationId: conv._id });
    setReplyingTo(null);
    setEditingMessage(null);
  };

  const handleNewChat = async (userId) => {
    try {
      const conv = await createOrGetConversation(userId);
      setConversations((prev) => {
        const filtered = prev.filter((c) => c._id !== conv._id);
        return [conv, ...filtered];
      });
      setActiveConversation(conv);
      setSearchQuery("");
      setSearchResults([]);
      setShowSearch(false);
      setShowSidebar(false);
    } catch (err) {
      toast.error("Failed to create conversation");
    }
  };

  const handleReply = (msg) => {
    setReplyingTo(msg);
    setEditingMessage(null);
    textareaRef.current?.focus();
  };

  const handleEdit = (msg) => {
    setEditingMessage(msg);
    setInputText(msg.content);
    setReplyingTo(null);
    textareaRef.current?.focus();
  };

  const handleDelete = async (msg, forEveryone = false) => {
    try {
      await deleteMessage(msg._id, forEveryone);
      socket.emit("messageDeleted", {
        messageId: msg._id,
        conversationId: activeConversation._id,
        forEveryone,
      });
      if (!forEveryone) {
        setMessages((prev) => prev.map((m) => (m._id === msg._id ? { ...m, deleted: true, content: "" } : m)));
      }
      toast.success(forEveryone ? "Deleted for everyone" : "Deleted");
    } catch { toast.error("Failed to delete"); }
  };

  const handleStar = async (msg) => {
    try {
      const data = await starMessage(msg._id);
      toast.success(data.message);
      setMessages((prev) =>
        prev.map((m) =>
          m._id === msg._id
            ? { ...m, starredBy: data.starred ? [...(m.starredBy || []), user.id] : (m.starredBy || []).filter((s) => s !== user.id) }
            : m
        )
      );
    } catch { toast.error("Failed to star"); }
  };

  const handlePin = async (msg) => {
    try {
      const data = await pinMessage(msg._id);
      toast.success(data.message);
    } catch { toast.error("Failed to pin"); }
  };

  const handleReact = async (msg, emoji) => {
    try {
      const data = await reactToMessage(msg._id, emoji);
      setMessages((prev) => prev.map((m) => (m._id === msg._id ? { ...m, reactions: data.reactions } : m)));
      socket.emit("messageReacted", {
        messageId: msg._id,
        conversationId: activeConversation._id,
        emoji,
        userId: user.id,
      });
    } catch { /* ignore */ }
  };

  const handleForward = async (msg, convId) => {
    try {
      await forwardMessage(msg._id, convId);
      toast.success("Message forwarded");
    } catch { toast.error("Failed to forward"); }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadProgress(0);
    try {
      const result = await uploadFile(file);
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");
      const isAudio = file.type.startsWith("audio/");
      let messageType = "document";
      if (isImage) messageType = "image";
      else if (isVideo) messageType = "video";
      else if (isAudio) messageType = "audio";

      socket.emit("sendMessage", {
        conversationId: activeConversation._id,
        sender: user.name,
        senderId: user.id,
        senderName: user.name,
        content: result.fileName,
        messageType,
        fileUrl: result.fileUrl,
        fileName: result.fileName,
        fileSize: result.fileSize,
      });

      toast.success("File uploaded");
    } catch { toast.error("Upload failed"); }
    finally { setUploading(false); setUploadProgress(0); }
  };

  const handleProfileClick = async (userId) => {
    try {
      const profile = await getUserProfile(userId);
      setProfileUser(profile);
      setShowProfileModal(true);
    } catch { toast.error("Failed to load profile"); }
  };

  const handleLoadMore = () => {
    if (!hasMore || loadingMore) return;
    loadMessages(activeConversation._id, page + 1);
  };

  const handleMessageSearch = async () => {
    if (!messageSearchQuery.trim() || !activeConversation) return;
    try {
      const results = await searchMessages(activeConversation._id, messageSearchQuery);
      setMessageSearchResults(results);
    } catch { setMessageSearchResults([]); }
  };

  const isConversationMuted = (conv) => {
    return conv.mutedBy?.includes(user?.id);
  };

  const isConversationPinned = (conv) => {
    return conv.pinnedBy?.includes(user?.id);
  };

  // ─── RENDER MESSAGES ───────────────────────────────────────
  const renderMessages = () => {
    let lastDay = null;
    if (messages.length === 0 && !messagesLoading) {
      return (
        <div className="messages-empty">
          <div className="empty-icon">💬</div>
          <h3>No messages yet</h3>
          <p>Say hello to start the conversation!</p>
        </div>
      );
    }

    return messages.map((msg, idx) => {
      const msgDay = new Date(msg.createdAt).toDateString();
      const showDaySep = msgDay !== lastDay;
      lastDay = msgDay;

      const isOwn = msg.sender?._id === user?.id || msg.sender === user?.id || msg.senderId === user?.id;
      const prevMsg = messages[idx - 1];
      const showSender = !isOwn && (!prevMsg || prevMsg.sender?._id !== msg.sender?._id);

      return (
        <React.Fragment key={msg._id || idx}>
          {showDaySep && (
            <motion.div
              className="day-separator"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {formatDay(msg.createdAt)}
            </motion.div>
          )}
          <MessageBubble
            message={msg}
            isOwn={isOwn}
            showSender={showSender}
            onReply={handleReply}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onStar={handleStar}
            onPin={handlePin}
            onReact={handleReact}
            onForward={handleForward}
            onProfileClick={handleProfileClick}
            onImageClick={(url) => setPreviewImage(url)}
            currentUserId={user?.id}
            isMine={msg.sender?._id === user?.id || msg.senderId === user?.id}
          />
        </React.Fragment>
      );
    });
  };

  // ─── RENDER CONVERSATIONS ──────────────────────────────────
  const renderConversations = () => {
    const sorted = [...conversations].sort((a, b) => {
      const aPinned = isConversationPinned(a);
      const bPinned = isConversationPinned(b);
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      return new Date(b.lastMessageAt || b.createdAt) - new Date(a.lastMessageAt || a.createdAt);
    });

    if (sorted.length === 0) {
      return (
        <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)", fontSize: "14px" }}>
          No conversations yet. Search for users to start chatting.
        </div>
      );
    }

    return sorted.map((conv) => {
      const isActive = activeConversation?._id === conv._id;
      const unread = conv.unreadCount?.[user?.id] || 0;
      const other = getOtherUser(conv);
      const name = getConversationName(conv);
      const lastMsg = conv.lastMessage;
      const lastMsgText = lastMsg?.deletedForEveryone
        ? "Message deleted"
        : lastMsg?.content
        ? lastMsg.content.substring(0, 50)
        : lastMsg?.messageType
        ? `Sent a ${lastMsg.messageType}`
        : "No messages yet";

      return (
        <motion.div
          key={conv._id}
          className={`conversation-item ${isActive ? "active" : ""}`}
          onClick={() => handleConversationClick(conv)}
          whileHover={{ backgroundColor: "var(--bg-tertiary)" }}
          transition={{ duration: 0.15 }}
        >
          <div className="conversation-avatar" style={{ background: getConversationColor(conv) }}>
            {getConversationAvatar(conv) ? (
              <img src={getConversationAvatar(conv)} alt="" className="conversation-avatar-img" />
            ) : (
              getConversationInitials(conv)
            )}
            {other && isUserOnline(other._id) && <span className="online-badge" />}
          </div>
          <div className="conversation-info">
            <div className="conversation-name">
              {name}
              {isConversationPinned(conv) && <span className="pinned-icon">📌</span>}
            </div>
            <div className="conversation-last-msg">
              {lastMsg?.senderName === user?.name ? "You: " : ""}
              {lastMsgText}
            </div>
          </div>
          <div className="conversation-meta">
            <span className="conversation-time">{formatTime(lastMsg?.createdAt || conv.createdAt)}</span>
            {unread > 0 && <span className="unread-badge">{unread > 99 ? "99+" : unread}</span>}
          </div>
        </motion.div>
      );
    });
  };

  // ─── RENDER SEARCH RESULTS ─────────────────────────────────
  const renderSearchResults = () => {
    if (searchResults.length === 0 && searchQuery.trim()) {
      return <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)" }}>No users found</div>;
    }
    return searchResults.map((u) => (
      <motion.div
        key={u._id}
        className="search-result-item"
        onClick={() => handleNewChat(u._id)}
        whileHover={{ backgroundColor: "var(--bg-tertiary)" }}
      >
        <div className="search-result-avatar" style={{ background: getUserColor(u._id) }}>
          {u.avatar ? <img src={u.avatar} alt="" style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover" }} /> : getInitials(u.name)}
        </div>
        <div>
          <div className="search-result-name">{u.name}</div>
          <div className="search-result-email">{u.email}</div>
        </div>
      </motion.div>
    ));
  };

  const activeTypingUser = Object.keys(typingUsers).find(Boolean);

  // ─── RENDER ────────────────────────────────────────────────
  if (!user) return null;

  return (
    <div className="chat-page">
      {/* ── SIDEBAR ── */}
      <aside className={`chat-sidebar ${showSidebar ? "" : "hidden"}`}>
        <div className="sidebar-header">
          <div className="sidebar-top-row">
            <div className="sidebar-logo">
              <div className="sidebar-logo-icon">💬</div>
              <div className="sidebar-logo-name">JD<span>Chats</span></div>
            </div>
            <div className="sidebar-actions">
              <button className="sidebar-icon-btn" onClick={() => setShowSearch(!showSearch)} title="Search users">
                {showSearch ? "✕" : "🔍"}
              </button>
              <button className="sidebar-icon-btn" onClick={() => setShowGroupModal(true)} title="Create group">
                👥
              </button>
              <button className="sidebar-icon-btn" onClick={toggleTheme} title="Toggle theme">
                {theme === "dark" ? "☀️" : "🌙"}
              </button>
            </div>
          </div>

          {showSearch ? (
            <div className="sidebar-search">
              <span className="sidebar-search-icon">🔍</span>
              <input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>
          ) : (
            <div className="sidebar-user-info" style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "var(--bg-tertiary)", borderRadius: "var(--radius-md)", cursor: "pointer" }} onClick={() => navigate("/settings")}>
              <div className="sidebar-avatar" style={{
                width: 34, height: 34, borderRadius: "50%", background: getUserColor(user.id),
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#fff", flexShrink: 0,
              }}>
                {getInitials(user.name)}
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user.name}
              </span>
              <span style={{ fontSize: 16 }}>⚙️</span>
            </div>
          )}
        </div>

        <div className="sidebar-body">
          {showSearch ? (
            <div>
              <div className="sidebar-section-title">Search Results</div>
              {renderSearchResults()}
            </div>
          ) : (
            <>
              <div className="sidebar-section-title">Chats</div>
              {conversations.length === 0 ? (
                <LoadingSkeleton count={5} />
              ) : (
                renderConversations()
              )}
            </>
          )}
        </div>
      </aside>

      {/* ── MAIN CHAT AREA ── */}
      <main className="chat-main">
        {activeConversation ? (
          <>
            {/* Topbar */}
            <div className="chat-topbar">
              <button
                className="sidebar-icon-btn"
                onClick={() => setShowSidebar(true)}
                style={{ display: "none" }}
              >
                ☰
              </button>
              <div
                className="chat-topbar-avatar"
                style={{ background: getConversationColor(activeConversation) }}
                onClick={() => {
                  const other = getOtherUser(activeConversation);
                  if (other) handleProfileClick(other._id);
                }}
              >
                {getConversationAvatar(activeConversation) ? (
                  <img src={getConversationAvatar(activeConversation)} alt="" />
                ) : (
                  getConversationInitials(activeConversation)
                )}
              </div>
              <div className="chat-topbar-info">
                <h2>
                  {getConversationName(activeConversation)}
                  {isConversationMuted(activeConversation) && <span style={{ fontSize: 14 }}>🔇</span>}
                </h2>
                <p>
                  {activeTypingUser
                    ? `${activeTypingUser} is typing...`
                    : (() => {
                        const other = getOtherUser(activeConversation);
                        if (other && isUserOnline(other._id)) return "Online";
                        if (other?.lastSeen) return `Last seen ${formatTime(other.lastSeen)}`;
                        return `${onlineUsers.length} online`;
                      })()
                  }
                </p>
              </div>
              <div className="chat-topbar-actions">
                <button
                  className="sidebar-icon-btn"
                  onClick={() => setShowMessageSearch(!showMessageSearch)}
                  title="Search messages"
                >
                  🔍
                </button>
                <button
                  className="sidebar-icon-btn"
                  onClick={() => pinConversation(activeConversation._id).then(() => {
                    setConversations((prev) => prev.map((c) =>
                      c._id === activeConversation._id ? { ...c, pinnedBy: isConversationPinned(c) ? (c.pinnedBy || []).filter((p) => p !== user.id) : [...(c.pinnedBy || []), user.id] } : c
                    ));
                  }).catch(() => {})}
                  title="Pin conversation"
                >
                  📌
                </button>
                <button
                  className="sidebar-icon-btn"
                  onClick={() => archiveConversation(activeConversation._id).then(() => {
                    setConversations((prev) => prev.filter((c) => c._id !== activeConversation._id));
                    setActiveConversation(null);
                  }).catch(() => {})}
                  title="Archive"
                >
                  📦
                </button>
              </div>
            </div>

            {/* Message Search */}
            {showMessageSearch && (
              <div style={{ padding: "12px 24px", borderBottom: "1px solid var(--border)", background: "var(--bg-secondary)" }}>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    className="form-input"
                    placeholder="Search messages..."
                    value={messageSearchQuery}
                    onChange={(e) => setMessageSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleMessageSearch()}
                    style={{ marginBottom: 0 }}
                  />
                  <button className="btn-secondary" onClick={handleMessageSearch} style={{ flexShrink: 0 }}>Search</button>
                </div>
                {messageSearchResults.length > 0 && (
                  <div style={{ marginTop: 12, maxHeight: 200, overflowY: "auto" }}>
                    {messageSearchResults.map((msg) => (
                      <div key={msg._id} className="search-msg-item" onClick={() => {
                        document.querySelector(`[data-msg-id="${msg._id}"]`)?.scrollIntoView({ behavior: "smooth" });
                        setShowMessageSearch(false);
                      }}>
                        <div className="search-msg-sender">{msg.senderName}</div>
                        <div className="search-msg-content">{msg.content}</div>
                        <div className="search-msg-time">{formatTime(msg.createdAt)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Messages */}
            <div className="messages-area" ref={messagesAreaRef} onScroll={(e) => {
              if (e.target.scrollTop < 50 && hasMore && !loadingMore) {
                handleLoadMore();
              }
            }}>
              {loadingMore && (
                <div style={{ textAlign: "center", padding: 8 }}>
                  <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2, display: "inline-block" }} />
                </div>
              )}
              {messagesLoading ? (
                <LoadingSkeleton count={6} type="messages" />
              ) : error ? (
                <div className="messages-empty">
                  <div className="empty-icon">⚠️</div>
                  <p>{error}</p>
                </div>
              ) : (
                renderMessages()
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Typing indicator */}
            <div className="typing-indicator-wrap">
              {activeTypingUser && (
                <div className="typing-indicator">
                  <span>{activeTypingUser} is typing</span>
                  <div className="typing-dots">
                    <span /><span /><span />
                  </div>
                </div>
              )}
            </div>

            {/* Reply/Edit bar */}
            {replyingTo && (
              <div className="reply-bar">
                <div className="reply-bar-border" />
                <div className="reply-bar-info">
                  <div className="reply-bar-sender">Replying to {replyingTo.senderName || replyingTo.sender}</div>
                  <div className="reply-bar-content">{replyingTo.content?.substring(0, 80)}</div>
                </div>
                <button className="reply-bar-close" onClick={() => setReplyingTo(null)}>✕</button>
              </div>
            )}

            {editingMessage && (
              <div className="reply-bar" style={{ background: "var(--accent-subtle)" }}>
                <div className="reply-bar-border" style={{ background: "var(--accent)" }} />
                <div className="reply-bar-info">
                  <div className="reply-bar-sender" style={{ color: "var(--accent)" }}>Editing message</div>
                </div>
                <button className="reply-bar-close" onClick={() => { setEditingMessage(null); setInputText(""); }}>✕</button>
              </div>
            )}

            {/* Upload progress */}
            {uploading && (
              <div className="upload-progress">
                <span style={{ fontSize: 16 }}>📤</span>
                <div className="upload-progress-bar">
                  <div className="upload-progress-fill" style={{ width: `${uploadProgress || 50}%` }} />
                </div>
                <span className="upload-progress-text">Uploading...</span>
              </div>
            )}

            {/* Input bar */}
            <div className="chat-input-bar">
              <div className="chat-input-row">
                <div className="chat-input-actions">
                  <button
                    className="input-action-btn"
                    onClick={() => fileInputRef.current?.click()}
                    title="Attach file"
                  >
                    📎
                  </button>
                  <div className="emoji-picker-wrap">
                    <button
                      className="input-action-btn"
                      onClick={() => setShowEmoji(!showEmoji)}
                      title="Emojis"
                    >
                      😊
                    </button>
                    <AnimatePresence>
                      {showEmoji && (
                        <EmojiPicker
                          onSelect={handleEmojiSelect}
                          onClose={() => setShowEmoji(false)}
                        />
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <textarea
                  ref={textareaRef}
                  placeholder="Type a message..."
                  value={inputText}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  style={{ height: "auto", overflow: "hidden" }}
                  onInput={(e) => {
                    e.target.style.height = "auto";
                    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                  }}
                />

                <motion.button
                  className="send-btn"
                  type="button"
                  onClick={handleSend}
                  disabled={!inputText.trim() && !uploading}
                  whileHover={{ scale: inputText.trim() ? 1.05 : 1 }}
                  whileTap={{ scale: inputText.trim() ? 0.95 : 1 }}
                >
                  ➤
                </motion.button>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              style={{ display: "none" }}
              onChange={handleFileSelect}
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.zip"
            />
          </>
        ) : (
          /* Welcome screen */
          <div className="welcome-screen">
            <motion.div
              className="welcome-icon"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
            >
              💬
            </motion.div>
            <h2>Welcome to JD-Chats</h2>
            <p>Select a conversation or search for users to start chatting</p>
            <motion.button
              className="btn-primary"
              style={{ width: "auto", padding: "12px 32px" }}
              onClick={() => setShowSearch(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Start a conversation
            </motion.button>
          </div>
        )}
      </main>

      {/* ── MODALS ── */}
      {showProfileModal && profileUser && (
        <UserProfileModal
          user={profileUser}
          isOnline={isUserOnline(profileUser._id)}
          onClose={() => { setShowProfileModal(false); setProfileUser(null); }}
          onMessage={() => { handleNewChat(profileUser._id); setShowProfileModal(false); }}
          onAddFriend={() => addFriend(profileUser._id).then(() => toast.success("Friend added")).catch((e) => toast.error(e.response?.data?.message || "Error"))}
          onRemoveFriend={() => removeFriend(profileUser._id).then(() => toast.success("Friend removed")).catch(() => toast.error("Error"))}
          onBlock={() => blockUser(profileUser._id).then(() => toast.success("User blocked")).catch(() => toast.error("Error"))}
          onUnblock={() => unblockUser(profileUser._id).then(() => toast.success("User unblocked")).catch(() => toast.error("Error"))}
          isFriend={friendsList.some((f) => f._id === profileUser._id)}
          isBlocked={blockedUsers.some((b) => b._id === profileUser._id)}
          isFavorite={favoriteContacts.some((f) => f._id === profileUser._id)}
          onToggleFavorite={() => toggleFavorite(profileUser._id).then(() => {
            setFavoriteContacts((prev) =>
              prev.some((f) => f === profileUser._id)
                ? prev.filter((f) => f !== profileUser._id)
                : [...prev, profileUser._id]
            );
          }).catch(() => {})}
        />
      )}

      {showGroupModal && (
        <CreateGroupModal
          onClose={() => setShowGroupModal(false)}
          onCreate={async (data) => {
            try {
              const groupData = await createGroup(data);
              const conv = groupData?.conversation
                ? { _id: groupData.conversation, type: "group", group: groupData, participants: [], lastMessageAt: new Date() }
                : await createOrGetConversation(data.members[0]);
              toast.success(`Group "${data.name}" created!`);
              setShowGroupModal(false);
              if (conv) {
                setConversations((prev) => {
                  const filtered = prev.filter((c) => c._id !== conv._id);
                  return [conv, ...filtered];
                });
                setActiveConversation(conv);
              }
            } catch (err) {
              toast.error(err.response?.data?.message || "Failed to create group");
            }
          }}
        />
      )}

      {previewImage && (
        <ImagePreview url={previewImage} onClose={() => setPreviewImage(null)} />
      )}
    </div>
  );
}

export default Chat;
