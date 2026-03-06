"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Artwork } from "@/data/artworks";
import VisitsChart from "@/components/admin/VisitsChart";
import { ArtworkStatRow, AddArtworkButton, PANEL_CLASS, PANEL_STYLE } from "./shared";
import type { Category } from "@/types/category";

type Props = {
  locale: "ru" | "en";
  allArtworks: Artwork[];
  sortedArtworks: Artwork[];
  groupedByCategory: { category: string; artworks: Artwork[] }[];
  viewCounts: Record<string, { total: number; recent: number }>;
  hiddenIds: Set<string>;
  sortBy: "popularity" | "date" | "category";
  setSortBy: (s: "popularity" | "date" | "category") => void;
  categories: Category[];
  categoryLabel: (catId: string) => string;
  onEditArtwork: (artwork: Artwork) => void;
  onDeletedArtwork: (id: string) => void;
  onNavigateArtwork: (artwork: Artwork) => void;
  onToggleHidden: (id: string) => void;
  onCreateArtwork: (imageUrl?: string) => void;
};

export default function StatisticSection({
  locale,
  allArtworks,
  sortedArtworks,
  groupedByCategory,
  viewCounts,
  hiddenIds,
  sortBy,
  setSortBy,
  categories,
  categoryLabel,
  onEditArtwork,
  onDeletedArtwork,
  onNavigateArtwork,
  onToggleHidden,
  onCreateArtwork,
}: Props) {
  const t = useTranslations("admin");

  return (
    <motion.div
      key="stat-panel"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={PANEL_CLASS}
      style={PANEL_STYLE}
    >
      <VisitsChart />

      <div className="w-full h-px bg-border" />

      {/* Table header + sort controls */}
      <div className="flex items-center gap-[16px] pr-[16px] mb-[8px] border-b border-r border-border">
        <span className="w-[2px] h-[2em] bg-border shrink-0" />
        <p className="w-[314px] shrink-0 text-[12px] font-bold tracking-[1.8px] text-text-light uppercase">
          {t("colNameInfo")}
        </p>
        <span className="w-[2px] h-[2em] bg-border shrink-0" />
        <p className="w-[120px] shrink-0 text-[12px] font-bold tracking-[1.8px] text-text-light uppercase">
          {t("colViews")}
        </p>
        <span className="w-[2px] h-[2em] bg-border shrink-0" />
        <p className="w-[130px] shrink-0 text-[12px] font-bold tracking-[1.8px] text-text-light uppercase">
          {t("colDate")}
        </p>
        <span className="w-[2px] h-[2em] bg-border shrink-0" />
        <p className="w-[60px] shrink-0 text-[12px] font-bold tracking-[1.8px] text-text-light uppercase">
          {t("colVersions")}
        </p>
        <span className="w-[2px] h-[2em] bg-border shrink-0" />
        <div className="flex-1 flex items-center justify-end gap-[12px]">
          {(["date", "popularity", "category"] as const).map((mode, i) => (
            <React.Fragment key={mode}>
              {i > 0 && <span className="w-px h-[1em] bg-text-light/50 self-center" />}
              <button
                onClick={() => setSortBy(mode)}
                className={`text-[12px] font-bold tracking-[1.8px] uppercase transition-colors ${
                  sortBy === mode ? "text-text-muted" : "text-text-light hover:text-text-muted"
                }`}
              >
                {t(mode === "popularity" ? "sortByPopularity" : mode === "category" ? "sortByCategory" : "sortByDate")}
              </button>
            </React.Fragment>
          ))}
        </div>
      </div>

      {sortBy === "category" ? (
        <div className="flex flex-col gap-[32px]">
          <AddArtworkButton onClick={() => onCreateArtwork()} label={t("addArtwork")} onDropImage={(url) => onCreateArtwork(url)} />
          <div style={{ height: 5 }} />
          {groupedByCategory.map((group, gi) => (
            <div key={group.category}>
              <div className={`flex items-center gap-[12px] mb-[32px] ${gi === 0 ? "mt-0" : "mt-[32px]"}`}>
                <p className="text-[14px] font-bold tracking-[2px] text-text-light uppercase shrink-0">
                  {categoryLabel(group.category)}
                </p>
                <span className="flex-1 h-px bg-border" />
              </div>
              <div className="flex flex-col gap-[4px]">
                {group.artworks.map((artwork) => (
                  <ArtworkStatRow
                    key={artwork.id}
                    artwork={artwork}
                    viewCount={viewCounts[artwork.id] ?? { total: 0, recent: 0 }}
                    locale={locale}
                    onEdit={() => onEditArtwork(artwork)}
                    onDeleted={onDeletedArtwork}
                    onNavigate={() => onNavigateArtwork(artwork)}
                    isHidden={hiddenIds.has(artwork.id)}
                    onToggleHidden={() => onToggleHidden(artwork.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-[4px]">
          <AddArtworkButton onClick={() => onCreateArtwork()} label={t("addArtwork")} onDropImage={(url) => onCreateArtwork(url)} />
          <div style={{ height: 5 }} />
          {sortedArtworks.map((artwork) => (
            <ArtworkStatRow
              key={artwork.id}
              artwork={artwork}
              viewCount={viewCounts[artwork.id] ?? { total: 0, recent: 0 }}
              locale={locale}
              onEdit={() => onEditArtwork(artwork)}
              onDeleted={onDeletedArtwork}
              onNavigate={() => onNavigateArtwork(artwork)}
              isHidden={hiddenIds.has(artwork.id)}
              onToggleHidden={() => onToggleHidden(artwork.id)}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}
