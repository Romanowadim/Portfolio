"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { href: "/about", key: "about" },
  { href: "/portfolio", key: "portfolio" },
  { href: "/equipment", key: "equipment" },
  { href: "/order", key: "order" },
] as const;

export default function Header() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-bg/80 backdrop-blur-md">
      <div className="max-w-[1920px] mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
        <Link href="/" className="text-lg font-bold tracking-[0.2em] uppercase">
          VR
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.key}
                href={item.href}
                className={`text-xs tracking-[0.15em] uppercase transition-colors ${
                  isActive
                    ? "text-text font-semibold"
                    : "text-text-secondary hover:text-text"
                }`}
              >
                {t(item.key)}
              </Link>
            );
          })}
          <LanguageSwitcher />
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex flex-col gap-1.5 p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <span className={`w-5 h-0.5 bg-text transition-transform ${mobileMenuOpen ? "rotate-45 translate-y-2" : ""}`} />
          <span className={`w-5 h-0.5 bg-text transition-opacity ${mobileMenuOpen ? "opacity-0" : ""}`} />
          <span className={`w-5 h-0.5 bg-text transition-transform ${mobileMenuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.nav
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden bg-bg border-t border-border px-6 py-4 flex flex-col gap-4"
          >
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`text-sm tracking-[0.15em] uppercase ${
                    isActive ? "text-text font-semibold" : "text-text-secondary"
                  }`}
                >
                  {t(item.key)}
                </Link>
              );
            })}
            <LanguageSwitcher />
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
