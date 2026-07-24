import React, { useRef, useEffect } from "react";
import { motion } from "framer-motion";

const EMOJIS = [
  "😀","😂","🥰","😎","🤔","😭","🤩","😡",
  "👍","👎","👏","🙌","🤝","💪","✌️","🤞",
  "🎉","🔥","💯","⭐","❤️","💔","💬","✅",
  "😅","🤣","🥺","😏","😤","🥳","🤗","😬",
  "🐱","🐶","🦊","🐼","🐸","🦁","🐯","🐻",
  "🍕","🍔","🍦","☕","🍺","🎂","🍩","🍓",
  "🌍","🌈","⚡","🌙","☀️","⭐","🌊","🔥",
  "🚀","✈️","🎵","🎮","📱","💻","⌚","🎁",
];

function EmojiPicker({ onSelect, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  return (
    <motion.div
      className="emoji-picker-popup"
      ref={ref}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.15 }}
    >
      <div className="emoji-picker-title">Emojis</div>
      <div className="emoji-grid">
        {EMOJIS.map((emoji, i) => (
          <button
            key={i}
            className="emoji-item"
            onClick={() => onSelect(emoji)}
            title={emoji}
            type="button"
          >
            {emoji}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

export default EmojiPicker;
