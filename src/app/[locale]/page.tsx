"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import SocialLinks from "@/components/layout/SocialLinks";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";

export default function HomePage() {
  const t = useTranslations("hero");

  return (
    <div className="flex flex-col justify-center h-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mt-auto lg:my-auto"
      >
        <h1 className="text-sm md:text-[14px] font-bold tracking-[4.5px] text-text-muted uppercase mb-0">
          {t("name")}
        </h1>
        <p className="text-sm md:text-[14px] font-medium tracking-[4.5px] text-text-light mb-[83px]">
          {t("title")}
        </p>
        <SocialLinks />
      </motion.div>

      {/* Artwork label + language switcher — top right corner on desktop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="hidden lg:flex flex-col items-end gap-[83px] fixed top-[48px] right-[3.33vw] z-50"
      >
        <LanguageSwitcher />
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
      </motion.div>
    </div>
  );
}
