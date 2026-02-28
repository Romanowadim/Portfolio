"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import CategoryMenu from "@/components/portfolio/CategoryMenu";
import SocialLinks from "@/components/layout/SocialLinks";

export default function PortfolioPage() {
  const t = useTranslations("portfolio");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-8"
    >
      <h1 className="text-2xl md:text-3xl font-bold tracking-[0.2em]">
        {t("heading")}
      </h1>
      <CategoryMenu />

      <div className="mt-auto pt-6">
        <SocialLinks />
      </div>
    </motion.div>
  );
}
