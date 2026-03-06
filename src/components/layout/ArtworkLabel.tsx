"use client";

import { motion } from "framer-motion";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import ThemeSwitcher from "@/components/ui/ThemeSwitcher";
import { usePortfolioPreview } from "@/components/portfolio/PortfolioPreviewContext";

export default function ArtworkLabel({ hideInfo, fadeInfo, heroLabel }: { hideInfo?: boolean; fadeInfo?: boolean; heroLabel?: { title: string; year: string; tools: string } }) {
  const { isPreviewActive } = usePortfolioPreview();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="hidden lg:flex flex-col items-end gap-[83px] fixed top-[48px] right-[3.33vw] z-50"
    >
      <div className="flex items-center gap-2">
        <ThemeSwitcher />
        <LanguageSwitcher />
      </div>
      {!hideInfo && (
        <motion.div
          className="text-right"
          animate={{ opacity: (fadeInfo || isPreviewActive) ? 0 : 1 }}
          transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
        >
          <p className="text-[13px] leading-[17px] text-text-light tracking-wide">
            {heroLabel?.title || "Self-Portrait"}
          </p>
          <p className="text-[13px] leading-[19px] text-[#ddd] font-semibold">
            {heroLabel?.year || "2020"}
          </p>
          <p className="text-[13px] leading-[15px] text-[#ddd] font-semibold">
            {heroLabel?.tools || "Procreate | Photoshop"}
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
