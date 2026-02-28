"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Equipment } from "@/data/equipment";

type Props = {
  equipment: Equipment;
  index: number;
};

export default function EquipmentCard({ equipment, index }: Props) {
  const t = useTranslations("equipment");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white rounded-lg p-4 flex flex-col"
    >
      <div className="relative w-full aspect-[4/3] mb-4 bg-bg rounded overflow-hidden">
        <Image
          src={equipment.image}
          alt={equipment.name}
          fill
          className="object-contain p-4"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>

      <p className="text-[10px] text-text-secondary tracking-wider uppercase mb-1">
        {equipment.brand}
      </p>
      <h3 className="text-sm font-bold tracking-[0.1em] mb-3">
        {equipment.name}
      </h3>

      <div className="flex flex-col gap-1.5 mt-auto">
        {equipment.specs.map((spec) => (
          <div key={spec.key} className="flex justify-between text-xs">
            <span className="text-text-secondary">{t(spec.key)}</span>
            <span className="font-medium">{spec.value}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
