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
import { PANEL_CLASS, PANEL_STYLE } from "./shared";
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

          <hr className="my-10 border-text-light/30" />

          {/* Social links section */}
          <div>
            <p className="text-[12px] font-bold tracking-[2.8px] uppercase text-text-secondary mb-1">
              Social links
            </p>
            <p className="text-[12px] text-text-light mb-4">
              Sidebar social buttons
            </p>

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
