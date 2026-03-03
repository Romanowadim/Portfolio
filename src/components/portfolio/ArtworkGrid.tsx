"use client";

import Image from "next/image";
import { useState } from "react";
import { useLocale } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Artwork } from "@/data/artworks";
import { useAdmin } from "@/components/admin/AdminProvider";
import ArtworkModal from "./ArtworkModal";
import ArtworkFormModal from "@/components/admin/ArtworkFormModal";

type Props = {
  artworks: Artwork[];
};

export default function ArtworkGrid({ artworks }: Props) {
  const locale = useLocale() as "ru" | "en";
  const { isAdmin } = useAdmin();
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);
  const [editingArtwork, setEditingArtwork] = useState<Artwork | null>(null);

  if (artworks.length === 0) {
    return (
      <p className="text-text-secondary text-sm tracking-wider">
        {locale === "ru" ? "Работы скоро появятся" : "Artworks coming soon"}
      </p>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {artworks.map((artwork, i) => (
          <motion.button
            key={artwork.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => setSelectedArtwork(artwork)}
            className="group relative aspect-square overflow-hidden rounded bg-bg-dark"
          >
            <Image
              src={artwork.image}
              alt={artwork.title[locale]}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-end p-2">
              <span className="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity tracking-wider">
                {artwork.title[locale]}
              </span>
            </div>
          </motion.button>
        ))}
      </div>

      {selectedArtwork && (
        <ArtworkModal
          artwork={selectedArtwork}
          onClose={() => setSelectedArtwork(null)}
          onEdit={isAdmin ? () => {
            setEditingArtwork(selectedArtwork);
            setSelectedArtwork(null);
          } : undefined}
        />
      )}

      <AnimatePresence>
        {editingArtwork && (
          <ArtworkFormModal
            category={editingArtwork.category}
            subcategory={editingArtwork.subcategory}
            artwork={editingArtwork}
            onClose={() => setEditingArtwork(null)}
            onSaved={() => setEditingArtwork(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
