"use client";

import React, { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useAdmin } from "@/components/admin/AdminProvider";
import { useRouter } from "@/i18n/navigation";
import { artworks as staticArtworks, Artwork } from "@/data/artworks";
import ArtworkFormModal from "@/components/admin/ArtworkFormModal";

const staticIds = new Set(staticArtworks.map((a) => a.id));

const RU_MONTHS = ["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"];
const EN_MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function formatCreatedAt(iso: string, locale: string): { date: string; time: string } {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const date = locale === "ru"
    ? `${day} ${RU_MONTHS[d.getMonth()]} ${year}г.`
    : `${day} ${EN_MONTHS[d.getMonth()]} ${year}`;
  return { date, time: `${hours}:${minutes}` };
}

function EyeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 14" fill="none">
      <path
        d="M10 0C5.5 0 1.73 2.89 0 7c1.73 4.11 5.5 7 10 7s8.27-2.89 10-7c-1.73-4.11-5.5-7-10-7zm0 11.67A4.67 4.67 0 1 1 10 2.33a4.67 4.67 0 0 1 0 9.34zM10 4a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"
        fill="currentColor"
      />
    </svg>
  );
}

function ArtworkStatRow({
  artwork,
  viewCount,
  locale,
  onEdit,
  onDeleted,
  onNavigate,
}: {
  artwork: Artwork;
  viewCount: { total: number; recent: number };
  locale: "ru" | "en";
  onEdit: () => void;
  onDeleted: (id: string) => void;
  onNavigate: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const isDynamic = !staticIds.has(artwork.id);

  const handleDelete = async () => {
    if (!confirm(`Delete "${artwork.title[locale]}"?`)) return;
    setDeleting(true);
    try {
      await fetch("/api/artworks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: artwork.id }),
      });
      onDeleted(artwork.id);
    } catch {
      setDeleting(false);
    }
  };

  return (
    <div
      className="flex items-center gap-[16px] bg-white px-[16px] py-[12px] cursor-pointer hover:bg-[#fafafa] transition-colors"
      onClick={onNavigate}
    >
      {/* Thumbnail */}
      <div className="relative w-[52px] h-[52px] shrink-0 bg-[#f0f0f0] overflow-hidden">
        <Image
          src={artwork.thumbnail || artwork.image}
          alt={artwork.title[locale]}
          fill
          className="object-cover"
          sizes="52px"
        />
      </div>

      {/* Info */}
      <div className="w-[248px] shrink-0 min-w-0 pr-[48px]">
        <p className="text-[13px] font-bold tracking-[1.5px] text-[#808080] uppercase truncate">
          {artwork.title[locale]}
        </p>
        <p className="text-[12px] font-medium tracking-[1.2px] text-[#c0c0c0] uppercase mt-[2px]">
          {artwork.category}
          {artwork.subcategory ? ` / ${artwork.subcategory}` : ""}
          {artwork.year ? ` · ${artwork.year}` : ""}
        </p>
      </div>

      {/* Separator */}
      <span className="w-px h-[32px] bg-[#ebebeb] shrink-0" />

      {/* Views */}
      <div className="flex items-center gap-[16px] shrink-0 w-[120px] justify-end">
        {viewCount.recent > 0 && (
          <span className="text-[13px] font-bold tracking-[0.5px]" style={{ color: "#81AB41" }}>
            +{viewCount.recent}
          </span>
        )}
        <div className="flex items-center gap-[5px] text-[#c0c0c0]">
          <EyeIcon />
          <span className="text-[13px] font-bold tracking-[0.5px]">{viewCount.total}</span>
        </div>
      </div>

      {/* Separator */}
      <span className="w-px h-[32px] bg-[#ebebeb] shrink-0" />

      {/* Date */}
      <div className="shrink-0 w-[130px]">
        {artwork.createdAt ? (() => {
          const { date, time } = formatCreatedAt(artwork.createdAt, locale);
          return (
            <>
              <p className="text-[12px] font-medium tracking-[1.2px] text-[#c0c0c0]">{date}</p>
              <p className="text-[12px] font-medium tracking-[1.2px] text-[#c0c0c0] mt-[2px]">{time}</p>
            </>
          );
        })() : (
          <p className="text-[12px] font-medium tracking-[1.2px] text-[#c0c0c0]">—</p>
        )}
      </div>

      {/* Separator */}
      <span className="w-px h-[32px] bg-[#ebebeb] shrink-0" />

      {/* Spacer */}
      <div className="flex-1" />

      {/* Edit */}
      <button
        onClick={(e) => { e.stopPropagation(); onEdit(); }}
        className="shrink-0 w-[16px] h-[16px] flex items-center justify-center text-[#c0c0c0] hover:text-[#808080] transition-colors"
        title="Edit"
      >
        <svg width="16" height="16" viewBox="0 0 20 19.9025" fill="none">
          <path
            d="M12.4365 3.32148L16.5049 7.38989L6.20657 17.6883L2.14042 13.6198L12.4365 3.32148ZM19.5921 2.34027L17.7777 0.525894C17.0765 -0.175298 15.938 -0.175298 15.2344 0.525894L13.4964 2.26388L17.5648 6.33233L19.5921 4.30507C20.136 3.76118 20.136 2.88411 19.5921 2.34027ZM0.0113215 19.3383C-0.0627191 19.6716 0.238132 19.9701 0.571391 19.8891L5.105 18.7899L1.03885 14.7215L0.0113215 19.3383Z"
            fill="currentColor"
          />
        </svg>
      </button>

      {/* Delete */}
      <button
        onClick={(e) => { e.stopPropagation(); handleDelete(); }}
        disabled={deleting}
        className="shrink-0 flex items-center gap-[5px] text-text-light hover:text-[#F87777] transition-colors disabled:opacity-40"
        title="Delete"
      >
        <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" clipRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 3.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" />
        </svg>
        <span className="text-[12px] font-medium tracking-wide">Delete</span>
      </button>
    </div>
  );
}

const sections = [{ key: "statistic" }] as const;

export default function CabinetPage() {
  const { isAdmin } = useAdmin();
  const router = useRouter();
  const locale = useLocale() as "ru" | "en";
  const t = useTranslations("admin");

  const [activeSection, setActiveSection] = useState<string>("statistic");
  const [sortBy, setSortBy] = useState<"popularity" | "date" | "category">("date");
  const [viewCounts, setViewCounts] = useState<Record<string, { total: number; recent: number }>>({});
  const [dynamicArtworks, setDynamicArtworks] = useState<Artwork[]>([]);
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [editingArtwork, setEditingArtwork] = useState<Artwork | null>(null);

  useEffect(() => {
    if (!isAdmin) router.replace("/");
  }, [isAdmin, router]);

  useEffect(() => {
    if (activeSection !== "statistic") return;
    fetch("/api/stats")
      .then((r) => r.json())
      .then((data: Record<string, number>) => setViewCounts(data))
      .catch(() => {});
    fetch("/api/artworks")
      .then((r) => r.json())
      .then((data: Artwork[]) => setDynamicArtworks(data))
      .catch(() => {});
    fetch("/api/deleted-artworks")
      .then((r) => r.json())
      .then((data: string[]) => setDeletedIds(new Set(data)))
      .catch(() => {});
  }, [activeSection]);

  if (!isAdmin) return null;

  // Merge static + dynamic; dynamic overrides static (same id); filter deleted
  const artworkMap = new Map<string, Artwork>();
  for (const a of staticArtworks) artworkMap.set(a.id, a);
  for (const a of dynamicArtworks) artworkMap.set(a.id, a);
  const allArtworks = Array.from(artworkMap.values()).filter((a) => !deletedIds.has(a.id));

  const CATEGORY_ORDER: Artwork["category"][] = ["personal", "orders", "youtube", "gamedev", "other"];

  const sortedArtworks = sortBy === "popularity"
    ? [...allArtworks].sort((a, b) => (viewCounts[b.id]?.total ?? 0) - (viewCounts[a.id]?.total ?? 0))
    : allArtworks; // "date" / "category" — preserves insertion order

  const categoryLabel = (cat: Artwork["category"]) => {
    const key = `category${cat.charAt(0).toUpperCase()}${cat.slice(1)}` as Parameters<typeof t>[0];
    return t(key);
  };

  // For "category" mode: group by category in fixed order
  const groupedByCategory: { category: Artwork["category"]; artworks: Artwork[] }[] =
    sortBy === "category"
      ? CATEGORY_ORDER
          .map((cat) => ({ category: cat, artworks: allArtworks.filter((a) => a.category === cat) }))
          .filter((g) => g.artworks.length > 0)
      : [];

  return (
    <>
      <div className="relative z-10 flex flex-col h-full py-6 lg:py-0">
        <div className="flex-1 flex items-center">
          <div className="flex flex-col gap-[28px]">
            {sections.map((section, i) => (
              <motion.div
                key={section.key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20, transition: { delay: 0, duration: 0.3 } }}
                transition={{ delay: 0.15 + i * 0.08, duration: 0.4, ease: "easeOut" }}
              >
                <button
                  onClick={() =>
                    setActiveSection(activeSection === section.key ? null : section.key)
                  }
                  className={`h-[30px] flex items-center text-sm font-bold tracking-[2.8px] uppercase transition-colors ${
                    activeSection === section.key
                      ? "text-text-muted"
                      : "text-[#c0c0c0] hover:text-text-muted"
                  }`}
                >
                  {t(section.key)}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Statistics panel — mirrors the artwork grid overlay from Portfolio */}
      <AnimatePresence>
        {activeSection === "statistic" && (
          <motion.div
            key="stat-panel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="fixed top-0 bottom-0 right-0 left-[calc(33.75vw+24px)] z-10 overflow-y-auto bg-[#f5f5f5]"
            style={{ paddingTop: 148 + 24, paddingBottom: 24, paddingRight: 24 }}
          >
            {/* Sort controls */}
            <div className="flex items-center justify-center gap-[16px] mb-[48px]">
              {(["date", "popularity", "category"] as const).map((mode, i) => (
                <React.Fragment key={mode}>
                  {i > 0 && <span className="w-px h-[1em] bg-text-light/50 self-center" />}
                  <button
                    onClick={() => setSortBy(mode)}
                    className={`text-[14px] tracking-wide transition-colors ${
                      sortBy === mode ? "text-[#808080]" : "text-[#c0c0c0] hover:text-[#808080]"
                    }`}
                  >
                    {t(mode === "popularity" ? "sortByPopularity" : mode === "category" ? "sortByCategory" : "sortByDate")}
                  </button>
                </React.Fragment>
              ))}
            </div>

            {/* Table header */}
            <div className="flex items-center gap-[16px] pr-[16px] pb-[8px]">
              <span className="w-[2px] h-[2em] bg-[#e0e0e0] shrink-0" />
              <p className="w-[314px] shrink-0 text-[10px] font-bold tracking-[1.8px] text-[#c0c0c0] uppercase">
                Name / Info
              </p>
              <span className="w-[2px] h-[2em] bg-[#e0e0e0] shrink-0" />
              <p className="w-[120px] shrink-0 text-[10px] font-bold tracking-[1.8px] text-[#c0c0c0] uppercase">
                Views
              </p>
              <span className="w-[2px] h-[2em] bg-[#e0e0e0] shrink-0" />
              <p className="w-[130px] shrink-0 text-[10px] font-bold tracking-[1.8px] text-[#c0c0c0] uppercase">
                Date
              </p>
              <span className="w-[2px] h-[2em] bg-[#e0e0e0] shrink-0" />
            </div>

            {sortBy === "category" ? (
              <div className="flex flex-col gap-[32px]">
                {groupedByCategory.map((group) => (
                  <div key={group.category}>
                    {/* Section header */}
                    <div className="flex items-center gap-[12px] mt-[32px] mb-[32px]">
                      <p className="text-[14px] font-bold tracking-[2px] text-[#c0c0c0] uppercase shrink-0">
                        {categoryLabel(group.category)}
                      </p>
                      <span className="flex-1 h-px bg-[#e0e0e0]" />
                    </div>
                    <div className="flex flex-col gap-[4px]">
                      {group.artworks.map((artwork) => (
                        <ArtworkStatRow
                          key={artwork.id}
                          artwork={artwork}
                          viewCount={viewCounts[artwork.id] ?? { total: 0, recent: 0 }}
                          locale={locale}
                          onEdit={() => setEditingArtwork(artwork)}
                          onDeleted={(id) => {
                            setDynamicArtworks((prev) => prev.filter((a) => a.id !== id));
                            setDeletedIds((prev) => new Set([...prev, id]));
                          }}
                          onNavigate={() => router.push(`/portfolio?artwork=${artwork.id}`)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-[4px]">
                {sortedArtworks.map((artwork) => (
                  <ArtworkStatRow
                    key={artwork.id}
                    artwork={artwork}
                    viewCount={viewCounts[artwork.id] ?? { total: 0, recent: 0 }}
                    locale={locale}
                    onEdit={() => setEditingArtwork(artwork)}
                    onDeleted={(id) => {
                      setDynamicArtworks((prev) => prev.filter((a) => a.id !== id));
                      setDeletedIds((prev) => new Set([...prev, id]));
                    }}
                    onNavigate={() => router.push(`/portfolio?artwork=${artwork.id}`)}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit modal */}
      <AnimatePresence>
        {editingArtwork && (
          <ArtworkFormModal
            key={editingArtwork.id}
            category={editingArtwork.category}
            subcategory={editingArtwork.subcategory}
            artwork={editingArtwork}
            onClose={() => setEditingArtwork(null)}
            onSaved={(updated) => {
              setDynamicArtworks((prev) =>
                prev.some((a) => a.id === updated.id)
                  ? prev.map((a) => (a.id === updated.id ? updated : a))
                  : [...prev, updated]
              );
              setEditingArtwork(null);
            }}
            onDeleted={(id) => {
              setDynamicArtworks((prev) => prev.filter((a) => a.id !== id));
              setEditingArtwork(null);
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
