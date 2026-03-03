"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "@/i18n/navigation";

export default function WhitePanel() {
  const pathname = usePathname();
  const isAbout = pathname === "/about";
  const isOrder = pathname === "/order";
  const isPortfolio = pathname === "/portfolio";
  const isCabinet = pathname === "/cabinet";
  const showPanel = isAbout || isOrder || isPortfolio || isCabinet;

  return (
    <AnimatePresence>
      {showPanel && (
        <motion.div
          key="white-panel"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className={`hidden lg:block fixed top-0 h-screen bg-white z-0 transition-[left,width] duration-500 ease-in-out ${
            isOrder
              ? "left-[33.75vw] w-[32.5vw]"
              : "left-0 w-[33.75vw]"
          }`}
        />
      )}
    </AnimatePresence>
  );
}
