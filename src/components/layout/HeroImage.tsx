"use client";

import Image from "next/image";
import { motion } from "framer-motion";

export default function HeroImage() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="hidden lg:flex items-center justify-center h-full"
    >
      <div className="relative w-full max-w-[600px] aspect-[3/4]">
        <Image
          src="/images/hero.png"
          alt="Character illustration"
          fill
          className="object-contain"
          priority
        />
      </div>
    </motion.div>
  );
}
