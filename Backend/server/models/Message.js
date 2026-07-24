const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Conversation",
    required: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  senderName: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    trim: true,
    default: "",
  },
  messageType: {
    type: String,
    enum: ["text", "image", "video", "audio", "document", "gif", "poll", "location", "voice"],
    default: "text",
  },
  fileUrl: {
    type: String,
    default: "",
  },
  fileName: {
    type: String,
    default: "",
  },
  fileSize: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ["sending", "sent", "delivered", "read"],
    default: "sent",
  },
  readBy: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      readAt: { type: Date, default: Date.now },
    },
  ],
  deliveredTo: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      deliveredAt: { type: Date, default: Date.now },
    },
  ],
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Message",
    default: null,
  },
  edited: {
    type: Boolean,
    default: false,
  },
  editedAt: {
    type: Date,
    default: null,
  },
  deleted: {
    type: Boolean,
    default: false,
  },
  deletedForEveryone: {
    type: Boolean,
    default: false,
  },
  deletedAt: {
    type: Date,
    default: null,
  },
  pinned: {
    type: Boolean,
    default: false,
  },
  pinnedAt: {
    type: Date,
    default: null,
  },
  starredBy: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  reactions: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      emoji: { type: String, required: true },
    },
  ],
  mentions: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  poll: {
    question: String,
    options: [
      {
        text: String,
        votes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      },
    ],
    expiresAt: Date,
  },
  location: {
    latitude: Number,
    longitude: Number,
    address: String,
  },
  forwarded: {
    type: Boolean,
    default: false,
  },
  forwardedFrom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Message",
    default: null,
  },
}, {
  timestamps: true,
});

messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ sender: 1, createdAt: -1 });
messageSchema.index({ content: "text" });

module.exports = mongoose.model("Message", messageSchema);
