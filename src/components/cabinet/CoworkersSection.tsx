"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Coworker } from "@/lib/blob";
import { Artwork } from "@/data/artworks";
import { EyeIcon, ClickIcon, CLICK_ICON_22, SOCIAL_ICONS, PANEL_CLASS, PANEL_STYLE } from "./shared";
import EntityChart from "./EntityChart";

function CoworkerRow({ coworker, onEdit, onDeleted, artworks, onArtworkClick, totalViews, totalClicks }: {
  coworker: Coworker;
  onEdit: () => void;
  onDeleted: (id: string) => void;
  artworks: Artwork[];
  onArtworkClick: (artwork: Artwork) => void;
  totalViews: number;
  totalClicks: number;
}) {
  const t = useTranslations("admin");
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Delete "${coworker.name}"?`)) return;
    setDeleting(true);
    try {
      await fetch("/api/coworkers", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: coworker.id }),
      });
      onDeleted(coworker.id);
    } catch {
      setDeleting(false);
    }
  };

  const thumbsRef = React.useRef<HTMLDivElement>(null);
  const [slotsPerRow, setSlotsPerRow] = React.useState(4);
  const [itemSize, setItemSize] = React.useState(104);

  React.useEffect(() => {
    const el = thumbsRef.current;
    if (!el) return;
    const gap = 10, pad = 10, minItem = 90;
    const update = () => {
      const available = el.clientWidth - pad * 2;
      const cols = Math.floor((available + gap) / (minItem + gap)) || 1;
      const size = (available - (cols - 1) * gap) / cols;
      setSlotsPerRow(cols);
      setItemSize(Math.floor(size));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const rows = Math.max(1, Math.ceil(artworks.length / slotsPerRow));
  const slotCount = rows * slotsPerRow;

  return (
    <div className="bg-bg-dark">
      {/* Top row — info + actions */}
      <div className="flex items-center gap-[16px] px-[16px] py-[12px] bg-white">
        <div className="relative w-[52px] h-[52px] shrink-0 rounded-full overflow-hidden bg-bg-dark flex items-center justify-center">
          {coworker.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coworker.avatar} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-[18px] font-bold text-text-light">
              {coworker.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold tracking-[1.5px] text-text-muted uppercase truncate">
            {coworker.name}
          </p>
          {coworker.role && (
            <p className="text-[12px] font-medium tracking-[1.2px] text-text-light uppercase mt-[2px] truncate">
              {coworker.role}
            </p>
          )}
          {coworker.socials && coworker.socials.length > 0 && (
            <div className="flex gap-[6px] mt-[4px]">
              {coworker.socials.map((s, i) => (
                <span key={i} className="text-[12px] font-bold tracking-[1px] text-text-light bg-bg px-[5px] py-[1px]">
                  {SOCIAL_ICONS[s.icon] ?? s.icon.toUpperCase()}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-[12px] shrink-0">
          <div className="flex items-center gap-[5px] text-text-light">
            <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
              <path d="M1 3.5A1.5 1.5 0 0 1 2.5 2h15A1.5 1.5 0 0 1 19 3.5v13a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 1 16.5v-13ZM3 5v10l4-4 3 3 4-5 3 3.5V5H3Z" />
            </svg>
            <span className="text-[13px] font-bold tracking-[0.5px]">{artworks.length}</span>
          </div>
          <span className="w-px h-[20px] bg-bg-dark shrink-0" />
          <div className="flex items-center gap-[5px] text-text-light">
            <EyeIcon />
            <span className="text-[13px] font-bold tracking-[0.5px]">{totalViews}</span>
          </div>
          <span className="w-px h-[20px] bg-bg-dark shrink-0" />
          <div className="flex items-center gap-[5px] text-text-light">
            <ClickIcon />
            <span className="text-[13px] font-bold tracking-[0.5px]">{totalClicks}</span>
          </div>
        </div>

        <span className="w-px h-[32px] bg-bg-dark shrink-0" />

        <button
          onClick={onEdit}
          className="shrink-0 w-[16px] h-[16px] flex items-center justify-center text-text-light hover:text-text-muted transition-colors"
          title="Edit"
        >
          <svg width="16" height="16" viewBox="0 0 20 19.9025" fill="none">
            <path d="M12.4365 3.32148L16.5049 7.38989L6.20657 17.6883L2.14042 13.6198L12.4365 3.32148ZM19.5921 2.34027L17.7777 0.525894C17.0765 -0.175298 15.938 -0.175298 15.2344 0.525894L13.4964 2.26388L17.5648 6.33233L19.5921 4.30507C20.136 3.76118 20.136 2.88411 19.5921 2.34027ZM0.0113215 19.3383C-0.0627191 19.6716 0.238132 19.9701 0.571391 19.8891L5.105 18.7899L1.03885 14.7215L0.0113215 19.3383Z" fill="currentColor" />
          </svg>
        </button>

        <button
          onClick={handleDelete}
          disabled={deleting}
          className="shrink-0 flex items-center gap-[5px] text-text-light hover:text-[#F87777] transition-colors disabled:opacity-40"
          title="Delete"
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" clipRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 3.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" />
          </svg>
          <span className="text-[12px] font-medium tracking-wide">{t("delete")}</span>
        </button>
      </div>

      {/* Bottom row — artwork thumbnails */}
      <div ref={thumbsRef} className="grid gap-[10px] p-[10px] bg-bg-dark overflow-y-auto" style={{ gridTemplateColumns: `repeat(${slotsPerRow}, 1fr)`, maxHeight: 20 + itemSize * 2 + 10 }}>
        {Array.from({ length: slotCount }, (_, i) => {
          const artwork = artworks[i];
          if (artwork) {
            return (
              <button
                key={artwork.id}
                onClick={(e) => { e.stopPropagation(); onArtworkClick(artwork); }}
                className="relative aspect-square overflow-hidden bg-bg-dark hover:brightness-75 transition-all"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={artwork.thumbnail || artwork.image}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </button>
            );
          }
          return (
            <div
              key={`placeholder-${i}`}
              className="aspect-square border border-dashed border-text-light"
            />
          );
        })}
      </div>
    </div>
  );
}

type Props = {
  locale: "ru" | "en";
  coworkers: Coworker[];
  allArtworks: Artwork[];
  viewCounts: Record<string, { total: number; recent: number }>;
  clickCounts: Record<string, { total: number; recent: number }>;
  onEditCoworker: (coworker: Coworker) => void;
  onDeletedCoworker: (id: string) => void;
  onCreateCoworker: () => void;
  onViewArtwork: (artwork: Artwork) => void;
};

export default function CoworkersSection({
  locale,
  coworkers,
  allArtworks,
  viewCounts,
  clickCounts,
  onEditCoworker,
  onDeletedCoworker,
  onCreateCoworker,
  onViewArtwork,
}: Props) {
  const t = useTranslations("admin");

  return (
    <motion.div
      key="coworkers-panel"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={PANEL_CLASS}
      style={PANEL_STYLE}
    >
      <div className="flex flex-col gap-[4px]">
        <EntityChart chartId="cc-coworkers" apiUrl="/api/stats/clicks-by-entity?type=coworkers" title="CLICKS BY COWORKERS" sidebarTitle="TOP COWORKERS" icon={CLICK_ICON_22} sidebarIcon={<ClickIcon />} />

        <button
          onClick={onCreateCoworker}
          className="w-full flex items-center justify-center gap-[8px] border-2 border-dashed border-border px-[16px] py-[14px] text-text-light hover:text-text-muted hover:border-text-light hover:bg-text-light/5 transition-all duration-200"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 1v14M1 8h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span className="text-[12px] font-bold tracking-[1.8px] uppercase">{t("addCoworker")}</span>
        </button>

        <div style={{ height: 5 }} />

        {coworkers.length === 0 && (
          <p className="text-center text-[12px] text-text-light py-[32px] tracking-[1.5px] uppercase">—</p>
        )}

        {coworkers.map((coworker, i) => {
          if (i % 2 !== 0) return null;
          const getArtworks = (cw: Coworker) =>
            allArtworks.filter((a) => a.coworkers?.some((c) => c.id === cw.id));
          const getViews = (cw: Coworker) =>
            getArtworks(cw).reduce((sum, a) => sum + (viewCounts[a.id]?.total ?? 0), 0);
          return (
            <div key={coworker.id} className="grid grid-cols-2 gap-[4px]">
              <CoworkerRow
                coworker={coworker}
                onEdit={() => onEditCoworker(coworker)}
                onDeleted={onDeletedCoworker}
                artworks={getArtworks(coworker)}
                onArtworkClick={onViewArtwork}
                totalViews={getViews(coworker)}
                totalClicks={clickCounts[coworker.id]?.total ?? 0}
              />
              {coworkers[i + 1] && (
                <CoworkerRow
                  coworker={coworkers[i + 1]}
                  onEdit={() => onEditCoworker(coworkers[i + 1])}
                  onDeleted={onDeletedCoworker}
                  artworks={getArtworks(coworkers[i + 1])}
                  onArtworkClick={onViewArtwork}
                  totalViews={getViews(coworkers[i + 1])}
                  totalClicks={clickCounts[coworkers[i + 1].id]?.total ?? 0}
                />
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
