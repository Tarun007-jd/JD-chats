import React from "react";
import { motion, AnimatePresence } from "framer-motion";

function TypingIndicator({ typingUser }) {
  return (
    <AnimatePresence>
      {typingUser && (
        <motion.div
          className="typing-indicator-wrap"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 5 }}
          transition={{ duration: 0.15 }}
        >
          <div className="typing-indicator">
            <span>{typingUser} is typing</span>
            <div className="typing-dots">
              <span />
              <span />
              <span />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default TypingIndicator;
