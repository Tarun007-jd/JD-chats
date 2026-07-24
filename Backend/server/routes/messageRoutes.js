const express = require("express");
const { body, query, validationResult } = require("express-validator");
const { protect } = require("../middleware/authMiddleware");
const Message = require("../models/Message");
const Conversation = require("../models/Conversation");

const router = express.Router();

// GET MESSAGES FOR A CONVERSATION
router.get("/:conversationId", protect, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ message: "Conversation not found" });

    const isParticipant = conversation.participants.some((p) => p.toString() === req.user.id);
    if (!isParticipant) return res.status(403).json({ message: "Not authorized" });

    const messages = await Message.find({
      conversation: conversationId,
      deletedForEveryone: false,
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("sender", "name avatar")
      .populate("replyTo")
      .populate("readBy.user", "name avatar")
      .lean();

    const total = await Message.countDocuments({
      conversation: conversationId,
      deletedForEveryone: false,
    });

    res.json({
      messages: messages.reverse(),
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasMore: skip + limit < total,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// SEARCH MESSAGES
router.get("/search/:conversationId", protect, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);

    const conversation = await Conversation.findById(req.params.conversationId);
    if (!conversation) return res.status(404).json({ message: "Conversation not found" });

    const isParticipant = conversation.participants.some((p) => p.toString() === req.user.id);
    if (!isParticipant) return res.status(403).json({ message: "Not authorized" });

    const messages = await Message.find({
      conversation: req.params.conversationId,
      content: { $regex: q, $options: "i" },
      deletedForEveryone: false,
    })
      .sort({ createdAt: -1 })
      .limit(30)
      .populate("sender", "name avatar");

    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// EDIT MESSAGE
router.put("/:id", protect, [
  body("content").trim().notEmpty().withMessage("Content is required"),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ message: "Message not found" });
    if (message.sender.toString() !== req.user.id) return res.status(403).json({ message: "Not authorized" });

    message.content = req.body.content;
    message.edited = true;
    message.editedAt = new Date();
    await message.save();

    const populated = await Message.findById(message._id).populate("sender", "name avatar");
    res.json(populated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE MESSAGE (soft delete)
router.delete("/:id", protect, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ message: "Message not found" });

    const { forEveryone } = req.query;

    if (forEveryone === "true") {
      if (message.sender.toString() !== req.user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }
      message.deletedForEveryone = true;
      message.deleted = true;
      message.deletedAt = new Date();
      await message.save();
      res.json({ message: "Message deleted for everyone", messageId: message._id });
    } else {
      res.json({ message: "Message deleted", messageId: message._id });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PIN/UNPIN MESSAGE
router.post("/:id/pin", protect, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ message: "Message not found" });

    message.pinned = !message.pinned;
    message.pinnedAt = message.pinned ? new Date() : null;
    await message.save();

    res.json({ message: message.pinned ? "Message pinned" : "Message unpinned", pinned: message.pinned });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// STAR/UNSTAR MESSAGE
router.post("/:id/star", protect, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ message: "Message not found" });

    const idx = message.starredBy.indexOf(req.user.id);
    if (idx > -1) {
      message.starredBy.splice(idx, 1);
    } else {
      message.starredBy.push(req.user.id);
    }
    await message.save();

    res.json({ message: idx > -1 ? "Message unstarred" : "Message starred", starred: idx === -1 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ADD REACTION
router.post("/:id/react", protect, async (req, res) => {
  try {
    const { emoji } = req.body;
    if (!emoji) return res.status(400).json({ message: "Emoji is required" });

    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ message: "Message not found" });

    const existing = message.reactions.find(
      (r) => r.user.toString() === req.user.id && r.emoji === emoji
    );
    if (existing) {
      message.reactions = message.reactions.filter(
        (r) => !(r.user.toString() === req.user.id && r.emoji === emoji)
      );
    } else {
      message.reactions.push({ user: req.user.id, emoji });
    }
    await message.save();

    res.json({ reactions: message.reactions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// FORWARD MESSAGE
router.post("/:id/forward", protect, async (req, res) => {
  try {
    const { conversationId } = req.body;
    const original = await Message.findById(req.params.id);
    if (!original) return res.status(404).json({ message: "Message not found" });

    const newMsg = await Message.create({
      conversation: conversationId,
      sender: req.user.id,
      senderName: original.senderName,
      content: original.content,
      messageType: original.messageType,
      fileUrl: original.fileUrl,
      fileName: original.fileName,
      fileSize: original.fileSize,
      forwarded: true,
      forwardedFrom: original._id,
    });

    const conversation = await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: newMsg._id,
      lastMessageAt: new Date(),
    });

    const populated = await Message.findById(newMsg._id).populate("sender", "name avatar");

    res.json(populated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
