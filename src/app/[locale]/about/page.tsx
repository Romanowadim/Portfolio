"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import SocialLinks from "@/components/layout/SocialLinks";

const programs = [
  { name: "Photoshop", abbr: "PS" },
  { name: "Illustrator", abbr: "AI" },
  { name: "Animate", abbr: "AN" },
  { name: "Figma", abbr: "FG" },
  { name: "Procreate", abbr: "PR" },
];

export default function AboutPage() {
  const t = useTranslations("about");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-10"
    >
      <h1 className="text-2xl md:text-3xl font-bold tracking-[0.2em]">
        {t("heading")}
      </h1>

      {/* Main bio */}
      <section>
        <h2 className="text-xs font-bold tracking-[0.2em] text-text-secondary mb-3">
          {t("main")}
        </h2>
        <p className="text-sm leading-relaxed text-text/80">
          {t("bio")}
        </p>
        <p className="text-xs text-text-secondary mt-2 tracking-wider">
          {t("experience")}
        </p>
      </section>

      {/* Education */}
      <section>
        <h2 className="text-xs font-bold tracking-[0.2em] text-text-secondary mb-3">
          {t("education")}
        </h2>
        <p className="text-sm text-text/80">{t("educationText")}</p>
      </section>

      {/* Programs */}
      <section>
        <h2 className="text-xs font-bold tracking-[0.2em] text-text-secondary mb-4">
          {t("programs")}
        </h2>
        <div className="flex flex-wrap gap-3">
          {programs.map((prog) => (
            <div
              key={prog.abbr}
              className="w-14 h-14 rounded-lg bg-white flex items-center justify-center text-xs font-bold tracking-wider text-text-secondary border border-border"
              title={prog.name}
            >
              {prog.abbr}
            </div>
          ))}
        </div>
      </section>

      <div className="mt-auto pt-6">
        <SocialLinks />
      </div>
    </motion.div>
  );
}
