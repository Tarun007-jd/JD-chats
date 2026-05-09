import api from "./api";

// Fetch chat history from the backend (last 100 messages)
export const fetchMessages = async () => {
  const response = await api.get("/api/messages");
  return response.data;
};
