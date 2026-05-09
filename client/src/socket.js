import { io } from "socket.io-client";

// Lazy socket — we create it once and export it.
// It will only attempt a connection when the component mounts and calls socket.connect().
// We set autoConnect: false so it does NOT connect the moment this file is imported.
const socket = io(process.env.REACT_APP_SOCKET_URL || "http://localhost:5000", {
  autoConnect: false,
  transports: ["websocket", "polling"], // websocket first (faster), fallback to polling
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

export default socket;