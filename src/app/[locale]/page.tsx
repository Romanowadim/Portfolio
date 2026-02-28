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
      >
        <h1 className="text-3xl md:text-5xl font-bold tracking-[0.2em] leading-tight mb-4">
          {t("name")}
        </h1>
        <p className="text-sm md:text-base text-text-secondary tracking-[0.1em] mb-10">
          {t("title")}
        </p>
        <SocialLinks />
      </motion.div>

      {/* Artwork label - shown on larger screens in the top right */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="hidden lg:block fixed top-20 right-10 text-xs text-text-secondary tracking-wider"
      >
        {t("artworkLabel")}
      </motion.div>
    </div>
  );
}
