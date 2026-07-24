const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const User = require("../models/User");

const onlineUsers = new Map();

const chatSocket = (io) => {
  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // ─── JOIN ──────────────────────────────────────────────────
    socket.on("join", ({ username, userId }) => {
      onlineUsers.set(socket.id, { username, userId, socketId: socket.id });
      io.emit("onlineUsers", Array.from(onlineUsers.values()));
      socket.broadcast.emit("userJoined", { username, userId });
      socket.userId = userId;
    });

    // ─── JOIN CONVERSATION ROOM ─────────────────────────────────
    socket.on("joinConversation", ({ conversationId }) => {
      socket.join(`conversation:${conversationId}`);
    });

    socket.on("leaveConversation", ({ conversationId }) => {
      socket.leave(`conversation:${conversationId}`);
    });

    // ─── SEND MESSAGE ───────────────────────────────────────────
    socket.on("sendMessage", async (data) => {
      try {
        const { conversationId, sender, senderId, senderName, content, messageType, fileUrl, fileName, fileSize, replyTo } = data;

        if (!conversationId) return;

        const msgData = {
          conversation: conversationId,
          sender: senderId,
          senderName: senderName || sender,
          content: content || "",
          messageType: messageType || "text",
          fileUrl: fileUrl || "",
          fileName: fileName || "",
          fileSize: fileSize || 0,
          replyTo: replyTo || null,
          status: "sent",
        };

        if (replyTo) msgData.replyTo = replyTo;

        const newMessage = await Message.create(msgData);
        await Message.populate(newMessage, [
          { path: "sender", select: "name avatar" },
          { path: "replyTo" },
        ]);

        await Conversation.findByIdAndUpdate(conversationId, {
          lastMessage: newMessage._id,
          lastMessageAt: new Date(),
          $inc: { [`unreadCount.${senderId}`]: 0 },
        });

        const conversation = await Conversation.findById(conversationId);
        if (conversation) {
          for (const pid of conversation.participants) {
            const pidStr = pid.toString();
            if (pidStr !== senderId) {
              conversation.unreadCount.set(pidStr, (conversation.unreadCount.get(pidStr) || 0) + 1);
            }
          }
          await conversation.save();
        }

        io.to(`conversation:${conversationId}`).emit("receiveMessage", newMessage);

        // Send notification to other participants
        for (const pid of conversation.participants) {
          const pidStr = pid.toString();
          if (pidStr !== senderId) {
            const targetSocket = Array.from(onlineUsers.values()).find(
              (u) => u.userId === pidStr
            );
            if (targetSocket) {
              io.to(targetSocket.socketId).emit("newMessageNotification", {
                conversationId,
                senderName: senderName || sender,
                content: content?.substring(0, 100),
                messageType: messageType || "text",
              });
            }
          }
        }
      } catch (error) {
        console.error("sendMessage error:", error);
        socket.emit("messageError", { message: "Failed to send message" });
      }
    });

    // ─── TYPING ─────────────────────────────────────────────────
    socket.on("typing", ({ conversationId, username }) => {
      socket.to(`conversation:${conversationId}`).emit("userTyping", { conversationId, username });
    });

    socket.on("stopTyping", ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit("userStopTyping", { conversationId });
    });

    // ─── MESSAGE SEEN ───────────────────────────────────────────
    socket.on("messageSeen", async ({ conversationId, userId, messageIds }) => {
      try {
        if (messageIds && messageIds.length > 0) {
          await Message.updateMany(
            { _id: { $in: messageIds }, "readBy.user": { $ne: userId } },
            {
              $push: { readBy: { user: userId, readAt: new Date() } },
              status: "read",
            }
          );
        }

        await Conversation.findByIdAndUpdate(conversationId, {
          [`unreadCount.${userId}`]: 0,
        });

        io.to(`conversation:${conversationId}`).emit("messagesRead", {
          conversationId,
          userId,
          messageIds,
        });
      } catch (error) {
        console.error("messageSeen error:", error);
      }
    });

    // ─── MESSAGE DELIVERED ──────────────────────────────────────
    socket.on("messageDelivered", async ({ messageIds, userId }) => {
      try {
        if (messageIds && messageIds.length > 0) {
          await Message.updateMany(
            { _id: { $in: messageIds }, "deliveredTo.user": { $ne: userId } },
            {
              $push: { deliveredTo: { user: userId, deliveredAt: new Date() } },
              status: { $ne: "read" },
            }
          );
        }
      } catch (error) {
        console.error("messageDelivered error:", error);
      }
    });

    // ─── MESSAGE EDITED ─────────────────────────────────────────
    socket.on("messageEdited", async ({ messageId, content, conversationId }) => {
      try {
        const message = await Message.findByIdAndUpdate(
          messageId,
          { content, edited: true, editedAt: new Date() },
          { new: true }
        ).populate("sender", "name avatar");
        io.to(`conversation:${conversationId}`).emit("messageUpdated", message);
      } catch (error) {
        console.error("messageEdited error:", error);
      }
    });

    // ─── MESSAGE DELETED ────────────────────────────────────────
    socket.on("messageDeleted", async ({ messageId, conversationId, forEveryone }) => {
      try {
        if (forEveryone) {
          await Message.findByIdAndUpdate(messageId, {
            deletedForEveryone: true,
            deleted: true,
            deletedAt: new Date(),
          });
        }
        io.to(`conversation:${conversationId}`).emit("messageRemoved", {
          messageId,
          conversationId,
          forEveryone: !!forEveryone,
        });
      } catch (error) {
        console.error("messageDeleted error:", error);
      }
    });

    // ─── MESSAGE REACTION ───────────────────────────────────────
    socket.on("messageReacted", async ({ messageId, conversationId, emoji, userId }) => {
      try {
        const message = await Message.findById(messageId);
        if (!message) return;

        const existing = message.reactions.find(
          (r) => r.user.toString() === userId && r.emoji === emoji
        );
        if (existing) {
          message.reactions = message.reactions.filter(
            (r) => !(r.user.toString() === userId && r.emoji === emoji)
          );
        } else {
          message.reactions.push({ user: userId, emoji });
        }
        await message.save();

        io.to(`conversation:${conversationId}`).emit("messageReactionUpdate", {
          messageId,
          reactions: message.reactions,
          conversationId,
        });
      } catch (error) {
        console.error("messageReacted error:", error);
      }
    });

    // ─── USER ONLINE/OFFLINE ────────────────────────────────────
    socket.on("disconnect", () => {
      const user = onlineUsers.get(socket.id);
      if (user) {
        console.log(`${user.username} disconnected`);
        onlineUsers.delete(socket.id);

        User.findByIdAndUpdate(user.userId, { lastSeen: new Date() }).catch(() => {});

        io.emit("onlineUsers", Array.from(onlineUsers.values()));
        socket.broadcast.emit("userLeft", { username: user.username, userId: user.userId });
      }
    });
  });
};

module.exports = chatSocket;
