"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";

const programs = [
  { name: "Photoshop", fullName: "Adobe Photoshop", experience: "11 years of experience", icon: "/images/programs/photoshop.svg", className: "w-[35px] h-[35px]", gap: "" },
  { name: "Illustrator", fullName: "Adobe Illustrator", experience: "3 years of experience", icon: "/images/programs/illustrator.svg", className: "w-[35px] h-[35px]", gap: "" },
  { name: "Animate", fullName: "Adobe Animate", experience: "7 years of experience", icon: "/images/programs/animate.svg", className: "w-[35px] h-[35px]", gap: "" },
  { name: "Figma", fullName: "Figma", experience: "3 years of experience", icon: "/images/programs/figma.png", className: "w-[43px] h-[43px]", gap: "-m-1" },
  { name: "Procreate", fullName: "Procreate", experience: "5 years of experience", icon: "/images/programs/procreate.png", className: "w-[35px] h-[35px]", gap: "" },
];

export default function AboutPage() {
  const t = useTranslations("about");
  const [hoveredProgram, setHoveredProgram] = useState<string | null>(null);

  const sectionTransition = (enterDelay: number, exitDelay: number) => ({
    initial: { opacity: 0, y: 15 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, delay: enterDelay, ease: "easeOut" as const },
    },
    exit: {
      opacity: 0,
      y: 15,
      transition: { duration: 0.3, delay: exitDelay, ease: "easeIn" as const },
    },
  });

  return (
    <div className="relative z-10 flex flex-col h-full py-6 lg:py-0">
      {/* Centered content */}
      <div className="flex-1 flex items-center">
        <div className="flex flex-col gap-[46px]">
          {/* MAIN — enters first (0.15s), exits last (0.2s delay) */}
          <motion.section {...sectionTransition(0.15, 0.2)}>
            <h2 className="text-[14px] font-bold tracking-[3.2px] text-text-muted uppercase mb-4">
              {t("main")}
            </h2>
            <p className="text-[14px] font-medium leading-[20px] text-[#787878] max-w-[380px]">
              {t("bio")}
            </p>
          </motion.section>

          {/* EDUCATION — enters second (0.35s), exits second (0.1s delay) */}
          <motion.section {...sectionTransition(0.35, 0.1)}>
            <h2 className="text-[14px] font-bold tracking-[3.2px] text-text-muted uppercase mb-4">
              {t("education")}
            </h2>
            <p className="text-[14px] font-medium leading-[20px] text-[#787878] max-w-[380px]">
              {t("educationText")}
            </p>
          </motion.section>

          {/* PROGRAMS — enters last (0.55s), exits first (0s delay) */}
          <motion.section {...sectionTransition(0.55, 0)}>
            <h2 className="text-[14px] font-bold tracking-[2.8px] text-text-muted uppercase mb-4">
              {t("programs")}
            </h2>
            <p className="text-[14px] font-medium leading-[20px] text-[#787878] mb-[35px]">
              {t("programsText")}
            </p>
            <div className="flex items-center gap-[35px]">
              {programs.map((p) => (
                <div
                  key={p.name}
                  className={`relative ${p.gap}`}
                  onMouseEnter={() => setHoveredProgram(p.name)}
                  onMouseLeave={() => setHoveredProgram(null)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.icon}
                    alt={p.name}
                    className={`${p.className} object-contain cursor-pointer`}
                  />
                  <AnimatePresence>
                    {hoveredProgram === p.name && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="absolute z-50 w-[209px] rounded-[13px] bg-white shadow-[0px_1px_10px_0px_rgba(0,0,0,0.1)] pointer-events-none"
                        style={{ left: -13, top: -14 }}
                      >
                        <div className="flex items-center gap-3 px-[13px] pt-[14px] pb-[13px]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={p.icon}
                            alt=""
                            className={`${p.className} object-contain shrink-0`}
                          />
                          <span className="text-[14px] text-[#7f7f7f] leading-[20px] font-semibold">
                            {p.fullName}
                          </span>
                        </div>
                        <div className="h-px bg-[#e8e8e8] mx-[11px]" />
                        <p className="text-[12px] text-[#7f7f7f] leading-[15.5px] text-center py-[10px]">
                          {p.experience}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </motion.section>

          {/* Spacer — maintains content height for centering (SocialLinks rendered in MainContent) */}
          <div className="mt-[110px] h-5" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
