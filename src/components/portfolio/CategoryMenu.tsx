"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { getArtworksByCategory, Artwork } from "@/data/artworks";
import ArtworkModal from "@/components/portfolio/ArtworkModal";
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
        <span className="text-[14px] font-bold tracking-[2.8px] text-[#7f7f7f] uppercase">
          {artwork.title[locale]}
        </span>
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
  const [expanded, setExpanded] = useState<string | null>(null);
  const [activeGrid, setActiveGrid] = useState<{ category: string; subcategory?: string } | null>(null);
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingArtwork, setEditingArtwork] = useState<Artwork | null>(null);
  const [dynamicArtworks, setDynamicArtworks] = useState<Artwork[]>([]);
  const [artworkOrder, setArtworkOrder] = useState<Record<string, string[]>>({});

  // Fetch dynamic artworks + order
  useEffect(() => {
    fetch("/api/artworks")
      .then((r) => r.json())
      .then((data: Artwork[]) => setDynamicArtworks(data))
      .catch(() => {});
    fetch("/api/artwork-order")
      .then((r) => r.json())
      .then((data: Record<string, string[]>) => setArtworkOrder(data))
      .catch(() => {});
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const showPreview = hoveredCategory && !activeGrid && !expanded;

  // Merge static + dynamic artworks, sorted by saved order
  const mergedArtworks = (() => {
    if (!activeGrid) return [];
    const staticOnes = getArtworksByCategory(activeGrid.category, activeGrid.subcategory);
    const dynamicOnes = dynamicArtworks.filter((a) => {
      if (a.category !== activeGrid.category) return false;
      if (activeGrid.subcategory && a.subcategory !== activeGrid.subcategory) return false;
      return true;
    });
    const idMap = new Map<string, Artwork>();
    for (const a of staticOnes) idMap.set(a.id, a);
    for (const a of dynamicOnes) idMap.set(a.id, a);
    const unsorted = Array.from(idMap.values());

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
    setDynamicArtworks((prev) => prev.map((a) => (a.id === artwork.id ? artwork : a)));
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
                          onClick={() => setSelectedArtwork(artwork)}
                        />
                      </SortableArtworkCard>
                    ))}
                    <AddArtworkTile
                      index={mergedArtworks.length}
                      onClick={() => setShowAddModal(true)}
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
                    onClick={() => setSelectedArtwork(artwork)}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {selectedArtwork && (
        <ArtworkModal
          artwork={selectedArtwork}
          onClose={() => setSelectedArtwork(null)}
          onEdit={() => {
            setEditingArtwork(selectedArtwork);
            setSelectedArtwork(null);
          }}
        />
      )}

      <AnimatePresence>
        {showAddModal && activeGrid && (
          <ArtworkFormModal
            category={activeGrid.category}
            subcategory={activeGrid.subcategory}
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
