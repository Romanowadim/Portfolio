"use client";

import { createPortal } from "react-dom";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Artwork } from "@/data/artworks";
import { useAdmin } from "@/components/admin/AdminProvider";
import type { Contact, Coworker } from "@/lib/blob";

const toolInfo: Record<string, { fullName: string; since: number; file?: string; ext?: string; invert?: boolean }> = {
  photoshop:   { fullName: "Adobe Photoshop",  since: 2009 },
  illustrator: { fullName: "Adobe Illustrator", since: 2017 },
  animate:     { fullName: "Adobe Animate",     since: 2013 },
  figma:       { fullName: "Figma",             since: 2017 },
  procreate:   { fullName: "Procreate",         since: 2015, ext: "png" },
  krita:       { fullName: "Krita",             since: 2024 },
  midjourney:  { fullName: "Midjourney",        since: 2022, invert: true },
  chatgpt:     { fullName: "ChatGPT",           since: 2024, invert: true },
  claude:      { fullName: "Claude",            since: 2026, file: "claude-ai", invert: true },
};

function getExperience(since: number): string {
  const years = new Date().getFullYear() - since;
  if (years === 0) return "Less than 1 year";
  if (years === 1) return "1 year of experience";
  return `${years} years of experience`;
}

type Props = {
  artwork: Artwork;
  onClose: () => void;
  onEdit?: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  instant?: boolean;
  isHidden?: boolean;
  onToggleHidden?: () => void;
};

export default function ArtworkModal({ artwork, onClose, onEdit, onPrev, onNext, instant, isHidden, onToggleHidden }: Props) {
  const locale = useLocale() as "ru" | "en";
  const { isAdmin } = useAdmin();
  const [contactsList, setContactsList] = useState<Contact[]>([]);
  useEffect(() => {
    if (artwork.contactId) {
      fetch("/api/contacts")
        .then((r) => r.json())
        .then((data) => setContactsList(Array.isArray(data) ? data : []))
        .catch(() => {});
    }
  }, [artwork.contactId]);

  // Resolve client data: from linked contact or inline fields
  const resolvedContact = artwork.contactId ? contactsList.find((c) => c.id === artwork.contactId) : undefined;
  const rc = {
    clientName: resolvedContact?.clientName ?? artwork.clientName,
    client: resolvedContact?.client ?? artwork.client,
    clientRole: resolvedContact?.clientRole ?? artwork.clientRole,
    clientAvatar: resolvedContact?.clientAvatar ?? artwork.clientAvatar,
    clientAvatarBg: artwork.clientAvatarBg,
    clientSocials: resolvedContact?.clientSocials ?? artwork.clientSocials,
    subscribers: artwork.subscribers,
  };

  const isOrder = !!rc.clientName;
  const [fullscreen, setFullscreen] = useState(false);
  const [hoveredTool, setHoveredTool] = useState<string | null>(null);
  const [imgRatio, setImgRatio] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"final" | "sketch">("final");

  // Reset view mode when navigating to another artwork
  useEffect(() => {
    setViewMode("final");
  }, [artwork.id]);

  const displayImage = viewMode === "sketch" && artwork.sketch ? artwork.sketch : artwork.image;
  const [viewStats, setViewStats] = useState<{ total: number; recent: number } | null>(null);
  const [coworkerList, setCoworkerList] = useState<Coworker[]>([]);

  useEffect(() => {
    if (!isAdmin) return;
    fetch("/api/stats")
      .then((r) => r.json())
      .then((data: Record<string, { total: number; recent: number }>) => {
        setViewStats(data[artwork.id] ?? { total: 0, recent: 0 });
      })
      .catch(() => {});
  }, [isAdmin, artwork.id]);

  // Fetch fresh coworker data from API
  useEffect(() => {
    if (!artwork.coworkers?.length) return;
    fetch("/api/coworkers")
      .then((r) => r.json())
      .then((data: Coworker[]) => {
        if (!Array.isArray(data)) return;
        setCoworkerList(data);
      })
      .catch(() => {});
  }, [artwork.id, artwork.coworkers?.length]);

  // Load image to get natural aspect ratio
  useEffect(() => {
    const img = new window.Image();
    img.onload = () => {
      setImgRatio(img.naturalWidth / img.naturalHeight);
    };
    img.src = artwork.image;
  }, [artwork.image]);

  // Reset fullscreen when navigating to another artwork
  useEffect(() => {
    setFullscreen(false);
  }, [artwork.id]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (fullscreen) {
          setFullscreen(false);
        } else {
          onClose();
        }
      }
      if (!fullscreen) {
        if (e.key === "ArrowLeft") onPrev?.();
        if (e.key === "ArrowRight") onNext?.();
      }
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose, onPrev, onNext, fullscreen]);

  const content = (
    <motion.div
      initial={{ opacity: instant ? 1 : 0 }}
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

      {/* Edit button (admin only) */}
      {isAdmin && onEdit && (
        <button
          onClick={onEdit}
          className="absolute top-[102px] right-[62px] z-10 w-[20px] h-[20px] flex items-center justify-center text-[#cccccc] hover:text-[#808080] transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 20 19.9025" fill="none">
            <path
              d="M12.4365 3.32148L16.5049 7.38989L6.20657 17.6883L2.14042 13.6198L12.4365 3.32148ZM19.5921 2.34027L17.7777 0.525894C17.0765 -0.175298 15.938 -0.175298 15.2344 0.525894L13.4964 2.26388L17.5648 6.33233L19.5921 4.30507C20.136 3.76118 20.136 2.88411 19.5921 2.34027ZM0.0113215 19.3383C-0.0627191 19.6716 0.238132 19.9701 0.571391 19.8891L5.105 18.7899L1.03885 14.7215L0.0113215 19.3383Z"
              fill="currentColor"
            />
          </svg>
        </button>
      )}

      {/* Hide/Show button (admin only) */}
      {isAdmin && onToggleHidden && (
        <button
          onClick={onToggleHidden}
          className="absolute top-[140px] right-[62px] z-10 w-[20px] h-[20px] flex items-center justify-center text-[#cccccc] hover:text-[#808080] transition-colors"
        >
          {isHidden ? (
            <svg width="18" height="16" viewBox="0 0 18.89 16" fill="currentColor">
              <path fillRule="evenodd" clipRule="evenodd" d="M2.726.22a.75.75 0 0 0-1.06 0 .75.75 0 0 0 0 1.06l14.5 14.5a.75.75 0 0 0 1.06-1.06l-1.745-1.745a10.03 10.03 0 0 0 3.3-4.38 1.65 1.65 0 0 0 0-1.186C17.338 3.66 13.702 1 9.444 1 7.728 1 6.112 1.432 4.7 2.194L2.726.22ZM7.198 4.691l1.091 1.092a2.5 2.5 0 0 1 3.374 3.374l1.092 1.091A4 4 0 0 0 9.446 4a3.98 3.98 0 0 0-2.248.691Z" />
              <path d="M10.194 11.93l2.523 2.523A9.99 9.99 0 0 1 9.446 15c-4.257 0-7.893-2.66-9.336-6.41a1.65 1.65 0 0 1 0-1.186 10.01 10.01 0 0 1 2.174-3.384l2.232 2.232A4 4 0 0 0 9.446 12c.256 0 .506-.024.748-.07Z" />
            </svg>
          ) : (
            <svg width="18" height="14" viewBox="0 0 18.89 14" fill="currentColor">
              <path d="M9.446 9.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
              <path fillRule="evenodd" clipRule="evenodd" d="M.11 7.59a1.65 1.65 0 0 1 0-1.186C1.555 2.658 5.189 0 9.444 0c4.258 0 7.894 2.66 9.336 6.41a1.65 1.65 0 0 1 0 1.186C17.336 11.342 13.702 14 9.446 14 5.189 14 1.553 11.34.11 7.59ZM13.446 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" />
            </svg>
          )}
        </button>
      )}

      {/* Prev / Next navigation arrows */}
      {onPrev && (
        <button
          onClick={onPrev}
          className="absolute left-[24px] top-1/2 -translate-y-1/2 z-10 text-[#c0c0c0] hover:text-[#808080] transition-colors"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}
      {onNext && (
        <button
          onClick={onNext}
          className="absolute right-[24px] top-1/2 -translate-y-1/2 z-10 text-[#c0c0c0] hover:text-[#808080] transition-colors"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}

      {/* Modal content */}
      {artwork.category === "youtube" ? (
        /* ─── YouTube layout: vertical card with wide image ─── */
        <div className="absolute inset-0 flex items-center justify-center p-[52px]" onClick={onClose}>
          <motion.div
            initial={{ opacity: instant ? 1 : 0, y: instant ? 0 : 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: instant ? 0 : 0.1 }}
            className="flex flex-col max-w-[1596px] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Client block + Versions — above the card */}
            {(rc.clientName || artwork.sketch) && (
              <div className="flex items-start bg-white px-[67px] py-[40px] shadow-[0px_4px_40px_0px_rgba(0,0,0,0.12)]">
                {rc.clientName && (
                  <div className="flex items-start gap-[27px]">
                    {rc.clientAvatar && (
                      <div
                        className="relative w-[80px] h-[80px] rounded-full overflow-hidden shrink-0"
                        style={rc.clientAvatarBg ? { backgroundColor: rc.clientAvatarBg } : undefined}
                      >
                        <Image
                          src={rc.clientAvatar}
                          alt={rc.clientName}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      </div>
                    )}
                    <div className="pt-[8px]">
                      <h3 className="text-[14px] font-bold tracking-[2.8px] text-[#808080] uppercase leading-[20px]">
                        {rc.clientName}
                      </h3>
                      {(rc.client || rc.clientRole) && (
                        <div className="mt-[4px]">
                          {rc.client && (
                            <p className="text-[12px] font-medium tracking-[2.4px] text-[#c0c0c0] leading-[15px] uppercase">
                              {rc.client}
                            </p>
                          )}
                          {rc.clientRole && (
                            <p className="text-[12px] font-medium tracking-[2.4px] text-[#c0c0c0] leading-[15px]">
                              {rc.clientRole}
                            </p>
                          )}
                          {rc.subscribers && (
                            <p className="text-[12px] font-medium tracking-[2.4px] text-[#c0c0c0] leading-[15px] mt-[4px]">
                              {rc.subscribers} subs
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    {rc.clientSocials && (
                      <div className="flex flex-col items-center gap-[10px] shrink-0 ml-[27px]">
                        {rc.clientSocials.map((social, i) => (
                          <a
                            key={i}
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

                {/* Versions — far right of client row */}
                {artwork.sketch && (
                  <div className="ml-auto shrink-0 flex flex-col items-end">
                    <h3 className="text-[14px] font-bold tracking-[2.8px] text-[#808080] leading-[20px]">
                      VERSIONS
                    </h3>
                    <div className="flex items-center gap-[12px] mt-[16px]">
                      {(["final", "sketch"] as const).map((mode, i) => (
                        <span key={mode} className="flex items-center gap-[12px]">
                          {i > 0 && <span className="w-px h-[1em] bg-[#c0c0c0]" />}
                          <button
                            onClick={() => setViewMode(mode)}
                            className={`text-[12px] font-bold tracking-[2px] uppercase transition-colors ${
                              viewMode === mode ? "text-[#808080]" : "text-[#c0c0c0] hover:text-[#808080]"
                            }`}
                          >
                            {mode}
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* White card */}
            <div className="bg-white shadow-[0px_4px_40px_0px_rgba(0,0,0,0.12)]">
              {/* Full-width image */}
              <div
                className="relative w-full overflow-hidden"
                style={{ aspectRatio: imgRatio ?? 6 }}
              >
                <Image
                  src={displayImage}
                  alt={artwork.title[locale]}
                  fill
                  className="object-cover"
                  sizes="90vw"
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

              {/* Info section below image — two columns */}
              <div className="flex gap-[160px] px-[67px] pt-[57px] pb-[52px]">
                {/* Left column: title, metadata, workspaces */}
                <div className="shrink-0">
                  <h2 className="text-[14px] font-bold tracking-[2.8px] text-[#808080] uppercase leading-[20px]">
                    {artwork.title[locale]}
                  </h2>

                  {(artwork.year || artwork.hours || artwork.resolution) && (
                    <div className="mt-[16px] flex flex-col gap-[2px]">
                      <div className="flex gap-[96px]">
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

                  {/* Admin: view stats (YouTube layout) */}
                  {isAdmin && viewStats && (
                    <div className="mt-[16px] flex items-center gap-[8px]">
                      <svg width="14" height="14" viewBox="0 0 20 14" fill="none" className="text-[#c0c0c0]">
                        <path d="M10 0C5.5 0 1.73 2.89 0 7c1.73 4.11 5.5 7 10 7s8.27-2.89 10-7c-1.73-4.11-5.5-7-10-7zm0 11.67A4.67 4.67 0 1 1 10 2.33a4.67 4.67 0 0 1 0 9.34zM10 4a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" fill="currentColor" />
                      </svg>
                      <span className="text-[12px] font-bold tracking-[0.5px] text-[#c0c0c0]">{viewStats.total}</span>
                      {viewStats.recent > 0 && (
                        <span className="text-[12px] font-bold tracking-[0.5px]" style={{ color: "#81AB41" }}>
                          +{viewStats.recent}
                        </span>
                      )}
                    </div>
                  )}

                  {artwork.tools && (
                    <div className="mt-[24px]">
                      <h3 className="text-[14px] font-bold tracking-[2.8px] text-[#808080] leading-[20px]">
                        WORKSPACES
                      </h3>
                      <div className="flex items-center gap-[20px] mt-[16px]">
                        {artwork.tools.split(" | ").map((tool) => {
                          const key = tool.toLowerCase();
                          const info = toolInfo[key];
                          const iconFile = info?.file ?? key;
                          const iconExt = info?.ext ?? "svg";
                          const iconSrc = `/images/programs/${iconFile}.${iconExt}`;
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
                                className="object-contain cursor-pointer w-[35px] h-[35px]"
                                style={{ filter: info?.invert ? "invert(1) grayscale(1) opacity(0.4)" : "grayscale(1) opacity(0.25)" }}
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
                                      <img src={iconSrc} alt="" className="object-contain shrink-0 w-[35px] h-[35px]" style={info?.invert ? { filter: "invert(1)" } : undefined} />
                                      <span className="text-[14px] text-[#7f7f7f] leading-[20px] font-semibold">
                                        {info.fullName}
                                      </span>
                                    </div>
                                    <div className="h-px bg-[#e8e8e8] mx-[11px]" />
                                    <p className="text-[12px] text-[#7f7f7f] leading-[15.5px] text-center py-[10px]">
                                      {getExperience(info.since)}
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

                {/* Review */}
                {artwork.review && (
                  <div className="max-w-[350px]">
                    <h3 className="text-[14px] font-bold tracking-[3.2px] text-[#808080] leading-[20px]">
                      {artwork.reviewType === "description" ? "DESCRIPTION" : "REVIEW TO ORDER"}
                    </h3>
                    <p className="mt-[16px] text-[14px] font-medium leading-[20px] text-[#787878] whitespace-pre-line break-words">
                      {artwork.review[locale]}
                    </p>
                  </div>
                )}

                {/* Right column: Coworkers */}
                {artwork.coworkers && artwork.coworkers.length > 0 && (
                  <div className="ml-auto shrink-0">
                    <h3 className="text-[14px] font-bold tracking-[2.8px] text-[#808080] leading-[20px]">
                      COWORKERS
                    </h3>
                    <div className="flex flex-col mt-[16px]">
                      {artwork.coworkers.map((cw, i) => {
                        const fresh = coworkerList.find((c) => (cw.id && c.id === cw.id) || c.name === cw.name);
                        const data = fresh ?? cw;
                        const socials = (fresh?.socials ?? cw.socials ?? []).filter((s) => s.url);
                        return (
                        <div key={i}>
                          {i > 0 && <div className="h-px bg-[#f0f0f0] my-[12px]" />}
                          <div className="flex items-center gap-[12px]">
                          <div className="relative w-[36px] h-[36px] rounded-full overflow-hidden shrink-0 bg-[#f0f0f0] flex items-center justify-center">
                            {data.avatar ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={data.avatar} alt={data.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-[13px] font-bold text-[#c0c0c0]">
                                {data.name.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-bold tracking-[1.8px] text-[#808080] uppercase leading-[16px]">
                              {data.name}
                            </p>
                            {data.role && (
                              <p className="text-[11px] font-medium tracking-[1.5px] text-[#c0c0c0] leading-[14px]">
                                {data.role}
                              </p>
                            )}
                          </div>
                          {socials.length > 0 && (
                            <div className="flex gap-[8px] shrink-0">
                              {socials.map((s, j) => (
                                <a
                                  key={j}
                                  href={s.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block w-[16px] h-[16px] hover:brightness-[0.667] transition-[filter]"
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={`/images/social/${s.icon}.svg`} alt={s.icon} className="w-full h-full object-contain" />
                                </a>
                              ))}
                            </div>
                          )}
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      ) : (
        /* ─── Default layout: horizontal image + info panel ─── */
        <div className="absolute inset-0 flex items-center justify-center p-[52px]" onClick={onClose}>
          <motion.div
            initial={{ opacity: instant ? 1 : 0, y: instant ? 0 : 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: instant ? 0 : 0.1 }}
            className="flex max-h-[calc(50vh+360px)] h-full shadow-[0px_4px_40px_0px_rgba(0,0,0,0.12)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left — artwork image, width adapts to image aspect ratio */}
            <div
              className="relative h-full shrink-0 overflow-hidden bg-[#f0f0f0]"
              style={{ width: imgRatio ? `min(calc(${imgRatio} * (50vh + 360px)), calc(100vw - 104px - 455px))` : "58.4%" }}
            >
              <Image
                src={displayImage}
                alt={artwork.title[locale]}
                fill
                className="object-contain"
                sizes="60vw"
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
            <div className="bg-white flex flex-col justify-between p-[50px] w-[455px] shrink-0 overflow-y-auto">
              {/* Top section */}
              <div>
                {/* Client info block (orders only) */}
                {isOrder && (
                  <div className="flex items-start gap-[16px] mb-[40px]">
                    {rc.clientAvatar && (
                      <div
                        className="relative w-[80px] h-[80px] rounded-full overflow-hidden shrink-0"
                        style={rc.clientAvatarBg ? { backgroundColor: rc.clientAvatarBg } : undefined}
                      >
                        <Image
                          src={rc.clientAvatar}
                          alt={rc.clientName || ""}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      </div>
                    )}
                    <div className="pt-[8px] flex-1">
                      <h3 className="text-[14px] font-bold tracking-[2.8px] text-[#808080] uppercase leading-[20px]">
                        {rc.clientName}
                      </h3>
                      {(rc.client || rc.clientRole) && (
                        <div className="mt-[4px]">
                          {rc.client && (
                            <p className="text-[12px] font-medium tracking-[2.4px] text-[#c0c0c0] leading-[15px] uppercase">
                              {rc.client}
                            </p>
                          )}
                          {rc.clientRole && (
                            <p className="text-[12px] font-medium tracking-[2.4px] text-[#c0c0c0] leading-[15px]">
                              {rc.clientRole}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    {rc.clientSocials && (
                      <div className="flex flex-col items-center gap-[10px] shrink-0">
                        {rc.clientSocials.map((social, i) => (
                          <a
                            key={i}
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

                {/* Title + Metadata block */}
                <div className="border-t border-b border-[#e8e8e8] py-[20px]">
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

                  {/* Admin: view stats */}
                  {isAdmin && viewStats && (
                    <div className="mt-[16px] flex items-center gap-[8px]">
                      <svg width="14" height="14" viewBox="0 0 20 14" fill="none" className="text-[#c0c0c0]">
                        <path d="M10 0C5.5 0 1.73 2.89 0 7c1.73 4.11 5.5 7 10 7s8.27-2.89 10-7c-1.73-4.11-5.5-7-10-7zm0 11.67A4.67 4.67 0 1 1 10 2.33a4.67 4.67 0 0 1 0 9.34zM10 4a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" fill="currentColor" />
                      </svg>
                      <span className="text-[12px] font-bold tracking-[0.5px] text-[#c0c0c0]">{viewStats.total}</span>
                      {viewStats.recent > 0 && (
                        <span className="text-[12px] font-bold tracking-[0.5px]" style={{ color: "#81AB41" }}>
                          +{viewStats.recent}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Client review (for orders) */}
                {artwork.review && (
                  <div className="mt-[40px] max-w-[350px]">
                    <h3 className="text-[14px] font-bold tracking-[3.2px] text-[#808080] leading-[20px]">
                      {artwork.reviewType === "description" ? "DESCRIPTION" : "REVIEW TO ORDER"}
                    </h3>
                    <p className="mt-[16px] text-[14px] font-medium leading-[20px] text-[#787878] whitespace-pre-line break-words">
                      {artwork.review[locale]}
                    </p>
                  </div>
                )}

                {/* Coworkers */}
                {artwork.coworkers && artwork.coworkers.length > 0 && (
                  <div className="mt-[40px]">
                    <h3 className="text-[14px] font-bold tracking-[2.8px] text-[#808080] leading-[20px]">
                      COWORKERS
                    </h3>
                    <div className="flex flex-col mt-[16px]">
                      {artwork.coworkers.map((cw, i) => {
                        const fresh = coworkerList.find((c) => (cw.id && c.id === cw.id) || c.name === cw.name);
                        const data = fresh ?? cw;
                        const socials = (fresh?.socials ?? cw.socials ?? []).filter((s) => s.url);
                        return (
                        <div key={i}>
                          {i > 0 && <div className="h-px bg-[#f0f0f0] my-[12px]" />}
                          <div className="flex items-center gap-[12px]">
                          <div className="relative w-[36px] h-[36px] rounded-full overflow-hidden shrink-0 bg-[#f0f0f0] flex items-center justify-center">
                            {data.avatar ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={data.avatar} alt={data.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-[13px] font-bold text-[#c0c0c0]">
                                {data.name.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-bold tracking-[1.8px] text-[#808080] uppercase leading-[16px]">
                              {data.name}
                            </p>
                            {data.role && (
                              <p className="text-[11px] font-medium tracking-[1.5px] text-[#c0c0c0] leading-[14px]">
                                {data.role}
                              </p>
                            )}
                          </div>
                          {socials.length > 0 && (
                            <div className="flex gap-[8px] shrink-0">
                              {socials.map((s, j) => (
                                <a
                                  key={j}
                                  href={s.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block w-[16px] h-[16px] hover:brightness-[0.667] transition-[filter]"
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={`/images/social/${s.icon}.svg`} alt={s.icon} className="w-full h-full object-contain" />
                                </a>
                              ))}
                            </div>
                          )}
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Versions toggle (if sketch exists) */}
              {artwork.sketch && (
                <div className="mt-[40px]">
                  <h3 className="text-[14px] font-bold tracking-[2.8px] text-[#808080] leading-[20px]">
                    VERSIONS
                  </h3>
                  <div className="flex items-center gap-[12px] mt-[16px]">
                    {(["final", "sketch"] as const).map((mode, i) => (
                      <span key={mode} className="flex items-center gap-[12px]">
                        {i > 0 && <span className="w-px h-[1em] bg-[#c0c0c0]" />}
                        <button
                          onClick={() => setViewMode(mode)}
                          className={`text-[12px] font-bold tracking-[2px] uppercase transition-colors ${
                            viewMode === mode ? "text-[#808080]" : "text-[#c0c0c0] hover:text-[#808080]"
                          }`}
                        >
                          {mode}
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

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
                      const iconFile = info?.file ?? key;
                      const iconExt = info?.ext ?? "svg";
                      const iconSrc = `/images/programs/${iconFile}.${iconExt}`;
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
                            className="object-contain cursor-pointer w-[35px] h-[35px]"
                            style={{ filter: info?.invert ? "invert(1) grayscale(1) opacity(0.4)" : "grayscale(1) opacity(0.25)" }}
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
                                  <img src={iconSrc} alt="" className="object-contain shrink-0 w-[35px] h-[35px]" style={info?.invert ? { filter: "invert(1)" } : undefined} />
                                  <span className="text-[14px] text-[#7f7f7f] leading-[20px] font-semibold">
                                    {info.fullName}
                                  </span>
                                </div>
                                <div className="h-px bg-[#e8e8e8] mx-[11px]" />
                                <p className="text-[12px] text-[#7f7f7f] leading-[15.5px] text-center py-[10px]">
                                  {getExperience(info.since)}
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
      )}

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
              src={displayImage}
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

  return createPortal(content, document.body);
}
