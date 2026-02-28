"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("language");

  const switchLocale = (newLocale: "ru" | "en") => {
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <div className="flex items-center gap-1 text-xs tracking-wider">
      <button
        onClick={() => switchLocale("ru")}
        className={`px-1.5 py-0.5 transition-colors ${
          locale === "ru" ? "text-text font-bold" : "text-text-secondary hover:text-text"
        }`}
      >
        {t("ru")}
      </button>
      <span className="text-border">/</span>
      <button
        onClick={() => switchLocale("en")}
        className={`px-1.5 py-0.5 transition-colors ${
          locale === "en" ? "text-text font-bold" : "text-text-secondary hover:text-text"
        }`}
      >
        {t("en")}
      </button>
    </div>
  );
}
