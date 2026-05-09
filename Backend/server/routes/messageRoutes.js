const express = require("express");
const { getMessages } = require("../controllers/messageController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// GET /api/messages — fetch chat history (protected)
router.get("/", protect, getMessages);

module.exports = router;
