"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useAdmin } from "@/components/admin/AdminProvider";
import { useRouter } from "@/i18n/navigation";
import { artworks as staticArtworks, Artwork } from "@/data/artworks";
import ArtworkFormModal from "@/components/admin/ArtworkFormModal";
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
}: {
  artwork: Artwork;
  viewCount: { total: number; recent: number };
  locale: "ru" | "en";
  onEdit: () => void;
  onDeleted: (id: string) => void;
  onNavigate: () => void;
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
      className="flex items-center gap-[16px] bg-white px-[16px] py-[12px] cursor-pointer hover:bg-[#fafafa] transition-colors"
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

function ContactRow({ contact, onEdit, onDeleted }: {
  contact: Contact;
  onEdit: () => void;
  onDeleted: (id: string) => void;
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

  return (
    <div className="flex items-center gap-[16px] bg-white px-[16px] py-[12px]">
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
  );
}

function CoworkerRow({ coworker, onEdit, onDeleted }: {
  coworker: Coworker;
  onEdit: () => void;
  onDeleted: (id: string) => void;
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

  return (
    <div className="flex items-center gap-[16px] bg-white px-[16px] py-[12px]">
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
}: {
  sub: Subcategory;
  locale: "ru" | "en";
  onEdit: () => void;
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
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-bold tracking-[1.2px] text-[#808080] uppercase truncate">
          — {sub.label[locale]}
        </p>
        <p className="text-[10px] text-[#c0c0c0] tracking-[1px] uppercase mt-[1px]">{sub.id}</p>
      </div>
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
}: {
  category: Category;
  locale: "ru" | "en";
  expanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onEditSub: (sub: Subcategory) => void;
  onAddSub: () => void;
  onReorderSubs: (reordered: Subcategory[]) => void;
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

        {/* Preview */}
        {category.preview ? (
          <div className="relative w-[40px] h-[40px] shrink-0 overflow-hidden bg-[#f0f0f0]">
            <Image src={category.preview} alt="" fill className="object-cover" sizes="40px" />
          </div>
        ) : (
          <div className="w-[40px] h-[40px] shrink-0 bg-[#f0f0f0]" />
        )}

        {/* Label */}
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold tracking-[1.5px] text-[#808080] uppercase truncate">
            {category.label[locale]}
          </p>
          <p className="text-[11px] text-[#c0c0c0] tracking-[1px] uppercase mt-[1px]">
            {category.id}
          </p>
        </div>

        {/* Expand subs arrow — always visible */}
        <button
          onClick={onToggle}
          className="shrink-0 text-[#c0c0c0] hover:text-[#808080] transition-colors text-[12px] px-2"
          title="Expand subcategories"
        >
          {expanded ? "▲" : "▼"}
        </button>

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

export default function CabinetPage() {
  const { isAdmin } = useAdmin();
  const router = useRouter();
  const locale = useLocale() as "ru" | "en";
  const t = useTranslations("admin");

  const [activeSection, setActiveSection] = useState<string | null>("statistic");
  const [sortBy, setSortBy] = useState<"popularity" | "date" | "category">("date");
  const [viewCounts, setViewCounts] = useState<Record<string, { total: number; recent: number }>>({});
  const [dynamicArtworks, setDynamicArtworks] = useState<Artwork[]>([]);
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [editingArtwork, setEditingArtwork] = useState<Artwork | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [initialImageUrl, setInitialImageUrl] = useState<string | undefined>();

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [isCreatingContact, setIsCreatingContact] = useState(false);

  const [coworkers, setCoworkers] = useState<Coworker[]>([]);
  const [editingCoworker, setEditingCoworker] = useState<Coworker | null>(null);
  const [isCreatingCoworker, setIsCreatingCoworker] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
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
  }, [activeSection]);

  useEffect(() => {
    if (activeSection !== "contacts") return;
    fetch("/api/contacts")
      .then((r) => r.json())
      .then((data: Contact[]) => setContacts(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [activeSection]);

  useEffect(() => {
    if (activeSection !== "coworkers") return;
    fetch("/api/coworkers")
      .then((r) => r.json())
      .then((data: Coworker[]) => setCoworkers(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [activeSection]);

  useEffect(() => {
    if (activeSection !== "categories") return;
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data: Category[]) => setCategories(Array.isArray(data) ? data : []))
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

  if (!isAdmin) return null;

  // Merge static + dynamic; dynamic overrides static (same id); filter deleted
  const artworkMap = new Map<string, Artwork>();
  for (const a of staticArtworks) artworkMap.set(a.id, a);
  for (const a of dynamicArtworks) artworkMap.set(a.id, a);
  const allArtworks = Array.from(artworkMap.values()).filter((a) => !deletedIds.has(a.id));

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
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-[4px]">
                <AddArtworkButton onClick={() => openCreate()} label={t("addArtwork")} onDropImage={(url) => openCreate(url)} />
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

              {contacts.length === 0 && (
                <p className="text-center text-[12px] text-[#c0c0c0] py-[32px] tracking-[1.5px] uppercase">—</p>
              )}

              {contacts.map((contact, i) => i % 2 === 0 && (
                <div key={contact.id} className="grid grid-cols-2 gap-[4px]">
                  <ContactRow
                    contact={contact}
                    onEdit={() => setEditingContact(contact)}
                    onDeleted={(id) => setContacts((prev) => prev.filter((c) => c.id !== id))}
                  />
                  {contacts[i + 1] && (
                    <ContactRow
                      contact={contacts[i + 1]}
                      onEdit={() => setEditingContact(contacts[i + 1])}
                      onDeleted={(id) => setContacts((prev) => prev.filter((c) => c.id !== id))}
                    />
                  )}
                </div>
              ))}
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

              {coworkers.length === 0 && (
                <p className="text-center text-[12px] text-[#c0c0c0] py-[32px] tracking-[1.5px] uppercase">—</p>
              )}

              {coworkers.map((coworker, i) => i % 2 === 0 && (
                <div key={coworker.id} className="grid grid-cols-2 gap-[4px]">
                  <CoworkerRow
                    coworker={coworker}
                    onEdit={() => setEditingCoworker(coworker)}
                    onDeleted={(id) => setCoworkers((prev) => prev.filter((c) => c.id !== id))}
                  />
                  {coworkers[i + 1] && (
                    <CoworkerRow
                      coworker={coworkers[i + 1]}
                      onEdit={() => setEditingCoworker(coworkers[i + 1])}
                      onDeleted={(id) => setCoworkers((prev) => prev.filter((c) => c.id !== id))}
                    />
                  )}
                </div>
              ))}
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
            onClose={() => setIsCreating(false)}
            onSaved={(created) => {
              setDynamicArtworks((prev) => [...prev, created]);
              setIsCreating(false);
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
    </>
  );
}
