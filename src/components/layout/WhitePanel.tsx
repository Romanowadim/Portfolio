"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "@/i18n/navigation";

export default function WhitePanel() {
  const pathname = usePathname();
  const isAbout = pathname === "/about";

  return (
    <AnimatePresence>
      {isAbout && (
        <motion.div
          key="white-panel"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="hidden lg:block fixed top-0 left-0 w-[33.75vw] h-screen bg-white z-0"
        />
      )}
    </AnimatePresence>
  );
}
