import React, { useRef, useEffect } from "react";

const EMOJIS = [
  "😀","😂","🥰","😎","🤔","😭","🤩","😡",
  "👍","👎","👏","🙌","🤝","💪","✌️","🤞",
  "🎉","🔥","💯","⭐","❤️","💔","💬","✅",
  "😅","🤣","🥺","😏","😤","🥳","🤗","😬",
  "🐱","🐶","🦊","🐼","🐸","🦁","🐯","🐻",
  "🍕","🍔","🍦","☕","🍺","🎂","🍩","🍓",
];

function EmojiPicker({ onSelect, onClose }) {
  const ref = useRef(null);

  // Close picker when clicking outside
  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  return (
    <div className="emoji-picker-popup" ref={ref}>
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
    </div>
  );
}

export default EmojiPicker;
