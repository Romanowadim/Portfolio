"use client";

import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "@/i18n/navigation";
import WhitePanel from "@/components/layout/WhitePanel";
import HeroImage from "@/components/layout/HeroImage";
import ArtworkLabel from "@/components/layout/ArtworkLabel";
import PageTransition from "@/components/layout/PageTransition";
import SocialLinks from "@/components/layout/SocialLinks";

export default function MainContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isFullWidth = pathname === "/equipment";
  const showSocial = pathname === "/" || pathname === "/about" || pathname === "/equipment";

  const [showFullWidth, setShowFullWidth] = useState(isFullWidth);
  const prevPathnameRef = useRef(pathname);

  useEffect(() => {
    const prevPathname = prevPathnameRef.current;
    prevPathnameRef.current = pathname;

    if (isFullWidth) {
      if (prevPathname === "/about") {
        // From About: delay so staggered section exits play before branch swap
        const timer = setTimeout(() => setShowFullWidth(true), 550);
        return () => clearTimeout(timer);
      }
      setShowFullWidth(true);
    } else {
      // Leaving Equipment: delay so exit animations play in full-width branch
      const timer = setTimeout(() => setShowFullWidth(false), 550);
      return () => clearTimeout(timer);
    }
  }, [isFullWidth, pathname]);

  return (
    <>
      {showFullWidth ? (
        <div className="min-h-screen relative">
          <main className="relative w-full min-h-screen pt-[148px]">
            <PageTransition>{children}</PageTransition>
          </main>
        </div>
      ) : (
        <div className="h-screen relative overflow-hidden">
          <WhitePanel />
          <main className="relative w-full lg:w-[45%] px-6 md:px-10 lg:pl-[7.71vw] pt-32 lg:pt-[148px] pb-10 lg:pb-0 h-screen flex flex-col">
            <div className="flex-1 flex flex-col">
              <PageTransition>{children}</PageTransition>
            </div>
          </main>
          <ArtworkLabel />
          <HeroImage />
        </div>
      )}

      {/* Shared SocialLinks — persists across Home/About/Equipment, animates position per page */}
      <AnimatePresence>
        {showSocial && (
          <motion.div
            key="social-links"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className={`fixed left-6 md:left-10 lg:left-[7.71vw] z-30 transition-[bottom] duration-1000 ease-in-out ${
              pathname === "/"
                ? "bottom-[calc((100vh-311px)/2)]"
                : "bottom-[calc((100vh-778px)/4)]"
            }`}
          >
            <SocialLinks />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
