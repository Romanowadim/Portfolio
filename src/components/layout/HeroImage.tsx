"use client";

import { motion } from "framer-motion";
import { usePathname } from "@/i18n/navigation";
import { usePortfolioPreview } from "@/components/portfolio/PortfolioPreviewContext";

const ease = [0.4, 0, 0.2, 1] as [number, number, number, number];
const transition = { duration: 0.7, ease };

const variants = {
  home: { top: "-8vh", width: "52vw", right: "0vw" },
  about: { top: "-40vh", width: "76vw", right: "-12vw" },
  order: { top: "-8vh", width: "52vw", right: "-8.3vw" },
};

const imgVariants = {
  home: { filter: "brightness(1.13) saturate(0.85)" },
  about: { filter: "brightness(1) saturate(1) contrast(1)" },
  order: { filter: "brightness(1.13) saturate(0.85)" },
};

export default function HeroImage({ isFadingOut, heroImage }: { isFadingOut: boolean; heroImage?: string }) {
  const pathname = usePathname();
  const isAbout = pathname === "/about";
  const isOrder = pathname === "/order";

  // Subscribe to portfolio preview context so this component re-renders when
  // a category is selected/deselected — that re-evaluation makes skipEntry
  // pick up the updated URL (pushState is called synchronously before state changes).
  usePortfolioPreview();

  // Synchronously check if URL has ?artwork= or ?c= — computed before Framer Motion reads `initial`.
  // When the modal/category closes, the URL is cleaned and React re-renders, so skipEntry becomes
  // false and the hero image fades in normally.
  const skipEntry = typeof window !== "undefined" && (
    new URLSearchParams(window.location.search).has("artwork") ||
    new URLSearchParams(window.location.search).has("c")
  );

  const variant = isAbout ? "about" : isOrder ? "order" : "home";
  // Keep "about" position during fade-out so it doesn't slide to "home"
  const positionVariant = isFadingOut ? "about" : variant;

  return (
    <motion.div
      initial={{ opacity: 0, x: skipEntry ? 0 : 40, ...variants[variant] }}
      animate={{
        opacity: isFadingOut || skipEntry ? 0 : 1,
        x: 0,
        ...variants[positionVariant],
      }}
      transition={transition}
      className="hidden lg:block absolute bottom-0 z-0 pointer-events-none"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <motion.img
        src={heroImage || "/images/hero.png"}
        alt="Character illustration"
        initial={imgVariants[variant]}
        animate={imgVariants[isFadingOut ? "about" : variant]}
        transition={transition}
        className="absolute inset-0 w-full h-full object-cover object-top"
      />
    </motion.div>
  );
}
