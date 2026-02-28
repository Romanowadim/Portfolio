"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { equipment } from "@/data/equipment";
import EquipmentCard from "@/components/equipment/EquipmentCard";

export default function EquipmentPage() {
  const t = useTranslations("equipment");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-8"
    >
      <h1 className="text-2xl md:text-3xl font-bold tracking-[0.2em]">
        {t("heading")}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {equipment.map((item, i) => (
          <EquipmentCard key={item.id} equipment={item} index={i} />
        ))}
      </div>
    </motion.div>
  );
}
