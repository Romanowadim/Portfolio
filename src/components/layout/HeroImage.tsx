"use client";

import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { usePathname } from "@/i18n/navigation";

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

export default function HeroImage() {
  const pathname = usePathname();
  const prevPathnameRef = useRef(pathname);

  const isAbout = pathname === "/about";
  const isHome = pathname === "/";
  const isOrder = pathname === "/order";
  const wasAbout = prevPathnameRef.current === "/about";

  // About → non-Home/Order: fade out in place instead of animating position
  const isFadingOut = wasAbout && !isAbout && !isHome && !isOrder;

  // Update ref in effect so strict mode double-render doesn't break detection
  useEffect(() => { prevPathnameRef.current = pathname; }, [pathname]);

  const variant = isAbout ? "about" : isOrder ? "order" : "home";
  // Keep "about" position during fade-out so it doesn't slide to "home"
  const positionVariant = isFadingOut ? "about" : variant;

  return (
    <motion.div
      initial={{ opacity: 0, x: 40, ...variants[variant] }}
      animate={{
        opacity: isFadingOut ? 0 : 1,
        x: 0,
        ...variants[positionVariant],
      }}
      transition={transition}
      className="hidden lg:block absolute bottom-0 z-0 pointer-events-none"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <motion.img
        src="/images/hero.png"
        alt="Character illustration"
        initial={imgVariants[variant]}
        animate={imgVariants[isFadingOut ? "about" : variant]}
        transition={transition}
        className="absolute inset-0 w-full h-full object-cover object-top"
      />
    </motion.div>
  );
}
