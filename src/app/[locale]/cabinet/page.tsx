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
import VisitsChart from "@/components/admin/VisitsChart";
import type { Contact, Coworker } from "@/lib/blob";
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
      className={`flex items-center gap-[16px] bg-white px-[16px] py-[12px] cursor-pointer hover:bg-[#fafafa] transition-colors ${isHidden ? "opacity-50" : ""}`}
      onClick={onNavigate}
    >
      {/* Thumbnail */}
      <div className="relative w-[52px] h-[52px] shrink-0 bg-[#f0f0f0] overflow-hidden">
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
        <p className="text-[13px] font-bold tracking-[1.5px] text-[#808080] uppercase truncate">
          {artwork.title[locale]}
        </p>
        <p className="text-[12px] font-medium tracking-[1.2px] text-[#c0c0c0] uppercase mt-[2px]">
          {artwork.category}
          {artwork.subcategory ? ` / ${artwork.subcategory}` : ""}
          {artwork.year ? ` · ${artwork.year}` : ""}
        </p>
      </div>

      {/* Separator */}
      <span className="w-px h-[32px] bg-[#ebebeb] shrink-0" />

      {/* Views */}
      <div className="flex items-center gap-[16px] shrink-0 w-[120px] justify-end">
        {viewCount.recent > 0 && (
          <span className="text-[13px] font-bold tracking-[0.5px]" style={{ color: "#81AB41" }}>
            +{viewCount.recent}
          </span>
        )}
        <div className="flex items-center gap-[5px] text-[#c0c0c0]">
          <EyeIcon />
          <span className="text-[13px] font-bold tracking-[0.5px]">{viewCount.total}</span>
        </div>
      </div>

      {/* Separator */}
      <span className="w-px h-[32px] bg-[#ebebeb] shrink-0" />

      {/* Date */}
      <div className="shrink-0 w-[130px]">
        {artwork.createdAt ? (() => {
          const { date, time } = formatCreatedAt(artwork.createdAt, locale);
          return (
            <>
              <p className="text-[12px] font-medium tracking-[1.2px] text-[#c0c0c0]">{date}</p>
              <p className="text-[12px] font-medium tracking-[1.2px] text-[#c0c0c0] mt-[2px]">{time}</p>
            </>
          );
        })() : (
          <p className="text-[12px] font-medium tracking-[1.2px] text-[#c0c0c0]">—</p>
        )}
      </div>

      {/* Separator */}
      <span className="w-px h-[32px] bg-[#ebebeb] shrink-0" />

      {/* Versions */}
      <div className="shrink-0 w-[60px]">
        <p className="text-[12px] font-bold tracking-[1.2px] text-[#c0c0c0]">
          {artwork.sketch ? "F+S" : "F"}
        </p>
      </div>

      {/* Separator */}
      <span className="w-px h-[32px] bg-[#ebebeb] shrink-0" />

      {/* Spacer */}
      <div className="flex-1" />

      {/* Edit */}
      <button
        onClick={(e) => { e.stopPropagation(); onEdit(); }}
        className="shrink-0 w-[16px] h-[16px] flex items-center justify-center text-[#c0c0c0] hover:text-[#808080] transition-colors"
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
          className="shrink-0 w-[16px] h-[16px] flex items-center justify-center text-[#c0c0c0] hover:text-[#808080] transition-colors"
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
          ? "border-[#808080] bg-[#c0c0c0]/10 text-[#808080]"
          : "border-[#e0e0e0] text-[#c0c0c0] hover:text-[#808080] hover:border-[#c0c0c0] hover:bg-[#c0c0c0]/5"
      }`}
    >
      {uploading ? (
        <span className="text-[12px] font-bold tracking-[1.8px] uppercase animate-pulse text-[#c0c0c0]">...</span>
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

function ContactRow({ contact, onEdit, onDeleted, artworks, onArtworkClick, onCreateArtwork, totalViews }: {
  contact: Contact;
  onEdit: () => void;
  onDeleted: (id: string) => void;
  artworks: Artwork[];
  onArtworkClick: (artwork: Artwork) => void;
  onCreateArtwork: () => void;
  totalViews: number;
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
    <div className="bg-[#ebebeb]">
      {/* Top row — info + actions */}
      <div className="flex items-center gap-[16px] px-[16px] py-[12px] bg-white">
        {/* Avatar */}
        <div className="relative w-[52px] h-[52px] shrink-0 rounded-full overflow-hidden bg-[#f0f0f0] flex items-center justify-center">
          {contact.clientAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={contact.clientAvatar} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-[18px] font-bold text-[#c0c0c0]">
              {contact.clientName.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold tracking-[1.5px] text-[#808080] uppercase truncate">
            {contact.clientName}
          </p>
          {(contact.clientRole || contact.client) && (
            <p className="text-[12px] font-medium tracking-[1.2px] text-[#c0c0c0] uppercase mt-[2px] truncate">
              {[contact.clientRole, contact.client].filter(Boolean).join(" · ")}
            </p>
          )}
          {contact.clientSocials && contact.clientSocials.length > 0 && (
            <div className="flex gap-[6px] mt-[4px]">
              {contact.clientSocials.map((s, i) => (
                <span key={i} className="text-[10px] font-bold tracking-[1px] text-[#c0c0c0] bg-[#f5f5f5] px-[5px] py-[1px]">
                  {SOCIAL_ICONS[s.icon] ?? s.icon.toUpperCase()}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-[12px] shrink-0">
          {/* Artworks count */}
          <div className="flex items-center gap-[5px] text-[#c0c0c0]">
            <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
              <path d="M1 3.5A1.5 1.5 0 0 1 2.5 2h15A1.5 1.5 0 0 1 19 3.5v13a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 1 16.5v-13ZM3 5v10l4-4 3 3 4-5 3 3.5V5H3Z" />
            </svg>
            <span className="text-[13px] font-bold tracking-[0.5px]">{artworks.length}</span>
          </div>

          <span className="w-px h-[20px] bg-[#ebebeb] shrink-0" />

          {/* Views */}
          <div className="flex items-center gap-[5px] text-[#c0c0c0]">
            <EyeIcon />
            <span className="text-[13px] font-bold tracking-[0.5px]">{totalViews}</span>
          </div>
        </div>

        <span className="w-px h-[32px] bg-[#ebebeb] shrink-0" />

        {/* Edit */}
        <button
          onClick={onEdit}
          className="shrink-0 w-[16px] h-[16px] flex items-center justify-center text-[#c0c0c0] hover:text-[#808080] transition-colors"
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
      <div ref={thumbsRef} className="grid gap-[10px] p-[10px] bg-[#ebebeb] overflow-y-auto" style={{ gridTemplateColumns: `repeat(${slotsPerRow}, 1fr)`, maxHeight: 20 + itemSize * 2 + 10 }}>
        {Array.from({ length: slotCount }, (_, i) => {
          const artwork = artworks[i];
          if (artwork) {
            return (
              <button
                key={artwork.id}
                onClick={(e) => { e.stopPropagation(); onArtworkClick(artwork); }}
                className="relative aspect-square overflow-hidden bg-[#f0f0f0] hover:brightness-75 transition-all"
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
                className="aspect-square border-2 border-dashed border-[#c0c0c0] flex items-center justify-center text-[#c0c0c0] hover:border-[#808080] hover:text-[#808080] transition-colors"
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
              className="aspect-square border border-dashed border-[#c0c0c0]"
            />
          );
        })}
      </div>
    </div>
  );
}

function CoworkerRow({ coworker, onEdit, onDeleted, artworks, onArtworkClick, totalViews }: {
  coworker: Coworker;
  onEdit: () => void;
  onDeleted: (id: string) => void;
  artworks: Artwork[];
  onArtworkClick: (artwork: Artwork) => void;
  totalViews: number;
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
    <div className="bg-[#ebebeb]">
      {/* Top row — info + actions */}
      <div className="flex items-center gap-[16px] px-[16px] py-[12px] bg-white">
        <div className="relative w-[52px] h-[52px] shrink-0 rounded-full overflow-hidden bg-[#f0f0f0] flex items-center justify-center">
          {coworker.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coworker.avatar} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-[18px] font-bold text-[#c0c0c0]">
              {coworker.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold tracking-[1.5px] text-[#808080] uppercase truncate">
            {coworker.name}
          </p>
          {coworker.role && (
            <p className="text-[12px] font-medium tracking-[1.2px] text-[#c0c0c0] uppercase mt-[2px] truncate">
              {coworker.role}
            </p>
          )}
          {coworker.socials && coworker.socials.length > 0 && (
            <div className="flex gap-[6px] mt-[4px]">
              {coworker.socials.map((s, i) => (
                <span key={i} className="text-[10px] font-bold tracking-[1px] text-[#c0c0c0] bg-[#f5f5f5] px-[5px] py-[1px]">
                  {SOCIAL_ICONS[s.icon] ?? s.icon.toUpperCase()}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-[12px] shrink-0">
          <div className="flex items-center gap-[5px] text-[#c0c0c0]">
            <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
              <path d="M1 3.5A1.5 1.5 0 0 1 2.5 2h15A1.5 1.5 0 0 1 19 3.5v13a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 1 16.5v-13ZM3 5v10l4-4 3 3 4-5 3 3.5V5H3Z" />
            </svg>
            <span className="text-[13px] font-bold tracking-[0.5px]">{artworks.length}</span>
          </div>
          <span className="w-px h-[20px] bg-[#ebebeb] shrink-0" />
          <div className="flex items-center gap-[5px] text-[#c0c0c0]">
            <EyeIcon />
            <span className="text-[13px] font-bold tracking-[0.5px]">{totalViews}</span>
          </div>
        </div>

        <span className="w-px h-[32px] bg-[#ebebeb] shrink-0" />

        <button
          onClick={onEdit}
          className="shrink-0 w-[16px] h-[16px] flex items-center justify-center text-[#c0c0c0] hover:text-[#808080] transition-colors"
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
      <div ref={thumbsRef} className="grid gap-[10px] p-[10px] bg-[#ebebeb] overflow-y-auto" style={{ gridTemplateColumns: `repeat(${slotsPerRow}, 1fr)`, maxHeight: 20 + itemSize * 2 + 10 }}>
        {Array.from({ length: slotCount }, (_, i) => {
          const artwork = artworks[i];
          if (artwork) {
            return (
              <button
                key={artwork.id}
                onClick={(e) => { e.stopPropagation(); onArtworkClick(artwork); }}
                className="relative aspect-square overflow-hidden bg-[#f0f0f0] hover:brightness-75 transition-all"
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
              className="aspect-square border border-dashed border-[#c0c0c0]"
            />
          );
        })}
      </div>
    </div>
  );
}

const sections = [{ key: "statistic" }, { key: "categories" }, { key: "contacts" }, { key: "coworkers" }] as const;

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
      className="flex items-center gap-[12px] bg-[#fafafa] px-[16px] py-[8px]"
    >
      <span
        {...attributes}
        {...listeners}
        className="cursor-grab text-[#c0c0c0] hover:text-[#808080] shrink-0 touch-none"
        title="Drag"
      >
        {DRAG_HANDLE_SVG}
      </span>
      <div className="w-[220px] shrink-0 min-w-0">
        <p className="text-[12px] font-bold tracking-[1.2px] text-[#808080] uppercase truncate">
          — {sub.label[locale]}
        </p>
        <p className="text-[10px] text-[#c0c0c0] tracking-[1px] uppercase mt-[1px]">{sub.id}</p>
      </div>
      <span className="w-px h-[24px] bg-[#ebebeb] shrink-0" />
      <div className="flex items-center gap-[16px] shrink-0 w-[120px] justify-end">
        {viewCount && viewCount.recent > 0 && (
          <span className="text-[13px] font-bold tracking-[0.5px]" style={{ color: "#81AB41" }}>
            +{viewCount.recent}
          </span>
        )}
        <div className="flex items-center gap-[5px] text-[#c0c0c0]">
          <EyeIcon />
          <span className="text-[13px] font-bold tracking-[0.5px]">{viewCount?.total ?? 0}</span>
        </div>
      </div>
      <span className="w-px h-[24px] bg-[#ebebeb] shrink-0" />
      {/* Artwork count */}
      <div className="w-[80px] shrink-0 text-[13px] font-bold tracking-[0.5px] text-[#c0c0c0] text-right">
        {artworkCount}
      </div>
      <span className="w-px h-[24px] bg-[#ebebeb] shrink-0" />
      {/* Date */}
      <div className="w-[130px] shrink-0">
        {sub.createdAt && (() => {
          const { date, time } = formatCreatedAt(sub.createdAt, locale);
          return (
            <>
              <p className="text-[12px] font-medium tracking-[1.2px] text-[#c0c0c0]">{date}</p>
              <p className="text-[12px] font-medium tracking-[1.2px] text-[#c0c0c0] mt-[2px]">{time}</p>
            </>
          );
        })()}
      </div>
      <span className="w-px h-[24px] bg-[#ebebeb] shrink-0" />
      <div className="flex-1" />
      <button
        onClick={onEdit}
        className="shrink-0 w-[14px] h-[14px] flex items-center justify-center text-[#c0c0c0] hover:text-[#808080] transition-colors"
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
          className="cursor-grab text-[#c0c0c0] hover:text-[#808080] shrink-0 touch-none"
          title="Drag"
        >
          {DRAG_HANDLE_SVG}
        </span>

        {/* Expand subs arrow */}
        <button
          onClick={onToggle}
          className="shrink-0 text-[#c0c0c0] hover:text-[#808080] transition-colors text-[12px]"
          title="Expand subcategories"
        >
          {expanded ? "▲" : "▼"}
        </button>

        {/* Preview */}
        {category.preview ? (
          <div className="relative w-[40px] h-[40px] shrink-0 overflow-hidden bg-[#f0f0f0]">
            <Image src={category.preview} alt="" fill className="object-cover" sizes="40px" />
          </div>
        ) : (
          <div className="w-[40px] h-[40px] shrink-0 bg-[#f0f0f0]" />
        )}

        {/* Label */}
        <div className="w-[200px] shrink-0 min-w-0">
          <p className="text-[13px] font-bold tracking-[1.5px] text-[#808080] uppercase truncate">
            {category.label[locale]}
          </p>
          <p className="text-[11px] text-[#c0c0c0] tracking-[1px] uppercase mt-[1px]">
            {category.id}
          </p>
        </div>

        <span className="w-px h-[32px] bg-[#ebebeb] shrink-0" />
        <div className="flex items-center gap-[16px] shrink-0 w-[120px] justify-end">
          {categoryViewCounts[category.id]?.recent > 0 && (
            <span className="text-[13px] font-bold tracking-[0.5px]" style={{ color: "#81AB41" }}>
              +{categoryViewCounts[category.id].recent}
            </span>
          )}
          <div className="flex items-center gap-[5px] text-[#c0c0c0]">
            <EyeIcon />
            <span className="text-[13px] font-bold tracking-[0.5px]">{categoryViewCounts[category.id]?.total ?? 0}</span>
          </div>
        </div>
        <span className="w-px h-[32px] bg-[#ebebeb] shrink-0" />

        {/* Artwork count */}
        <div className="w-[80px] shrink-0 text-[13px] font-bold tracking-[0.5px] text-[#c0c0c0] text-right">
          {artworkCounts[category.id] ?? 0}
        </div>
        <span className="w-px h-[32px] bg-[#ebebeb] shrink-0" />

        {/* Date */}
        <div className="w-[130px] shrink-0">
          {category.createdAt && (() => {
            const { date, time } = formatCreatedAt(category.createdAt, locale);
            return (
              <>
                <p className="text-[12px] font-medium tracking-[1.2px] text-[#c0c0c0]">{date}</p>
                <p className="text-[12px] font-medium tracking-[1.2px] text-[#c0c0c0] mt-[2px]">{time}</p>
              </>
            );
          })()}
        </div>
        <span className="w-px h-[32px] bg-[#ebebeb] shrink-0" />

        <div className="flex-1" />

        {/* Edit */}
        <button
          onClick={onEdit}
          className="shrink-0 w-[16px] h-[16px] flex items-center justify-center text-[#c0c0c0] hover:text-[#808080] transition-colors"
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
                className="flex items-center gap-[6px] px-[16px] py-[6px] text-[11px] font-bold tracking-[1.8px] uppercase text-[#c0c0c0] hover:text-[#808080] transition-colors"
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
    <div className="border border-[#e0e0e0] mb-[4px] overflow-hidden">
      <div className="flex max-h-[260px]">
        {/* Chart section */}
        <div className="w-2/3 min-w-0 px-[20px] py-[16px]">
          {/* Total + period switcher */}
          <div className="flex items-baseline justify-between mb-[16px]">
            <div className="flex items-baseline gap-[8px]">
              <span className="text-[26px] font-bold tracking-tight text-[#808080]">
                {loading ? "—" : total.toLocaleString()}
              </span>
              <span className="text-[12px] font-bold tracking-[2px] uppercase text-[#c0c0c0]">
                VIEWS BY CLIENTS
              </span>
            </div>
            <div className="flex items-center gap-[12px]" data-cv-periods>
              {CV_PERIODS.map((p, i) => (
                <React.Fragment key={p}>
                  {i > 0 && <span className="w-px h-[1em] bg-[#c0c0c0]/40 self-center" />}
                  <button
                    onClick={() => setPeriod(p)}
                    className={`text-[12px] font-bold tracking-[1.8px] uppercase transition-colors ${
                      period === p ? "text-[#808080]" : "text-[#c0c0c0] hover:text-[#808080]"
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
              <span className="text-[12px] text-[#c0c0c0] tracking-[2px] uppercase animate-pulse">...</span>
            </div>
          ) : (
            <div className="flex">
              {/* Y-axis labels */}
              <div className="relative shrink-0" style={{ width: CV_Y_LABEL_W, height: CV_CHART_H }}>
                {gridLevels.map(({ frac, pxY, value }) => (
                  <span
                    key={frac}
                    className="absolute right-[6px] text-[12px] font-bold text-[#c0c0c0] leading-none -translate-y-1/2"
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
                    <rect key={i} x={b.x1} y={0} width={b.x2 - b.x1} height={CV_CHART_H} fill="#808080" fillOpacity="0.06" />
                  ))}

                  {gridLevels.map(({ frac, svgY }) => (
                    <line key={frac} x1={0} y1={svgY} x2={chartW} y2={svgY} stroke="#e0e0e0" strokeWidth="1" strokeDasharray="2 3" />
                  ))}

                  {labels.map((_, i) => {
                    if (i % labelEvery !== 0) return null;
                    const cx = i * (barW + gap) + barW / 2;
                    return <line key={i} x1={cx} y1={0} x2={cx} y2={CV_CHART_H} stroke="#e0e0e0" strokeWidth="0.5" />;
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
                    <line x1={hoveredCx} y1={0} x2={hoveredCx} y2={CV_CHART_H} stroke="#c0c0c0" strokeWidth="1" />
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
                    <div className="bg-white text-[11px] font-bold tracking-[1px] px-[10px] py-[6px] shadow-[0_2px_12px_rgba(0,0,0,0.10)] whitespace-nowrap mt-[4px]">
                      <div className="text-[#c0c0c0] mb-[4px]">{labels[hoveredIdx]?.label}</div>
                      {chartData.map((contact, ci) => {
                        const val = contact.buckets[hoveredIdx]?.count ?? 0;
                        if (val === 0) return null;
                        return (
                          <div key={contact.id} className="flex items-center gap-[6px]">
                            <span className="w-[6px] h-[6px] rounded-full shrink-0" style={{ background: CV_COLORS[ci % CV_COLORS.length] }} />
                            <span className="text-[#808080]">{contact.name}</span>
                            <span className="text-[#808080] ml-auto pl-[8px]">{val}</span>
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
                        className="absolute text-[12px] font-bold tracking-[1.8px] uppercase text-[#c0c0c0] -translate-x-1/2 leading-none"
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
        <div className="w-px bg-[#e0e0e0] shrink-0" />
        <div className="w-1/3 shrink-0 px-[16px] py-[16px] flex flex-col overflow-hidden" data-cv-sidebar>
          <div className="text-[12px] font-bold tracking-[2px] uppercase text-[#c0c0c0] mb-[12px] shrink-0">
            TOP CLIENTS
          </div>
          <div className="overflow-y-auto min-h-0 flex-1">
            {loading ? (
              <span className="text-[12px] text-[#c0c0c0] animate-pulse">...</span>
            ) : data.length === 0 ? (
              <span className="text-[12px] text-[#c0c0c0]">—</span>
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
                        ci > 0 ? "border-t border-[#e0e0e0]" : ""
                      } ${selectedId && !isSelected ? "opacity-40" : ""}`}
                    >
                      <span className="text-[11px] font-bold text-[#c0c0c0] tabular-nums w-[16px] text-right shrink-0">{ci + 1}</span>
                      <span className="w-px h-[12px] bg-[#e0e0e0] shrink-0" />
                      <svg className="shrink-0" width="12" height="12" viewBox="0 0 24 24" fill="#c0c0c0">
                        <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                        <path fillRule="evenodd" d="M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113-1.487 4.471-5.705 7.697-10.677 7.697-4.97 0-9.186-3.223-10.675-7.69a1.762 1.762 0 0 1 0-1.113ZM17.25 12a5.25 5.25 0 1 1-10.5 0 5.25 5.25 0 0 1 10.5 0Z" clipRule="evenodd" />
                      </svg>
                      <span className="text-[12px] font-bold text-[#c0c0c0] tabular-nums min-w-[24px] text-right shrink-0">{contact.totalViews}</span>
                      <span
                        className="w-[8px] h-[8px] rounded-full shrink-0"
                        style={{ background: color }}
                      />
                      <span className="text-[12px] font-bold text-[#808080] truncate">{contact.name}</span>
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
                      : "text-[#c0c0c0] hover:text-text-muted"
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
            className="fixed top-0 bottom-0 right-0 left-[calc(33.75vw+24px)] z-10 overflow-y-auto bg-[#f5f5f5]"
            style={{ paddingTop: 148 + 24, paddingBottom: 24, paddingRight: 24 }}
          >
            <VisitsChart />

            <div className="w-full h-px bg-[#e0e0e0]" />

            {/* Table header + sort controls in one row */}
            <div className="flex items-center gap-[16px] pr-[16px] mb-[8px] border-b border-r border-[#e0e0e0]">
              <span className="w-[2px] h-[2em] bg-[#e0e0e0] shrink-0" />
              <p className="w-[314px] shrink-0 text-[10px] font-bold tracking-[1.8px] text-[#c0c0c0] uppercase">
                {t("colNameInfo")}
              </p>
              <span className="w-[2px] h-[2em] bg-[#e0e0e0] shrink-0" />
              <p className="w-[120px] shrink-0 text-[10px] font-bold tracking-[1.8px] text-[#c0c0c0] uppercase">
                {t("colViews")}
              </p>
              <span className="w-[2px] h-[2em] bg-[#e0e0e0] shrink-0" />
              <p className="w-[130px] shrink-0 text-[10px] font-bold tracking-[1.8px] text-[#c0c0c0] uppercase">
                {t("colDate")}
              </p>
              <span className="w-[2px] h-[2em] bg-[#e0e0e0] shrink-0" />
              <p className="w-[60px] shrink-0 text-[10px] font-bold tracking-[1.8px] text-[#c0c0c0] uppercase">
                {t("colVersions")}
              </p>
              <span className="w-[2px] h-[2em] bg-[#e0e0e0] shrink-0" />
              {/* Sort filters — right-aligned */}
              <div className="flex-1 flex items-center justify-end gap-[12px]">
                {(["date", "popularity", "category"] as const).map((mode, i) => (
                  <React.Fragment key={mode}>
                    {i > 0 && <span className="w-px h-[1em] bg-text-light/50 self-center" />}
                    <button
                      onClick={() => setSortBy(mode)}
                      className={`text-[10px] font-bold tracking-[1.8px] uppercase transition-colors ${
                        sortBy === mode ? "text-[#808080]" : "text-[#c0c0c0] hover:text-[#808080]"
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
                      <p className="text-[14px] font-bold tracking-[2px] text-[#c0c0c0] uppercase shrink-0">
                        {categoryLabel(group.category)}
                      </p>
                      <span className="flex-1 h-px bg-[#e0e0e0]" />
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
            className="fixed top-0 bottom-0 right-0 left-[calc(33.75vw+24px)] z-10 overflow-y-auto bg-[#f5f5f5]"
            style={{ paddingTop: 148 + 24, paddingBottom: 24, paddingRight: 24 }}
          >
            <div className="flex flex-col gap-[4px]">
              <ContactViewsChart />

              {/* Add button — spans full width */}
              <button
                onClick={() => setIsCreatingContact(true)}
                className="w-full flex items-center justify-center gap-[8px] border-2 border-dashed border-[#e0e0e0] px-[16px] py-[14px] text-[#c0c0c0] hover:text-[#808080] hover:border-[#c0c0c0] hover:bg-[#c0c0c0]/5 transition-all duration-200"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 1v14M1 8h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <span className="text-[12px] font-bold tracking-[1.8px] uppercase">{t("addContact")}</span>
              </button>

              <div style={{ height: 5 }} />

              {contacts.length === 0 && (
                <p className="text-center text-[12px] text-[#c0c0c0] py-[32px] tracking-[1.5px] uppercase">—</p>
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
            className="fixed top-0 bottom-0 right-0 left-[calc(33.75vw+24px)] z-10 overflow-y-auto bg-[#f5f5f5]"
            style={{ paddingTop: 148 + 24, paddingBottom: 24, paddingRight: 24 }}
          >
            <div className="flex flex-col gap-[4px]">
              <button
                onClick={() => setIsCreatingCoworker(true)}
                className="w-full flex items-center justify-center gap-[8px] border-2 border-dashed border-[#e0e0e0] px-[16px] py-[14px] text-[#c0c0c0] hover:text-[#808080] hover:border-[#c0c0c0] hover:bg-[#c0c0c0]/5 transition-all duration-200"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 1v14M1 8h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <span className="text-[12px] font-bold tracking-[1.8px] uppercase">{t("addCoworker")}</span>
              </button>

              <div style={{ height: 5 }} />

              {coworkers.length === 0 && (
                <p className="text-center text-[12px] text-[#c0c0c0] py-[32px] tracking-[1.5px] uppercase">—</p>
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
                    />
                    {coworkers[i + 1] && (
                      <CoworkerRow
                        coworker={coworkers[i + 1]}
                        onEdit={() => setEditingCoworker(coworkers[i + 1])}
                        onDeleted={(id) => setCoworkers((prev) => prev.filter((c) => c.id !== id))}
                        artworks={getArtworks(coworkers[i + 1])}
                        onArtworkClick={(a) => setViewingArtwork(a)}
                        totalViews={getViews(coworkers[i + 1])}
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
            className="fixed top-0 bottom-0 right-0 left-[calc(33.75vw+24px)] z-10 overflow-y-auto bg-[#f5f5f5]"
            style={{ paddingTop: 148 + 24, paddingBottom: 24, paddingRight: 24 }}
          >
            {/* Table header — same flex/gap/px as SortableCategoryRow */}
            <div className="flex items-center gap-[12px] px-[16px] mb-[8px] border border-[#e0e0e0]">
              {/* Invisible drag handle — same svg size */}
              <span className="shrink-0 invisible">{DRAG_HANDLE_SVG}</span>
              {/* Invisible arrow — same button style */}
              <span className="shrink-0 text-[12px] invisible">▼</span>
              {/* Invisible preview */}
              <div className="w-[40px] shrink-0" />
              {/* NAME / INFO — same w-[200px] as label */}
              <p className="w-[200px] shrink-0 text-[10px] font-bold tracking-[1.8px] text-[#c0c0c0] uppercase">
                {t("colNameInfo")}
              </p>
              <span className="w-px h-[2em] bg-[#e0e0e0] shrink-0" />
              {/* VIEWS — same w-[120px] */}
              <p className="w-[120px] shrink-0 text-[10px] font-bold tracking-[1.8px] text-[#c0c0c0] uppercase">
                {t("colViews")}
              </p>
              <span className="w-px h-[2em] bg-[#e0e0e0] shrink-0" />
              {/* CARDS */}
              <p className="w-[80px] shrink-0 text-[10px] font-bold tracking-[1.8px] text-[#c0c0c0] uppercase">
                {t("colCards")}
              </p>
              <span className="w-px h-[2em] bg-[#e0e0e0] shrink-0" />
              {/* DATE */}
              <p className="w-[130px] shrink-0 text-[10px] font-bold tracking-[1.8px] text-[#c0c0c0] uppercase">
                {t("colDate")}
              </p>
              <span className="w-px h-[2em] bg-[#e0e0e0] shrink-0" />
            </div>

            <div className="flex flex-col gap-[4px]">
              {/* Add section button */}
              <button
                onClick={() => setCatModalMode({ type: "newCategory" })}
                className="w-full flex items-center justify-center gap-[8px] border-2 border-dashed border-[#e0e0e0] px-[16px] py-[14px] text-[#c0c0c0] hover:text-[#808080] hover:border-[#c0c0c0] hover:bg-[#c0c0c0]/5 transition-all duration-200"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 1v14M1 8h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <span className="text-[12px] font-bold tracking-[1.8px] uppercase">{t("addCategory")}</span>
              </button>

              <div style={{ height: 5 }} />

              {categories.length === 0 && (
                <p className="text-center text-[12px] text-[#c0c0c0] py-[32px] tracking-[1.5px] uppercase">—</p>
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
    </>
  );
}
