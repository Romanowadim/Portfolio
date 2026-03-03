"use client";

import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import WhitePanel from "@/components/layout/WhitePanel";
import dynamic from "next/dynamic";
const HeroImage = dynamic(() => import("@/components/layout/HeroImage"), { ssr: false });
import ArtworkLabel from "@/components/layout/ArtworkLabel";
import PageTransition from "@/components/layout/PageTransition";
import SocialLinks from "@/components/layout/SocialLinks";
import { PortfolioPreviewProvider } from "@/components/portfolio/PortfolioPreviewContext";

export default function MainContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const t = useTranslations("hero");
  const isFullWidth = pathname === "/equipment";
  const showSocial = pathname === "/" || pathname === "/about" || pathname === "/equipment" || pathname === "/order" || pathname.startsWith("/portfolio");
  const showHeroName = pathname === "/" || pathname === "/order";

  const isOrder = pathname === "/order";
  const isAbout = pathname === "/about";
  const isHome = pathname === "/";
  const isPortfolio = pathname.startsWith("/portfolio");
  const isCabinet = pathname === "/cabinet";
  const [showFullWidth, setShowFullWidth] = useState(isFullWidth);
  const [isOrderLayout, setIsOrderLayout] = useState(isOrder);
  const prevPathnameRef = useRef(pathname);

  const isFadingOut = prevPathnameRef.current === "/about" && !isAbout && !isHome && !isOrder && !isPortfolio;

  useEffect(() => {
    const prevPathname = prevPathnameRef.current;

    if (isFullWidth) {
      if (prevPathname === "/about") {
        const timer = setTimeout(() => setShowFullWidth(true), 550);
        return () => clearTimeout(timer);
      }
      setShowFullWidth(true);
    } else {
      const timer = setTimeout(() => setShowFullWidth(false), 550);
      return () => clearTimeout(timer);
    }
  }, [isFullWidth, pathname]);

  useEffect(() => {
    const prevPathname = prevPathnameRef.current;

    if (isOrder) {
      if (prevPathname === "/about") {
        // From About: delay so staggered section exits play before layout shifts
        const timer = setTimeout(() => setIsOrderLayout(true), 550);
        return () => clearTimeout(timer);
      }
      setIsOrderLayout(true);
    } else {
      // Delay layout reset so Order exit animation plays in place
      const timer = setTimeout(() => setIsOrderLayout(false), 550);
      return () => clearTimeout(timer);
    }
  }, [isOrder, pathname]);

  // Update prev pathname ref LAST so both effects above can read the previous value
  useEffect(() => {
    prevPathnameRef.current = pathname;
  }, [pathname]);

  return (
    <PortfolioPreviewProvider>
      {showFullWidth ? (
        <div className="min-h-screen relative">
          <main className="relative w-full min-h-screen pt-[148px]">
            <PageTransition>{children}</PageTransition>
          </main>
        </div>
      ) : (
        <div className="h-screen relative overflow-hidden">
          <WhitePanel />
          <main
            className={`relative w-full px-6 md:px-10 pt-32 lg:pt-[148px] h-screen flex flex-col ${
              isOrderLayout
                ? "lg:pl-[38vw] pb-10 lg:pb-6 overflow-y-auto"
                : "lg:w-[45%] lg:pl-[7.71vw] pb-10 lg:pb-0"
            }`}
          >
            <div className="flex-1 flex flex-col">
              <PageTransition>{children}</PageTransition>
            </div>
          </main>
          {!isCabinet && <HeroImage isFadingOut={isFadingOut} />}
        </div>
      )}

      {/* ArtworkLabel — always mounted to avoid language switcher blinking on transitions */}
      <ArtworkLabel hideInfo={isFullWidth || isCabinet} fadeInfo={isFadingOut} />

      {/* Shared hero name — persists across Home/Order without re-animating */}
      <AnimatePresence>
        {showHeroName && (
          <motion.div
            key="hero-name"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.5, delay: 0.5, ease: "easeOut" } }}
            exit={{ opacity: 0, transition: { duration: 0.3, ease: "easeOut" } }}
            className="hidden lg:flex fixed left-[7.71vw] top-[148px] h-[calc(100vh-148px)] flex-col justify-center z-10 pointer-events-none"
          >
            <div className="mb-[83px]">
              <h2 className="text-[14px] font-bold tracking-[4.5px] text-text-muted uppercase mb-0">
                {t("name")}
              </h2>
              <p className="text-[14px] font-medium tracking-[4.5px] text-text-light">
                {t("title")}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Shared SocialLinks — persists across Home/About/Equipment, animates position per page */}
      <AnimatePresence>
        {showSocial && (
          <motion.div
            key="social-links"
            data-artwork-hide
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className={`fixed left-6 md:left-10 lg:left-[7.71vw] z-30 transition-[bottom] duration-1000 ease-in-out ${
              pathname === "/" || pathname === "/order"
                ? "bottom-[calc((100vh-311px)/2)]"
                : "bottom-[calc((100vh-778px)/4)]" /* About, Portfolio, Equipment */
            }`}
          >
            <SocialLinks />
          </motion.div>
        )}
      </AnimatePresence>
    </PortfolioPreviewProvider>
  );
}
