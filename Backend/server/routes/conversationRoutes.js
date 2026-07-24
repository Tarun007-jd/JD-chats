const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");

const router = express.Router();

// GET ALL CONVERSATIONS FOR USER
router.get("/", protect, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user.id,
    })
      .populate("participants", "name avatar status lastSeen")
      .populate({
        path: "lastMessage",
        select: "content senderName messageType createdAt status",
      })
      .sort({ lastMessageAt: -1 });

    res.json(conversations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET SINGLE CONVERSATION
router.get("/:id", protect, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id)
      .populate("participants", "name avatar status lastSeen")
      .populate({
        path: "lastMessage",
        select: "content senderName messageType createdAt status",
      });
    if (!conversation) return res.status(404).json({ message: "Conversation not found" });
    res.json(conversation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE OR GET PRIVATE CONVERSATION
router.post("/", protect, async (req, res) => {
  try {
    const { participantId } = req.body;
    if (!participantId) return res.status(400).json({ message: "participantId is required" });

    if (participantId === req.user.id) {
      return res.status(400).json({ message: "Cannot create conversation with yourself" });
    }

    const existing = await Conversation.findOne({
      type: "private",
      participants: { $all: [req.user.id, participantId], $size: 2 },
    }).populate("participants", "name avatar status lastSeen");

    if (existing) return res.json(existing);

    const conversation = await Conversation.create({
      participants: [req.user.id, participantId],
      type: "private",
    });

    const populated = await Conversation.findById(conversation._id)
      .populate("participants", "name avatar status lastSeen");

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// MARK AS READ
router.put("/:id/read", protect, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) return res.status(404).json({ message: "Conversation not found" });

    conversation.unreadCount.set(req.user.id, 0);
    await conversation.save();

    await Message.updateMany(
      {
        conversation: req.params.id,
        "readBy.user": { $ne: req.user.id },
        sender: { $ne: req.user.id },
      },
      {
        $push: { readBy: { user: req.user.id, readAt: new Date() } },
        status: "read",
      }
    );

    res.json({ message: "Marked as read" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PIN CONVERSATION
router.post("/:id/pin", protect, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) return res.status(404).json({ message: "Conversation not found" });

    const idx = conversation.pinnedBy.indexOf(req.user.id);
    if (idx > -1) {
      conversation.pinnedBy.splice(idx, 1);
    } else {
      conversation.pinnedBy.push(req.user.id);
    }
    await conversation.save();

    res.json({ pinned: idx === -1 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ARCHIVE CONVERSATION
router.post("/:id/archive", protect, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) return res.status(404).json({ message: "Conversation not found" });

    const idx = conversation.archivedBy.indexOf(req.user.id);
    if (idx > -1) {
      conversation.archivedBy.splice(idx, 1);
    } else {
      conversation.archivedBy.push(req.user.id);
    }
    await conversation.save();

    res.json({ archived: idx === -1 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// MUTE CONVERSATION
router.post("/:id/mute", protect, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) return res.status(404).json({ message: "Conversation not found" });

    const idx = conversation.mutedBy.indexOf(req.user.id);
    if (idx > -1) {
      conversation.mutedBy.splice(idx, 1);
    } else {
      conversation.mutedBy.push(req.user.id);
    }
    await conversation.save();

    res.json({ muted: idx === -1 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
