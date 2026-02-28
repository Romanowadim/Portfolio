"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Artwork } from "@/data/artworks";

type Props = {
  artwork: Artwork;
  onClose: () => void;
};

export default function ArtworkModal({ artwork, onClose }: Props) {
  const locale = useLocale() as "ru" | "en";
  const t = useTranslations("portfolio");
  const [showSketch, setShowSketch] = useState(false);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const imageSrc = showSketch && artwork.sketch ? artwork.sketch : artwork.image;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative max-w-5xl w-full max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute -top-10 right-0 text-white/80 hover:text-white text-sm tracking-wider"
          >
            ✕ CLOSE
          </button>

          {/* Image */}
          <div className="relative w-full flex-1 min-h-0 aspect-[4/3]">
            <Image
              src={imageSrc}
              alt={artwork.title[locale]}
              fill
              className="object-contain"
              sizes="90vw"
            />
          </div>

          {/* Bottom bar */}
          <div className="flex items-center justify-between mt-4">
            <h3 className="text-white text-sm tracking-[0.15em]">
              {artwork.title[locale]}
            </h3>
            {artwork.sketch && (
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSketch(false)}
                  className={`text-xs tracking-wider px-3 py-1 rounded transition-colors ${
                    !showSketch
                      ? "bg-white text-black"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  {t("final")}
                </button>
                <button
                  onClick={() => setShowSketch(true)}
                  className={`text-xs tracking-wider px-3 py-1 rounded transition-colors ${
                    showSketch
                      ? "bg-white text-black"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  {t("sketch")}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
