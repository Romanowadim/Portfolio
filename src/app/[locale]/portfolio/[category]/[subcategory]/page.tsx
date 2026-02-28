"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { motion } from "framer-motion";
import { use } from "react";
import { getArtworksByCategory } from "@/data/artworks";
import ArtworkGrid from "@/components/portfolio/ArtworkGrid";

type Props = {
  params: Promise<{ category: string; subcategory: string }>;
};

export default function SubcategoryPage({ params }: Props) {
  const { category, subcategory } = use(params);
  const t = useTranslations("portfolio");

  const artworks = getArtworksByCategory(category, subcategory);

  const subcategoryLabels: Record<string, string> = {
    cg: "cg",
    lineart: "lineart",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-6"
    >
      <Link
        href={`/portfolio/${category}`}
        className="text-xs tracking-[0.15em] text-text-secondary hover:text-text transition-colors"
      >
        ← {t("backToCategories")}
      </Link>

      <h1 className="text-2xl font-bold tracking-[0.2em]">
        {t(subcategoryLabels[subcategory] ?? subcategory)}
      </h1>

      <ArtworkGrid artworks={artworks} />
    </motion.div>
  );
}
