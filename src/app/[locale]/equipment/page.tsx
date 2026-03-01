"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { equipment } from "@/data/equipment";

export default function EquipmentPage() {
  const t = useTranslations("equipment");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col h-[calc(100vh-148px)] px-6 md:px-10 lg:px-[5.7vw]"
    >
      {/* Equipment grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6 flex-1">
        {equipment.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.12, duration: 0.5, ease: "easeOut" }}
            className="flex flex-col"
          >
            {/* Device image */}
            <div className="flex items-end justify-center h-[220px] lg:h-[calc(50vh-90px)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.image}
                alt={item.name}
                className="max-h-full max-w-full object-contain"
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
                  <span>{spec.value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
