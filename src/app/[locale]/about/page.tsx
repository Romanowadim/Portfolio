"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import SocialLinks from "@/components/layout/SocialLinks";

const programs = [
  { name: "Photoshop", icon: "/images/programs/photoshop.png" },
  { name: "Illustrator", icon: "/images/programs/illustrator.png" },
  { name: "Animate", icon: "/images/programs/animate.png" },
  { name: "Figma", icon: "/images/programs/figma.png" },
  { name: "Procreate", icon: "/images/programs/procreate.png" },
];

export default function AboutPage() {
  const t = useTranslations("about");

  return (
    <div className="relative z-10 flex flex-col h-full py-6 lg:py-0">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col gap-[40px] my-auto"
      >
        {/* MAIN section */}
        <section>
          <h2 className="text-[14px] font-bold tracking-[3.2px] text-text-muted uppercase mb-4">
            {t("main")}
          </h2>
          <p className="text-[14px] font-medium leading-[20px] text-[#787878] max-w-[380px]">
            {t("bio")}
          </p>
        </section>

        {/* EDUCATION section */}
        <section>
          <h2 className="text-[14px] font-bold tracking-[3.2px] text-text-muted uppercase mb-4">
            {t("education")}
          </h2>
          <p className="text-[14px] font-medium leading-[20px] text-[#787878] max-w-[380px]">
            {t("educationText")}
          </p>
        </section>

        {/* PROGRAMS section */}
        <section>
          <h2 className="text-[14px] font-bold tracking-[2.8px] text-text-muted uppercase mb-4">
            {t("programs")}
          </h2>
          <p className="text-[14px] font-medium leading-[20px] text-[#787878] mb-6">
            {t("programsText")}
          </p>
          <div className="flex items-center gap-[35px]">
            {programs.map((p) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={p.name}
                src={p.icon}
                alt={p.name}
                className="w-[35px] h-[35px] object-contain"
              />
            ))}
          </div>
        </section>

        {/* Social links — animated drop-down */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="mt-4"
        >
          <SocialLinks />
        </motion.div>
      </motion.div>
    </div>
  );
}
