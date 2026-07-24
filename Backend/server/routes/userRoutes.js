const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const User = require("../models/User");
const Notification = require("../models/Notification");

const router = express.Router();

// SEARCH USERS
router.get("/search", protect, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);

    const users = await User.find({
      _id: { $ne: req.user.id },
      name: { $regex: q, $options: "i" },
    }).select("name email avatar status lastSeen").limit(20);

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET USER PROFILE
router.get("/:id", protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("name email avatar status lastSeen friends");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ADD FRIEND
router.post("/add-friend/:id", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) return res.status(404).json({ message: "User not found" });

    if (user.friends.includes(req.params.id)) {
      return res.status(400).json({ message: "Already friends" });
    }

    user.friends.push(req.params.id);
    targetUser.friends.push(req.user.id);
    await user.save();
    await targetUser.save();

    await Notification.create({
      user: req.params.id,
      type: "friend_accepted",
      title: "Friend Request Accepted",
      body: `${user.name} accepted your friend request`,
      data: { userId: req.user.id },
    });

    res.json({ message: "Friend added" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// REMOVE FRIEND
router.post("/remove-friend/:id", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) return res.status(404).json({ message: "User not found" });

    user.friends = user.friends.filter((f) => f.toString() !== req.params.id);
    targetUser.friends = targetUser.friends.filter((f) => f.toString() !== req.user.id);
    await user.save();
    await targetUser.save();

    res.json({ message: "Friend removed" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// BLOCK USER
router.post("/block/:id", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user.blockedUsers.includes(req.params.id)) {
      return res.status(400).json({ message: "User already blocked" });
    }

    user.blockedUsers.push(req.params.id);
    user.friends = user.friends.filter((f) => f.toString() !== req.params.id);
    await user.save();

    res.json({ message: "User blocked" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UNBLOCK USER
router.post("/unblock/:id", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.blockedUsers = user.blockedUsers.filter((b) => b.toString() !== req.params.id);
    await user.save();
    res.json({ message: "User unblocked" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// TOGGLE FAVORITE
router.post("/favorite/:id", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const idx = user.favoriteContacts.indexOf(req.params.id);
    if (idx > -1) {
      user.favoriteContacts.splice(idx, 1);
    } else {
      user.favoriteContacts.push(req.params.id);
    }
    await user.save();
    res.json({ message: idx > -1 ? "Removed from favorites" : "Added to favorites" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET FRIENDS
router.get("/", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate("friends", "name email avatar status lastSeen")
      .populate("blockedUsers", "name email avatar")
      .populate("favoriteContacts", "name email avatar");
    res.json({
      friends: user.friends,
      blockedUsers: user.blockedUsers,
      favoriteContacts: user.favoriteContacts,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
