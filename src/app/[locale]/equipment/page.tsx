"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useLocale } from "next-intl";
import { motion } from "framer-motion";
import { type Equipment, equipmentName, specValue } from "@/data/equipment";

function localizeValue(value: string, locale: string) {
  if (locale !== "ru") return value;
  return value.replace(/\bGHz\b/g, "ГГц").replace(/\bGb\b/g, "Гб");
}

export default function EquipmentPage() {
  const locale = useLocale();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/equipment")
      .then((r) => r.json())
      .then((data: Equipment[]) => { if (Array.isArray(data)) setEquipment(data); })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);

  const checkArrows = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setShowLeft(el.scrollLeft > 4);
    setShowRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkArrows();
    const ro = new ResizeObserver(checkArrows);
    ro.observe(el);
    el.addEventListener("scroll", checkArrows, { passive: true });
    return () => { ro.disconnect(); el.removeEventListener("scroll", checkArrows); };
  }, [checkArrows, equipment]);

  const scroll = (dir: -1 | 1) => {
    const el = scrollRef.current;
    if (!el) return;
    // Scroll by full view (4 cards at a time)
    el.scrollBy({ left: dir * el.clientWidth, behavior: "smooth" });
  };

  if (!loaded) {
    return (
      <div className="flex flex-col h-[calc(100vh-148px)] items-center justify-center">
        <span className="text-text-light text-sm animate-pulse">...</span>
      </div>
    );
  }

  const arrowClass =
    "absolute top-1/2 -translate-y-1/2 z-10 w-[44px] h-[44px] flex items-center justify-center text-text-light hover:text-text-muted transition-colors cursor-pointer";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col h-[calc(100vh-148px)] justify-center px-6 md:px-10 lg:px-[7.71vw]"
    >
      <div className="relative">
        {/* Left arrow */}
        {showLeft && (
          <button onClick={() => scroll(-1)} className={`${arrowClass} left-[-60px]`}>
            <svg width="12" height="20" viewBox="0 0 12 20" fill="none">
              <path d="M11 1L2 10L11 19" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
        )}
        {/* Right arrow */}
        {showRight && (
          <button onClick={() => scroll(1)} className={`${arrowClass} right-[-60px]`}>
            <svg width="12" height="20" viewBox="0 0 12 20" fill="none">
              <path d="M1 1L10 10L1 19" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
        )}

        {/* Scrollable row */}
        <div
          ref={scrollRef}
          className="flex gap-8 lg:gap-[10.5vw] overflow-x-hidden"
        >
          {equipment.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.12, duration: 0.5, ease: "easeOut" }}
              className="flex flex-col w-[calc(25%-7.875vw)] shrink-0"
            >
              {/* Device image */}
              <div className="relative w-full aspect-square overflow-hidden flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.image}
                  alt={equipmentName(item, locale)}
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Brand icon */}
              <div className="h-[60px] flex items-center mb-[2px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.brandIcon}
                  alt=""
                  className="h-[18px] w-auto object-contain"
                />
              </div>

              {/* Device name */}
              <h3 className="text-[14px] font-bold tracking-[3.2px] text-[#808080] leading-[20px] mb-5">
                {equipmentName(item, locale)}
              </h3>

              {/* Specs */}
              <div className="flex flex-col gap-0">
                {item.specs.map((spec) => (
                  <div
                    key={spec.key}
                    className="flex text-[14px] font-medium text-[#969696] leading-[20px]"
                  >
                    <span className="shrink-0 mr-3">
                      {spec.key}
                    </span>
                    <span>{localizeValue(specValue(spec.value, locale), locale)}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
