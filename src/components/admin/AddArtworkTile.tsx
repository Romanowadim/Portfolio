"use client";

import { motion } from "framer-motion";

type Props = {
  onClick: () => void;
  index: number;
};

export default function AddArtworkTile({ onClick, index }: Props) {
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
      onClick={onClick}
      className="group relative aspect-square overflow-hidden border-2 border-dashed border-[#c0c0c0] flex items-center justify-center transition-colors hover:border-text-muted"
    >
      <span className="text-[40px] font-light text-[#c0c0c0] group-hover:text-text-muted transition-colors">
        +
      </span>
    </motion.button>
  );
}
