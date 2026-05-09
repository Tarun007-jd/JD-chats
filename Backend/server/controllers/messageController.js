const Message = require("../models/Message");

// GET all messages (chat history)
const getMessages = async (req, res) => {
  try {
    const messages = await Message.find()
      .sort({ createdAt: 1 }) // oldest first
      .limit(100);             // cap at 100 for performance

    res.status(200).json(messages);
  } catch (error) {
    console.error("getMessages error:", error);
    res.status(500).json({ message: "Failed to fetch messages" });
  }
};

module.exports = { getMessages };
