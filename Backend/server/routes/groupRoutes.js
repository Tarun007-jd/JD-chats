const express = require("express");
const { body, validationResult } = require("express-validator");
const { protect } = require("../middleware/authMiddleware");
const Group = require("../models/Group");
const Conversation = require("../models/Conversation");
const Notification = require("../models/Notification");

const router = express.Router();

// CREATE GROUP
router.post("/", protect, [
  body("name").trim().notEmpty().withMessage("Group name is required").isLength({ max: 100 }),
  body("description").optional().trim().isLength({ max: 500 }),
  body("members").isArray({ min: 1 }).withMessage("At least one member is required"),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

    const { name, description, members } = req.body;

    const allMembers = [...new Set([req.user.id, ...members])];
    const memberObjects = allMembers.map((m) => ({
      user: m,
      role: m === req.user.id ? "admin" : "member",
    }));

    const conversation = await Conversation.create({
      participants: allMembers,
      type: "group",
    });

    const group = await Group.create({
      name,
      description: description || "",
      admin: req.user.id,
      members: memberObjects,
      conversation: conversation._id,
    });

    conversation.group = group._id;
    await conversation.save();

    const populatedGroup = await Group.findById(group._id)
      .populate("members.user", "name avatar")
      .populate("admin", "name avatar");

    for (const memberId of members) {
      await Notification.create({
        user: memberId,
        type: "group_invite",
        title: `Added to ${name}`,
        body: `You were added to the group "${name}"`,
        data: { groupId: group._id },
      });
    }

    res.status(201).json(populatedGroup);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET GROUP
router.get("/:id", protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate("members.user", "name avatar status lastSeen")
      .populate("admin", "name avatar");
    if (!group) return res.status(404).json({ message: "Group not found" });
    res.json(group);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE GROUP
router.put("/:id", protect, [
  body("name").optional().trim().isLength({ max: 100 }),
  body("description").optional().trim().isLength({ max: 500 }),
], async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: "Group not found" });
    if (group.admin.toString() !== req.user.id) return res.status(403).json({ message: "Only admin can update group" });

    if (req.body.name) group.name = req.body.name;
    if (req.body.description !== undefined) group.description = req.body.description;
    await group.save();

    const populated = await Group.findById(group._id)
      .populate("members.user", "name avatar")
      .populate("admin", "name avatar");
    res.json(populated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ADD MEMBERS
router.post("/:id/members", protect, async (req, res) => {
  try {
    const { members } = req.body;
    if (!members || !members.length) return res.status(400).json({ message: "Members array is required" });

    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: "Group not found" });
    if (group.admin.toString() !== req.user.id) return res.status(403).json({ message: "Only admin can add members" });

    const existingIds = group.members.map((m) => m.user.toString());
    const newMembers = members.filter((m) => !existingIds.includes(m));

    for (const memberId of newMembers) {
      group.members.push({ user: memberId, role: "member" });
    }
    await group.save();

    const conversation = await Conversation.findById(group.conversation);
    for (const memberId of newMembers) {
      if (!conversation.participants.includes(memberId)) {
        conversation.participants.push(memberId);
      }
    }
    await conversation.save();

    const populated = await Group.findById(group._id)
      .populate("members.user", "name avatar")
      .populate("admin", "name avatar");
    res.json(populated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// REMOVE MEMBER
router.delete("/:id/members/:memberId", protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: "Group not found" });
    if (group.admin.toString() !== req.user.id) return res.status(403).json({ message: "Only admin can remove members" });

    group.members = group.members.filter((m) => m.user.toString() !== req.params.memberId);
    await group.save();

    const conversation = await Conversation.findById(group.conversation);
    conversation.participants = conversation.participants.filter(
      (p) => p.toString() !== req.params.memberId
    );
    await conversation.save();

    res.json({ message: "Member removed" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
