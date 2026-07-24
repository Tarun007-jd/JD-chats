import api from "./api";

export const fetchMessages = async (conversationId, page = 1, limit = 50) => {
  const response = await api.get(`/api/messages/${conversationId}?page=${page}&limit=${limit}`);
  return response.data;
};

export const searchMessages = async (conversationId, query) => {
  const response = await api.get(`/api/messages/search/${conversationId}?q=${encodeURIComponent(query)}`);
  return response.data;
};

export const editMessage = async (messageId, content) => {
  const response = await api.put(`/api/messages/${messageId}`, { content });
  return response.data;
};

export const deleteMessage = async (messageId, forEveryone = false) => {
  const response = await api.delete(`/api/messages/${messageId}?forEveryone=${forEveryone}`);
  return response.data;
};

export const pinMessage = async (messageId) => {
  const response = await api.post(`/api/messages/${messageId}/pin`);
  return response.data;
};

export const starMessage = async (messageId) => {
  const response = await api.post(`/api/messages/${messageId}/star`);
  return response.data;
};

export const reactToMessage = async (messageId, emoji) => {
  const response = await api.post(`/api/messages/${messageId}/react`, { emoji });
  return response.data;
};

export const forwardMessage = async (messageId, conversationId) => {
  const response = await api.post(`/api/messages/${messageId}/forward`, { conversationId });
  return response.data;
};

export const fetchConversations = async () => {
  const response = await api.get("/api/conversations");
  return response.data;
};

export const createOrGetConversation = async (participantId) => {
  const response = await api.post("/api/conversations", { participantId });
  return response.data;
};

export const markConversationRead = async (conversationId) => {
  const response = await api.put(`/api/conversations/${conversationId}/read`);
  return response.data;
};

export const pinConversation = async (conversationId) => {
  const response = await api.post(`/api/conversations/${conversationId}/pin`);
  return response.data;
};

export const archiveConversation = async (conversationId) => {
  const response = await api.post(`/api/conversations/${conversationId}/archive`);
  return response.data;
};

export const muteConversation = async (conversationId) => {
  const response = await api.post(`/api/conversations/${conversationId}/mute`);
  return response.data;
};

export const searchUsers = async (query) => {
  const response = await api.get(`/api/users/search?q=${encodeURIComponent(query)}`);
  return response.data;
};

export const addFriend = async (userId) => {
  const response = await api.post(`/api/users/add-friend/${userId}`);
  return response.data;
};

export const removeFriend = async (userId) => {
  const response = await api.post(`/api/users/remove-friend/${userId}`);
  return response.data;
};

export const blockUser = async (userId) => {
  const response = await api.post(`/api/users/block/${userId}`);
  return response.data;
};

export const unblockUser = async (userId) => {
  const response = await api.post(`/api/users/unblock/${userId}`);
  return response.data;
};

export const getUserProfile = async (userId) => {
  const response = await api.get(`/api/users/${userId}`);
  return response.data;
};

export const getFriends = async () => {
  const response = await api.get("/api/users");
  return response.data;
};

export const toggleFavorite = async (userId) => {
  const response = await api.post(`/api/users/favorite/${userId}`);
  return response.data;
};

export const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await api.post("/api/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const fetchNotifications = async () => {
  const response = await api.get("/api/notifications");
  return response.data;
};

export const markNotificationRead = async (notificationId) => {
  const response = await api.put(`/api/notifications/read/${notificationId}`);
  return response.data;
};

export const markAllNotificationsRead = async () => {
  const response = await api.put("/api/notifications/read-all");
  return response.data;
};

export const getUnreadNotificationCount = async () => {
  const response = await api.get("/api/notifications/unread-count");
  return response.data;
};

export const updateProfile = async (data) => {
  const response = await api.put("/api/auth/profile", data);
  return response.data;
};

export const changePassword = async (currentPassword, newPassword) => {
  const response = await api.put("/api/auth/password", { currentPassword, newPassword });
  return response.data;
};

export const updateSettings = async (settings) => {
  const response = await api.put("/api/auth/settings", settings);
  return response.data;
};

export const deleteAccount = async () => {
  const response = await api.delete("/api/auth/account");
  return response.data;
};

export const fetchCurrentUser = async () => {
  const response = await api.get("/api/auth/me");
  return response.data;
};

export const createGroup = async (data) => {
  const response = await api.post("/api/groups", data);
  return response.data;
};

export const fetchGroup = async (groupId) => {
  const response = await api.get(`/api/groups/${groupId}`);
  return response.data;
};

export const updateGroup = async (groupId, data) => {
  const response = await api.put(`/api/groups/${groupId}`, data);
  return response.data;
};

export const addGroupMembers = async (groupId, members) => {
  const response = await api.post(`/api/groups/${groupId}/members`, { members });
  return response.data;
};

export const removeGroupMember = async (groupId, memberId) => {
  const response = await api.delete(`/api/groups/${groupId}/members/${memberId}`);
  return response.data;
};
