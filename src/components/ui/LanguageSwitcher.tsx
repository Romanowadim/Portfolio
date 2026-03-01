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
    <div className="flex items-center gap-1 text-[14px] tracking-wide">
      <button
        onClick={() => switchLocale("ru")}
        className={`px-1.5 py-0.5 transition-colors cursor-pointer ${
          locale === "ru" ? "text-text-muted font-semibold" : "text-text-light hover:text-text-muted"
        }`}
      >
        {t("ru")}
      </button>
      <span className="text-text-light">/</span>
      <button
        onClick={() => switchLocale("en")}
        className={`px-1.5 py-0.5 transition-colors cursor-pointer ${
          locale === "en" ? "text-text-muted font-semibold" : "text-text-light hover:text-text-muted"
        }`}
      >
        {t("en")}
      </button>
    </div>
  );
}
