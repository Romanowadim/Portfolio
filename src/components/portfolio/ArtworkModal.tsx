"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Artwork } from "@/data/artworks";

const toolInfo: Record<string, { fullName: string; experience: string }> = {
  photoshop: { fullName: "Adobe Photoshop", experience: "11 years of experience" },
  illustrator: { fullName: "Adobe Illustrator", experience: "3 years of experience" },
  animate: { fullName: "Adobe Animate", experience: "7 years of experience" },
  figma: { fullName: "Figma", experience: "3 years of experience" },
  procreate: { fullName: "Procreate", experience: "5 years of experience" },
};

type Props = {
  artwork: Artwork;
  onClose: () => void;
};

export default function ArtworkModal({ artwork, onClose }: Props) {
  const locale = useLocale() as "ru" | "en";
  const isOrder = artwork.category === "orders" && artwork.clientName;
  const [fullscreen, setFullscreen] = useState(false);
  const [hoveredTool, setHoveredTool] = useState<string | null>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (fullscreen) {
          setFullscreen(false);
        } else {
          onClose();
        }
      }
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose, fullscreen]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[100]"
    >
      {/* White overlay background */}
      <div className="absolute inset-0 bg-white/95" onClick={onClose} />

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-[64px] right-[64px] z-10 w-[16px] h-[16px] flex items-center justify-center text-[#808080] hover:text-[#404040] transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M1 1L15 15M15 1L1 15" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>

      {/* Modal content */}
      <div className="absolute inset-0 flex items-center justify-center p-[64px]" onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex max-w-[1094px] w-full max-h-[798px] h-full shadow-[0px_4px_40px_0px_rgba(0,0,0,0.12)]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Left — artwork image (639/1094 ≈ 58.4%) */}
          <div className="relative h-full shrink-0 overflow-hidden" style={{ width: "58.4%" }}>
            <Image
              src={artwork.image}
              alt={artwork.title[locale]}
              fill
              className="object-cover"
              sizes="50vw"
              priority
            />
            {/* Fullscreen button */}
            <button
              onClick={() => setFullscreen(true)}
              className="group absolute top-[16px] right-[16px] z-20 w-[35px] h-[35px]"
            >
              <svg viewBox="0 0 35 35" fill="none" className="w-full h-full">
                <path
                  className="transition-opacity duration-200 opacity-15 group-hover:opacity-40"
                  d="M27.2174 0H7.78264C3.48441 0 0 3.59106 0 8.02085V26.9791C0 31.4089 3.48441 35 7.78264 35H27.2174C31.5156 35 35 31.4089 35 26.9791V8.02085C35 3.59106 31.5156 0 27.2174 0Z"
                  fill="#7F7F7F"
                />
                <g className="transition-opacity duration-200 opacity-60 group-hover:opacity-100" fill="white">
                  <path d="M6.95521 6.50634C7.37974 6.17626 7.9165 5.99802 8.45427 6.00157C10.6201 6.00106 12.7859 6.00055 14.9522 6.00208C15.3412 6.00259 15.7226 6.18438 15.9719 6.48196C16.2751 6.83438 16.3731 7.34778 16.2202 7.78704C16.0486 8.31923 15.5184 8.7077 14.9588 8.7077C12.8758 8.71177 10.7927 8.70821 8.7097 8.70973C8.70868 10.5912 8.70919 12.4731 8.70919 14.3546C8.71884 14.741 8.55989 15.1295 8.27298 15.39C7.97286 15.6713 7.53919 15.8013 7.13396 15.7313C6.69724 15.6622 6.30622 15.3626 6.12443 14.9599C6.02693 14.7552 5.99544 14.5262 6.00052 14.3018C6.00255 12.3386 5.99849 10.3759 6.00255 8.41266C6.00458 7.67481 6.36818 6.95169 6.95521 6.50634Z" />
                  <path d="M19.3215 6.48122C19.5698 6.18415 19.9506 6.00286 20.3386 6.00185C22.3856 5.99982 24.4326 6.00134 26.4796 6.00083C26.8025 5.99982 27.1311 5.99017 27.4465 6.07447C28.1239 6.24052 28.717 6.71533 29.0293 7.33892C29.2147 7.70048 29.2979 8.10876 29.2924 8.51349C29.2918 10.4767 29.2939 12.4394 29.2918 14.4026C29.3005 15.0435 28.7932 15.6396 28.1589 15.731C27.5815 15.8372 26.964 15.5122 26.7177 14.9815C26.6045 14.756 26.5761 14.5001 26.5837 14.2513C26.5847 12.4038 26.5842 10.5569 26.5837 8.7095C24.5179 8.709 22.4526 8.71001 20.3868 8.709C19.8922 8.72271 19.4047 8.44392 19.1696 8.00771C18.899 7.53189 18.9619 6.89407 19.3215 6.48122Z" />
                  <path d="M6.55102 19.8082C6.94508 19.5086 7.50824 19.4588 7.95055 19.6813C8.40961 19.8996 8.71582 20.3953 8.70871 20.9036C8.71024 22.7972 8.70871 24.6908 8.70922 26.584C10.7902 26.585 12.8707 26.5829 14.9518 26.585C15.3352 26.586 15.712 26.7612 15.9613 27.0522C16.2705 27.4031 16.3741 27.92 16.2228 28.3628C16.0527 28.9011 15.517 29.2936 14.9518 29.2911C12.7712 29.2931 10.5907 29.2942 8.41012 29.2906C7.44426 29.2906 6.52106 28.6558 6.17473 27.755C6.05082 27.4508 5.99903 27.1217 6.00106 26.7942C6.00106 24.831 6.00004 22.8673 6.00156 20.9041C5.99649 20.4785 6.20672 20.0586 6.55102 19.8082Z" />
                  <path d="M27.773 19.5529C28.3356 19.4752 28.9211 19.7977 29.1588 20.3126C29.2644 20.5264 29.299 20.7676 29.2929 21.0042C29.2918 22.8501 29.2929 24.696 29.2929 26.5414C29.3005 26.9238 29.2852 27.3153 29.1481 27.6769C28.8247 28.6158 27.8791 29.2922 26.8853 29.2907C24.72 29.2953 22.5542 29.2917 20.3889 29.2927C19.9014 29.306 19.4195 29.0363 19.1803 28.6102C18.9558 28.2248 18.9421 27.7272 19.1452 27.3306C19.3265 26.9649 19.6825 26.6933 20.0827 26.612C20.267 26.5744 20.4569 26.5851 20.6443 26.5841C22.6243 26.5846 24.6042 26.5846 26.5842 26.5841C26.5862 24.6737 26.5811 22.7628 26.5862 20.8519C26.5928 20.2044 27.1301 19.6194 27.773 19.5529Z" />
                </g>
              </svg>
            </button>
          </div>

          {/* Right — info panel */}
          <div className="bg-white flex flex-col justify-between p-[50px] min-w-[296px] flex-1 overflow-y-auto">
            {/* Top section */}
            <div>
              {/* Client info block (orders only) */}
              {isOrder && artwork.clientAvatar && (
                <div className="flex items-start gap-[16px] mb-[40px]">
                  <div className="relative w-[80px] h-[80px] rounded-full overflow-hidden shrink-0">
                    <Image
                      src={artwork.clientAvatar}
                      alt={artwork.clientName || ""}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </div>
                  <div className="pt-[8px] flex-1">
                    <h3 className="text-[14px] font-bold tracking-[2.8px] text-[#808080] uppercase leading-[20px]">
                      {artwork.clientName}
                    </h3>
                    {(artwork.client || artwork.clientRole) && (
                      <div className="mt-[4px]">
                        {artwork.client && (
                          <p className="text-[12px] font-medium tracking-[2.4px] text-[#c0c0c0] leading-[15px] uppercase">
                            {artwork.client}
                          </p>
                        )}
                        {artwork.clientRole && (
                          <p className="text-[12px] font-medium tracking-[2.4px] text-[#c0c0c0] leading-[15px]">
                            {artwork.clientRole}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  {artwork.clientSocials && (
                    <div className="flex flex-col items-center gap-[10px] shrink-0">
                      {artwork.clientSocials.map((social) => (
                        <a
                          key={social.icon}
                          href={social.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-[20px] h-[20px] hover:brightness-[0.667] transition-[filter]"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`/images/social/${social.icon}.svg`}
                            alt={social.icon}
                            className="w-full h-full object-contain"
                          />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Title */}
              <h2 className="text-[14px] font-bold tracking-[2.8px] text-[#808080] uppercase leading-[20px]">
                {artwork.title[locale]}
              </h2>

              {/* Metadata row */}
              {(artwork.year || artwork.hours || artwork.resolution) && (
                <div className="mt-[16px] flex flex-col gap-[2px]">
                  <div className="flex gap-[20px]">
                    {artwork.year && (
                      <span className="text-[12px] font-medium tracking-[2.4px] text-[#c0c0c0] leading-[20px]">
                        {artwork.year}
                      </span>
                    )}
                    {artwork.hours && (
                      <span className="text-[12px] font-medium tracking-[2.4px] text-[#c0c0c0] leading-[20px]">
                        {artwork.hours}
                      </span>
                    )}
                  </div>
                  {artwork.resolution && (
                    <span className="text-[12px] font-medium tracking-[2.4px] text-[#c0c0c0] leading-[20px]">
                      {artwork.resolution}px.
                    </span>
                  )}
                </div>
              )}

              {/* Client review (for orders) */}
              {artwork.review && (
                <div className="mt-[40px]">
                  <h3 className="text-[14px] font-bold tracking-[3.2px] text-[#808080] leading-[20px]">
                    REVIEW TO ORDER
                  </h3>
                  <p className="mt-[16px] text-[14px] font-medium leading-[20px] text-[#787878]">
                    {artwork.review[locale]}
                  </p>
                </div>
              )}
            </div>

            {/* Bottom — workspaces/tools */}
            {artwork.tools && (
              <div className="mt-[40px]">
                <h3 className="text-[14px] font-bold tracking-[2.8px] text-[#808080] leading-[20px]">
                  WORKSPACES
                </h3>
                <div className="flex items-center gap-[20px] mt-[16px]">
                  {artwork.tools.split(" | ").map((tool) => {
                    const key = tool.toLowerCase();
                    const info = toolInfo[key];
                    const iconSrc = `/images/programs/${key}.${key === "procreate" || key === "figma" ? "png" : "svg"}`;
                    return (
                      <div
                        key={tool}
                        className="relative"
                        onMouseEnter={() => setHoveredTool(tool)}
                        onMouseLeave={() => setHoveredTool(null)}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={iconSrc}
                          alt={tool}
                          className="w-[35px] h-[35px] object-contain cursor-pointer grayscale opacity-25"
                        />
                        <AnimatePresence>
                          {hoveredTool === tool && info && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.15 }}
                              className="absolute z-50 w-[209px] rounded-[13px] bg-white shadow-[0px_1px_10px_0px_rgba(0,0,0,0.1)] pointer-events-none"
                              style={{ left: -13, top: -14 }}
                            >
                              <div className="flex items-center gap-3 px-[13px] pt-[14px] pb-[13px]">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={iconSrc} alt="" className="w-[35px] h-[35px] object-contain shrink-0" />
                                <span className="text-[14px] text-[#7f7f7f] leading-[20px] font-semibold">
                                  {info.fullName}
                                </span>
                              </div>
                              <div className="h-px bg-[#e8e8e8] mx-[11px]" />
                              <p className="text-[12px] text-[#7f7f7f] leading-[15.5px] text-center py-[10px]">
                                {info.experience}
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Fullscreen image overlay */}
      <AnimatePresence>
        {fullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 cursor-pointer"
            onClick={() => setFullscreen(false)}
          >
            <Image
              src={artwork.image}
              alt={artwork.title[locale]}
              fill
              className="object-contain p-[32px]"
              sizes="100vw"
              priority
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
