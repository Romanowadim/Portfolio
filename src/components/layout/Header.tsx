"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import { useAdmin } from "@/components/admin/AdminProvider";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

const navItems = [
  { href: "/about", key: "about" },
  { href: "/portfolio", key: "portfolio" },
  { href: "/equipment", key: "equipment" },
  { href: "/order", key: "order" },
] as const;

export default function Header() {
  const t = useTranslations("nav");
  const tAdmin = useTranslations("admin");
  const pathname = usePathname();
  const { isAdmin, logout } = useAdmin();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
      <div className="px-6 md:px-10 lg:pl-[3.33vw] lg:pr-0 h-20 lg:h-[148px] flex items-center pointer-events-auto">
        {/* Logo */}
        <Link href="/" className="shrink-0 mr-6 lg:mr-[calc(4.38vw_-_17px)]">
          <Image
            src="/images/logo.svg"
            alt="VR"
            width={17}
            height={56}
            className="h-[40px] lg:h-[56px] w-auto opacity-50 hover:opacity-100 transition-opacity"
          />
        </Link>

        {/* Desktop nav — next to logo */}
        <nav className="hidden md:flex items-center gap-[30px]">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.key}
                href={item.href}
                className={`text-[14px] tracking-wide transition-colors ${
                  isActive
                    ? "text-text-muted"
                    : "text-text-light hover:text-text-muted"
                }`}
              >
                {t(item.key)}
              </Link>
            );
          })}
          {isAdmin && (
            <button
              onClick={logout}
              className="text-[12px] tracking-wide text-[#c0c0c0] hover:text-text-muted transition-colors opacity-60 hover:opacity-100"
            >
              {tAdmin("logout")}
            </button>
          )}
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden ml-auto flex flex-col gap-1.5 p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <span className={`w-5 h-0.5 bg-text-muted transition-transform ${mobileMenuOpen ? "rotate-45 translate-y-2" : ""}`} />
          <span className={`w-5 h-0.5 bg-text-muted transition-opacity ${mobileMenuOpen ? "opacity-0" : ""}`} />
          <span className={`w-5 h-0.5 bg-text-muted transition-transform ${mobileMenuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
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
                    isActive ? "text-text-muted font-semibold" : "text-text-light"
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
