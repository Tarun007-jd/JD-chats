const Message = require("../models/Message");

// Map of socketId → { username, userId }
const onlineUsers = new Map();

const chatSocket = (io) => {
  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // ─── USER JOINS ───────────────────────────────────────────────
    socket.on("join", ({ username, userId }) => {
      onlineUsers.set(socket.id, { username, userId });

      console.log(`${username} joined. Online: ${onlineUsers.size}`);

      // Broadcast updated online users list to everyone
      io.emit("onlineUsers", Array.from(onlineUsers.values()));

      // Notify others someone joined
      socket.broadcast.emit("userJoined", { username });
    });

    // ─── SEND MESSAGE ─────────────────────────────────────────────
    socket.on("sendMessage", async ({ sender, senderId, message }) => {
      try {
        // Save to MongoDB
        const newMessage = new Message({ sender, senderId, message });
        await newMessage.save();

        const payload = {
          _id: newMessage._id,
          sender: newMessage.sender,
          senderId: newMessage.senderId,
          message: newMessage.message,
          createdAt: newMessage.createdAt,
        };

        // Broadcast to ALL clients (including sender)
        io.emit("receiveMessage", payload);
      } catch (error) {
        console.error("sendMessage error:", error);
        socket.emit("messageError", { message: "Failed to send message" });
      }
    });

    // ─── TYPING INDICATOR ─────────────────────────────────────────
    socket.on("typing", ({ username }) => {
      // Send to everyone except the typer
      socket.broadcast.emit("userTyping", { username });
    });

    socket.on("stopTyping", () => {
      socket.broadcast.emit("userStopTyping");
    });

    // ─── DISCONNECT ───────────────────────────────────────────────
    socket.on("disconnect", () => {
      const user = onlineUsers.get(socket.id);

      if (user) {
        console.log(`${user.username} disconnected`);
        onlineUsers.delete(socket.id);

        // Notify everyone of updated list
        io.emit("onlineUsers", Array.from(onlineUsers.values()));
        socket.broadcast.emit("userLeft", { username: user.username });
      }
    });
  });
};

module.exports = chatSocket;
