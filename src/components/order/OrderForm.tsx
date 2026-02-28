"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";

export default function OrderForm() {
  const t = useTranslations("order");
  const [submitted, setSubmitted] = useState(false);

  const serviceKeys = ["illustration", "logo", "concept", "banner", "other"] as const;

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-start gap-2"
      >
        <h2 className="text-2xl font-bold tracking-[0.15em]">{t("success")}</h2>
        <p className="text-text-secondary text-sm">{t("successMessage")}</p>
      </motion.div>
    );
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitted(true);
      }}
      className="flex flex-col gap-5 max-w-md"
    >
      <div className="flex flex-col gap-1.5">
        <label className="text-xs tracking-[0.15em] uppercase text-text-secondary">
          {t("name")}
        </label>
        <input
          type="text"
          required
          className="bg-white border border-border rounded px-3 py-2.5 text-sm outline-none focus:border-text transition-colors"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs tracking-[0.15em] uppercase text-text-secondary">
          {t("email")}
        </label>
        <input
          type="email"
          required
          className="bg-white border border-border rounded px-3 py-2.5 text-sm outline-none focus:border-text transition-colors"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs tracking-[0.15em] uppercase text-text-secondary">
          {t("service")}
        </label>
        <select
          required
          className="bg-white border border-border rounded px-3 py-2.5 text-sm outline-none focus:border-text transition-colors"
        >
          <option value="">—</option>
          {serviceKeys.map((key) => (
            <option key={key} value={key}>
              {t(`services.${key}`)}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs tracking-[0.15em] uppercase text-text-secondary">
          {t("description")}
        </label>
        <textarea
          required
          rows={4}
          className="bg-white border border-border rounded px-3 py-2.5 text-sm outline-none focus:border-text transition-colors resize-none"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs tracking-[0.15em] uppercase text-text-secondary">
          {t("budget")}
        </label>
        <input
          type="text"
          className="bg-white border border-border rounded px-3 py-2.5 text-sm outline-none focus:border-text transition-colors"
        />
      </div>

      <button
        type="submit"
        className="mt-2 bg-text text-bg text-xs tracking-[0.2em] uppercase font-semibold px-6 py-3 rounded hover:bg-accent transition-colors"
      >
        {t("submit")}
      </button>
    </motion.form>
  );
}
