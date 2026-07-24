const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  avatar: {
    type: String,
    default: "",
  },
  status: {
    type: String,
    default: "Hey there! I am using JD-Chats",
    maxlength: 150,
  },
  lastSeen: {
    type: Date,
    default: Date.now,
  },
  friends: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  blockedUsers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  favoriteContacts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  theme: {
    type: String,
    enum: ["light", "dark", "auto"],
    default: "light",
  },
  notifications: {
    type: Boolean,
    default: true,
  },
  notificationSound: {
    type: Boolean,
    default: true,
  },
  privacyLastSeen: {
    type: Boolean,
    default: true,
  },
  privacyReadReceipts: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model("User", userSchema);
