"use client";

import { motion } from "framer-motion";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";

export default function ArtworkLabel({ hideInfo }: { hideInfo?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="hidden lg:flex flex-col items-end gap-[83px] fixed top-[48px] right-[3.33vw] z-50"
    >
      <LanguageSwitcher />
      {!hideInfo && (
        <div className="text-right">
          <p className="text-[13px] leading-[17px] text-text-light tracking-wide">
            Self-Portrait
          </p>
          <p className="text-[13px] leading-[19px] text-[#ddd] font-semibold">
            2020
          </p>
          <p className="text-[13px] leading-[15px] text-[#ddd] font-semibold">
            Procreate | Photoshop
          </p>
        </div>
      )}
    </motion.div>
  );
}
