"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import SocialLinks from "@/components/layout/SocialLinks";

export default function HomePage() {
  const t = useTranslations("hero");

  return (
    <div className="flex flex-col justify-center min-h-[calc(100vh-10rem)]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mt-auto mb-[14.5vh]"
      >
        <h1 className="text-sm md:text-[14px] font-bold tracking-[2.8px] text-text-muted uppercase mb-0">
          {t("name")}
        </h1>
        <p className="text-sm md:text-[14px] font-medium tracking-[2.8px] text-text-light mb-[86px]">
          {t("title")}
        </p>
        <SocialLinks />
      </motion.div>

      {/* Artwork label — top right corner on desktop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="hidden lg:block fixed top-[48px] right-[2.8%] text-right"
      >
        <p className="text-[10px] leading-[13px] text-text-light tracking-wide">
          Self-Portrait
        </p>
        <p className="text-[10px] leading-[15px] text-[#ddd] font-semibold">
          2020
        </p>
        <p className="text-[10px] leading-[11px] text-[#ddd] font-semibold">
          Procreate | Photoshop
        </p>
      </motion.div>
    </div>
  );
}
