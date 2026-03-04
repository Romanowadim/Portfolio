"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import ImageUpload from "./ImageUpload";
import type { Category, Subcategory } from "@/types/category";

type Mode =
  | { type: "newCategory" }
  | { type: "editCategory"; category: Category }
  | { type: "newSubcategory"; parentId: string }
  | { type: "editSubcategory"; parentId: string; subcategory: Subcategory };

type Props = {
  mode: Mode;
  categories: Category[];
  onClose: () => void;
  onSaved: (categories: Category[]) => void;
};

export default function CategoryFormModal({ mode, categories: currentCategories, onClose, onSaved }: Props) {
  const t = useTranslations("admin");

  const isEdit =
    mode.type === "editCategory" || mode.type === "editSubcategory";
  const isSubcategory =
    mode.type === "newSubcategory" || mode.type === "editSubcategory";

  const [id, setId] = useState(
    mode.type === "editCategory"
      ? mode.category.id
      : mode.type === "editSubcategory"
      ? mode.subcategory.id
      : ""
  );
  const [labelRu, setLabelRu] = useState(
    mode.type === "editCategory"
      ? mode.category.label.ru
      : mode.type === "editSubcategory"
      ? mode.subcategory.label.ru
      : ""
  );
  const [labelEn, setLabelEn] = useState(
    mode.type === "editCategory"
      ? mode.category.label.en
      : mode.type === "editSubcategory"
      ? mode.subcategory.label.en
      : ""
  );
  const [preview, setPreview] = useState(
    mode.type === "editCategory" ? (mode.category.preview ?? "") : ""
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const persist = async (updated: Category[]) => {
    const putRes = await fetch("/api/categories", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
    if (!putRes.ok) {
      const data = await putRes.json().catch(() => ({}));
      throw new Error(data.error || `Error ${putRes.status}`);
    }
    onSaved(updated);
    onClose();
  };

  const handleSave = async () => {
    if (!labelRu || !labelEn) { setError("Fill in both labels"); return; }
    if (!isEdit && !id) { setError("Fill in ID"); return; }

    setSaving(true);
    setError("");

    try {
      let updated: Category[];

      if (mode.type === "newCategory") {
        const newCat: Category = {
          id,
          label: { ru: labelRu, en: labelEn },
          preview: preview || undefined,
          createdAt: new Date().toISOString(),
          subcategories: [],
        };
        updated = [...currentCategories, newCat];
      } else if (mode.type === "editCategory") {
        updated = currentCategories.map((c) =>
          c.id === mode.category.id
            ? { ...c, label: { ru: labelRu, en: labelEn }, preview: preview || undefined }
            : c
        );
      } else if (mode.type === "newSubcategory") {
        const newSub: Subcategory = { id, label: { ru: labelRu, en: labelEn }, createdAt: new Date().toISOString() };
        updated = currentCategories.map((c) =>
          c.id === mode.parentId
            ? { ...c, subcategories: [...c.subcategories, newSub] }
            : c
        );
      } else {
        updated = currentCategories.map((c) =>
          c.id === mode.parentId
            ? {
                ...c,
                subcategories: c.subcategories.map((s) =>
                  s.id === mode.subcategory.id
                    ? { ...s, label: { ru: labelRu, en: labelEn } }
                    : s
                ),
              }
            : c
        );
      }

      await persist(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete?")) return;
    setSaving(true);
    setError("");

    try {
      let updated: Category[];

      if (mode.type === "editCategory") {
        updated = currentCategories.filter((c) => c.id !== mode.category.id);
      } else if (mode.type === "editSubcategory") {
        updated = currentCategories.map((c) =>
          c.id === mode.parentId
            ? { ...c, subcategories: c.subcategories.filter((s) => s.id !== mode.subcategory.id) }
            : c
        );
      } else {
        setSaving(false);
        return;
      }

      await persist(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
      setSaving(false);
    }
  };

  const inputClass =
    "w-full h-[30px] border border-[#c0c0c0] pl-3 pr-3 text-sm outline-none focus:border-text transition-colors";
  const labelClass =
    "text-[12px] font-bold tracking-[2.8px] uppercase text-text-secondary mb-1 block";

  const title = isSubcategory
    ? isEdit
      ? t("editSubcategory")
      : t("addSubcategory")
    : isEdit
    ? t("editCategory")
    : t("addCategory");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[200]"
    >
      <div className="absolute inset-0 bg-white/95" onClick={onClose} />
      <div
        className="absolute inset-0 flex items-center justify-center px-[40px] py-[48px]"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-white max-w-[480px] w-full shadow-[0px_4px_40px_0px_rgba(0,0,0,0.12)] px-[60px] py-[40px]"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-sm font-bold tracking-[2.8px] uppercase text-text-muted mb-8">
            {title}
          </h2>

          <div className="flex flex-col gap-5">
            {/* ID — only on create */}
            {!isEdit && (
              <div>
                <label className={labelClass}>{t("form.categoryId")}</label>
                <input
                  className={inputClass}
                  value={id}
                  onChange={(e) => setId(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                  placeholder="my-category"
                />
              </div>
            )}

            {/* Labels */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>{t("form.labelEn")}</label>
                <input
                  className={inputClass}
                  value={labelEn}
                  onChange={(e) => setLabelEn(e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>{t("form.labelRu")}</label>
                <input
                  className={inputClass}
                  value={labelRu}
                  onChange={(e) => setLabelRu(e.target.value)}
                />
              </div>
            </div>

            {/* Preview — only for categories */}
            {!isSubcategory && (
              <div>
                <label className={labelClass}>PREVIEW</label>
                {preview ? (
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={preview}
                      alt=""
                      className="w-[80px] h-[50px] object-cover shrink-0"
                    />
                    <button
                      type="button"
                      onClick={() => setPreview("")}
                      className="text-[12px] text-[#c0c0c0] hover:text-text-muted"
                    >
                      {t("form.changeImage")}
                    </button>
                  </div>
                ) : (
                  <ImageUpload onUploaded={setPreview} compact />
                )}
              </div>
            )}

            {error && (
              <p className="text-[12px] text-red-400 text-center">{error}</p>
            )}

            <div className="flex gap-3">
              {isEdit && (
                <button
                  onClick={handleDelete}
                  disabled={saving}
                  className="h-[40px] px-6 text-sm font-bold tracking-[2.8px] uppercase border border-red-400 text-red-400 hover:bg-red-400 hover:text-white transition-colors disabled:opacity-30"
                >
                  {t("form.delete")}
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={saving || !labelRu || !labelEn || (!isEdit && !id)}
                className="h-[40px] flex-1 text-sm font-bold tracking-[2.8px] uppercase bg-text-muted text-white hover:bg-text transition-colors disabled:opacity-30"
              >
                {saving ? "..." : isEdit ? t("form.update") : t("form.save")}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
