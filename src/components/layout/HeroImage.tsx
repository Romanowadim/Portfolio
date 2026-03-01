"use client";

import Image from "next/image";
import { motion } from "framer-motion";

export default function HeroImage() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="hidden lg:block absolute top-[-17vh] right-0 w-[55.8%] h-[172vh] pointer-events-none"
    >
      <Image
        src="/images/hero.png"
        alt="Character illustration"
        fill
        className="object-cover"
        priority
      />
    </motion.div>
  );
}
