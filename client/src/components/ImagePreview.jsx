import React from "react";
import { motion } from "framer-motion";

function ImagePreview({ url, onClose }) {
  return (
    <motion.div
      className="image-preview-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.img
        src={url}
        alt="Preview"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
      />
    </motion.div>
  );
}

export default ImagePreview;
