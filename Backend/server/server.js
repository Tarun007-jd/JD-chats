const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");

require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const messageRoutes = require("./routes/messageRoutes");
const chatSocket = require("./sockets/chatSocket");

const app = express();

// ─── CORS ─────────────────────────────────────────────────────────────────────
// Allow both localhost (dev) and the deployed frontend URL (production)
const allowedOrigins = [
  "http://localhost:3000",
  process.env.CLIENT_URL, // your deployed frontend URL e.g. https://jd-chats.vercel.app
].filter(Boolean); // remove undefined if CLIENT_URL not set

app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);

app.use(express.json());

// ─── ROUTES ───────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

app.get("/", (req, res) => {
  res.send("JD-Chats Server Running ✅");
});

// ─── HTTP SERVER ──────────────────────────────────────────────────────────────
const server = http.createServer(app);

// ─── SOCKET.IO ────────────────────────────────────────────────────────────────
const { Server } = require("socket.io");

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Mount all socket logic from separate file
chatSocket(io);

// ─── PORT ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

// ─── MONGODB + START ──────────────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log("✅ MongoDB Connected");

    server.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });