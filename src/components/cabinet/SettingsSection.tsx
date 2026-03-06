"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext,
  closestCenter,
  type DragEndEvent,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { type Equipment, equipmentName, specValue } from "@/data/equipment";
import { ClickIcon, CLICK_ICON_22, PANEL_CLASS, PANEL_STYLE } from "./shared";
import EntityChart from "./EntityChart";
import HorizontalCarousel from "@/components/admin/HorizontalCarousel";
import ImageUpload from "@/components/admin/ImageUpload";
import ToolSelector from "@/components/admin/ToolSelector";
import EquipmentFormModal from "@/components/admin/EquipmentFormModal";

/* ------------------------------------------------------------------ */
/*  Constants & helpers                                                */
/* ------------------------------------------------------------------ */

const DRAG_HANDLE_SVG = (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
    <circle cx="2" cy="2" r="2" />
    <circle cx="8" cy="2" r="2" />
    <circle cx="2" cy="8" r="2" />
    <circle cx="8" cy="8" r="2" />
  </svg>
);

const BUILT_IN_ICONS = ["artstation", "behance", "deviantart", "instagram", "telegram", "tumblr", "vk", "youtube"];

/* ------------------------------------------------------------------ */
/*  SortableSocialRow                                                  */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

type Props = {
  siteSocials: { name: string; url: string; icon: string }[];
  setSiteSocials: React.Dispatch<React.SetStateAction<{ name: string; url: string; icon: string }[]>>;
  socialsSaving: boolean;
  setSocialsSaving: (v: boolean) => void;
  heroImage: string;
  setHeroImage: (v: string) => void;
  heroImages: { url: string; title: string; year: string; tools: string }[];
  setHeroImages: (v: { url: string; title: string; year: string; tools: string }[]) => void;
  heroSaving: boolean;
  setHeroSaving: (v: boolean) => void;
  heroMetaEditing: { url: string; title: string; year: string; tools: string } | null;
  setHeroMetaEditing: (v: { url: string; title: string; year: string; tools: string } | null) => void;
  equipmentItems: Equipment[];
  setEquipmentItems: React.Dispatch<React.SetStateAction<Equipment[]>>;
  socialSensors: ReturnType<typeof useSensors>;
};

/* ------------------------------------------------------------------ */
/*  SettingsSection                                                    */
/* ------------------------------------------------------------------ */

export default function SettingsSection({
  siteSocials,
  setSiteSocials,
  socialsSaving,
  setSocialsSaving,
  heroImage,
  setHeroImage,
  heroImages,
  setHeroImages,
  heroSaving,
  setHeroSaving,
  heroMetaEditing,
  setHeroMetaEditing,
  equipmentItems,
  setEquipmentItems,
  socialSensors,
}: Props) {
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [isCreatingEquipment, setIsCreatingEquipment] = useState(false);
  const [converting, setConverting] = useState(false);
  const [convertResult, setConvertResult] = useState<{ converted: number; savedMB: number } | null>(null);
  const [storageStats, setStorageStats] = useState<{ totalFiles: number; totalMB: number; byType: Record<string, { count: number; mb: number }> } | null>(null);
  const [referrers, setReferrers] = useState<{ host: string; count: number }[]>([]);

  React.useEffect(() => {
    fetch("/api/convert-webp").then((r) => r.json()).then(setStorageStats).catch(() => {});
    fetch("/api/stats/referrers").then((r) => r.json()).then((data) => { if (Array.isArray(data)) setReferrers(data); }).catch(() => {});
  }, []);

  return (
    <>
      {/* Settings panel */}
      <motion.div
        key="settings-panel"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className={PANEL_CLASS}
        style={PANEL_STYLE}
      >
        <div>
          {/* Image optimization & Referrers */}
          <div className="mb-12 flex gap-6 items-start">
            <div className="w-[520px] shrink-0">
              <p className="text-[12px] font-bold tracking-[2.8px] uppercase text-text-secondary mb-1">
                Image optimization
              </p>

              {storageStats && (
                <div className="flex items-end gap-[32px] mb-4 mt-2">
                  <div className="flex flex-col">
                    <span className="text-[26px] font-bold tracking-tight text-text-muted leading-none">{storageStats.totalFiles}</span>
                    <span className="text-[12px] font-bold tracking-[2px] uppercase text-text-light mt-[4px]">files</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[26px] font-bold tracking-tight text-text-muted leading-none">{storageStats.totalMB} <span className="text-[16px]">MB</span></span>
                    <span className="text-[12px] font-bold tracking-[2px] uppercase text-text-light mt-[4px]">total size</span>
                  </div>
                  <span className="w-px h-[36px] bg-border" />
                  {Object.entries(storageStats.byType).map(([ext, v]) => (
                    <div key={ext} className="flex flex-col">
                      <span className="text-[26px] font-bold tracking-tight text-text-muted leading-none">{v.count} <span className="text-[16px] text-text-light">({v.mb} MB)</span></span>
                      <span className="text-[12px] font-bold tracking-[2px] uppercase text-text-light mt-[4px]">{ext.replace(".", "")}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-4">
                <button
                  onClick={async () => {
                    setConverting(true);
                    setConvertResult(null);
                    try {
                      const res = await fetch("/api/convert-webp", { method: "POST" });
                      if (res.ok) {
                        setConvertResult(await res.json());
                        const statsRes = await fetch("/api/convert-webp");
                        if (statsRes.ok) setStorageStats(await statsRes.json());
                      }
                    } catch {}
                    setConverting(false);
                  }}
                  disabled={converting}
                  className="h-[36px] px-5 text-[12px] font-bold tracking-[1.8px] uppercase border border-text-light text-text-light hover:text-text-muted hover:border-text-muted transition-colors disabled:opacity-40"
                >
                  {converting ? "Converting..." : "Convert to WebP"}
                </button>
                {convertResult && (
                  <span className="text-[12px] text-text-light tracking-[1px]">
                    {convertResult.converted === 0
                      ? "All images are already WebP"
                      : `${convertResult.converted} files converted, saved ${convertResult.savedMB} MB`}
                  </span>
                )}
              </div>
            </div>

            {/* Referrer sites table */}
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-bold tracking-[2.8px] uppercase text-text-secondary mb-1">
                Referrer sites
              </p>
              {referrers.length === 0 ? (
                <p className="text-[12px] text-text-light mt-2">No referrer data yet</p>
              ) : (
                <div className="mt-2 border border-border max-h-[calc(7*33px+16px)] overflow-y-auto">
                  {(() => {
                    const rows: { host: string; count: number }[][] = [];
                    for (let i = 0; i < referrers.length; i += 3) {
                      rows.push(referrers.slice(i, i + 3));
                    }
                    return rows.map((row, ri) => (
                      <div key={ri} className={`grid shrink-0 ${ri % 2 === 1 ? "bg-text-muted/[0.06]" : ""}`} style={{ gridTemplateColumns: "1fr auto 1fr auto 1fr" }}>
                        {row.map((r, ci) => {
                          const idx = ri * 3 + ci;
                          return (
                            <React.Fragment key={r.host}>
                              {ci > 0 && <div className="w-px bg-border" />}
                              <div className="flex items-center justify-between py-[6px] px-4">
                                <div className="flex items-center gap-[6px] truncate mr-4">
                                  <span className="text-[12px] font-bold text-text-light tabular-nums w-[16px] text-right shrink-0">{idx + 1}</span>
                                  <span className="w-px h-[12px] bg-border shrink-0" />
                                  <span className="text-[13px] text-text-muted truncate">{r.host}</span>
                                </div>
                                <span className="text-[13px] font-bold text-text-muted shrink-0">{r.count}</span>
                              </div>
                            </React.Fragment>
                          );
                        })}
                        {row.length < 3 && Array.from({ length: 3 - row.length }).map((_, ci) => (
                          <React.Fragment key={`empty-${ci}`}>
                            <div className="w-px bg-border" />
                            <div />
                          </React.Fragment>
                        ))}
                      </div>
                    ));
                  })()}
                </div>
              )}
            </div>
          </div>

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
          <HorizontalCarousel className="mb-6">
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
          </HorizontalCarousel>

          <hr className="my-10 border-text-light/30" />

          {/* Equipment section */}
          <div>
            <p className="text-[12px] font-bold tracking-[2.8px] uppercase text-text-secondary mb-1">
              Equipment
            </p>
            <p className="text-[12px] text-text-light mb-4">
              Devices shown on /equipment page
            </p>

            <HorizontalCarousel className="mb-6">
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
                        alt={equipmentName(item, "en")}
                        className="w-full h-full object-contain"
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
                      {equipmentName(item, "en")}
                    </p>
                    <div className="flex flex-col">
                      {item.specs.map((s) => (
                        <div key={s.key} className="flex text-[10px] font-medium text-[#969696] leading-[15px]">
                          <span className="shrink-0 mr-2">
                            {s.key}
                          </span>
                          <span className="truncate">{specValue(s.value, "en")}</span>
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
            </HorizontalCarousel>
          </div>
        </div>
      </motion.div>

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
