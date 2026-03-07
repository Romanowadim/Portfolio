"use client";

import React, { useState, useCallback } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
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

import type { Category, Subcategory } from "@/types/category";
import { EyeIcon, formatCreatedAt, PANEL_CLASS, PANEL_STYLE } from "./shared";
import EntityChart from "./EntityChart";
import { EYE_ICON_22 } from "./shared";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

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
    <path
      d="M12.4365 3.32148L16.5049 7.38989L6.20657 17.6883L2.14042 13.6198L12.4365 3.32148ZM19.5921 2.34027L17.7777 0.525894C17.0765 -0.175298 15.938 -0.175298 15.2344 0.525894L13.4964 2.26388L17.5648 6.33233L19.5921 4.30507C20.136 3.76118 20.136 2.88411 19.5921 2.34027ZM0.0113215 19.3383C-0.0627191 19.6716 0.238132 19.9701 0.571391 19.8891L5.105 18.7899L1.03885 14.7215L0.0113215 19.3383Z"
      fill="currentColor"
    />
  </svg>
);

/* ------------------------------------------------------------------ */
/*  SortableSubcategoryRow                                             */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/*  SortableCategoryRow                                                */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/*  CategoriesSection                                                  */
/* ------------------------------------------------------------------ */

type Props = {
  locale: "ru" | "en";
  categories: Category[];
  categoryViewCounts: Record<string, { total: number; recent: number }>;
  artworkCounts: Record<string, number>;
  expandedCatId: string | null;
  setExpandedCatId: (id: string | null) => void;
  catSensors: ReturnType<typeof useSensors>;
  handleCatDragEnd: (event: DragEndEvent) => void;
  onNewCategory: () => void;
  onEditCategory: (cat: Category) => void;
  onEditSubcategory: (parentId: string, sub: Subcategory) => void;
  onAddSubcategory: (parentId: string) => void;
  onReorderSubs: (catId: string, reordered: Subcategory[]) => void;
};

export default function CategoriesSection({
  locale,
  categories,
  categoryViewCounts,
  artworkCounts,
  expandedCatId,
  setExpandedCatId,
  catSensors,
  handleCatDragEnd,
  onNewCategory,
  onEditCategory,
  onEditSubcategory,
  onAddSubcategory,
  onReorderSubs,
}: Props) {
  const t = useTranslations("admin");
  const [resetKey, setResetKey] = useState(0);

  const handleReset = useCallback(async (target: string) => {
    if (!confirm(`Reset ${target} data?`)) return;
    await fetch("/api/stats/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target }),
    });
    setResetKey((k) => k + 1);
  }, []);

  return (
    <motion.div
      key="categories-panel"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="fixed top-0 bottom-0 right-0 left-[calc(33.75vw+24px)] z-10 overflow-y-auto bg-bg"
      style={{ paddingTop: 148 + 24, paddingBottom: 24, paddingRight: 24 }}
    >
      <EntityChart chartId="cv-categories" apiUrl={`/api/stats/views-by-category?locale=${locale}`} title="VIEWS BY SECTIONS" sidebarTitle="TOP SECTIONS" resetKey={resetKey} onReset={() => handleReset("category-views")} icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" /><path fillRule="evenodd" d="M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113-1.487 4.471-5.705 7.697-10.677 7.697-4.97 0-9.186-3.223-10.675-7.69a1.762 1.762 0 0 1 0-1.113ZM17.25 12a5.25 5.25 0 1 1-10.5 0 5.25 5.25 0 0 1 10.5 0Z" clipRule="evenodd" /></svg>} sidebarIcon={<EyeIcon />} />

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
          onClick={onNewCategory}
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
                  onEdit={() => onEditCategory(cat)}
                  onEditSub={(sub) => onEditSubcategory(cat.id, sub)}
                  onAddSub={() => onAddSubcategory(cat.id)}
                  categoryViewCounts={categoryViewCounts}
                  artworkCounts={artworkCounts}
                  onReorderSubs={(reordered) => onReorderSubs(cat.id, reordered)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </motion.div>
  );
}
