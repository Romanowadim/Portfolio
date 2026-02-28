"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { motion } from "framer-motion";

const categories = [
  { key: "personal", slug: "personal" },
  { key: "orders", slug: "orders" },
  { key: "youtube", slug: "youtube" },
  { key: "other", slug: "other" },
  { key: "gamedev", slug: "gamedev" },
] as const;

export default function CategoryMenu() {
  const t = useTranslations("portfolio");

  return (
    <div className="flex flex-col gap-3">
      {categories.map((cat, i) => (
        <motion.div
          key={cat.key}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <Link
            href={`/portfolio/${cat.slug}`}
            className="block text-lg md:text-xl font-bold tracking-[0.2em] uppercase text-text-secondary hover:text-text transition-colors"
          >
            {t(cat.key)}
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
