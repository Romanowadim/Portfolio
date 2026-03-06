"use client";

import { useState } from "react";
import { motion } from "framer-motion";

type Props = {
  onClick: () => void;
  index: number;
  onDropImage?: (url: string) => void;
};

export default function AddArtworkTile({ onClick, index, onDropImage }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);

  const uploadFile = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (res.ok) {
        const data = await res.json();
        onDropImage?.(data.url);
      }
    } catch {}
    setUploading(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file?.type.startsWith("image/")) uploadFile(file);
  };

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
      onClick={onClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`group relative aspect-square overflow-hidden border-2 border-dashed flex items-center justify-center transition-colors ${
        dragOver
          ? "border-text-muted bg-text-light/10"
          : "border-text-light hover:border-text-muted"
      }`}
    >
      {uploading ? (
        <span className="text-[24px] font-light text-text-light animate-pulse">...</span>
      ) : (
        <span className={`text-[40px] font-light transition-colors ${dragOver ? "text-text-muted" : "text-text-light group-hover:text-text-muted"}`}>
          +
        </span>
      )}
    </motion.button>
  );
}
