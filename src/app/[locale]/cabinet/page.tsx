"use client";

import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useAdmin } from "@/components/admin/AdminProvider";
import { useRouter } from "@/i18n/navigation";
import { artworks as staticArtworks, Artwork } from "@/data/artworks";
import ArtworkFormModal from "@/components/admin/ArtworkFormModal";
import ArtworkModal from "@/components/portfolio/ArtworkModal";
import ContactPickerModal from "@/components/admin/ContactPickerModal";
import CoworkerPickerModal from "@/components/admin/CoworkerPickerModal";
import CategoryFormModal from "@/components/admin/CategoryFormModal";
import EquipmentFormModal from "@/components/admin/EquipmentFormModal";
import VisitsChart from "@/components/admin/VisitsChart";
import ImageUpload from "@/components/admin/ImageUpload";
import ToolSelector from "@/components/admin/ToolSelector";
import type { Contact, Coworker } from "@/lib/blob";
import type { Equipment } from "@/data/equipment";
import type { Category, Subcategory } from "@/types/category";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const staticIds = new Set(staticArtworks.map((a) => a.id));

const RU_MONTHS = ["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"];
const EN_MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function formatCreatedAt(iso: string, locale: string): { date: string; time: string } {
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

function EyeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 14" fill="none">
      <path
        d="M10 0C5.5 0 1.73 2.89 0 7c1.73 4.11 5.5 7 10 7s8.27-2.89 10-7c-1.73-4.11-5.5-7-10-7zm0 11.67A4.67 4.67 0 1 1 10 2.33a4.67 4.67 0 0 1 0 9.34zM10 4a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"
        fill="currentColor"
      />
    </svg>
  );
}

function ClickIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
      <path d="M6.111 11.8891C3.96311 9.7412 3.96311 6.2588 6.111 4.11091C8.25888 1.96303 11.7413 1.96303 13.8892 4.11091C14.9633 5.185 15.5001 6.59127 15.5001 8C15.5001 8.41421 15.8359 8.75 16.2501 8.75C16.6643 8.75 17.0001 8.41421 17.0001 8C17.0001 6.2097 16.3165 4.41694 14.9498 3.05025C12.2162 0.316582 7.78401 0.316582 5.05034 3.05025C2.31667 5.78392 2.31667 10.2161 5.05034 12.9497C5.34323 13.2426 5.8181 13.2426 6.111 12.9497C6.40389 12.6569 6.40389 12.182 6.111 11.8891Z" />
      <path d="M8.23235 6.23223C7.25604 7.20854 7.25604 8.79146 8.23235 9.76777C8.52525 10.0607 8.52525 10.5355 8.23235 10.8284C7.93946 11.1213 7.46459 11.1213 7.17169 10.8284C5.60959 9.26633 5.60959 6.73367 7.17169 5.17157C8.73379 3.60948 11.2664 3.60948 12.8285 5.17157C13.6094 5.95247 14.0001 6.97747 14.0001 8C14.0001 8.41421 13.6643 8.75 13.2501 8.75C12.8359 8.75 12.5001 8.41421 12.5001 8C12.5001 7.35903 12.2562 6.72054 11.7679 6.23223C10.7916 5.25592 9.20866 5.25592 8.23235 6.23223Z" />
      <path d="M10.7657 7.51062C10.5871 7.24492 10.2596 7.12184 9.95029 7.20417C9.64095 7.2865 9.41795 7.5561 9.3951 7.8754L8.90409 14.7363C8.88303 15.0306 9.0365 15.3099 9.29622 15.4499C9.55595 15.59 9.87365 15.5647 10.108 15.3854L11.1508 14.5873L12.1363 18.2653C12.2436 18.6654 12.6548 18.9028 13.0549 18.7956C13.455 18.6884 13.6924 18.2771 13.5852 17.877L12.6083 14.2312L13.9005 14.4349C14.1951 14.4814 14.4893 14.3489 14.6497 14.0974C14.8101 13.846 14.8062 13.5233 14.6398 13.2758L10.7657 7.51062Z" />
    </svg>
  );
}

function ArtworkStatRow({
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
      {/* Thumbnail */}
      <div className="relative w-[52px] h-[52px] shrink-0 bg-bg-dark overflow-hidden">
        <Image
          src={artwork.thumbnail || artwork.image}
          alt={artwork.title[locale]}
          fill
          className="object-cover"
          sizes="52px"
        />
      </div>

      {/* Info */}
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

      {/* Separator */}
      <span className="w-px h-[32px] bg-bg-dark shrink-0" />

      {/* Views */}
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

      {/* Separator */}
      <span className="w-px h-[32px] bg-bg-dark shrink-0" />

      {/* Date */}
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

      {/* Separator */}
      <span className="w-px h-[32px] bg-bg-dark shrink-0" />

      {/* Versions */}
      <div className="shrink-0 w-[60px]">
        <p className="text-[12px] font-bold tracking-[1.2px] text-text-light">
          {artwork.sketch ? "F+S" : "F"}
        </p>
      </div>

      {/* Separator */}
      <span className="w-px h-[32px] bg-bg-dark shrink-0" />

      {/* Spacer */}
      <div className="flex-1" />

      {/* Edit */}
      <button
        onClick={(e) => { e.stopPropagation(); onEdit(); }}
        className="shrink-0 w-[16px] h-[16px] flex items-center justify-center text-text-light hover:text-text-muted transition-colors"
        title="Edit"
      >
        <svg width="16" height="16" viewBox="0 0 20 19.9025" fill="none">
          <path
            d="M12.4365 3.32148L16.5049 7.38989L6.20657 17.6883L2.14042 13.6198L12.4365 3.32148ZM19.5921 2.34027L17.7777 0.525894C17.0765 -0.175298 15.938 -0.175298 15.2344 0.525894L13.4964 2.26388L17.5648 6.33233L19.5921 4.30507C20.136 3.76118 20.136 2.88411 19.5921 2.34027ZM0.0113215 19.3383C-0.0627191 19.6716 0.238132 19.9701 0.571391 19.8891L5.105 18.7899L1.03885 14.7215L0.0113215 19.3383Z"
            fill="currentColor"
          />
        </svg>
      </button>

      {/* Hide/Show */}
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

      {/* Delete */}
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

function AddArtworkButton({
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

const SOCIAL_ICONS: Record<string, string> = {
  youtube: "YT", vk: "VK", instagram: "IG", telegram: "TG",
  artstation: "AS", behance: "BE", deviantart: "DA",
};

function ContactRow({ contact, onEdit, onDeleted, artworks, onArtworkClick, onCreateArtwork, totalViews, totalClicks }: {
  contact: Contact;
  onEdit: () => void;
  onDeleted: (id: string) => void;
  artworks: Artwork[];
  onArtworkClick: (artwork: Artwork) => void;
  onCreateArtwork: () => void;
  totalViews: number;
  totalClicks: number;
}) {
  const t = useTranslations("admin");
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Delete "${contact.clientName}"?`)) return;
    setDeleting(true);
    try {
      await fetch("/api/contacts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: contact.id }),
      });
      onDeleted(contact.id);
    } catch {
      setDeleting(false);
    }
  };

  const thumbsRef = React.useRef<HTMLDivElement>(null);
  const [slotsPerRow, setSlotsPerRow] = React.useState(4);
  const [itemSize, setItemSize] = React.useState(104);

  React.useEffect(() => {
    const el = thumbsRef.current;
    if (!el) return;
    const gap = 10, pad = 10, minItem = 90;
    const update = () => {
      const available = el.clientWidth - pad * 2;
      const cols = Math.floor((available + gap) / (minItem + gap)) || 1;
      const size = (available - (cols - 1) * gap) / cols;
      setSlotsPerRow(cols);
      setItemSize(Math.floor(size));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const rows = Math.max(1, Math.ceil(artworks.length / slotsPerRow));
  const slotCount = rows * slotsPerRow;

  return (
    <div className="bg-bg-dark">
      {/* Top row — info + actions */}
      <div className="flex items-center gap-[16px] px-[16px] py-[12px] bg-white">
        {/* Avatar */}
        <div className="relative w-[52px] h-[52px] shrink-0 rounded-full overflow-hidden bg-bg-dark flex items-center justify-center">
          {contact.clientAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={contact.clientAvatar} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-[18px] font-bold text-text-light">
              {contact.clientName.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold tracking-[1.5px] text-text-muted uppercase truncate">
            {contact.clientName}
          </p>
          {(contact.clientRole || contact.client) && (
            <p className="text-[12px] font-medium tracking-[1.2px] text-text-light uppercase mt-[2px] truncate">
              {[contact.clientRole, contact.client].filter(Boolean).join(" · ")}
            </p>
          )}
          {contact.clientSocials && contact.clientSocials.length > 0 && (
            <div className="flex gap-[6px] mt-[4px]">
              {contact.clientSocials.map((s, i) => (
                <span key={i} className="text-[12px] font-bold tracking-[1px] text-text-light bg-bg px-[5px] py-[1px]">
                  {SOCIAL_ICONS[s.icon] ?? s.icon.toUpperCase()}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-[12px] shrink-0">
          {/* Artworks count */}
          <div className="flex items-center gap-[5px] text-text-light">
            <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
              <path d="M1 3.5A1.5 1.5 0 0 1 2.5 2h15A1.5 1.5 0 0 1 19 3.5v13a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 1 16.5v-13ZM3 5v10l4-4 3 3 4-5 3 3.5V5H3Z" />
            </svg>
            <span className="text-[13px] font-bold tracking-[0.5px]">{artworks.length}</span>
          </div>

          <span className="w-px h-[20px] bg-bg-dark shrink-0" />

          {/* Views */}
          <div className="flex items-center gap-[5px] text-text-light">
            <EyeIcon />
            <span className="text-[13px] font-bold tracking-[0.5px]">{totalViews}</span>
          </div>

          <span className="w-px h-[20px] bg-bg-dark shrink-0" />

          {/* Clicks */}
          <div className="flex items-center gap-[5px] text-text-light">
            <ClickIcon />
            <span className="text-[13px] font-bold tracking-[0.5px]">{totalClicks}</span>
          </div>
        </div>

        <span className="w-px h-[32px] bg-bg-dark shrink-0" />

        {/* Edit */}
        <button
          onClick={onEdit}
          className="shrink-0 w-[16px] h-[16px] flex items-center justify-center text-text-light hover:text-text-muted transition-colors"
          title="Edit"
        >
          <svg width="16" height="16" viewBox="0 0 20 19.9025" fill="none">
            <path d="M12.4365 3.32148L16.5049 7.38989L6.20657 17.6883L2.14042 13.6198L12.4365 3.32148ZM19.5921 2.34027L17.7777 0.525894C17.0765 -0.175298 15.938 -0.175298 15.2344 0.525894L13.4964 2.26388L17.5648 6.33233L19.5921 4.30507C20.136 3.76118 20.136 2.88411 19.5921 2.34027ZM0.0113215 19.3383C-0.0627191 19.6716 0.238132 19.9701 0.571391 19.8891L5.105 18.7899L1.03885 14.7215L0.0113215 19.3383Z" fill="currentColor" />
          </svg>
        </button>

        {/* Delete */}
        <button
          onClick={handleDelete}
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

      {/* Bottom row — artwork thumbnails + placeholders */}
      <div ref={thumbsRef} className="grid gap-[10px] p-[10px] bg-bg-dark overflow-y-auto" style={{ gridTemplateColumns: `repeat(${slotsPerRow}, 1fr)`, maxHeight: 20 + itemSize * 2 + 10 }}>
        {Array.from({ length: slotCount }, (_, i) => {
          const artwork = artworks[i];
          if (artwork) {
            return (
              <button
                key={artwork.id}
                onClick={(e) => { e.stopPropagation(); onArtworkClick(artwork); }}
                className="relative aspect-square overflow-hidden bg-bg-dark hover:brightness-75 transition-all"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={artwork.thumbnail || artwork.image}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </button>
            );
          }
          if (i === artworks.length) {
            return (
              <button
                key="add-artwork"
                onClick={onCreateArtwork}
                className="aspect-square border-2 border-dashed border-text-light flex items-center justify-center text-text-light hover:border-text-muted hover:text-text-muted transition-colors"
              >
                <svg width="24" height="24" viewBox="0 0 16 16" fill="none">
                  <path d="M8 1v14M1 8h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            );
          }
          return (
            <div
              key={`placeholder-${i}`}
              className="aspect-square border border-dashed border-text-light"
            />
          );
        })}
      </div>
    </div>
  );
}

function CoworkerRow({ coworker, onEdit, onDeleted, artworks, onArtworkClick, totalViews, totalClicks }: {
  coworker: Coworker;
  onEdit: () => void;
  onDeleted: (id: string) => void;
  artworks: Artwork[];
  onArtworkClick: (artwork: Artwork) => void;
  totalViews: number;
  totalClicks: number;
}) {
  const t = useTranslations("admin");
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Delete "${coworker.name}"?`)) return;
    setDeleting(true);
    try {
      await fetch("/api/coworkers", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: coworker.id }),
      });
      onDeleted(coworker.id);
    } catch {
      setDeleting(false);
    }
  };

  const thumbsRef = React.useRef<HTMLDivElement>(null);
  const [slotsPerRow, setSlotsPerRow] = React.useState(4);
  const [itemSize, setItemSize] = React.useState(104);

  React.useEffect(() => {
    const el = thumbsRef.current;
    if (!el) return;
    const gap = 10, pad = 10, minItem = 90;
    const update = () => {
      const available = el.clientWidth - pad * 2;
      const cols = Math.floor((available + gap) / (minItem + gap)) || 1;
      const size = (available - (cols - 1) * gap) / cols;
      setSlotsPerRow(cols);
      setItemSize(Math.floor(size));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const rows = Math.max(1, Math.ceil(artworks.length / slotsPerRow));
  const slotCount = rows * slotsPerRow;

  return (
    <div className="bg-bg-dark">
      {/* Top row — info + actions */}
      <div className="flex items-center gap-[16px] px-[16px] py-[12px] bg-white">
        <div className="relative w-[52px] h-[52px] shrink-0 rounded-full overflow-hidden bg-bg-dark flex items-center justify-center">
          {coworker.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coworker.avatar} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-[18px] font-bold text-text-light">
              {coworker.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold tracking-[1.5px] text-text-muted uppercase truncate">
            {coworker.name}
          </p>
          {coworker.role && (
            <p className="text-[12px] font-medium tracking-[1.2px] text-text-light uppercase mt-[2px] truncate">
              {coworker.role}
            </p>
          )}
          {coworker.socials && coworker.socials.length > 0 && (
            <div className="flex gap-[6px] mt-[4px]">
              {coworker.socials.map((s, i) => (
                <span key={i} className="text-[12px] font-bold tracking-[1px] text-text-light bg-bg px-[5px] py-[1px]">
                  {SOCIAL_ICONS[s.icon] ?? s.icon.toUpperCase()}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-[12px] shrink-0">
          <div className="flex items-center gap-[5px] text-text-light">
            <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
              <path d="M1 3.5A1.5 1.5 0 0 1 2.5 2h15A1.5 1.5 0 0 1 19 3.5v13a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 1 16.5v-13ZM3 5v10l4-4 3 3 4-5 3 3.5V5H3Z" />
            </svg>
            <span className="text-[13px] font-bold tracking-[0.5px]">{artworks.length}</span>
          </div>
          <span className="w-px h-[20px] bg-bg-dark shrink-0" />
          <div className="flex items-center gap-[5px] text-text-light">
            <EyeIcon />
            <span className="text-[13px] font-bold tracking-[0.5px]">{totalViews}</span>
          </div>
          <span className="w-px h-[20px] bg-bg-dark shrink-0" />
          <div className="flex items-center gap-[5px] text-text-light">
            <ClickIcon />
            <span className="text-[13px] font-bold tracking-[0.5px]">{totalClicks}</span>
          </div>
        </div>

        <span className="w-px h-[32px] bg-bg-dark shrink-0" />

        <button
          onClick={onEdit}
          className="shrink-0 w-[16px] h-[16px] flex items-center justify-center text-text-light hover:text-text-muted transition-colors"
          title="Edit"
        >
          <svg width="16" height="16" viewBox="0 0 20 19.9025" fill="none">
            <path d="M12.4365 3.32148L16.5049 7.38989L6.20657 17.6883L2.14042 13.6198L12.4365 3.32148ZM19.5921 2.34027L17.7777 0.525894C17.0765 -0.175298 15.938 -0.175298 15.2344 0.525894L13.4964 2.26388L17.5648 6.33233L19.5921 4.30507C20.136 3.76118 20.136 2.88411 19.5921 2.34027ZM0.0113215 19.3383C-0.0627191 19.6716 0.238132 19.9701 0.571391 19.8891L5.105 18.7899L1.03885 14.7215L0.0113215 19.3383Z" fill="currentColor" />
          </svg>
        </button>

        <button
          onClick={handleDelete}
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

      {/* Bottom row — artwork thumbnails */}
      <div ref={thumbsRef} className="grid gap-[10px] p-[10px] bg-bg-dark overflow-y-auto" style={{ gridTemplateColumns: `repeat(${slotsPerRow}, 1fr)`, maxHeight: 20 + itemSize * 2 + 10 }}>
        {Array.from({ length: slotCount }, (_, i) => {
          const artwork = artworks[i];
          if (artwork) {
            return (
              <button
                key={artwork.id}
                onClick={(e) => { e.stopPropagation(); onArtworkClick(artwork); }}
                className="relative aspect-square overflow-hidden bg-bg-dark hover:brightness-75 transition-all"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={artwork.thumbnail || artwork.image}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </button>
            );
          }
          return (
            <div
              key={`placeholder-${i}`}
              className="aspect-square border border-dashed border-text-light"
            />
          );
        })}
      </div>
    </div>
  );
}

const sections = [{ key: "statistic" }, { key: "categories" }, { key: "contacts" }, { key: "coworkers" }, { key: "settings" }] as const;

const DRAG_HANDLE_SVG = (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
    <circle cx="2" cy="2" r="2" />
    <circle cx="8" cy="2" r="2" />
    <circle cx="2" cy="8" r="2" />
    <circle cx="8" cy="8" r="2" />
  </svg>
);

const EDIT_SVG_16 = (
  <svg width="16" height="16" viewBox="0 0 20 19.9025" fill="none">
    <path d="M12.4365 3.32148L16.5049 7.38989L6.20657 17.6883L2.14042 13.6198L12.4365 3.32148ZM19.5921 2.34027L17.7777 0.525894C17.0765 -0.175298 15.938 -0.175298 15.2344 0.525894L13.4964 2.26388L17.5648 6.33233L19.5921 4.30507C20.136 3.76118 20.136 2.88411 19.5921 2.34027ZM0.0113215 19.3383C-0.0627191 19.6716 0.238132 19.9701 0.571391 19.8891L5.105 18.7899L1.03885 14.7215L0.0113215 19.3383Z" fill="currentColor" />
  </svg>
);

const BUILT_IN_ICONS = ["artstation", "behance", "deviantart", "instagram", "telegram", "tumblr", "vk", "youtube"];

function SortableSocialRow({
  id,
  social: s,
  index: i,
  onUpdate,
  onRemove,
}: {
  id: string;
  social: { name: string; url: string; icon: string };
  index: number;
  onUpdate: (idx: number, updated: { name: string; url: string; icon: string }) => void;
  onRemove: (idx: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  const isBuiltIn = BUILT_IN_ICONS.some((ic) => s.icon === `/images/social/${ic}.svg`);

  return (
    <div ref={setNodeRef} style={style} className="flex gap-2 items-center">
      <span
        {...attributes}
        {...listeners}
        className="cursor-grab text-text-light hover:text-text-muted shrink-0 touch-none"
      >
        {DRAG_HANDLE_SVG}
      </span>
      {/* Icon — click to upload custom SVG */}
      <div
        className="w-[30px] h-[30px] shrink-0 border border-text-light flex items-center justify-center cursor-pointer hover:border-text-muted transition-colors relative"
        onClick={() => document.getElementById(`social-icon-input-${i}`)?.click()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={s.icon} alt={s.name} className="w-[18px] h-[18px] object-contain" />
        <input
          id={`social-icon-input-${i}`}
          type="file"
          accept="image/svg+xml,image/*"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const fd = new FormData();
            fd.append("file", file);
            const res = await fetch("/api/upload", { method: "POST", body: fd });
            if (!res.ok) return;
            const { url } = await res.json();
            onUpdate(i, { ...s, icon: url });
            e.target.value = "";
          }}
        />
      </div>
      {/* Preset picker */}
      <select
        className="h-[30px] border border-text-light text-sm outline-none px-1 shrink-0"
        value={isBuiltIn ? s.icon : "__custom"}
        onChange={(e) => {
          if (e.target.value === "__custom") return;
          onUpdate(i, { ...s, icon: e.target.value });
        }}
      >
        {BUILT_IN_ICONS.map((ic) => (
          <option key={ic} value={`/images/social/${ic}.svg`}>{ic}</option>
        ))}
        {!isBuiltIn && <option value="__custom">custom</option>}
      </select>
      {/* Name */}
      <input
        className="w-[90px] shrink-0 h-[30px] border border-text-light pl-3 pr-3 text-sm outline-none focus:border-text transition-colors"
        value={s.name}
        onChange={(e) => onUpdate(i, { ...s, name: e.target.value })}
        placeholder="Name"
      />
      {/* URL */}
      <input
        className="flex-1 h-[30px] border border-text-light pl-3 pr-3 text-sm outline-none focus:border-text transition-colors"
        value={s.url}
        onChange={(e) => onUpdate(i, { ...s, url: e.target.value })}
        placeholder="https://..."
      />
      {/* Remove */}
      <button
        type="button"
        onClick={() => onRemove(i)}
        className="text-text-light hover:text-text-muted text-sm shrink-0"
      >
        ✕
      </button>
    </div>
  );
}

// Sortable row for a subcategory
function SortableSubcategoryRow({
  sub,
  locale,
  onEdit,
  viewCount,
  artworkCount,
}: {
  sub: Subcategory;
  locale: "ru" | "en";
  onEdit: () => void;
  viewCount?: { total: number; recent: number };
  artworkCount: number;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: sub.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-[12px] bg-bg px-[16px] py-[8px]"
    >
      <span
        {...attributes}
        {...listeners}
        className="cursor-grab text-text-light hover:text-text-muted shrink-0 touch-none"
        title="Drag"
      >
        {DRAG_HANDLE_SVG}
      </span>
      <div className="w-[220px] shrink-0 min-w-0">
        <p className="text-[12px] font-bold tracking-[1.2px] text-text-muted uppercase truncate">
          — {sub.label[locale]}
        </p>
        <p className="text-[12px] text-text-light tracking-[1px] uppercase mt-[1px]">{sub.id}</p>
      </div>
      <span className="w-px h-[24px] bg-bg-dark shrink-0" />
      <div className="flex items-center gap-[16px] shrink-0 w-[120px] justify-end">
        {viewCount && viewCount.recent > 0 && (
          <span className="text-[13px] font-bold tracking-[0.5px]" style={{ color: "#81AB41" }}>
            +{viewCount.recent}
          </span>
        )}
        <div className="flex items-center gap-[5px] text-text-light">
          <EyeIcon />
          <span className="text-[13px] font-bold tracking-[0.5px]">{viewCount?.total ?? 0}</span>
        </div>
      </div>
      <span className="w-px h-[24px] bg-bg-dark shrink-0" />
      {/* Artwork count */}
      <div className="w-[80px] shrink-0 text-[13px] font-bold tracking-[0.5px] text-text-light text-right">
        {artworkCount}
      </div>
      <span className="w-px h-[24px] bg-bg-dark shrink-0" />
      {/* Date */}
      <div className="w-[130px] shrink-0">
        {sub.createdAt && (() => {
          const { date, time } = formatCreatedAt(sub.createdAt, locale);
          return (
            <>
              <p className="text-[12px] font-medium tracking-[1.2px] text-text-light">{date}</p>
              <p className="text-[12px] font-medium tracking-[1.2px] text-text-light mt-[2px]">{time}</p>
            </>
          );
        })()}
      </div>
      <span className="w-px h-[24px] bg-bg-dark shrink-0" />
      <div className="flex-1" />
      <button
        onClick={onEdit}
        className="shrink-0 w-[14px] h-[14px] flex items-center justify-center text-text-light hover:text-text-muted transition-colors"
        title="Edit subcategory"
      >
        <svg width="14" height="14" viewBox="0 0 20 19.9025" fill="none">
          <path d="M12.4365 3.32148L16.5049 7.38989L6.20657 17.6883L2.14042 13.6198L12.4365 3.32148ZM19.5921 2.34027L17.7777 0.525894C17.0765 -0.175298 15.938 -0.175298 15.2344 0.525894L13.4964 2.26388L17.5648 6.33233L19.5921 4.30507C20.136 3.76118 20.136 2.88411 19.5921 2.34027ZM0.0113215 19.3383C-0.0627191 19.6716 0.238132 19.9701 0.571391 19.8891L5.105 18.7899L1.03885 14.7215L0.0113215 19.3383Z" fill="currentColor" />
        </svg>
      </button>
    </div>
  );
}

// Sortable row for a category in the cabinet panel
function SortableCategoryRow({
  category,
  locale,
  expanded,
  onToggle,
  onEdit,
  onEditSub,
  onAddSub,
  onReorderSubs,
  categoryViewCounts,
  artworkCounts,
}: {
  category: Category;
  locale: "ru" | "en";
  expanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onEditSub: (sub: Subcategory) => void;
  onAddSub: () => void;
  onReorderSubs: (reordered: Subcategory[]) => void;
  categoryViewCounts: Record<string, { total: number; recent: number }>;
  artworkCounts: Record<string, number>;
}) {
  const t = useTranslations("admin");
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: category.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  const subSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleSubDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = category.subcategories.findIndex((s) => s.id === active.id);
    const newIndex = category.subcategories.findIndex((s) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onReorderSubs(arrayMove(category.subcategories, oldIndex, newIndex));
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div className="flex items-center gap-[12px] bg-white px-[16px] py-[10px]">
        {/* Drag handle */}
        <span
          {...attributes}
          {...listeners}
          className="cursor-grab text-text-light hover:text-text-muted shrink-0 touch-none"
          title="Drag"
        >
          {DRAG_HANDLE_SVG}
        </span>

        {/* Expand subs arrow */}
        <button
          onClick={onToggle}
          className="shrink-0 text-text-light hover:text-text-muted transition-colors text-[12px]"
          title="Expand subcategories"
        >
          {expanded ? "▲" : "▼"}
        </button>

        {/* Preview */}
        {category.preview ? (
          <div className="relative w-[40px] h-[40px] shrink-0 overflow-hidden bg-bg-dark">
            <Image src={category.preview} alt="" fill className="object-cover" sizes="40px" />
          </div>
        ) : (
          <div className="w-[40px] h-[40px] shrink-0 bg-bg-dark" />
        )}

        {/* Label */}
        <div className="w-[200px] shrink-0 min-w-0">
          <p className="text-[13px] font-bold tracking-[1.5px] text-text-muted uppercase truncate">
            {category.label[locale]}
          </p>
          <p className="text-[12px] text-text-light tracking-[1px] uppercase mt-[1px]">
            {category.id}
          </p>
        </div>

        <span className="w-px h-[32px] bg-bg-dark shrink-0" />
        <div className="flex items-center gap-[16px] shrink-0 w-[120px] justify-end">
          {categoryViewCounts[category.id]?.recent > 0 && (
            <span className="text-[13px] font-bold tracking-[0.5px]" style={{ color: "#81AB41" }}>
              +{categoryViewCounts[category.id].recent}
            </span>
          )}
          <div className="flex items-center gap-[5px] text-text-light">
            <EyeIcon />
            <span className="text-[13px] font-bold tracking-[0.5px]">{categoryViewCounts[category.id]?.total ?? 0}</span>
          </div>
        </div>
        <span className="w-px h-[32px] bg-bg-dark shrink-0" />

        {/* Artwork count */}
        <div className="w-[80px] shrink-0 text-[13px] font-bold tracking-[0.5px] text-text-light text-right">
          {artworkCounts[category.id] ?? 0}
        </div>
        <span className="w-px h-[32px] bg-bg-dark shrink-0" />

        {/* Date */}
        <div className="w-[130px] shrink-0">
          {category.createdAt && (() => {
            const { date, time } = formatCreatedAt(category.createdAt, locale);
            return (
              <>
                <p className="text-[12px] font-medium tracking-[1.2px] text-text-light">{date}</p>
                <p className="text-[12px] font-medium tracking-[1.2px] text-text-light mt-[2px]">{time}</p>
              </>
            );
          })()}
        </div>
        <span className="w-px h-[32px] bg-bg-dark shrink-0" />

        <div className="flex-1" />

        {/* Edit */}
        <button
          onClick={onEdit}
          className="shrink-0 w-[16px] h-[16px] flex items-center justify-center text-text-light hover:text-text-muted transition-colors"
          title="Edit"
        >
          {EDIT_SVG_16}
        </button>
      </div>

      {/* Subcategories */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-[2px] pl-[56px] pb-[4px]">
              <DndContext
                sensors={subSensors}
                collisionDetection={closestCenter}
                onDragEnd={handleSubDragEnd}
              >
                <SortableContext
                  items={category.subcategories.map((s) => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {category.subcategories.map((sub) => (
                    <SortableSubcategoryRow
                      key={sub.id}
                      sub={sub}
                      locale={locale}
                      onEdit={() => onEditSub(sub)}
                      viewCount={categoryViewCounts[`${category.id}/${sub.id}`]}
                      artworkCount={artworkCounts[`${category.id}/${sub.id}`] ?? 0}
                    />
                  ))}
                </SortableContext>
              </DndContext>
              <button
                onClick={onAddSub}
                className="flex items-center gap-[6px] px-[16px] py-[6px] text-[12px] font-bold tracking-[1.8px] uppercase text-text-light hover:text-text-muted transition-colors"
              >
                + {t("addSubcategory")}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Contact Views Chart ─────────────────────────────────────────── */

type CVPeriod = "day" | "week" | "month" | "year";
type CVBucket = { label: string; count: number };
type CVContact = { id: string; name: string; totalViews: number; buckets: CVBucket[] };
const CV_PERIODS: CVPeriod[] = ["day", "week", "month", "year"];
const CV_CHART_H = 160;
const CV_LABEL_H = 16;
const CV_Y_LABEL_W = 32;
const CV_COLORS = ["#81AB41", "#E8913A", "#5B8DEF", "#E85B8D", "#8B5CF6", "#14B8A6", "#F59E0B", "#EF4444"];

function ContactViewsChart() {
  const t = useTranslations("admin");
  const [mounted, setMounted] = useState(false);
  const [period, setPeriod] = useState<CVPeriod>("week");
  const [data, setData] = useState<CVContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const chartRef = useRef<HTMLDivElement>(null);
  const [chartW, setChartW] = useState(600);

  useEffect(() => setMounted(true), []);

  useLayoutEffect(() => {
    const el = chartRef.current;
    if (!el) return;
    setChartW(el.clientWidth);
    const ro = new ResizeObserver(() => setChartW(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, [mounted]);

  useEffect(() => {
    if (!selectedId) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("[data-cv-sidebar]") || target.closest("[data-cv-periods]")) return;
      setSelectedId(null);
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [selectedId]);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/stats/views-by-contact?period=${period}`)
      .then((r) => r.json())
      .then((d: { contacts: CVContact[] }) => { setData(d.contacts); setLoading(false); })
      .catch(() => setLoading(false));
  }, [period]);

  const selected = selectedId ? data.find((c) => c.id === selectedId) : null;
  const chartData = selected ? [selected] : data.slice(0, 3);
  const total = data.reduce((s, c) => s + c.totalViews, 0);
  const n = chartData.length > 0 ? chartData[0].buckets.length : 0;
  const gap = n > 20 ? 2 : n > 10 ? 3 : 6;
  const barW = n > 0 ? Math.max(1, (chartW - gap * (n - 1)) / n) : 0;
  const labelEvery = n <= 12 ? 1 : n <= 24 ? 2 : 5;

  // Global max across all contacts
  const globalMax = Math.max(
    ...chartData.flatMap((c) => c.buckets.map((b) => b.count)),
    1,
  );

  const peakY = (count: number) =>
    CV_CHART_H - Math.max(count > 0 ? 2 : 0, Math.round((count / globalMax) * CV_CHART_H));

  const makePoints = (buckets: CVBucket[]) =>
    buckets.map((b, i) => `${i * (barW + gap) + barW / 2},${peakY(b.count)}`).join(" ");

  const makeFillPath = (buckets: CVBucket[]) => {
    if (buckets.length < 2) return "";
    const firstCx = barW / 2;
    const lastCx = (buckets.length - 1) * (barW + gap) + barW / 2;
    const pts = buckets.map((b, i) => `${i * (barW + gap) + barW / 2},${peakY(b.count)}`).join(" L ");
    return `M ${firstCx},${CV_CHART_H} L ${pts} L ${lastCx},${CV_CHART_H} Z`;
  };

  const gridLevels = [1 / 3, 2 / 3, 1].map((frac) => ({
    frac,
    svgY: CV_CHART_H - Math.round(frac * CV_CHART_H),
    pxY: (1 - frac) * CV_CHART_H,
    value: Math.round(frac * globalMax),
  }));

  const labels = chartData.length > 0 ? chartData[0].buckets : [];

  const verticalXs = labels
    .map((_, i) => (i % labelEvery === 0 ? i * (barW + gap) + barW / 2 : null))
    .filter((x): x is number => x !== null);
  const vBandEdges = [0, ...verticalXs, chartW];
  const vBands = vBandEdges.slice(0, -1).map((x1, i) => ({ x1, x2: vBandEdges[i + 1], fill: i % 2 === 0 }));

  const handleMouseMove = (e: React.MouseEvent<SVGRectElement>) => {
    const svgEl = e.currentTarget.closest("svg")!;
    const rect = svgEl.getBoundingClientRect();
    const svgX = (e.clientX - rect.left) * (chartW / rect.width);
    const idx = Math.max(0, Math.min(n - 1, Math.round((svgX - barW / 2) / (barW + gap))));
    setHoveredIdx(idx);
  };

  const hoveredCx = hoveredIdx !== null ? hoveredIdx * (barW + gap) + barW / 2 : 0;

  if (!mounted) return null;

  return (
    <div className="border border-border mb-[4px] overflow-hidden">
      <div className="flex max-h-[260px]">
        {/* Chart section */}
        <div className="w-2/3 min-w-0 px-[20px] py-[16px]">
          {/* Total + period switcher */}
          <div className="flex items-center justify-between mb-[16px]">
            <div className="flex items-center gap-[8px]">
              <span className="text-text-muted flex items-center">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" /><path fillRule="evenodd" d="M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113-1.487 4.471-5.705 7.697-10.677 7.697-4.97 0-9.186-3.223-10.675-7.69a1.762 1.762 0 0 1 0-1.113ZM17.25 12a5.25 5.25 0 1 1-10.5 0 5.25 5.25 0 0 1 10.5 0Z" clipRule="evenodd" /></svg>
              </span>
              <span className="text-[26px] font-bold tracking-tight text-text-muted">
                {loading ? "—" : total.toLocaleString()}
              </span>
              <span className="text-[12px] font-bold tracking-[2px] uppercase text-text-light">
                VIEWS BY CLIENTS
              </span>
            </div>
            <div className="flex items-center gap-[12px]" data-cv-periods>
              {CV_PERIODS.map((p, i) => (
                <React.Fragment key={p}>
                  {i > 0 && <span className="w-px h-[1em] bg-text-light/40 self-center" />}
                  <button
                    onClick={() => setPeriod(p)}
                    className={`text-[12px] font-bold tracking-[1.8px] uppercase transition-colors ${
                      period === p ? "text-text-muted" : "text-text-light hover:text-text-muted"
                    }`}
                  >
                    {t(`period.${p}`)}
                  </button>
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Chart */}
          {loading ? (
            <div style={{ height: CV_CHART_H + CV_LABEL_H + 4 }} className="flex items-center justify-center">
              <span className="text-[12px] text-text-light tracking-[2px] uppercase animate-pulse">...</span>
            </div>
          ) : (
            <div className="flex">
              {/* Y-axis labels */}
              <div className="relative shrink-0" style={{ width: CV_Y_LABEL_W, height: CV_CHART_H }}>
                {gridLevels.map(({ frac, pxY, value }) => (
                  <span
                    key={frac}
                    className="absolute right-[6px] text-[12px] font-bold text-text-light leading-none -translate-y-1/2"
                    style={{ top: pxY }}
                  >
                    {value}
                  </span>
                ))}
              </div>

              {/* Chart area */}
              <div className="flex-1 min-w-0 relative" ref={chartRef}>
                <svg
                  viewBox={`0 0 ${chartW} ${CV_CHART_H}`}
                  width="100%"
                  preserveAspectRatio="none"
                  overflow="visible"
                  style={{ display: "block", height: CV_CHART_H }}
                >
                  <defs>
                    {chartData.map((contact, ci) => (
                      <linearGradient
                        key={contact.id}
                        id={`cvFill-${ci}`}
                        x1="0" y1="0" x2="0" y2={CV_CHART_H}
                        gradientUnits="userSpaceOnUse"
                      >
                        <stop offset="0%" stopColor={CV_COLORS[ci % CV_COLORS.length]} stopOpacity="0.15" />
                        <stop offset="100%" stopColor={CV_COLORS[ci % CV_COLORS.length]} stopOpacity="0" />
                      </linearGradient>
                    ))}
                  </defs>

                  {vBands.filter((b) => b.fill).map((b, i) => (
                    <rect key={i} x={b.x1} y={0} width={b.x2 - b.x1} height={CV_CHART_H} fill="var(--color-text-muted)" fillOpacity="0.06" />
                  ))}

                  {gridLevels.map(({ frac, svgY }) => (
                    <line key={frac} x1={0} y1={svgY} x2={chartW} y2={svgY} stroke="var(--color-border)" strokeWidth="1" strokeDasharray="2 3" />
                  ))}

                  {labels.map((_, i) => {
                    if (i % labelEvery !== 0) return null;
                    const cx = i * (barW + gap) + barW / 2;
                    return <line key={i} x1={cx} y1={0} x2={cx} y2={CV_CHART_H} stroke="var(--color-border)" strokeWidth="0.5" />;
                  })}

                  {/* Fill + polyline per contact */}
                  {chartData.map((contact, ci) => {
                    const color = CV_COLORS[ci % CV_COLORS.length];
                    const fillPath = makeFillPath(contact.buckets);
                    const points = makePoints(contact.buckets);
                    return (
                      <React.Fragment key={contact.id}>
                        {fillPath && <path d={fillPath} fill={`url(#cvFill-${ci})`} />}
                        {contact.buckets.length > 1 && (
                          <polyline
                            points={points}
                            fill="none"
                            stroke={color}
                            strokeWidth="2"
                            strokeLinejoin="round"
                            strokeLinecap="round"
                            vectorEffect="non-scaling-stroke"
                          />
                        )}
                      </React.Fragment>
                    );
                  })}

                  {/* Hover vertical line */}
                  {hoveredIdx !== null && (
                    <line x1={hoveredCx} y1={0} x2={hoveredCx} y2={CV_CHART_H} stroke="var(--color-text-light)" strokeWidth="1" />
                  )}

                  <rect
                    x={0} y={0} width={chartW} height={CV_CHART_H}
                    fill="transparent"
                    style={{ cursor: "crosshair" }}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={() => setHoveredIdx(null)}
                  />
                </svg>

                {/* Dots on lines */}
                {hoveredIdx !== null && chartData.map((contact, ci) => {
                  const val = contact.buckets[hoveredIdx]?.count ?? 0;
                  if (val === 0) return null;
                  const cy = peakY(val);
                  return (
                    <div
                      key={contact.id}
                      className="absolute pointer-events-none z-10"
                      style={{
                        left: `${(hoveredCx / chartW) * 100}%`,
                        top: cy,
                        transform: "translate(-50%, -50%)",
                      }}
                    >
                      <div className="w-[8px] h-[8px] rounded-full" style={{ background: CV_COLORS[ci % CV_COLORS.length] }} />
                    </div>
                  );
                })}

                {/* Tooltip */}
                {hoveredIdx !== null && chartData.length > 0 && (
                  <div
                    className="absolute pointer-events-none z-10"
                    style={{
                      left: `${(hoveredCx / chartW) * 100}%`,
                      top: 0,
                      transform: "translateX(-50%)",
                    }}
                  >
                    <div className="bg-white text-[12px] font-bold tracking-[1px] px-[10px] py-[6px] shadow-[0_2px_12px_rgba(0,0,0,0.10)] whitespace-nowrap mt-[4px]">
                      <div className="text-text-light mb-[4px]">{labels[hoveredIdx]?.label}</div>
                      {chartData.map((contact, ci) => {
                        const val = contact.buckets[hoveredIdx]?.count ?? 0;
                        if (val === 0) return null;
                        return (
                          <div key={contact.id} className="flex items-center gap-[6px]">
                            <span className="w-[6px] h-[6px] rounded-full shrink-0" style={{ background: CV_COLORS[ci % CV_COLORS.length] }} />
                            <span className="text-text-muted">{contact.name}</span>
                            <span className="text-text-muted ml-auto pl-[8px]">{val}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* X-axis labels */}
                <div className="relative mt-[4px]" style={{ height: CV_LABEL_H }}>
                  {labels.map((b, i) => {
                    if (i % labelEvery !== 0) return null;
                    const pct = ((i * (barW + gap) + barW / 2) / chartW) * 100;
                    return (
                      <span
                        key={i}
                        className="absolute text-[12px] font-bold tracking-[1.8px] uppercase text-text-light -translate-x-1/2 leading-none"
                        style={{ left: `${pct}%`, top: 0 }}
                      >
                        {b.label}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Top clients sidebar */}
        <div className="w-px bg-border shrink-0" />
        <div className="w-1/3 shrink-0 px-[16px] py-[16px] flex flex-col overflow-hidden" data-cv-sidebar>
          <div className="text-[12px] font-bold tracking-[2px] uppercase text-text-light mb-[12px] shrink-0">
            TOP CLIENTS
          </div>
          <div className="overflow-y-auto min-h-0 flex-1">
            {loading ? (
              <span className="text-[12px] text-text-light animate-pulse">...</span>
            ) : data.length === 0 ? (
              <span className="text-[12px] text-text-light">—</span>
            ) : (
              <div className="flex flex-col">
                {data.map((contact, ci) => {
                  const isSelected = selectedId === contact.id;
                  const color = isSelected ? CV_COLORS[0] : CV_COLORS[ci % CV_COLORS.length];
                  return (
                    <button
                      key={contact.id}
                      onClick={() => setSelectedId(isSelected ? null : contact.id)}
                      className={`flex items-center gap-[6px] text-left transition-opacity py-[6px] ${
                        ci > 0 ? "border-t border-border" : ""
                      } ${selectedId && !isSelected ? "opacity-40" : ""}`}
                    >
                      <span className="text-[12px] font-bold text-text-light tabular-nums w-[16px] text-right shrink-0">{ci + 1}</span>
                      <span className="w-px h-[12px] bg-border shrink-0" />
                      <svg className="shrink-0" width="12" height="12" viewBox="0 0 24 24" fill="var(--color-text-muted)">
                        <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                        <path fillRule="evenodd" d="M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113-1.487 4.471-5.705 7.697-10.677 7.697-4.97 0-9.186-3.223-10.675-7.69a1.762 1.762 0 0 1 0-1.113ZM17.25 12a5.25 5.25 0 1 1-10.5 0 5.25 5.25 0 0 1 10.5 0Z" clipRule="evenodd" />
                      </svg>
                      <span className="text-[12px] font-bold text-text-muted tabular-nums shrink-0">{contact.totalViews}</span>
                      <span className="w-px h-[12px] bg-border shrink-0" />
                      <span
                        className="w-[8px] h-[8px] rounded-full shrink-0"
                        style={{ background: color }}
                      />
                      <span className="text-[12px] font-bold text-text-muted truncate">{contact.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Entity Chart (universal multi-line chart with sidebar) ───────── */

type ECEntity = { id: string; name: string; total: number; buckets: CVBucket[] };

function EntityChart({ chartId, apiUrl, title, sidebarTitle, icon, sidebarIcon }: {
  chartId: string;
  apiUrl: string;
  title: string;
  sidebarTitle: string;
  icon: React.ReactNode;
  sidebarIcon?: React.ReactNode;
}) {
  const t = useTranslations("admin");
  const [mounted, setMounted] = useState(false);
  const [period, setPeriod] = useState<CVPeriod>("week");
  const [data, setData] = useState<ECEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const chartRef = useRef<HTMLDivElement>(null);
  const [chartW, setChartW] = useState(600);

  useEffect(() => setMounted(true), []);

  useLayoutEffect(() => {
    const el = chartRef.current;
    if (!el) return;
    setChartW(el.clientWidth);
    const ro = new ResizeObserver(() => setChartW(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, [mounted]);

  useEffect(() => {
    if (!selectedId) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest(`[data-ec-sidebar-${chartId}]`) || target.closest(`[data-ec-periods-${chartId}]`)) return;
      setSelectedId(null);
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [selectedId, chartId]);

  useEffect(() => {
    setLoading(true);
    const sep = apiUrl.includes("?") ? "&" : "?";
    fetch(`${apiUrl}${sep}period=${period}`)
      .then((r) => r.json())
      .then((d: { entities: ECEntity[] }) => { setData(d.entities); setLoading(false); })
      .catch(() => setLoading(false));
  }, [period, apiUrl]);

  const selected = selectedId ? data.find((c) => c.id === selectedId) : null;
  const chartData = selected ? [selected] : data.slice(0, 3);
  const total = data.reduce((s, c) => s + c.total, 0);
  const n = chartData.length > 0 ? chartData[0].buckets.length : 0;
  const gap = n > 20 ? 2 : n > 10 ? 3 : 6;
  const barW = n > 0 ? Math.max(1, (chartW - gap * (n - 1)) / n) : 0;
  const labelEvery = n <= 12 ? 1 : n <= 24 ? 2 : 5;

  const globalMax = Math.max(
    ...chartData.flatMap((c) => c.buckets.map((b) => b.count)),
    1,
  );

  const peakY = (count: number) =>
    CV_CHART_H - Math.max(count > 0 ? 2 : 0, Math.round((count / globalMax) * CV_CHART_H));

  const makePoints = (buckets: CVBucket[]) =>
    buckets.map((b, i) => `${i * (barW + gap) + barW / 2},${peakY(b.count)}`).join(" ");

  const makeFillPath = (buckets: CVBucket[]) => {
    if (buckets.length < 2) return "";
    const firstCx = barW / 2;
    const lastCx = (buckets.length - 1) * (barW + gap) + barW / 2;
    const pts = buckets.map((b, i) => `${i * (barW + gap) + barW / 2},${peakY(b.count)}`).join(" L ");
    return `M ${firstCx},${CV_CHART_H} L ${pts} L ${lastCx},${CV_CHART_H} Z`;
  };

  const gridLevels = [1 / 3, 2 / 3, 1].map((frac) => ({
    frac,
    svgY: CV_CHART_H - Math.round(frac * CV_CHART_H),
    pxY: (1 - frac) * CV_CHART_H,
    value: Math.round(frac * globalMax),
  }));

  const labels = chartData.length > 0 ? chartData[0].buckets : [];

  const verticalXs = labels
    .map((_, i) => (i % labelEvery === 0 ? i * (barW + gap) + barW / 2 : null))
    .filter((x): x is number => x !== null);
  const vBandEdges = [0, ...verticalXs, chartW];
  const vBands = vBandEdges.slice(0, -1).map((x1, i) => ({ x1, x2: vBandEdges[i + 1], fill: i % 2 === 0 }));

  const handleMouseMove = (e: React.MouseEvent<SVGRectElement>) => {
    const svgEl = e.currentTarget.closest("svg")!;
    const rect = svgEl.getBoundingClientRect();
    const svgX = (e.clientX - rect.left) * (chartW / rect.width);
    const idx = Math.max(0, Math.min(n - 1, Math.round((svgX - barW / 2) / (barW + gap))));
    setHoveredIdx(idx);
  };

  const hoveredCx = hoveredIdx !== null ? hoveredIdx * (barW + gap) + barW / 2 : 0;

  if (!mounted) return null;

  return (
    <div className="border border-border mb-[4px] overflow-hidden">
      <div className="flex max-h-[260px]">
        {/* Chart section */}
        <div className="w-2/3 min-w-0 px-[20px] py-[16px]">
          <div className="flex items-center justify-between mb-[16px]">
            <div className="flex items-center gap-[8px]">
              <span className="text-text-muted flex items-center">{icon}</span>
              <span className="text-[26px] font-bold tracking-tight text-text-muted">
                {loading ? "—" : total.toLocaleString()}
              </span>
              <span className="text-[12px] font-bold tracking-[2px] uppercase text-text-light">
                {title}
              </span>
            </div>
            <div className="flex items-center gap-[12px]" {...{ [`data-ec-periods-${chartId}`]: true }}>
              {CV_PERIODS.map((p, i) => (
                <React.Fragment key={p}>
                  {i > 0 && <span className="w-px h-[1em] bg-text-light/40 self-center" />}
                  <button
                    onClick={() => setPeriod(p)}
                    className={`text-[12px] font-bold tracking-[1.8px] uppercase transition-colors ${
                      period === p ? "text-text-muted" : "text-text-light hover:text-text-muted"
                    }`}
                  >
                    {t(`period.${p}`)}
                  </button>
                </React.Fragment>
              ))}
            </div>
          </div>

          {loading ? (
            <div style={{ height: CV_CHART_H + CV_LABEL_H + 4 }} className="flex items-center justify-center">
              <span className="text-[12px] text-text-light tracking-[2px] uppercase animate-pulse">...</span>
            </div>
          ) : (
            <div className="flex">
              <div className="relative shrink-0" style={{ width: CV_Y_LABEL_W, height: CV_CHART_H }}>
                {gridLevels.map(({ frac, pxY, value }) => (
                  <span
                    key={frac}
                    className="absolute right-[6px] text-[12px] font-bold text-text-light leading-none -translate-y-1/2"
                    style={{ top: pxY }}
                  >
                    {value}
                  </span>
                ))}
              </div>

              <div className="flex-1 min-w-0 relative" ref={chartRef}>
                <svg
                  viewBox={`0 0 ${chartW} ${CV_CHART_H}`}
                  width="100%"
                  preserveAspectRatio="none"
                  overflow="visible"
                  style={{ display: "block", height: CV_CHART_H }}
                >
                  <defs>
                    {chartData.map((entity, ci) => (
                      <linearGradient
                        key={entity.id}
                        id={`ecFill-${chartId}-${ci}`}
                        x1="0" y1="0" x2="0" y2={CV_CHART_H}
                        gradientUnits="userSpaceOnUse"
                      >
                        <stop offset="0%" stopColor={CV_COLORS[ci % CV_COLORS.length]} stopOpacity="0.15" />
                        <stop offset="100%" stopColor={CV_COLORS[ci % CV_COLORS.length]} stopOpacity="0" />
                      </linearGradient>
                    ))}
                  </defs>

                  {vBands.filter((b) => b.fill).map((b, i) => (
                    <rect key={i} x={b.x1} y={0} width={b.x2 - b.x1} height={CV_CHART_H} fill="var(--color-text-muted)" fillOpacity="0.06" />
                  ))}

                  {gridLevels.map(({ frac, svgY }) => (
                    <line key={frac} x1={0} y1={svgY} x2={chartW} y2={svgY} stroke="var(--color-border)" strokeWidth="1" strokeDasharray="2 3" />
                  ))}

                  {labels.map((_, i) => {
                    if (i % labelEvery !== 0) return null;
                    const cx = i * (barW + gap) + barW / 2;
                    return <line key={i} x1={cx} y1={0} x2={cx} y2={CV_CHART_H} stroke="var(--color-border)" strokeWidth="0.5" />;
                  })}

                  {chartData.map((entity, ci) => {
                    const color = CV_COLORS[ci % CV_COLORS.length];
                    const fillPath = makeFillPath(entity.buckets);
                    const points = makePoints(entity.buckets);
                    return (
                      <React.Fragment key={entity.id}>
                        {fillPath && <path d={fillPath} fill={`url(#ecFill-${chartId}-${ci})`} />}
                        {entity.buckets.length > 1 && (
                          <polyline
                            points={points}
                            fill="none"
                            stroke={color}
                            strokeWidth="2"
                            strokeLinejoin="round"
                            strokeLinecap="round"
                            vectorEffect="non-scaling-stroke"
                          />
                        )}
                      </React.Fragment>
                    );
                  })}

                  {hoveredIdx !== null && (
                    <line x1={hoveredCx} y1={0} x2={hoveredCx} y2={CV_CHART_H} stroke="var(--color-text-light)" strokeWidth="1" />
                  )}

                  <rect
                    x={0} y={0} width={chartW} height={CV_CHART_H}
                    fill="transparent"
                    style={{ cursor: "crosshair" }}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={() => setHoveredIdx(null)}
                  />
                </svg>

                {hoveredIdx !== null && chartData.map((entity, ci) => {
                  const val = entity.buckets[hoveredIdx]?.count ?? 0;
                  if (val === 0) return null;
                  const cy = peakY(val);
                  return (
                    <div
                      key={entity.id}
                      className="absolute pointer-events-none z-10"
                      style={{
                        left: `${(hoveredCx / chartW) * 100}%`,
                        top: cy,
                        transform: "translate(-50%, -50%)",
                      }}
                    >
                      <div className="w-[8px] h-[8px] rounded-full" style={{ background: CV_COLORS[ci % CV_COLORS.length] }} />
                    </div>
                  );
                })}

                {hoveredIdx !== null && chartData.length > 0 && (
                  <div
                    className="absolute pointer-events-none z-10"
                    style={{
                      left: `${(hoveredCx / chartW) * 100}%`,
                      top: 0,
                      transform: "translateX(-50%)",
                    }}
                  >
                    <div className="bg-white text-[12px] font-bold tracking-[1px] px-[10px] py-[6px] shadow-[0_2px_12px_rgba(0,0,0,0.10)] whitespace-nowrap mt-[4px]">
                      <div className="text-text-light mb-[4px]">{labels[hoveredIdx]?.label}</div>
                      {chartData.map((entity, ci) => {
                        const val = entity.buckets[hoveredIdx]?.count ?? 0;
                        if (val === 0) return null;
                        return (
                          <div key={entity.id} className="flex items-center gap-[6px]">
                            <span className="w-[6px] h-[6px] rounded-full shrink-0" style={{ background: CV_COLORS[ci % CV_COLORS.length] }} />
                            <span className="text-text-muted">{entity.name}</span>
                            <span className="text-text-muted ml-auto pl-[8px]">{val}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="relative mt-[4px]" style={{ height: CV_LABEL_H }}>
                  {labels.map((b, i) => {
                    if (i % labelEvery !== 0) return null;
                    const pct = ((i * (barW + gap) + barW / 2) / chartW) * 100;
                    return (
                      <span
                        key={i}
                        className="absolute text-[12px] font-bold tracking-[1.8px] uppercase text-text-light -translate-x-1/2 leading-none"
                        style={{ left: `${pct}%`, top: 0 }}
                      >
                        {b.label}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-px bg-border shrink-0" />
        <div className="w-1/3 shrink-0 px-[16px] py-[16px] flex flex-col overflow-hidden" {...{ [`data-ec-sidebar-${chartId}`]: true }}>
          <div className="text-[12px] font-bold tracking-[2px] uppercase text-text-light mb-[12px] shrink-0">
            {sidebarTitle}
          </div>
          <div className="overflow-y-auto min-h-0 flex-1">
            {loading ? (
              <span className="text-[12px] text-text-light animate-pulse">...</span>
            ) : data.length === 0 ? (
              <span className="text-[12px] text-text-light">—</span>
            ) : (
              <div className="flex flex-col">
                {data.map((entity, ci) => {
                  const isSelected = selectedId === entity.id;
                  const color = isSelected ? CV_COLORS[0] : CV_COLORS[ci % CV_COLORS.length];
                  return (
                    <button
                      key={entity.id}
                      onClick={() => setSelectedId(isSelected ? null : entity.id)}
                      className={`flex items-center gap-[6px] text-left transition-opacity py-[6px] ${
                        ci > 0 ? "border-t border-border" : ""
                      } ${selectedId && !isSelected ? "opacity-40" : ""}`}
                    >
                      <span className="text-[12px] font-bold text-text-light tabular-nums w-[16px] text-right shrink-0">{ci + 1}</span>
                      <span className="w-px h-[12px] bg-border shrink-0" />
                      <span className="shrink-0 text-text-muted">{sidebarIcon ?? icon}</span>
                      <span className="text-[12px] font-bold text-text-muted tabular-nums shrink-0">{entity.total}</span>
                      <span className="w-px h-[12px] bg-border shrink-0" />
                      <span
                        className="w-[8px] h-[8px] rounded-full shrink-0"
                        style={{ background: color }}
                      />
                      <span className="text-[12px] font-bold text-text-muted truncate">{entity.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CabinetPage() {
  const { isAdmin } = useAdmin();
  const router = useRouter();
  const locale = useLocale() as "ru" | "en";
  const t = useTranslations("admin");

  const socialSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const [activeSection, setActiveSectionRaw] = useState<string | null>("statistic");
  const [sectionRestored, setSectionRestored] = useState(false);
  useEffect(() => {
    if (sectionRestored) return;
    const saved = sessionStorage.getItem("cabinet-section");
    if (saved) setActiveSectionRaw(saved);
    setSectionRestored(true);
  }, [sectionRestored]);
  const setActiveSection = (s: string | null) => {
    setActiveSectionRaw(s);
    if (typeof window !== "undefined") {
      if (s) sessionStorage.setItem("cabinet-section", s);
      else sessionStorage.removeItem("cabinet-section");
    }
  };
  const [sortBy, setSortBy] = useState<"popularity" | "date" | "category">("date");
  const [viewCounts, setViewCounts] = useState<Record<string, { total: number; recent: number }>>({});
  const [dynamicArtworks, setDynamicArtworks] = useState<Artwork[]>([]);
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [editingArtwork, setEditingArtwork] = useState<Artwork | null>(null);
  const [viewingArtwork, setViewingArtwork] = useState<Artwork | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [initialImageUrl, setInitialImageUrl] = useState<string | undefined>();
  const [createForContactId, setCreateForContactId] = useState<string | undefined>();

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [isCreatingContact, setIsCreatingContact] = useState(false);

  const [coworkers, setCoworkers] = useState<Coworker[]>([]);
  const [editingCoworker, setEditingCoworker] = useState<Coworker | null>(null);
  const [isCreatingCoworker, setIsCreatingCoworker] = useState(false);

  const [clickCounts, setClickCounts] = useState<Record<string, { total: number; recent: number }>>({});

  const [siteSocials, setSiteSocials] = useState<{ name: string; url: string; icon: string }[]>([]);
  const [socialsSaving, setSocialsSaving] = useState(false);

  const [heroImage, setHeroImage] = useState("/images/hero.png");
  const [heroImages, setHeroImages] = useState<{ url: string; title: string; year: string; tools: string }[]>([{ url: "/images/hero.png", title: "", year: "", tools: "" }]);
  const [heroSaving, setHeroSaving] = useState(false);
  const [heroMetaEditing, setHeroMetaEditing] = useState<{ url: string; title: string; year: string; tools: string } | null>(null);

  const [equipmentItems, setEquipmentItems] = useState<Equipment[]>([]);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [isCreatingEquipment, setIsCreatingEquipment] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryViewCounts, setCategoryViewCounts] = useState<Record<string, { total: number; recent: number }>>({});
  const [expandedCatId, setExpandedCatId] = useState<string | null>(null);
  type CatModalMode =
    | { type: "newCategory" }
    | { type: "editCategory"; category: Category }
    | { type: "newSubcategory"; parentId: string }
    | { type: "editSubcategory"; parentId: string; subcategory: Subcategory };
  const [catModalMode, setCatModalMode] = useState<CatModalMode | null>(null);

  const openCreate = (imageUrl?: string) => {
    setInitialImageUrl(imageUrl);
    setIsCreating(true);
  };

  useEffect(() => {
    if (!isAdmin) router.replace("/");
  }, [isAdmin, router]);

  useEffect(() => {
    fetch("/api/site-settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.heroImage) setHeroImage(d.heroImage);
        if (Array.isArray(d.heroImages)) {
          setHeroImages(d.heroImages.map((img: unknown) =>
            typeof img === "string"
              ? { url: img, title: "", year: "", tools: "" }
              : img as { url: string; title: string; year: string; tools: string }
          ));
        }
        if (Array.isArray(d.socials)) setSiteSocials(d.socials);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/equipment")
      .then((r) => r.json())
      .then((data: Equipment[]) => { if (Array.isArray(data)) setEquipmentItems(data); })
      .catch(() => {});
  }, []);

  // Load categories once on mount so they're available in all sections
  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data: Category[]) => setCategories((prev) => prev.length === 0 ? (Array.isArray(data) ? data : []) : prev))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (activeSection !== "statistic") return;
    fetch("/api/stats")
      .then((r) => r.json())
      .then((data: Record<string, number>) => setViewCounts(data))
      .catch(() => {});
    fetch("/api/artworks")
      .then((r) => r.json())
      .then((data: Artwork[]) => setDynamicArtworks(data))
      .catch(() => {});
    fetch("/api/deleted-artworks")
      .then((r) => r.json())
      .then((data: string[]) => setDeletedIds(new Set(data)))
      .catch(() => {});
    fetch("/api/hidden-artworks")
      .then((r) => r.json())
      .then((data: string[]) => setHiddenIds(new Set(data)))
      .catch(() => {});
  }, [activeSection]);

  useEffect(() => {
    if (activeSection !== "contacts") return;
    fetch("/api/contacts")
      .then((r) => r.json())
      .then((data: Contact[]) => setContacts(Array.isArray(data) ? data : []))
      .catch(() => {});
    fetch("/api/artworks")
      .then((r) => r.json())
      .then((data: Artwork[]) => setDynamicArtworks(data))
      .catch(() => {});
    fetch("/api/stats")
      .then((r) => r.json())
      .then((data: Record<string, number>) => setViewCounts(data))
      .catch(() => {});
    fetch("/api/stats/contact-click")
      .then((r) => r.json())
      .then(setClickCounts)
      .catch(() => {});
  }, [activeSection]);

  useEffect(() => {
    if (activeSection !== "coworkers") return;
    fetch("/api/coworkers")
      .then((r) => r.json())
      .then((data: Coworker[]) => setCoworkers(Array.isArray(data) ? data : []))
      .catch(() => {});
    fetch("/api/artworks")
      .then((r) => r.json())
      .then((data: Artwork[]) => setDynamicArtworks(data))
      .catch(() => {});
    fetch("/api/stats")
      .then((r) => r.json())
      .then((data: Record<string, number>) => setViewCounts(data))
      .catch(() => {});
    fetch("/api/stats/contact-click")
      .then((r) => r.json())
      .then(setClickCounts)
      .catch(() => {});
  }, [activeSection]);

  useEffect(() => {
    if (activeSection !== "categories") return;
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data: Category[]) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => {});
    fetch("/api/stats/category-views")
      .then((r) => r.json())
      .then((data: Record<string, { total: number; recent: number }>) => setCategoryViewCounts(data))
      .catch(() => {});
    fetch("/api/artworks")
      .then((r) => r.json())
      .then((data: Artwork[]) => setDynamicArtworks(data))
      .catch(() => {});
    fetch("/api/deleted-artworks")
      .then((r) => r.json())
      .then((data: string[]) => setDeletedIds(new Set(data)))
      .catch(() => {});
  }, [activeSection]);

  const catSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleCatDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = categories.findIndex((c) => c.id === active.id);
      const newIndex = categories.findIndex((c) => c.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;
      const reordered = arrayMove(categories, oldIndex, newIndex);
      setCategories(reordered);
      fetch("/api/categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reordered),
      }).catch(() => {});
    },
    [categories]
  );

  const handleToggleHidden = async (id: string) => {
    const isCurrentlyHidden = hiddenIds.has(id);
    setHiddenIds((prev) => {
      const next = new Set(prev);
      if (isCurrentlyHidden) next.delete(id);
      else next.add(id);
      return next;
    });
    try {
      const res = await fetch("/api/hidden-artworks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, hidden: !isCurrentlyHidden }),
      });
      const data: string[] = await res.json();
      setHiddenIds(new Set(data));
    } catch {}
  };

  if (!isAdmin) return null;

  // Merge static + dynamic; dynamic overrides static (same id); filter deleted
  const artworkMap = new Map<string, Artwork>();
  for (const a of staticArtworks) artworkMap.set(a.id, a);
  for (const a of dynamicArtworks) artworkMap.set(a.id, a);
  const allArtworks = Array.from(artworkMap.values()).filter((a) => !deletedIds.has(a.id));

  // Count artworks per category / subcategory key
  const artworkCounts: Record<string, number> = {};
  for (const a of allArtworks) {
    artworkCounts[a.category] = (artworkCounts[a.category] ?? 0) + 1;
    if (a.subcategory) {
      artworkCounts[`${a.category}/${a.subcategory}`] = (artworkCounts[`${a.category}/${a.subcategory}`] ?? 0) + 1;
    }
  }

  const sortedArtworks = sortBy === "popularity"
    ? [...allArtworks].sort((a, b) => (viewCounts[b.id]?.total ?? 0) - (viewCounts[a.id]?.total ?? 0))
    : [...allArtworks].sort((a, b) => {
        const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return db - da; // newest first
      });

  // Use loaded categories for grouping; fall back to unique category IDs from artworks
  const categoryOrder = categories.length > 0
    ? categories.map((c) => c.id)
    : [...new Set(allArtworks.map((a) => a.category))];

  const categoryLabel = (catId: string) => {
    const found = categories.find((c) => c.id === catId);
    if (found) return found.label[locale];
    // Fallback: try i18n key
    const key = `category${catId.charAt(0).toUpperCase()}${catId.slice(1)}` as Parameters<typeof t>[0];
    try { return t(key); } catch { return catId; }
  };

  // For "category" mode: group by category in order
  const groupedByCategory: { category: string; artworks: Artwork[] }[] =
    sortBy === "category"
      ? categoryOrder
          .map((cat) => ({ category: cat, artworks: allArtworks.filter((a) => a.category === cat) }))
          .filter((g) => g.artworks.length > 0)
      : [];

  return (
    <>
      <div className="relative z-10 flex flex-col h-full py-6 lg:py-0">
        <div className="flex-1 flex items-center">
          <div className="flex flex-col gap-[28px]">
            {sections.map((section, i) => (
              <motion.div
                key={section.key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20, transition: { delay: 0, duration: 0.3 } }}
                transition={{ delay: 0.15 + i * 0.08, duration: 0.4, ease: "easeOut" }}
              >
                <button
                  onClick={() =>
                    setActiveSection(activeSection === section.key ? null : section.key)
                  }
                  className={`h-[30px] flex items-center text-sm font-bold tracking-[2.8px] uppercase transition-colors ${
                    activeSection === section.key
                      ? "text-text-muted"
                      : "text-text-light hover:text-text-muted"
                  }`}
                >
                  {t(section.key)}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Statistics panel — mirrors the artwork grid overlay from Portfolio */}
      <AnimatePresence>
        {activeSection === "statistic" && (
          <motion.div
            key="stat-panel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="fixed top-0 bottom-0 right-0 left-[calc(33.75vw+24px)] z-10 overflow-y-auto bg-bg"
            style={{ paddingTop: 148 + 24, paddingBottom: 24, paddingRight: 24 }}
          >
            <VisitsChart />

            <div className="w-full h-px bg-border" />

            {/* Table header + sort controls in one row */}
            <div className="flex items-center gap-[16px] pr-[16px] mb-[8px] border-b border-r border-border">
              <span className="w-[2px] h-[2em] bg-border shrink-0" />
              <p className="w-[314px] shrink-0 text-[12px] font-bold tracking-[1.8px] text-text-light uppercase">
                {t("colNameInfo")}
              </p>
              <span className="w-[2px] h-[2em] bg-border shrink-0" />
              <p className="w-[120px] shrink-0 text-[12px] font-bold tracking-[1.8px] text-text-light uppercase">
                {t("colViews")}
              </p>
              <span className="w-[2px] h-[2em] bg-border shrink-0" />
              <p className="w-[130px] shrink-0 text-[12px] font-bold tracking-[1.8px] text-text-light uppercase">
                {t("colDate")}
              </p>
              <span className="w-[2px] h-[2em] bg-border shrink-0" />
              <p className="w-[60px] shrink-0 text-[12px] font-bold tracking-[1.8px] text-text-light uppercase">
                {t("colVersions")}
              </p>
              <span className="w-[2px] h-[2em] bg-border shrink-0" />
              {/* Sort filters — right-aligned */}
              <div className="flex-1 flex items-center justify-end gap-[12px]">
                {(["date", "popularity", "category"] as const).map((mode, i) => (
                  <React.Fragment key={mode}>
                    {i > 0 && <span className="w-px h-[1em] bg-text-light/50 self-center" />}
                    <button
                      onClick={() => setSortBy(mode)}
                      className={`text-[12px] font-bold tracking-[1.8px] uppercase transition-colors ${
                        sortBy === mode ? "text-text-muted" : "text-text-light hover:text-text-muted"
                      }`}
                    >
                      {t(mode === "popularity" ? "sortByPopularity" : mode === "category" ? "sortByCategory" : "sortByDate")}
                    </button>
                  </React.Fragment>
                ))}
              </div>
            </div>

            {sortBy === "category" ? (
              <div className="flex flex-col gap-[32px]">
                <AddArtworkButton onClick={() => openCreate()} label={t("addArtwork")} onDropImage={(url) => openCreate(url)} />
                <div style={{ height: 5 }} />
                {groupedByCategory.map((group, gi) => (
                  <div key={group.category}>
                    {/* Section header */}
                    <div className={`flex items-center gap-[12px] mb-[32px] ${gi === 0 ? "mt-0" : "mt-[32px]"}`}>
                      <p className="text-[14px] font-bold tracking-[2px] text-text-light uppercase shrink-0">
                        {categoryLabel(group.category)}
                      </p>
                      <span className="flex-1 h-px bg-border" />
                    </div>
                    <div className="flex flex-col gap-[4px]">
                      {group.artworks.map((artwork) => (
                        <ArtworkStatRow
                          key={artwork.id}
                          artwork={artwork}
                          viewCount={viewCounts[artwork.id] ?? { total: 0, recent: 0 }}
                          locale={locale}
                          onEdit={() => setEditingArtwork(artwork)}
                          onDeleted={(id) => {
                            setDynamicArtworks((prev) => prev.filter((a) => a.id !== id));
                            setDeletedIds((prev) => new Set([...prev, id]));
                          }}
                          onNavigate={() => router.push(`/portfolio?artwork=${artwork.id}`)}
                          isHidden={hiddenIds.has(artwork.id)}
                          onToggleHidden={() => handleToggleHidden(artwork.id)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-[4px]">
                <AddArtworkButton onClick={() => openCreate()} label={t("addArtwork")} onDropImage={(url) => openCreate(url)} />
                <div style={{ height: 5 }} />
                {sortedArtworks.map((artwork) => (
                  <ArtworkStatRow
                    key={artwork.id}
                    artwork={artwork}
                    viewCount={viewCounts[artwork.id] ?? { total: 0, recent: 0 }}
                    locale={locale}
                    onEdit={() => setEditingArtwork(artwork)}
                    onDeleted={(id) => {
                      setDynamicArtworks((prev) => prev.filter((a) => a.id !== id));
                      setDeletedIds((prev) => new Set([...prev, id]));
                    }}
                    onNavigate={() => router.push(`/portfolio?artwork=${artwork.id}`)}
                    isHidden={hiddenIds.has(artwork.id)}
                    onToggleHidden={() => handleToggleHidden(artwork.id)}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contacts panel */}
      <AnimatePresence>
        {activeSection === "contacts" && (
          <motion.div
            key="contacts-panel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="fixed top-0 bottom-0 right-0 left-[calc(33.75vw+24px)] z-10 overflow-y-auto bg-bg"
            style={{ paddingTop: 148 + 24, paddingBottom: 24, paddingRight: 24 }}
          >
            <div className="flex flex-col gap-[4px]">
              <div className="grid grid-cols-2 gap-[4px]">
                <ContactViewsChart />
                <EntityChart chartId="cc-contacts" apiUrl="/api/stats/clicks-by-entity?type=contacts" title="CLICKS BY CLIENTS" sidebarTitle="TOP CLIENTS" icon={<svg width="22" height="22" viewBox="0 0 20 20" fill="currentColor"><path d="M6.111 11.8891C3.96311 9.7412 3.96311 6.2588 6.111 4.11091C8.25888 1.96303 11.7413 1.96303 13.8892 4.11091C14.9633 5.185 15.5001 6.59127 15.5001 8C15.5001 8.41421 15.8359 8.75 16.2501 8.75C16.6643 8.75 17.0001 8.41421 17.0001 8C17.0001 6.2097 16.3165 4.41694 14.9498 3.05025C12.2162 0.316582 7.78401 0.316582 5.05034 3.05025C2.31667 5.78392 2.31667 10.2161 5.05034 12.9497C5.34323 13.2426 5.8181 13.2426 6.111 12.9497C6.40389 12.6569 6.40389 12.182 6.111 11.8891Z" /><path d="M8.23235 6.23223C7.25604 7.20854 7.25604 8.79146 8.23235 9.76777C8.52525 10.0607 8.52525 10.5355 8.23235 10.8284C7.93946 11.1213 7.46459 11.1213 7.17169 10.8284C5.60959 9.26633 5.60959 6.73367 7.17169 5.17157C8.73379 3.60948 11.2664 3.60948 12.8285 5.17157C13.6094 5.95247 14.0001 6.97747 14.0001 8C14.0001 8.41421 13.6643 8.75 13.2501 8.75C12.8359 8.75 12.5001 8.41421 12.5001 8C12.5001 7.35903 12.2562 6.72054 11.7679 6.23223C10.7916 5.25592 9.20866 5.25592 8.23235 6.23223Z" /><path d="M10.7657 7.51062C10.5871 7.24492 10.2596 7.12184 9.95029 7.20417C9.64095 7.2865 9.41795 7.5561 9.3951 7.8754L8.90409 14.7363C8.88303 15.0306 9.0365 15.3099 9.29622 15.4499C9.55595 15.59 9.87365 15.5647 10.108 15.3854L11.1508 14.5873L12.1363 18.2653C12.2436 18.6654 12.6548 18.9028 13.0549 18.7956C13.455 18.6884 13.6924 18.2771 13.5852 17.877L12.6083 14.2312L13.9005 14.4349C14.1951 14.4814 14.4893 14.3489 14.6497 14.0974C14.8101 13.846 14.8062 13.5233 14.6398 13.2758L10.7657 7.51062Z" /></svg>} sidebarIcon={<ClickIcon />} />
              </div>

              {/* Add button — spans full width */}
              <button
                onClick={() => setIsCreatingContact(true)}
                className="w-full flex items-center justify-center gap-[8px] border-2 border-dashed border-border px-[16px] py-[14px] text-text-light hover:text-text-muted hover:border-text-light hover:bg-text-light/5 transition-all duration-200"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 1v14M1 8h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <span className="text-[12px] font-bold tracking-[1.8px] uppercase">{t("addContact")}</span>
              </button>

              <div style={{ height: 5 }} />

              {contacts.length === 0 && (
                <p className="text-center text-[12px] text-text-light py-[32px] tracking-[1.5px] uppercase">—</p>
              )}

              {contacts.map((contact, i) => {
                if (i % 2 !== 0) return null;
                const getArtworks = (c: Contact) =>
                  allArtworks.filter((a) => a.contactId === c.id);
                const getViews = (c: Contact) =>
                  getArtworks(c).reduce((sum, a) => sum + (viewCounts[a.id]?.total ?? 0), 0);
                return (
                  <div key={contact.id} className="grid grid-cols-2 gap-[4px]">
                    <ContactRow
                      contact={contact}
                      onEdit={() => setEditingContact(contact)}
                      onDeleted={(id) => setContacts((prev) => prev.filter((c) => c.id !== id))}
                      artworks={getArtworks(contact)}
                      onArtworkClick={(a) => setViewingArtwork(a)}
                      onCreateArtwork={() => { setCreateForContactId(contact.id); setIsCreating(true); }}
                      totalViews={getViews(contact)}
                      totalClicks={clickCounts[contact.id]?.total ?? 0}
                    />
                    {contacts[i + 1] && (
                      <ContactRow
                        contact={contacts[i + 1]}
                        onEdit={() => setEditingContact(contacts[i + 1])}
                        onDeleted={(id) => setContacts((prev) => prev.filter((c) => c.id !== id))}
                        artworks={getArtworks(contacts[i + 1])}
                        onArtworkClick={(a) => setViewingArtwork(a)}
                        onCreateArtwork={() => { setCreateForContactId(contacts[i + 1].id); setIsCreating(true); }}
                        totalViews={getViews(contacts[i + 1])}
                        totalClicks={clickCounts[contacts[i + 1].id]?.total ?? 0}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Coworkers panel */}
      <AnimatePresence>
        {activeSection === "coworkers" && (
          <motion.div
            key="coworkers-panel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="fixed top-0 bottom-0 right-0 left-[calc(33.75vw+24px)] z-10 overflow-y-auto bg-bg"
            style={{ paddingTop: 148 + 24, paddingBottom: 24, paddingRight: 24 }}
          >
            <div className="flex flex-col gap-[4px]">
              <EntityChart chartId="cc-coworkers" apiUrl="/api/stats/clicks-by-entity?type=coworkers" title="CLICKS BY COWORKERS" sidebarTitle="TOP COWORKERS" icon={<svg width="22" height="22" viewBox="0 0 20 20" fill="currentColor"><path d="M6.111 11.8891C3.96311 9.7412 3.96311 6.2588 6.111 4.11091C8.25888 1.96303 11.7413 1.96303 13.8892 4.11091C14.9633 5.185 15.5001 6.59127 15.5001 8C15.5001 8.41421 15.8359 8.75 16.2501 8.75C16.6643 8.75 17.0001 8.41421 17.0001 8C17.0001 6.2097 16.3165 4.41694 14.9498 3.05025C12.2162 0.316582 7.78401 0.316582 5.05034 3.05025C2.31667 5.78392 2.31667 10.2161 5.05034 12.9497C5.34323 13.2426 5.8181 13.2426 6.111 12.9497C6.40389 12.6569 6.40389 12.182 6.111 11.8891Z" /><path d="M8.23235 6.23223C7.25604 7.20854 7.25604 8.79146 8.23235 9.76777C8.52525 10.0607 8.52525 10.5355 8.23235 10.8284C7.93946 11.1213 7.46459 11.1213 7.17169 10.8284C5.60959 9.26633 5.60959 6.73367 7.17169 5.17157C8.73379 3.60948 11.2664 3.60948 12.8285 5.17157C13.6094 5.95247 14.0001 6.97747 14.0001 8C14.0001 8.41421 13.6643 8.75 13.2501 8.75C12.8359 8.75 12.5001 8.41421 12.5001 8C12.5001 7.35903 12.2562 6.72054 11.7679 6.23223C10.7916 5.25592 9.20866 5.25592 8.23235 6.23223Z" /><path d="M10.7657 7.51062C10.5871 7.24492 10.2596 7.12184 9.95029 7.20417C9.64095 7.2865 9.41795 7.5561 9.3951 7.8754L8.90409 14.7363C8.88303 15.0306 9.0365 15.3099 9.29622 15.4499C9.55595 15.59 9.87365 15.5647 10.108 15.3854L11.1508 14.5873L12.1363 18.2653C12.2436 18.6654 12.6548 18.9028 13.0549 18.7956C13.455 18.6884 13.6924 18.2771 13.5852 17.877L12.6083 14.2312L13.9005 14.4349C14.1951 14.4814 14.4893 14.3489 14.6497 14.0974C14.8101 13.846 14.8062 13.5233 14.6398 13.2758L10.7657 7.51062Z" /></svg>} sidebarIcon={<ClickIcon />} />

              <button
                onClick={() => setIsCreatingCoworker(true)}
                className="w-full flex items-center justify-center gap-[8px] border-2 border-dashed border-border px-[16px] py-[14px] text-text-light hover:text-text-muted hover:border-text-light hover:bg-text-light/5 transition-all duration-200"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 1v14M1 8h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <span className="text-[12px] font-bold tracking-[1.8px] uppercase">{t("addCoworker")}</span>
              </button>

              <div style={{ height: 5 }} />

              {coworkers.length === 0 && (
                <p className="text-center text-[12px] text-text-light py-[32px] tracking-[1.5px] uppercase">—</p>
              )}

              {coworkers.map((coworker, i) => {
                if (i % 2 !== 0) return null;
                const getArtworks = (cw: Coworker) =>
                  allArtworks.filter((a) => a.coworkers?.some((c) => c.id === cw.id));
                const getViews = (cw: Coworker) =>
                  getArtworks(cw).reduce((sum, a) => sum + (viewCounts[a.id]?.total ?? 0), 0);
                return (
                  <div key={coworker.id} className="grid grid-cols-2 gap-[4px]">
                    <CoworkerRow
                      coworker={coworker}
                      onEdit={() => setEditingCoworker(coworker)}
                      onDeleted={(id) => setCoworkers((prev) => prev.filter((c) => c.id !== id))}
                      artworks={getArtworks(coworker)}
                      onArtworkClick={(a) => setViewingArtwork(a)}
                      totalViews={getViews(coworker)}
                      totalClicks={clickCounts[coworker.id]?.total ?? 0}
                    />
                    {coworkers[i + 1] && (
                      <CoworkerRow
                        coworker={coworkers[i + 1]}
                        onEdit={() => setEditingCoworker(coworkers[i + 1])}
                        onDeleted={(id) => setCoworkers((prev) => prev.filter((c) => c.id !== id))}
                        artworks={getArtworks(coworkers[i + 1])}
                        onArtworkClick={(a) => setViewingArtwork(a)}
                        totalViews={getViews(coworkers[i + 1])}
                        totalClicks={clickCounts[coworkers[i + 1].id]?.total ?? 0}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Categories panel */}
      <AnimatePresence>
        {activeSection === "categories" && (
          <motion.div
            key="categories-panel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="fixed top-0 bottom-0 right-0 left-[calc(33.75vw+24px)] z-10 overflow-y-auto bg-bg"
            style={{ paddingTop: 148 + 24, paddingBottom: 24, paddingRight: 24 }}
          >
            <EntityChart chartId="cv-categories" apiUrl={`/api/stats/views-by-category?locale=${locale}`} title="VIEWS BY SECTIONS" sidebarTitle="TOP SECTIONS" icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" /><path fillRule="evenodd" d="M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113-1.487 4.471-5.705 7.697-10.677 7.697-4.97 0-9.186-3.223-10.675-7.69a1.762 1.762 0 0 1 0-1.113ZM17.25 12a5.25 5.25 0 1 1-10.5 0 5.25 5.25 0 0 1 10.5 0Z" clipRule="evenodd" /></svg>} sidebarIcon={<EyeIcon />} />

            {/* Table header — same flex/gap/px as SortableCategoryRow */}
            <div className="flex items-center gap-[12px] px-[16px] mb-[8px] border border-border">
              {/* Invisible drag handle — same svg size */}
              <span className="shrink-0 invisible">{DRAG_HANDLE_SVG}</span>
              {/* Invisible arrow — same button style */}
              <span className="shrink-0 text-[12px] invisible">▼</span>
              {/* Invisible preview */}
              <div className="w-[40px] shrink-0" />
              {/* NAME / INFO — same w-[200px] as label */}
              <p className="w-[200px] shrink-0 text-[12px] font-bold tracking-[1.8px] text-text-light uppercase">
                {t("colNameInfo")}
              </p>
              <span className="w-px h-[2em] bg-border shrink-0" />
              {/* VIEWS — same w-[120px] */}
              <p className="w-[120px] shrink-0 text-[12px] font-bold tracking-[1.8px] text-text-light uppercase">
                {t("colViews")}
              </p>
              <span className="w-px h-[2em] bg-border shrink-0" />
              {/* CARDS */}
              <p className="w-[80px] shrink-0 text-[12px] font-bold tracking-[1.8px] text-text-light uppercase">
                {t("colCards")}
              </p>
              <span className="w-px h-[2em] bg-border shrink-0" />
              {/* DATE */}
              <p className="w-[130px] shrink-0 text-[12px] font-bold tracking-[1.8px] text-text-light uppercase">
                {t("colDate")}
              </p>
              <span className="w-px h-[2em] bg-border shrink-0" />
            </div>

            <div className="flex flex-col gap-[4px]">
              {/* Add section button */}
              <button
                onClick={() => setCatModalMode({ type: "newCategory" })}
                className="w-full flex items-center justify-center gap-[8px] border-2 border-dashed border-border px-[16px] py-[14px] text-text-light hover:text-text-muted hover:border-text-light hover:bg-text-light/5 transition-all duration-200"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 1v14M1 8h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <span className="text-[12px] font-bold tracking-[1.8px] uppercase">{t("addCategory")}</span>
              </button>

              <div style={{ height: 5 }} />

              {categories.length === 0 && (
                <p className="text-center text-[12px] text-text-light py-[32px] tracking-[1.5px] uppercase">—</p>
              )}

              <DndContext
                sensors={catSensors}
                collisionDetection={closestCenter}
                onDragEnd={handleCatDragEnd}
              >
                <SortableContext
                  items={categories.map((c) => c.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="flex flex-col gap-[4px]">
                    {categories.map((cat) => (
                      <SortableCategoryRow
                        key={cat.id}
                        category={cat}
                        locale={locale}
                        expanded={expandedCatId === cat.id}
                        onToggle={() => setExpandedCatId(expandedCatId === cat.id ? null : cat.id)}
                        onEdit={() => setCatModalMode({ type: "editCategory", category: cat })}
                        onEditSub={(sub) => setCatModalMode({ type: "editSubcategory", parentId: cat.id, subcategory: sub })}
                        onAddSub={() => setCatModalMode({ type: "newSubcategory", parentId: cat.id })}
                        categoryViewCounts={categoryViewCounts}
                        artworkCounts={artworkCounts}
                        onReorderSubs={(reordered) => {
                          const updated = categories.map((c) =>
                            c.id === cat.id ? { ...c, subcategories: reordered } : c
                          );
                          setCategories(updated);
                          fetch("/api/categories", {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(updated),
                          }).catch(() => {});
                        }}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create modal */}
      <AnimatePresence>
        {isCreating && (
          <ArtworkFormModal
            key="new"
            category={categories.length > 0 ? categories[0].id : "personal"}
            categories={categories}
            initialImageUrl={initialImageUrl}
            initialContactId={createForContactId}
            onClose={() => { setIsCreating(false); setCreateForContactId(undefined); }}
            onSaved={(created) => {
              setDynamicArtworks((prev) => [...prev, created]);
              setIsCreating(false);
              setCreateForContactId(undefined);
            }}
          />
        )}
      </AnimatePresence>

      {/* Contact create modal */}
      <AnimatePresence>
        {isCreatingContact && (
          <ContactPickerModal
            key="new-contact"
            onClose={() => setIsCreatingContact(false)}
            onSaved={(contact) => {
              setContacts((prev) => [...prev, contact]);
              setIsCreatingContact(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* Contact edit modal */}
      <AnimatePresence>
        {editingContact && (
          <ContactPickerModal
            key={editingContact.id}
            contact={editingContact}
            onClose={() => setEditingContact(null)}
            onSaved={(updated) => {
              setContacts((prev) => prev.map((c) => c.id === updated.id ? updated : c));
              setEditingContact(null);
            }}
            onDeleted={(id) => {
              setContacts((prev) => prev.filter((c) => c.id !== id));
              setEditingContact(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Coworker create modal */}
      <AnimatePresence>
        {isCreatingCoworker && (
          <CoworkerPickerModal
            key="new-coworker"
            onClose={() => setIsCreatingCoworker(false)}
            onSaved={(coworker) => {
              setCoworkers((prev) => [...prev, coworker]);
              setIsCreatingCoworker(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* Coworker edit modal */}
      <AnimatePresence>
        {editingCoworker && (
          <CoworkerPickerModal
            key={editingCoworker.id}
            coworker={editingCoworker}
            onClose={() => setEditingCoworker(null)}
            onSaved={(updated) => {
              setCoworkers((prev) => prev.map((c) => c.id === updated.id ? updated : c));
              setEditingCoworker(null);
            }}
            onDeleted={(id) => {
              setCoworkers((prev) => prev.filter((c) => c.id !== id));
              setEditingCoworker(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Edit artwork modal */}
      <AnimatePresence>
        {editingArtwork && (
          <ArtworkFormModal
            key={editingArtwork.id}
            category={editingArtwork.category}
            subcategory={editingArtwork.subcategory}
            categories={categories}
            artwork={editingArtwork}
            onClose={() => setEditingArtwork(null)}
            onSaved={(updated) => {
              setDynamicArtworks((prev) =>
                prev.some((a) => a.id === updated.id)
                  ? prev.map((a) => (a.id === updated.id ? updated : a))
                  : [...prev, updated]
              );
              setEditingArtwork(null);
            }}
            onDeleted={(id) => {
              setDynamicArtworks((prev) => prev.filter((a) => a.id !== id));
              setEditingArtwork(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Category form modal */}
      <AnimatePresence>
        {catModalMode && (
          <CategoryFormModal
            key={JSON.stringify(catModalMode)}
            mode={catModalMode}
            categories={categories}
            onClose={() => setCatModalMode(null)}
            onSaved={(updated) => {
              setCategories(updated);
              setCatModalMode(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Artwork viewing modal (from contact thumbnails) */}
      <AnimatePresence>
        {viewingArtwork && (
          <ArtworkModal
            key={viewingArtwork.id}
            artwork={viewingArtwork}
            onClose={() => setViewingArtwork(null)}
            onEdit={() => { setEditingArtwork(viewingArtwork); setViewingArtwork(null); }}
            isHidden={hiddenIds.has(viewingArtwork.id)}
            onToggleHidden={() => handleToggleHidden(viewingArtwork.id)}
          />
        )}
      </AnimatePresence>

      {/* Settings panel */}
      <AnimatePresence>
        {activeSection === "settings" && (
          <motion.div
            key="settings-panel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="fixed top-0 bottom-0 right-0 left-[calc(33.75vw+24px)] z-10 overflow-y-auto bg-bg"
            style={{ paddingTop: 148 + 24, paddingBottom: 24, paddingRight: 24 }}
          >
            <div>
              {/* Social links section */}
              <div className="mb-0">
                <p className="text-[12px] font-bold tracking-[2.8px] uppercase text-text-secondary mb-1">
                  Social links
                </p>
                <p className="text-[12px] text-text-light mb-4">
                  Sidebar social buttons
                </p>

                <div className="flex gap-6 items-start">
                <div className="w-[520px] shrink-0">
                <DndContext
                  sensors={socialSensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(event: DragEndEvent) => {
                    const { active, over } = event;
                    if (over && active.id !== over.id) {
                      const oldIdx = siteSocials.findIndex((_, i) => `social-${i}` === active.id);
                      const newIdx = siteSocials.findIndex((_, i) => `social-${i}` === over.id);
                      if (oldIdx !== -1 && newIdx !== -1) setSiteSocials(arrayMove(siteSocials, oldIdx, newIdx));
                    }
                  }}
                >
                <SortableContext items={siteSocials.map((_, i) => `social-${i}`)} strategy={verticalListSortingStrategy}>
                <div className="flex flex-col gap-2 max-w-[520px]">
                  {siteSocials.map((s, i) => (
                    <SortableSocialRow
                      key={`social-${i}`}
                      id={`social-${i}`}
                      social={s}
                      index={i}
                      onUpdate={(idx, updated) => {
                        const next = [...siteSocials];
                        next[idx] = updated;
                        setSiteSocials(next);
                      }}
                      onRemove={(idx) => setSiteSocials(siteSocials.filter((_, j) => j !== idx))}
                    />
                  ))}
                </div>
                </SortableContext>
                </DndContext>
                <div className="flex gap-2 mt-3 max-w-[520px]">
                  <button
                    type="button"
                    onClick={() => setSiteSocials([...siteSocials, { name: "", url: "", icon: "/images/social/vk.svg" }])}
                    className="text-[12px] text-text-light hover:text-text-muted"
                  >
                    + Add link
                  </button>
                  <button
                    type="button"
                    disabled={socialsSaving}
                    onClick={async () => {
                      setSocialsSaving(true);
                      try {
                        const res = await fetch("/api/site-settings", {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ socials: siteSocials.filter((s) => s.name && s.url) }),
                        });
                        if (res.ok) {
                          const data = await res.json();
                          setSiteSocials(data.socials);
                        }
                      } catch {}
                      setSocialsSaving(false);
                    }}
                    className="text-[12px] font-bold tracking-[1.8px] uppercase text-text-muted hover:text-text transition-colors disabled:opacity-30 ml-auto"
                  >
                    {socialsSaving ? "..." : "Save"}
                  </button>
                </div>
                </div>

                {/* Social clicks chart */}
                <div className="flex-1 min-w-0">
                  <EntityChart
                    chartId="social-clicks"
                    apiUrl="/api/stats/clicks-by-social"
                    title="SOCIAL CLICKS"
                    sidebarTitle="TOP SOCIALS"
                    icon={<svg width="22" height="22" viewBox="0 0 20 20" fill="currentColor"><path d="M6.111 11.8891C3.96311 9.7412 3.96311 6.2588 6.111 4.11091C8.25888 1.96303 11.7413 1.96303 13.8892 4.11091C14.9633 5.185 15.5001 6.59127 15.5001 8C15.5001 8.41421 15.8359 8.75 16.2501 8.75C16.6643 8.75 17.0001 8.41421 17.0001 8C17.0001 6.2097 16.3165 4.41694 14.9498 3.05025C12.2162 0.316582 7.78401 0.316582 5.05034 3.05025C2.31667 5.78392 2.31667 10.2161 5.05034 12.9497C5.34323 13.2426 5.8181 13.2426 6.111 12.9497C6.40389 12.6569 6.40389 12.182 6.111 11.8891Z" /><path d="M8.23235 6.23223C7.25604 7.20854 7.25604 8.79146 8.23235 9.76777C8.52525 10.0607 8.52525 10.5355 8.23235 10.8284C7.93946 11.1213 7.46459 11.1213 7.17169 10.8284C5.60959 9.26633 5.60959 6.73367 7.17169 5.17157C8.73379 3.60948 11.2664 3.60948 12.8285 5.17157C13.6094 5.95247 14.0001 6.97747 14.0001 8C14.0001 8.41421 13.6643 8.75 13.2501 8.75C12.8359 8.75 12.5001 8.41421 12.5001 8C12.5001 7.35903 12.2562 6.72054 11.7679 6.23223C10.7916 5.25592 9.20866 5.25592 8.23235 6.23223Z" /><path d="M10.7657 7.51062C10.5871 7.24492 10.2596 7.12184 9.95029 7.20417C9.64095 7.2865 9.41795 7.5561 9.3951 7.8754L8.90409 14.7363C8.88303 15.0306 9.0365 15.3099 9.29622 15.4499C9.55595 15.59 9.87365 15.5647 10.108 15.3854L11.1508 14.5873L12.1363 18.2653C12.2436 18.6654 12.6548 18.9028 13.0549 18.7956C13.455 18.6884 13.6924 18.2771 13.5852 17.877L12.6083 14.2312L13.9005 14.4349C14.1951 14.4814 14.4893 14.3489 14.6497 14.0974C14.8101 13.846 14.8062 13.5233 14.6398 13.2758L10.7657 7.51062Z" /></svg>}
                    sidebarIcon={<ClickIcon />}
                  />
                </div>
                </div>
              </div>

              <hr className="my-10 border-text-light/30" />

              <p className="text-[12px] font-bold tracking-[2.8px] uppercase text-text-secondary mb-1">
                Hero illustration
              </p>
              <p className="text-[12px] text-text-light mb-4">
                2400 × 3000px, PNG
              </p>

              {/* Gallery grid */}
              <div
                className="flex gap-2 mb-6 overflow-x-auto pb-3 hero-gallery-scroll"
                ref={(el) => {
                  if (!el) return;
                  const handler = (e: WheelEvent) => {
                    if (e.deltaY !== 0) {
                      el.scrollLeft += e.deltaY;
                      e.preventDefault();
                    }
                  };
                  el.addEventListener("wheel", handler, { passive: false });
                  (el as any).__wheelCleanup?.();
                  (el as any).__wheelCleanup = () => el.removeEventListener("wheel", handler);
                }}
              >
                {heroImages.map((img) => (
                  <div
                    key={img.url}
                    className={`w-[calc(12.5%-6px)] shrink-0 cursor-pointer group border-2 transition-colors ${
                      img.url === heroImage
                        ? "border-[#81AB41]"
                        : "border-transparent"
                    }`}
                    onClick={() => setHeroMetaEditing({ ...img })}
                  >
                    <div className="relative aspect-[3/4] overflow-hidden bg-[#ebebeb] group-hover:bg-[#dedede] transition-colors shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.url}
                        alt=""
                        className="w-full h-full object-cover object-top"
                      />
                      {/* Delete button */}
                      {heroImages.length > 1 && (
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (!confirm("Delete this image?")) return;
                            try {
                              const res = await fetch("/api/site-settings", {
                                method: "DELETE",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ url: img.url }),
                              });
                              if (res.ok) {
                                const data = await res.json();
                                setHeroImages(data.heroImages);
                                setHeroImage(data.heroImage);
                              }
                            } catch {}
                          }}
                          className="absolute top-1 right-1 w-5 h-5 bg-white/80 rounded-full flex items-center justify-center text-[12px] text-text-muted hover:text-text opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ✕
                        </button>
                      )}
                      {img.url === heroImage && (
                        <div className="absolute top-0 left-0 right-0 bg-[#81AB41] text-white text-[12px] text-center py-0.5 tracking-[1px] uppercase">
                          Active
                        </div>
                      )}
                    </div>
                    {(img.title || img.year || img.tools) && (
                      <div className="bg-white pl-[16px] pr-[8px] pt-[16px] pb-[14px] flex flex-col gap-[2px]">
                        {img.title && <p className="truncate text-[14px] font-bold tracking-[1.8px] uppercase text-text-muted">{img.title}</p>}
                        {img.year && <p className="truncate text-[12px] tracking-[1.8px] text-text-light">{img.year}</p>}
                        {img.tools && <p className="truncate text-[12px] tracking-[1.8px] text-text-light">{img.tools}</p>}
                      </div>
                    )}
                  </div>
                ))}
                {/* Upload button */}
                <div className="w-[calc(12.5%-6px)] shrink-0">
                  <ImageUpload
                    sizeClassName="aspect-[3/4] w-full"
                    noPreview
                    onUploaded={async (url) => {
                      setHeroSaving(true);
                      try {
                        const res = await fetch("/api/site-settings", {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ heroImage: url }),
                        });
                        if (res.ok) {
                          const data = await res.json();
                          setHeroImages(data.heroImages);
                          setHeroImage(data.heroImage);
                          // Open metadata popup for the newly uploaded image
                          const newImg = data.heroImages.find((i: { url: string }) => i.url === url);
                          if (newImg) setHeroMetaEditing({ ...newImg });
                        }
                      } catch {}
                      setHeroSaving(false);
                    }}
                  />
                </div>
              </div>

              <hr className="my-10 border-text-light/30" />

              {/* Equipment section */}
              <div>
                <p className="text-[12px] font-bold tracking-[2.8px] uppercase text-text-secondary mb-1">
                  Equipment
                </p>
                <p className="text-[12px] text-text-light mb-4">
                  Devices shown on /equipment page
                </p>

                <div
                  className="flex gap-2 mb-6 overflow-x-auto pb-3 hero-gallery-scroll"
                  ref={(el) => {
                    if (!el) return;
                    const handler = (e: WheelEvent) => {
                      if (e.deltaY !== 0) {
                        el.scrollLeft += e.deltaY;
                        e.preventDefault();
                      }
                    };
                    el.addEventListener("wheel", handler, { passive: false });
                    (el as any).__wheelCleanup?.();
                    (el as any).__wheelCleanup = () => el.removeEventListener("wheel", handler);
                  }}
                >
                  {equipmentItems.map((item) => (
                    <div
                      key={item.id}
                      className="w-[calc(12.5%-6px)] shrink-0 cursor-pointer group border-2 border-transparent transition-colors"
                      onClick={() => setEditingEquipment(item)}
                    >
                      <div className="relative aspect-square overflow-hidden bg-[#ebebeb] group-hover:bg-[#dedede] transition-colors shrink-0">
                        {item.image && (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={item.image}
                            alt={item.name}
                            className="absolute max-w-none"
                            style={{
                              width: item.imagePos.width,
                              height: item.imagePos.height,
                              left: item.imagePos.left,
                              top: item.imagePos.top,
                            }}
                          />
                        )}
                      </div>
                      <div className="bg-white pl-[16px] pr-[8px] pt-[12px] pb-[12px]">
                        {item.brandIcon && (
                          <div className="h-[30px] flex items-center mb-[2px]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={item.brandIcon} alt="" className="h-[12px] w-auto object-contain" />
                          </div>
                        )}
                        <p className="text-[11px] font-bold tracking-[2.4px] uppercase text-[#808080] leading-[16px] mb-[6px]">
                          {item.name}
                        </p>
                        <div className="flex flex-col">
                          {item.specs.map((s) => (
                            <div key={s.key} className="flex text-[10px] font-medium text-[#969696] leading-[15px]">
                              <span className="shrink-0" style={{ width: item.specKeyWidth * 0.7 }}>
                                {s.key}
                              </span>
                              <span className="truncate">{s.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                  {/* Add button */}
                  <div className="w-[calc(12.5%-6px)] shrink-0">
                    <ImageUpload
                      sizeClassName="aspect-square w-full"
                      noPreview
                      onUploaded={() => setIsCreatingEquipment(true)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Hero image metadata popup */}
      <AnimatePresence>
        {heroMetaEditing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[110]"
          >
            <div className="absolute inset-0 bg-white/95" onClick={() => setHeroMetaEditing(null)} />
            <div
              className="absolute inset-0 flex items-center justify-center px-[40px] py-[48px]"
              onClick={() => setHeroMetaEditing(null)}
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="bg-white max-w-[620px] w-full shadow-[0px_4px_40px_0px_rgba(0,0,0,0.12)] px-[60px] py-[40px]"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="text-sm font-bold tracking-[2.8px] uppercase text-text-muted mb-8">
                  Hero Image Info
                </h2>

                <div className="flex flex-col gap-5">
                  {/* Top row: image left, fields right — aligned to image height */}
                  <div className="flex gap-5 items-stretch">
                    {/* Image — 50% */}
                    <div className="flex-1">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={heroMetaEditing.url}
                        alt=""
                        className="w-full aspect-[3/4] object-cover object-top bg-[#ebebeb]"
                      />
                    </div>

                    {/* Title + Year + Tools — 50%, stretched to image height */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div className="flex flex-col gap-4">
                        <div>
                          <label className="text-[12px] font-bold tracking-[2.8px] uppercase text-text-secondary mb-1 block">
                            Title
                          </label>
                          <input
                            className="w-full h-[30px] border border-text-light pl-3 pr-3 text-sm outline-none focus:border-text transition-colors"
                            value={heroMetaEditing.title}
                            onChange={(e) => setHeroMetaEditing({ ...heroMetaEditing, title: e.target.value })}
                            placeholder="Name"
                          />
                        </div>
                        <div>
                          <label className="text-[12px] font-bold tracking-[2.8px] uppercase text-text-secondary mb-1 block">
                            Year
                          </label>
                          <input
                            className="w-full h-[30px] border border-text-light pl-3 pr-3 text-sm outline-none focus:border-text transition-colors"
                            value={heroMetaEditing.year}
                            onChange={(e) => setHeroMetaEditing({ ...heroMetaEditing, year: e.target.value })}
                            placeholder="2020"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[12px] font-bold tracking-[2.8px] uppercase text-text-secondary mb-1 block">
                          Tools
                        </label>
                        <ToolSelector
                          value={heroMetaEditing.tools}
                          onChange={(tools) => setHeroMetaEditing({ ...heroMetaEditing, tools })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Change image link */}
                  <button
                    type="button"
                    onClick={() => document.getElementById("hero-replace-input")?.click()}
                    className="text-[12px] text-text-light hover:text-text-muted transition-colors self-start"
                  >
                    Change image
                  </button>
                  <input
                    id="hero-replace-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const fd = new FormData();
                      fd.append("file", file);
                      const uploadRes = await fetch("/api/upload", { method: "POST", body: fd });
                      if (!uploadRes.ok) return;
                      const { url: newUrl } = await uploadRes.json();
                      setHeroSaving(true);
                      try {
                        const oldUrl = heroMetaEditing.url;
                        const res = await fetch("/api/site-settings", {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ heroImage: newUrl }),
                        });
                        if (res.ok) {
                          const metaRes = await fetch("/api/site-settings", {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ updateMeta: { url: newUrl, title: heroMetaEditing.title, year: heroMetaEditing.year, tools: heroMetaEditing.tools } }),
                          });
                          if (metaRes.ok) {
                            const delRes = await fetch("/api/site-settings", {
                              method: "DELETE",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ url: oldUrl }),
                            });
                            const data = delRes.ok ? await delRes.json() : await metaRes.json();
                            setHeroImages(data.heroImages);
                            setHeroImage(data.heroImage);
                            setHeroMetaEditing({ ...heroMetaEditing, url: newUrl });
                          }
                        }
                      } catch {}
                      setHeroSaving(false);
                      e.target.value = "";
                    }}
                  />

                  <div className="flex gap-3 mt-4">
                    {heroImages.length > 1 && (
                      <button
                        onClick={async () => {
                          if (!confirm("Delete this image?")) return;
                          setHeroSaving(true);
                          try {
                            const res = await fetch("/api/site-settings", {
                              method: "DELETE",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ url: heroMetaEditing.url }),
                            });
                            if (res.ok) {
                              const data = await res.json();
                              setHeroImages(data.heroImages);
                              setHeroImage(data.heroImage);
                            }
                          } catch {}
                          setHeroSaving(false);
                          setHeroMetaEditing(null);
                        }}
                        disabled={heroSaving}
                        className="h-[40px] flex-1 text-[12px] font-bold tracking-[1.8px] uppercase border border-red-400 text-red-400 hover:bg-red-400 hover:text-white transition-colors disabled:opacity-30"
                      >
                        Delete
                      </button>
                    )}
                    {heroMetaEditing.url !== heroImage && (
                      <button
                        onClick={async () => {
                          setHeroSaving(true);
                          try {
                            // Save metadata first
                            await fetch("/api/site-settings", {
                              method: "PUT",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ updateMeta: heroMetaEditing }),
                            });
                            // Set as active
                            const res = await fetch("/api/site-settings", {
                              method: "PUT",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ heroImage: heroMetaEditing.url }),
                            });
                            if (res.ok) {
                              const data = await res.json();
                              setHeroImages(data.heroImages);
                              setHeroImage(data.heroImage);
                            }
                          } catch {}
                          setHeroSaving(false);
                          setHeroMetaEditing(null);
                        }}
                        disabled={heroSaving}
                        className="h-[40px] flex-1 text-[12px] font-bold tracking-[1.8px] uppercase border border-[#81AB41] text-[#81AB41] hover:bg-[#81AB41] hover:text-white transition-colors disabled:opacity-30"
                      >
                        Set Active
                      </button>
                    )}
                    <button
                      onClick={async () => {
                        setHeroSaving(true);
                        try {
                          const res = await fetch("/api/site-settings", {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ updateMeta: heroMetaEditing }),
                          });
                          if (res.ok) {
                            const data = await res.json();
                            setHeroImages(data.heroImages);
                          }
                        } catch {}
                        setHeroSaving(false);
                        setHeroMetaEditing(null);
                      }}
                      disabled={heroSaving}
                      className="h-[40px] flex-1 text-[12px] font-bold tracking-[1.8px] uppercase bg-text-muted text-white hover:bg-text transition-colors disabled:opacity-30"
                    >
                      {heroSaving ? "..." : "Save"}
                    </button>
                    <button
                      onClick={() => setHeroMetaEditing(null)}
                      className="h-[40px] flex-1 text-[12px] font-bold tracking-[1.8px] uppercase border border-text-light text-text-light hover:border-text-muted hover:text-text-muted transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isCreatingEquipment && (
          <EquipmentFormModal
            onClose={() => setIsCreatingEquipment(false)}
            onSaved={(item) => setEquipmentItems((prev) => [...prev, item])}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {editingEquipment && (
          <EquipmentFormModal
            equipment={editingEquipment}
            onClose={() => setEditingEquipment(null)}
            onSaved={(item) => setEquipmentItems((prev) => prev.map((e) => e.id === item.id ? item : e))}
            onDeleted={(id) => setEquipmentItems((prev) => prev.filter((e) => e.id !== id))}
          />
        )}
      </AnimatePresence>
    </>
  );
}
