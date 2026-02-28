"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { motion } from "framer-motion";
import { use } from "react";
import { getArtworksByCategory } from "@/data/artworks";
import ArtworkGrid from "@/components/portfolio/ArtworkGrid";
import ComingSoon from "@/components/ui/ComingSoon";

type Props = {
  params: Promise<{ category: string }>;
};

export default function CategoryPage({ params }: Props) {
  const { category } = use(params);
  const t = useTranslations("portfolio");

  // Personal has subcategories
  if (category === "personal") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-6"
      >
        <Link
          href="/portfolio"
          className="text-xs tracking-[0.15em] text-text-secondary hover:text-text transition-colors"
        >
          ← {t("backToPortfolio")}
        </Link>

        <h1 className="text-2xl font-bold tracking-[0.2em]">
          {t("personal")}
        </h1>

        <div className="flex flex-col gap-3">
          <Link
            href="/portfolio/personal/cg"
            className="text-base font-semibold tracking-[0.15em] text-text-secondary hover:text-text transition-colors"
          >
            {t("cg")}
          </Link>
          <Link
            href="/portfolio/personal/lineart"
            className="text-base font-semibold tracking-[0.15em] text-text-secondary hover:text-text transition-colors"
          >
            {t("lineart")}
          </Link>
        </div>
      </motion.div>
    );
  }

  // Coming soon for other & gamedev
  if (category === "other" || category === "gamedev") {
    return (
      <div>
        <Link
          href="/portfolio"
          className="text-xs tracking-[0.15em] text-text-secondary hover:text-text transition-colors"
        >
          ← {t("backToPortfolio")}
        </Link>
        <ComingSoon />
      </div>
    );
  }

  // Regular category with artworks
  const artworks = getArtworksByCategory(category);
  const categoryKey = category as keyof typeof categoryLabels;
  const categoryLabels = {
    orders: "orders",
    youtube: "youtube",
  } as const;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-6"
    >
      <Link
        href="/portfolio"
        className="text-xs tracking-[0.15em] text-text-secondary hover:text-text transition-colors"
      >
        ← {t("backToPortfolio")}
      </Link>

      <h1 className="text-2xl font-bold tracking-[0.2em]">
        {t(categoryLabels[categoryKey] ?? category)}
      </h1>

      <ArtworkGrid artworks={artworks} />
    </motion.div>
  );
}
