"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";

export default function HomePage() {
  const t = useTranslations("hero");

  return (
    <div className="flex flex-col justify-center h-full">
      <div className="mt-auto lg:my-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="lg:hidden"
        >
          <h1 className="text-sm font-bold tracking-[4.5px] text-text-muted uppercase mb-0">
            {t("name")}
          </h1>
          <p className="text-sm font-medium tracking-[4.5px] text-text-light mb-[83px]">
            {t("title")}
          </p>
        </motion.div>
      </div>

    </div>
  );
}
