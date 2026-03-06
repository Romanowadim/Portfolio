"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Artwork } from "@/data/artworks";
import { SingleChart } from "@/components/admin/VisitsChart";
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

export default function CardsSection({
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
  const [summary, setSummary] = useState<{ todayArtworkViews: number; allTimeArtworkViews: number } | null>(null);
  const [converting, setConverting] = useState(false);
  const [convertResult, setConvertResult] = useState<{ converted: number; savedMB: number } | null>(null);
  const [storageStats, setStorageStats] = useState<{ totalFiles: number; totalMB: number; byType: Record<string, { count: number; mb: number }> } | null>(null);

  useEffect(() => {
    fetch("/api/stats/summary")
      .then((r) => r.json())
      .then(setSummary)
      .catch(() => {});
    fetch("/api/convert-webp")
      .then((r) => r.json())
      .then(setStorageStats)
      .catch(() => {});
  }, []);

  return (
    <motion.div
      key="cards-panel"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={PANEL_CLASS}
      style={PANEL_STYLE}
    >
      {/* Image optimization */}
      <div className="mb-[20px]">
        <p className="text-[12px] font-bold tracking-[2.8px] uppercase text-text-secondary mb-1">
          Image optimization
        </p>

        {storageStats && (
          <div className="flex items-end gap-[32px] mb-4 mt-2">
            <div className="flex flex-col">
              <span className="text-[26px] font-bold tracking-tight text-text-muted leading-none">{storageStats.totalFiles}</span>
              <span className="text-[12px] font-bold tracking-[2px] uppercase text-text-light mt-[4px]">files</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[26px] font-bold tracking-tight text-text-muted leading-none">{storageStats.totalMB} <span className="text-[16px]">MB</span></span>
              <span className="text-[12px] font-bold tracking-[2px] uppercase text-text-light mt-[4px]">total size</span>
            </div>
            <span className="w-px h-[36px] bg-border" />
            {Object.entries(storageStats.byType).map(([ext, v]) => (
              <div key={ext} className="flex flex-col">
                <span className="text-[26px] font-bold tracking-tight text-text-muted leading-none">{v.count} <span className="text-[16px] text-text-light">({v.mb} MB)</span></span>
                <span className="text-[12px] font-bold tracking-[2px] uppercase text-text-light mt-[4px]">{ext.replace(".", "")}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-4">
          <button
            onClick={async () => {
              setConverting(true);
              setConvertResult(null);
              try {
                const res = await fetch("/api/convert-webp", { method: "POST" });
                if (res.ok) {
                  setConvertResult(await res.json());
                  const statsRes = await fetch("/api/convert-webp");
                  if (statsRes.ok) setStorageStats(await statsRes.json());
                }
              } catch {}
              setConverting(false);
            }}
            disabled={converting}
            className="h-[36px] px-5 text-[12px] font-bold tracking-[1.8px] uppercase border border-text-light text-text-light hover:text-text-muted hover:border-text-muted transition-colors disabled:opacity-40"
          >
            {converting ? "Converting..." : "Convert to WebP"}
          </button>
          {convertResult && (
            <span className="text-[12px] text-text-light tracking-[1px]">
              {convertResult.converted === 0
                ? "All images are already WebP"
                : `${convertResult.converted} files converted, saved ${convertResult.savedMB} MB`}
            </span>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div className="flex gap-[12px] mb-[20px]">
        {[
          { label: "TODAY'S VIEWS", value: summary?.todayArtworkViews },
          { label: "ALL-TIME VIEWS", value: summary?.allTimeArtworkViews },
          { label: "TOTAL CARDS", value: allArtworks.length },
        ].map(({ label, value }, i) => (
          <div key={i} className="flex-1 bg-white px-[16px] py-[12px]">
            <div className="text-[12px] font-bold tracking-[1.8px] uppercase text-text-light mb-[4px]">
              {label}
            </div>
            <div className="flex items-baseline gap-[8px]">
              <span className="text-[22px] font-bold tracking-tight text-text-muted">
                {value !== undefined ? value.toLocaleString() : "—"}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Views chart */}
      <div className="border border-border mb-[28px]">
        <div className="px-[20px] py-[16px]">
          <SingleChart apiUrl="/api/stats/views-chart" title={t("views")} icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" /><path fillRule="evenodd" d="M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113-1.487 4.471-5.705 7.697-10.677 7.697-4.97 0-9.186-3.223-10.675-7.69a1.762 1.762 0 0 1 0-1.113ZM17.25 12a5.25 5.25 0 1 1-10.5 0 5.25 5.25 0 0 1 10.5 0Z" clipRule="evenodd" /></svg>} />
        </div>
      </div>

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
