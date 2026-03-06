"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { artworks as staticArtworks, Artwork } from "@/data/artworks";

const staticIds = new Set(staticArtworks.map((a) => a.id));

const RU_MONTHS = ["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"];
const EN_MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export function formatCreatedAt(iso: string, locale: string): { date: string; time: string } {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const date = locale === "ru"
    ? `${day} ${RU_MONTHS[d.getMonth()]} ${year}г.`
    : `${day} ${EN_MONTHS[d.getMonth()]} ${year}`;
  return { date, time: `${hours}:${minutes}` };
}

export function EyeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 14" fill="none">
      <path
        d="M10 0C5.5 0 1.73 2.89 0 7c1.73 4.11 5.5 7 10 7s8.27-2.89 10-7c-1.73-4.11-5.5-7-10-7zm0 11.67A4.67 4.67 0 1 1 10 2.33a4.67 4.67 0 0 1 0 9.34zM10 4a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"
        fill="currentColor"
      />
    </svg>
  );
}

export function ClickIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
      <path d="M6.111 11.8891C3.96311 9.7412 3.96311 6.2588 6.111 4.11091C8.25888 1.96303 11.7413 1.96303 13.8892 4.11091C14.9633 5.185 15.5001 6.59127 15.5001 8C15.5001 8.41421 15.8359 8.75 16.2501 8.75C16.6643 8.75 17.0001 8.41421 17.0001 8C17.0001 6.2097 16.3165 4.41694 14.9498 3.05025C12.2162 0.316582 7.78401 0.316582 5.05034 3.05025C2.31667 5.78392 2.31667 10.2161 5.05034 12.9497C5.34323 13.2426 5.8181 13.2426 6.111 12.9497C6.40389 12.6569 6.40389 12.182 6.111 11.8891Z" />
      <path d="M8.23235 6.23223C7.25604 7.20854 7.25604 8.79146 8.23235 9.76777C8.52525 10.0607 8.52525 10.5355 8.23235 10.8284C7.93946 11.1213 7.46459 11.1213 7.17169 10.8284C5.60959 9.26633 5.60959 6.73367 7.17169 5.17157C8.73379 3.60948 11.2664 3.60948 12.8285 5.17157C13.6094 5.95247 14.0001 6.97747 14.0001 8C14.0001 8.41421 13.6643 8.75 13.2501 8.75C12.8359 8.75 12.5001 8.41421 12.5001 8C12.5001 7.35903 12.2562 6.72054 11.7679 6.23223C10.7916 5.25592 9.20866 5.25592 8.23235 6.23223Z" />
      <path d="M10.7657 7.51062C10.5871 7.24492 10.2596 7.12184 9.95029 7.20417C9.64095 7.2865 9.41795 7.5561 9.3951 7.8754L8.90409 14.7363C8.88303 15.0306 9.0365 15.3099 9.29622 15.4499C9.55595 15.59 9.87365 15.5647 10.108 15.3854L11.1508 14.5873L12.1363 18.2653C12.2436 18.6654 12.6548 18.9028 13.0549 18.7956C13.455 18.6884 13.6924 18.2771 13.5852 17.877L12.6083 14.2312L13.9005 14.4349C14.1951 14.4814 14.4893 14.3489 14.6497 14.0974C14.8101 13.846 14.8062 13.5233 14.6398 13.2758L10.7657 7.51062Z" />
    </svg>
  );
}

export const CLICK_ICON_22 = <svg width="22" height="22" viewBox="0 0 20 20" fill="currentColor"><path d="M6.111 11.8891C3.96311 9.7412 3.96311 6.2588 6.111 4.11091C8.25888 1.96303 11.7413 1.96303 13.8892 4.11091C14.9633 5.185 15.5001 6.59127 15.5001 8C15.5001 8.41421 15.8359 8.75 16.2501 8.75C16.6643 8.75 17.0001 8.41421 17.0001 8C17.0001 6.2097 16.3165 4.41694 14.9498 3.05025C12.2162 0.316582 7.78401 0.316582 5.05034 3.05025C2.31667 5.78392 2.31667 10.2161 5.05034 12.9497C5.34323 13.2426 5.8181 13.2426 6.111 12.9497C6.40389 12.6569 6.40389 12.182 6.111 11.8891Z" /><path d="M8.23235 6.23223C7.25604 7.20854 7.25604 8.79146 8.23235 9.76777C8.52525 10.0607 8.52525 10.5355 8.23235 10.8284C7.93946 11.1213 7.46459 11.1213 7.17169 10.8284C5.60959 9.26633 5.60959 6.73367 7.17169 5.17157C8.73379 3.60948 11.2664 3.60948 12.8285 5.17157C13.6094 5.95247 14.0001 6.97747 14.0001 8C14.0001 8.41421 13.6643 8.75 13.2501 8.75C12.8359 8.75 12.5001 8.41421 12.5001 8C12.5001 7.35903 12.2562 6.72054 11.7679 6.23223C10.7916 5.25592 9.20866 5.25592 8.23235 6.23223Z" /><path d="M10.7657 7.51062C10.5871 7.24492 10.2596 7.12184 9.95029 7.20417C9.64095 7.2865 9.41795 7.5561 9.3951 7.8754L8.90409 14.7363C8.88303 15.0306 9.0365 15.3099 9.29622 15.4499C9.55595 15.59 9.87365 15.5647 10.108 15.3854L11.1508 14.5873L12.1363 18.2653C12.2436 18.6654 12.6548 18.9028 13.0549 18.7956C13.455 18.6884 13.6924 18.2771 13.5852 17.877L12.6083 14.2312L13.9005 14.4349C14.1951 14.4814 14.4893 14.3489 14.6497 14.0974C14.8101 13.846 14.8062 13.5233 14.6398 13.2758L10.7657 7.51062Z" /></svg>;

export const EYE_ICON_22 = <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" /><path fillRule="evenodd" d="M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113-1.487 4.471-5.705 7.697-10.677 7.697-4.97 0-9.186-3.223-10.675-7.69a1.762 1.762 0 0 1 0-1.113ZM17.25 12a5.25 5.25 0 1 1-10.5 0 5.25 5.25 0 0 1 10.5 0Z" clipRule="evenodd" /></svg>;

export const SOCIAL_ICONS: Record<string, string> = {
  youtube: "YT", vk: "VK", instagram: "IG", telegram: "TG",
  artstation: "AS", behance: "BE", deviantart: "DA",
};

export const PANEL_CLASS = "fixed top-0 bottom-0 right-0 left-[calc(33.75vw+24px)] z-10 overflow-y-auto bg-bg";
export const PANEL_STYLE = { paddingTop: 148 + 24, paddingBottom: 24, paddingRight: 24 };

export function ArtworkStatRow({
  artwork,
  viewCount,
  locale,
  onEdit,
  onDeleted,
  onNavigate,
  isHidden,
  onToggleHidden,
}: {
  artwork: Artwork;
  viewCount: { total: number; recent: number };
  locale: "ru" | "en";
  onEdit: () => void;
  onDeleted: (id: string) => void;
  onNavigate: () => void;
  isHidden?: boolean;
  onToggleHidden?: () => void;
}) {
  const t = useTranslations("admin");
  const [deleting, setDeleting] = useState(false);
  const isDynamic = !staticIds.has(artwork.id);

  const handleDelete = async () => {
    if (!confirm(`Delete "${artwork.title[locale]}"?`)) return;
    setDeleting(true);
    try {
      await fetch("/api/artworks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: artwork.id }),
      });
      onDeleted(artwork.id);
    } catch {
      setDeleting(false);
    }
  };

  return (
    <div
      className={`flex items-center gap-[16px] bg-white px-[16px] py-[12px] cursor-pointer hover:bg-bg transition-colors ${isHidden ? "opacity-50" : ""}`}
      onClick={onNavigate}
    >
      <div className="relative w-[52px] h-[52px] shrink-0 bg-bg-dark overflow-hidden">
        <Image
          src={artwork.thumbnail || artwork.image}
          alt={artwork.title[locale]}
          fill
          className="object-cover"
          sizes="52px"
        />
      </div>
      <div className="w-[248px] shrink-0 min-w-0 pr-[48px]">
        <p className="text-[13px] font-bold tracking-[1.5px] text-text-muted uppercase truncate">
          {artwork.title[locale]}
        </p>
        <p className="text-[12px] font-medium tracking-[1.2px] text-text-light uppercase mt-[2px]">
          {artwork.category}
          {artwork.subcategory ? ` / ${artwork.subcategory}` : ""}
          {artwork.year ? ` · ${artwork.year}` : ""}
        </p>
      </div>
      <span className="w-px h-[32px] bg-bg-dark shrink-0" />
      <div className="flex items-center gap-[16px] shrink-0 w-[120px] justify-end">
        {viewCount.recent > 0 && (
          <span className="text-[13px] font-bold tracking-[0.5px]" style={{ color: "#81AB41" }}>
            +{viewCount.recent}
          </span>
        )}
        <div className="flex items-center gap-[5px] text-text-light">
          <EyeIcon />
          <span className="text-[13px] font-bold tracking-[0.5px]">{viewCount.total}</span>
        </div>
      </div>
      <span className="w-px h-[32px] bg-bg-dark shrink-0" />
      <div className="shrink-0 w-[130px]">
        {artwork.createdAt ? (() => {
          const { date, time } = formatCreatedAt(artwork.createdAt, locale);
          return (
            <>
              <p className="text-[12px] font-medium tracking-[1.2px] text-text-light">{date}</p>
              <p className="text-[12px] font-medium tracking-[1.2px] text-text-light mt-[2px]">{time}</p>
            </>
          );
        })() : (
          <p className="text-[12px] font-medium tracking-[1.2px] text-text-light">—</p>
        )}
      </div>
      <span className="w-px h-[32px] bg-bg-dark shrink-0" />
      <div className="shrink-0 w-[60px]">
        <p className="text-[12px] font-bold tracking-[1.2px] text-text-light">
          {artwork.sketch ? "F+S" : "F"}
        </p>
      </div>
      <span className="w-px h-[32px] bg-bg-dark shrink-0" />
      <div className="flex-1" />
      <button
        onClick={(e) => { e.stopPropagation(); onEdit(); }}
        className="shrink-0 w-[16px] h-[16px] flex items-center justify-center text-text-light hover:text-text-muted transition-colors"
        title="Edit"
      >
        <svg width="16" height="16" viewBox="0 0 20 19.9025" fill="none">
          <path d="M12.4365 3.32148L16.5049 7.38989L6.20657 17.6883L2.14042 13.6198L12.4365 3.32148ZM19.5921 2.34027L17.7777 0.525894C17.0765 -0.175298 15.938 -0.175298 15.2344 0.525894L13.4964 2.26388L17.5648 6.33233L19.5921 4.30507C20.136 3.76118 20.136 2.88411 19.5921 2.34027ZM0.0113215 19.3383C-0.0627191 19.6716 0.238132 19.9701 0.571391 19.8891L5.105 18.7899L1.03885 14.7215L0.0113215 19.3383Z" fill="currentColor" />
        </svg>
      </button>
      {onToggleHidden && (
        <button
          onClick={(e) => { e.stopPropagation(); onToggleHidden(); }}
          className="shrink-0 w-[16px] h-[16px] flex items-center justify-center text-text-light hover:text-text-muted transition-colors"
          title={isHidden ? "Show" : "Hide"}
        >
          {isHidden ? (
            <svg width="16" height="14" viewBox="0 0 18.89 16" fill="currentColor">
              <path fillRule="evenodd" clipRule="evenodd" d="M2.726.22a.75.75 0 0 0-1.06 0 .75.75 0 0 0 0 1.06l14.5 14.5a.75.75 0 0 0 1.06-1.06l-1.745-1.745a10.03 10.03 0 0 0 3.3-4.38 1.65 1.65 0 0 0 0-1.186C17.338 3.66 13.702 1 9.444 1 7.728 1 6.112 1.432 4.7 2.194L2.726.22ZM7.198 4.691l1.091 1.092a2.5 2.5 0 0 1 3.374 3.374l1.092 1.091A4 4 0 0 0 9.446 4a3.98 3.98 0 0 0-2.248.691Z" />
              <path d="M10.194 11.93l2.523 2.523A9.99 9.99 0 0 1 9.446 15c-4.257 0-7.893-2.66-9.336-6.41a1.65 1.65 0 0 1 0-1.186 10.01 10.01 0 0 1 2.174-3.384l2.232 2.232A4 4 0 0 0 9.446 12c.256 0 .506-.024.748-.07Z" />
            </svg>
          ) : (
            <svg width="16" height="12" viewBox="0 0 18.89 14" fill="currentColor">
              <path d="M9.446 9.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
              <path fillRule="evenodd" clipRule="evenodd" d="M.11 7.59a1.65 1.65 0 0 1 0-1.186C1.555 2.658 5.189 0 9.444 0c4.258 0 7.894 2.66 9.336 6.41a1.65 1.65 0 0 1 0 1.186C17.336 11.342 13.702 14 9.446 14 5.189 14 1.553 11.34.11 7.59ZM13.446 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" />
            </svg>
          )}
        </button>
      )}
      <button
        onClick={(e) => { e.stopPropagation(); handleDelete(); }}
        disabled={deleting}
        className="shrink-0 flex items-center gap-[5px] text-text-light hover:text-[#F87777] transition-colors disabled:opacity-40"
        title="Delete"
      >
        <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" clipRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 3.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" />
        </svg>
        <span className="text-[12px] font-medium tracking-wide">{t("delete")}</span>
      </button>
    </div>
  );
}

export function AddArtworkButton({
  onClick,
  label,
  onDropImage,
}: {
  onClick: () => void;
  label: string;
  onDropImage: (url: string) => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);

  const uploadFile = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (res.ok) {
        const data = await res.json();
        onDropImage(data.url);
      }
    } catch {}
    setUploading(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file?.type.startsWith("image/")) uploadFile(file);
  };

  return (
    <button
      onClick={onClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{ height: dragOver ? 200 : undefined }}
      className={`w-full flex items-center justify-center gap-[8px] border-2 border-dashed px-[16px] py-[14px] transition-all duration-200 ${
        dragOver
          ? "border-text-muted bg-text-light/10 text-text-muted"
          : "border-border text-text-light hover:text-text-muted hover:border-text-light hover:bg-text-light/5"
      }`}
    >
      {uploading ? (
        <span className="text-[12px] font-bold tracking-[1.8px] uppercase animate-pulse text-text-light">...</span>
      ) : dragOver ? (
        <svg width="24" height="24" viewBox="0 0 16 16" fill="none">
          <path d="M8 1v14M1 8h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ) : (
        <>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 1v14M1 8h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span className="text-[12px] font-bold tracking-[1.8px] uppercase">{label}</span>
        </>
      )}
    </button>
  );
}
