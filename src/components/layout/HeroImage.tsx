"use client";

import { motion } from "framer-motion";
import { usePathname } from "@/i18n/navigation";

const transition = {
  duration: 0.7,
  ease: [0.4, 0, 0.2, 1] as [number, number, number, number],
};

const variants = {
  home: {
    top: "-8vh",
    width: "52vw",
  },
  about: {
    top: "-40vh",
    width: "76vw",
  },
};

const imgVariants = {
  home: {
    filter: "brightness(1.13) saturate(0.85)",
  },
  about: {
    filter: "brightness(1.2) saturate(1.15)",
  },
};

export default function HeroImage() {
  const pathname = usePathname();
  const isAbout = pathname === "/about";
  const variant = isAbout ? "about" : "home";

  return (
    <motion.div
      initial={{ opacity: 0, x: 40, ...variants[variant] }}
      animate={{ opacity: 1, x: 0, ...variants[variant] }}
      transition={transition}
      className="hidden lg:block absolute bottom-0 right-0 z-0 pointer-events-none"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <motion.img
        src="/images/hero.png"
        alt="Character illustration"
        initial={imgVariants[variant]}
        animate={imgVariants[variant]}
        transition={transition}
        className="absolute inset-0 w-full h-full object-cover object-top"
      />
    </motion.div>
  );
}
