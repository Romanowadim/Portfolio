"use client";

import { useRef, useState, useEffect, useCallback, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
};

export default function HorizontalCarousel({ children, className = "" }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);

  const checkArrows = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    setShowLeft(el.scrollLeft > 4);
    setShowRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    checkArrows();
    const ro = new ResizeObserver(checkArrows);
    ro.observe(el);
    el.addEventListener("scroll", checkArrows, { passive: true });
    return () => {
      ro.disconnect();
      el.removeEventListener("scroll", checkArrows);
    };
  }, [checkArrows, children]);

  const scroll = (dir: -1 | 1) => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.6, behavior: "smooth" });
  };

  const arrowClass =
    "absolute top-1/2 -translate-y-1/2 z-10 w-[32px] h-[32px] flex items-center justify-center bg-white/90 shadow-[0_1px_6px_rgba(0,0,0,0.12)] text-text-muted hover:text-text transition-all cursor-pointer";

  return (
    <div className={`relative group/carousel ${className}`}>
      {showLeft && (
        <button
          onClick={() => scroll(-1)}
          className={`${arrowClass} left-0`}
        >
          <svg width="10" height="16" viewBox="0 0 10 16" fill="none">
            <path d="M9 1L2 8L9 15" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
      )}
      {showRight && (
        <button
          onClick={() => scroll(1)}
          className={`${arrowClass} right-0`}
        >
          <svg width="10" height="16" viewBox="0 0 10 16" fill="none">
            <path d="M1 1L8 8L1 15" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
      )}
      <div
        ref={containerRef}
        className="flex gap-2 overflow-x-hidden"
      >
        {children}
      </div>
    </div>
  );
}
