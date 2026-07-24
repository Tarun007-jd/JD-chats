const mongoose = require("mongoose");

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  description: {
    type: String,
    default: "",
    maxlength: 500,
  },
  avatar: {
    type: String,
    default: "",
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  members: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      role: {
        type: String,
        enum: ["admin", "member"],
        default: "member",
      },
      joinedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Conversation",
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model("Group", groupSchema);
