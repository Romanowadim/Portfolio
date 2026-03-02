"use client";

import { motion } from "framer-motion";
import CategoryMenu from "@/components/portfolio/CategoryMenu";

export default function PortfolioPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="h-full flex flex-col justify-center"
      style={{ paddingBottom: "calc((100vh - 778px) / 4 + 40px)" }}
    >
      <CategoryMenu />
    </motion.div>
  );
}
