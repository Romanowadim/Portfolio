"use client";

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
  const showSocial = pathname === "/about" || pathname === "/equipment";

  return (
    <>
      {isFullWidth ? (
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

      {/* Shared SocialLinks — persists across About/Equipment transitions */}
      <AnimatePresence>
        {showSocial && (
          <motion.div
            key="social-links"
            initial={{ y: -240 }}
            animate={{ y: 0, transition: { duration: 0.8, ease: "easeOut" } }}
            exit={{ y: -240, transition: { duration: 0.5, ease: "easeIn" } }}
            className="fixed left-6 md:left-10 lg:left-[7.71vw] bottom-[calc((100vh-778px)/2)] z-30"
          >
            <SocialLinks />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
