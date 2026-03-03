"use client";

import { useState, useEffect, useLayoutEffect, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { getArtworksByCategory, artworks as staticArtworks, Artwork } from "@/data/artworks";
import ArtworkModal from "@/components/portfolio/ArtworkModal";
import { usePortfolioPreview } from "@/components/portfolio/PortfolioPreviewContext";
import { useAdmin } from "@/components/admin/AdminProvider";
import AddArtworkTile from "@/components/admin/AddArtworkTile";
import ArtworkFormModal from "@/components/admin/ArtworkFormModal";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import SortableArtworkCard from "@/components/admin/SortableArtworkCard";

function ArtworkCard({
  artwork,
  index,
  locale,
  onClick,
}: {
  artwork: Artwork;
  index: number;
  locale: "ru" | "en";
  onClick: () => void;
}) {
  return (
    <motion.button
      key={artwork.id}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
      onClick={onClick}
      className="group relative w-full aspect-square overflow-hidden bg-[#e0e0e0]"
    >
      <Image
        src={artwork.thumbnail || artwork.image}
        alt={artwork.title[locale]}
        fill
        className="object-cover"
        sizes="(max-width: 1920px) 15vw, 288px"
      />
      {/* Figma overlay: white gradient + title + year/tools */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: "linear-gradient(to bottom, rgba(255,255,255,0.65) 0%, rgba(255,255,255,0.95) 59.375%)",
          mixBlendMode: "hard-light",
        }}
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        {artwork.logo ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={artwork.logo}
              alt={artwork.title[locale]}
              className="w-[160px] h-auto mb-[10px]"
            />
            <span className="text-[14px] font-bold tracking-[2.8px] text-[#7f7f7f] uppercase">
              {artwork.title[locale]}
            </span>
          </>
        ) : (
          <span className="text-[14px] font-bold tracking-[2.8px] text-[#7f7f7f] uppercase">
            {artwork.title[locale]}
          </span>
        )}
        {artwork.subscribers !== undefined && (
          <div className="flex items-center gap-[9px] mt-[8px]">
            <svg width="30" height="30" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" clipRule="evenodd" d="M19.8 5.97251C19.8 5.97251 19.6044 4.58454 19.005 3.97344C18.2444 3.17094 17.3919 3.16719 17.0012 3.12063C14.2025 2.91673 10.0044 2.91673 10.0044 2.91673H9.99563C9.99563 2.91673 5.7975 2.91673 2.99875 3.12063C2.6075 3.16719 1.75563 3.17094 0.994375 3.97344C0.395 4.58469 0.2 5.97251 0.2 5.97251C0.2 5.97251 0 7.60282 0 9.23235V10.7606C0 12.3908 0.2 14.0205 0.2 14.0205C0.2 14.0205 0.395 15.4084 0.994375 16.0195C1.75563 16.822 2.755 16.7969 3.2 16.8806C4.8 17.0355 10 17.0833 10 17.0833C10 17.0833 14.2025 17.077 17.0012 16.8731C17.3919 16.8259 18.2444 16.8222 19.005 16.0197C19.6044 15.4084 19.8 14.0206 19.8 14.0206C19.8 14.0206 20 12.3909 20 10.7606V9.23235C20 7.60282 19.8 5.97251 19.8 5.97251ZM7.935 12.6125L7.93437 6.95329L13.3381 9.79266L7.935 12.6125Z" fill="#7f7f7f"/>
            </svg>
            <span className="text-[18px] font-bold tracking-[3.6px] text-[#7f7f7f]">
              {artwork.subscribers}
            </span>
          </div>
        )}
      </div>
      {(artwork.year || artwork.tools) && (
        <div className="absolute bottom-[11%] left-0 right-0 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {artwork.year && (
            <p className="text-[12px] font-semibold leading-[22px] text-[#c0c0c0]">
              {artwork.year}
            </p>
          )}
          {artwork.tools && (
            <p className="text-[12px] font-semibold leading-[22px] text-[#c0c0c0]">
              {artwork.tools}
            </p>
          )}
        </div>
      )}
    </motion.button>
  );
}

const categoryPreviews: Record<string, string> = {
  personal: "/images/portfolio-previews/personal.png",
  orders: "/images/portfolio-previews/orders.jpg",
  youtube: "/images/portfolio-previews/youtube.jpg",
  other: "/images/portfolio-previews/other.jpg",
  gamedev: "/images/portfolio-previews/gamedev.jpg",
};

const subcategories: Record<string, { key: string; slug: string }[]> = {
  personal: [
    { key: "cg", slug: "cg" },
    { key: "lineart", slug: "lineart" },
  ],
};

const categories = [
  { key: "personal", slug: "personal" },
  { key: "orders", slug: "orders" },
  { key: "youtube", slug: "youtube" },
  { key: "other", slug: "other" },
  { key: "gamedev", slug: "gamedev" },
] as const;

export default function CategoryMenu() {
  const t = useTranslations("portfolio");
  const locale = useLocale() as "ru" | "en";
  const { isAdmin } = useAdmin();
  const { setPreviewActive } = usePortfolioPreview();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [activeGrid, setActiveGrid] = useState<{ category: string; subcategory?: string } | null>(null);
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);
  const [pendingArtworkId, setPendingArtworkId] = useState<string | null>(null);
  const [openInstant, setOpenInstant] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addInitialImageUrl, setAddInitialImageUrl] = useState<string | undefined>();

  const openAddModal = (imageUrl?: string) => {
    setAddInitialImageUrl(imageUrl);
    setShowAddModal(true);
  };
  const [editingArtwork, setEditingArtwork] = useState<Artwork | null>(null);
  const [dynamicArtworks, setDynamicArtworks] = useState<Artwork[]>([]);
  const [artworkOrder, setArtworkOrder] = useState<Record<string, string[]>>({});
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());

  // Fetch dynamic artworks + order + deleted IDs
  useEffect(() => {
    fetch("/api/artworks")
      .then((r) => r.json())
      .then((data: Artwork[]) => setDynamicArtworks(data))
      .catch(() => {});
    fetch("/api/artwork-order")
      .then((r) => r.json())
      .then((data: Record<string, string[]>) => setArtworkOrder(data))
      .catch(() => {});
    fetch("/api/deleted-artworks")
      .then((r) => r.json())
      .then((data: string[]) => setDeletedIds(new Set(data)))
      .catch(() => {});
  }, []);

  // URL sync: open artwork from ?artwork=id on mount
  // useLayoutEffect fires before browser paint → no hero image flash
  useLayoutEffect(() => {
    const id = new URLSearchParams(window.location.search).get("artwork");
    if (!id) return;
    const found = staticArtworks.find((a) => a.id === id);
    if (found) {
      setOpenInstant(true);
      setActiveGrid({ category: found.category, subcategory: found.subcategory });
      setSelectedArtwork(found);
    }
    // Always set pendingArtworkId so dynamic version (with extra fields) upgrades the modal
    setPendingArtworkId(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset instant flag after modal has mounted
  useEffect(() => {
    if (openInstant) setOpenInstant(false);
  }, [openInstant]);

  // Resolve pending artwork once dynamic artworks load
  useEffect(() => {
    if (!pendingArtworkId || dynamicArtworks.length === 0) return;
    const found = dynamicArtworks.find((a) => a.id === pendingArtworkId);
    if (found) {
      setActiveGrid({ category: found.category, subcategory: found.subcategory });
      setSelectedArtwork(found);
    }
    setPendingArtworkId(null);
  }, [dynamicArtworks, pendingArtworkId]);

  const handleSelectArtwork = (artwork: Artwork | null) => {
    setSelectedArtwork(artwork);
    if (artwork) {
      window.history.replaceState(null, "", "?artwork=" + artwork.id);
      fetch("/api/stats/view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artworkId: artwork.id }),
      }).catch(() => {});
    } else {
      window.history.replaceState(null, "", window.location.pathname);
      document.documentElement.removeAttribute("data-artwork-open");
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const showPreview = hoveredCategory && !activeGrid && !expanded;

  useEffect(() => {
    setPreviewActive(!!(showPreview || activeGrid));
  }, [showPreview, activeGrid, setPreviewActive]);

  // Merge static + dynamic artworks, sorted by saved order
  const mergedArtworks = (() => {
    if (!activeGrid) return [];
    const staticOnes = getArtworksByCategory(activeGrid.category, activeGrid.subcategory);
    const idMap = new Map<string, Artwork>();
    for (const a of staticOnes) idMap.set(a.id, a);
    // All dynamic artworks override static (category may have changed)
    for (const a of dynamicArtworks) idMap.set(a.id, a);
    // Filter after merge so category changes and deletions are reflected correctly
    const unsorted = Array.from(idMap.values()).filter((a) => {
      if (deletedIds.has(a.id)) return false;
      if (a.category !== activeGrid.category) return false;
      if (activeGrid.subcategory && a.subcategory !== activeGrid.subcategory) return false;
      return true;
    });

    const orderKey = activeGrid.subcategory
      ? `${activeGrid.category}/${activeGrid.subcategory}`
      : activeGrid.category;
    const savedOrder = artworkOrder[orderKey];
    if (!savedOrder) return unsorted;

    const posMap = new Map(savedOrder.map((id, i) => [id, i]));
    return unsorted.sort((a, b) => {
      const posA = posMap.get(a.id) ?? Number.MAX_SAFE_INTEGER;
      const posB = posMap.get(b.id) ?? Number.MAX_SAFE_INTEGER;
      return posA - posB;
    });
  })();

  const orderKey = activeGrid
    ? activeGrid.subcategory
      ? `${activeGrid.category}/${activeGrid.subcategory}`
      : activeGrid.category
    : "";

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id || !orderKey) return;

      const oldIndex = mergedArtworks.findIndex((a) => a.id === active.id);
      const newIndex = mergedArtworks.findIndex((a) => a.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(mergedArtworks, oldIndex, newIndex);
      const newIds = reordered.map((a) => a.id);

      // Optimistic update
      setArtworkOrder((prev) => ({ ...prev, [orderKey]: newIds }));

      // Persist
      const fullOrder = { ...artworkOrder, [orderKey]: newIds };
      fetch("/api/artwork-order", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fullOrder),
      }).catch(() => {});
    },
    [mergedArtworks, orderKey, artworkOrder]
  );

  const handleCategoryClick = (category: string) => {
    if (activeGrid?.category === category && !activeGrid?.subcategory) {
      setActiveGrid(null);
    } else {
      setActiveGrid({ category });
    }
  };

  const handleSubClick = (category: string, subcategory: string) => {
    if (activeGrid?.category === category && activeGrid?.subcategory === subcategory) {
      setActiveGrid(null);
    } else {
      setActiveGrid({ category, subcategory });
    }
  };

  const isCategoryActive = (key: string) => {
    return activeGrid?.category === key && !activeGrid?.subcategory;
  };

  const handleArtworkAdded = (artwork: Artwork) => {
    setDynamicArtworks((prev) => [...prev, artwork]);
    if (orderKey) {
      setArtworkOrder((prev) => {
        const existing = prev[orderKey] ?? [];
        return { ...prev, [orderKey]: [...existing, artwork.id] };
      });
    }
  };

  const handleArtworkUpdated = (artwork: Artwork) => {
    setDynamicArtworks((prev) => {
      const exists = prev.some((a) => a.id === artwork.id);
      if (!exists) return [...prev, artwork];
      return prev.map((a) => (a.id === artwork.id ? artwork : a));
    });
  };

  const handleArtworkDeleted = (id: string) => {
    setDynamicArtworks((prev) => prev.filter((a) => a.id !== id));
    if (orderKey) {
      setArtworkOrder((prev) => {
        const existing = prev[orderKey] ?? [];
        return { ...prev, [orderKey]: existing.filter((eid) => eid !== id) };
      });
    }
  };

  return (
    <>
      <div className="flex flex-col gap-[28px]">
        {categories.map((cat, i) => {
          const subs = subcategories[cat.key];
          const isExpanded = expanded === cat.key;

          return (
            <motion.div
              key={cat.key}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20, transition: { delay: (4 - i) * 0.05, duration: 0.3 } }}
              transition={{ delay: 0.15 + i * 0.08, duration: 0.4, ease: "easeOut" }}
            >
              {subs ? (
                <button
                  onClick={() => {
                    setExpanded(isExpanded ? null : cat.key);
                    if (isExpanded) setActiveGrid(null);
                  }}
                  onMouseEnter={() => setHoveredCategory(cat.key)}
                  onMouseLeave={() => setHoveredCategory(null)}
                  className={`h-[30px] flex items-center text-sm font-bold tracking-[2.8px] uppercase transition-colors ${
                    isExpanded ? "text-text-muted" : "text-[#c0c0c0] hover:text-text-muted"
                  }`}
                >
                  {t(cat.key)}
                </button>
              ) : (
                <button
                  onClick={() => handleCategoryClick(cat.key)}
                  onMouseEnter={() => setHoveredCategory(cat.key)}
                  onMouseLeave={() => setHoveredCategory(null)}
                  className={`h-[30px] flex items-center text-sm font-bold tracking-[2.8px] uppercase transition-colors ${
                    isCategoryActive(cat.key) ? "text-text-muted" : "text-[#c0c0c0] hover:text-text-muted"
                  }`}
                >
                  {t(cat.key)}
                </button>
              )}

              <AnimatePresence>
                {isExpanded && subs && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="overflow-hidden"
                  >
                    <div className="flex flex-col gap-[14px] pl-[43px] pt-[14px]">
                      {subs.map((sub) => (
                        <button
                          key={sub.key}
                          onClick={() => handleSubClick(cat.key, sub.slug)}
                          className={`text-left text-sm font-medium transition-colors ${
                            activeGrid?.category === cat.key && activeGrid?.subcategory === sub.slug
                              ? "text-text-muted"
                              : "text-[#c0c0c0] hover:text-text-muted"
                          }`}
                        >
                          -&nbsp;&nbsp;&nbsp;{t(sub.key)}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Category hover preview — covers hero image area */}
      <AnimatePresence>
        {showPreview && categoryPreviews[hoveredCategory] && (
          <motion.div
            key={`preview-${hoveredCategory}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="fixed top-0 bottom-0 right-0 left-[33.75vw] z-[5] pointer-events-none"
          >
            <Image
              src={categoryPreviews[hoveredCategory]}
              alt={hoveredCategory}
              fill
              className="object-cover object-center"
              sizes="66vw"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Artwork grid overlay — covers hero image area */}
      <AnimatePresence>
        {activeGrid && mergedArtworks.length > 0 && (
          <motion.div
            key={`${activeGrid.category}-${activeGrid.subcategory ?? "all"}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="fixed top-0 bottom-0 right-0 left-[calc(33.75vw+24px)] z-10 overflow-y-auto bg-[#f5f5f5]"
            style={{ paddingTop: 24, paddingBottom: 24, paddingRight: 24 }}
          >
            {isAdmin ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={mergedArtworks.map((a) => a.id)}
                  strategy={rectSortingStrategy}
                >
                  <div className="grid grid-cols-4 gap-[24px]">
                    {mergedArtworks.map((artwork, i) => (
                      <SortableArtworkCard key={artwork.id} id={artwork.id}>
                        <ArtworkCard
                          artwork={artwork}
                          index={i}
                          locale={locale}
                          onClick={() => handleSelectArtwork(artwork)}
                        />
                      </SortableArtworkCard>
                    ))}
                    <AddArtworkTile
                      index={mergedArtworks.length}
                      onClick={() => openAddModal()}
                      onDropImage={(url) => openAddModal(url)}
                    />
                  </div>
                </SortableContext>
              </DndContext>
            ) : (
              <div className="grid grid-cols-4 gap-[24px]">
                {mergedArtworks.map((artwork, i) => (
                  <ArtworkCard
                    key={artwork.id}
                    artwork={artwork}
                    index={i}
                    locale={locale}
                    onClick={() => handleSelectArtwork(artwork)}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedArtwork && (() => {
          const idx = mergedArtworks.findIndex((a) => a.id === selectedArtwork.id);
          return (
            <ArtworkModal
              key="artwork-modal"
              artwork={selectedArtwork}
              instant={openInstant}
              onClose={() => handleSelectArtwork(null)}
              onPrev={idx > 0 ? () => handleSelectArtwork(mergedArtworks[idx - 1]) : undefined}
              onNext={idx < mergedArtworks.length - 1 ? () => handleSelectArtwork(mergedArtworks[idx + 1]) : undefined}
              onEdit={() => {
                setEditingArtwork(selectedArtwork);
                handleSelectArtwork(null);
              }}
            />
          );
        })()}
      </AnimatePresence>

      <AnimatePresence>
        {showAddModal && activeGrid && (
          <ArtworkFormModal
            category={activeGrid.category}
            subcategory={activeGrid.subcategory}
            initialImageUrl={addInitialImageUrl}
            onClose={() => setShowAddModal(false)}
            onSaved={handleArtworkAdded}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingArtwork && (
          <ArtworkFormModal
            key={editingArtwork.id}
            category={editingArtwork.category}
            subcategory={editingArtwork.subcategory}
            artwork={editingArtwork}
            onClose={() => setEditingArtwork(null)}
            onSaved={handleArtworkUpdated}
            onDeleted={handleArtworkDeleted}
          />
        )}
      </AnimatePresence>
    </>
  );
}
