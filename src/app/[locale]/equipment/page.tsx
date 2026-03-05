"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { motion } from "framer-motion";
import type { Equipment } from "@/data/equipment";

function localizeValue(value: string, locale: string) {
  if (locale !== "ru") return value;
  return value.replace(/\bGHz\b/g, "ГГц").replace(/\bGb\b/g, "Гб");
}

export default function EquipmentPage() {
  const t = useTranslations("equipment");
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

  if (!loaded) {
    return (
      <div className="flex flex-col h-[calc(100vh-148px)] items-center justify-center">
        <span className="text-text-light text-sm animate-pulse">...</span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col h-[calc(100vh-148px)] px-6 md:px-10 lg:px-[7.71vw] lg:pb-[calc((100vh-778px)/4+20px)]"
    >
      {/* Equipment grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-[10.5vw] flex-1 content-center">
        {equipment.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.12, duration: 0.5, ease: "easeOut" }}
            className="flex flex-col"
          >
            {/* Device image */}
            <div className="relative w-full aspect-square overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.image}
                alt={item.name}
                className="absolute max-w-none"
                style={{
                  width: item.imagePos.width,
                  height: item.imagePos.height,
                  left: item.imagePos.left,
                  top: item.imagePos.top,
                }}
              />
            </div>

            {/* Brand icon */}
            <div className="h-[60px] flex items-center mb-[2px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.brandIcon}
                alt=""
                className={
                  item.id === "wacom"
                    ? "h-[60px] w-auto object-contain"
                    : "h-[18px] w-auto object-contain"
                }
              />
            </div>

            {/* Device name */}
            <h3 className="text-[14px] font-bold tracking-[3.2px] text-[#808080] leading-[20px] mb-5">
              {item.name}
            </h3>

            {/* Specs */}
            <div className="flex flex-col gap-0">
              {item.specs.map((spec) => (
                <div
                  key={spec.key}
                  className="flex text-[14px] font-medium text-[#969696] leading-[20px]"
                >
                  <span
                    className="shrink-0"
                    style={{ width: item.specKeyWidth }}
                  >
                    {t(spec.key)}
                  </span>
                  <span>{localizeValue(spec.value, locale)}</span>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
