"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { getArtworksByCategory, Artwork } from "@/data/artworks";
import ArtworkModal from "@/components/portfolio/ArtworkModal";
import { useAdmin } from "@/components/admin/AdminProvider";
import AddArtworkTile from "@/components/admin/AddArtworkTile";
import AddArtworkModal from "@/components/admin/AddArtworkModal";

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
  const [dynamicArtworks, setDynamicArtworks] = useState<Artwork[]>([]);

  // Fetch dynamic artworks
  useEffect(() => {
    fetch("/api/artworks")
      .then((r) => r.json())
      .then((data: Artwork[]) => setDynamicArtworks(data))
      .catch(() => {});
  }, []);

  const showPreview = hoveredCategory && !activeGrid && !expanded;

  // Merge static + dynamic artworks
  const mergedArtworks = (() => {
    if (!activeGrid) return [];
    const staticOnes = getArtworksByCategory(activeGrid.category, activeGrid.subcategory);
    const dynamicOnes = dynamicArtworks.filter((a) => {
      if (a.category !== activeGrid.category) return false;
      if (activeGrid.subcategory && a.subcategory !== activeGrid.subcategory) return false;
      return true;
    });
    // Dynamic artworks with same id override static
    const idMap = new Map<string, Artwork>();
    for (const a of staticOnes) idMap.set(a.id, a);
    for (const a of dynamicOnes) idMap.set(a.id, a);
    return Array.from(idMap.values());
  })();

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
            <div className="grid grid-cols-4 gap-[24px]">
              {mergedArtworks.map((artwork, i) => (
                <motion.button
                  key={artwork.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.03, duration: 0.3 }}
                  onClick={() => setSelectedArtwork(artwork)}
                  className="group relative aspect-square overflow-hidden bg-[#e0e0e0]"
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
              ))}
              {isAdmin && (
                <AddArtworkTile
                  index={mergedArtworks.length}
                  onClick={() => setShowAddModal(true)}
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {selectedArtwork && (
        <ArtworkModal
          artwork={selectedArtwork}
          onClose={() => setSelectedArtwork(null)}
        />
      )}

      <AnimatePresence>
        {showAddModal && activeGrid && (
          <AddArtworkModal
            category={activeGrid.category}
            subcategory={activeGrid.subcategory}
            onClose={() => setShowAddModal(false)}
            onSaved={handleArtworkAdded}
          />
        )}
      </AnimatePresence>
    </>
  );
}
