"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";

export default function ComingSoon() {
  const t = useTranslations("comingSoon");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-start justify-center min-h-[50vh]"
    >
      <h1 className="text-3xl md:text-4xl font-bold tracking-[0.2em] mb-4">
        {t("title")}
      </h1>
      <p className="text-text-secondary text-sm tracking-wider">
        {t("subtitle")}
      </p>
    </motion.div>
  );
}
