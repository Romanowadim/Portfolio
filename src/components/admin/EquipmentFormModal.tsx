"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import type { Equipment } from "@/data/equipment";
import ImageUpload from "./ImageUpload";

function LangToggle({ value, onChange }: { value: "en" | "ru"; onChange: (v: "en" | "ru") => void }) {
  return (
    <span className="inline-flex gap-1">
      <button type="button" onClick={() => onChange("en")} className={`text-[12px] font-bold tracking-[2.8px] uppercase transition-colors ${value === "en" ? "text-text-secondary" : "text-text-light"}`}>EN</button>
      <span className="text-text-light text-[12px] font-bold">|</span>
      <button type="button" onClick={() => onChange("ru")} className={`text-[12px] font-bold tracking-[2.8px] uppercase transition-colors ${value === "ru" ? "text-text-secondary" : "text-text-light"}`}>RU</button>
    </span>
  );
}

type Props = {
  equipment?: Equipment;
  onClose: () => void;
  onSaved: (item: Equipment) => void;
  onDeleted?: (id: string) => void;
};

export default function EquipmentFormModal({ equipment: editItem, onClose, onSaved, onDeleted }: Props) {
  const isEdit = !!editItem;

  const editName = editItem?.name;
  const [nameEn, setNameEn] = useState(typeof editName === "object" ? editName.en : (editName || ""));
  const [nameRu, setNameRu] = useState(typeof editName === "object" ? editName.ru : "");
  const [nameLang, setNameLang] = useState<"en" | "ru">("en");
  const [brandIcon, setBrandIcon] = useState(editItem?.brandIcon || "");
  const [image, setImage] = useState(editItem?.image || "");
  const [specs, setSpecs] = useState<{ key: string; valueEn: string; valueRu: string }[]>(
    (editItem?.specs || []).map((s) => ({
      key: s.key,
      valueEn: typeof s.value === "object" ? s.value.en : s.value,
      valueRu: typeof s.value === "object" ? s.value.ru : "",
    }))
  );
  const [specLang, setSpecLang] = useState<"en" | "ru">("en");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  const addSpec = () => setSpecs([...specs, { key: "", valueEn: "", valueRu: "" }]);

  const updateSpec = (i: number, field: "key" | "valueEn" | "valueRu", val: string) => {
    const next = [...specs];
    next[i] = { ...next[i], [field]: val };
    setSpecs(next);
  };

  const removeSpec = (i: number) => setSpecs(specs.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    if (!nameEn.trim()) return;
    setSaving(true);
    setError("");
    const item: Equipment = {
      id: editItem?.id || `eq-${Date.now()}`,
      name: nameRu.trim() ? { en: nameEn.trim(), ru: nameRu.trim() } : nameEn.trim(),
      brandIcon,
      image,
      specs: specs
        .filter((s) => s.key || s.valueEn)
        .map((s) => ({
          key: s.key,
          value: s.valueRu.trim() ? { en: s.valueEn.trim(), ru: s.valueRu.trim() } : s.valueEn.trim(),
        })),
    };
    try {
      const res = await fetch("/api/equipment", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || `Error ${res.status}`);
        setSaving(false);
        return;
      }
      onSaved(item);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editItem || !onDeleted) return;
    if (!confirm("Delete this equipment?")) return;
    setSaving(true);
    try {
      const res = await fetch("/api/equipment", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editItem.id }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || `Error ${res.status}`);
        setSaving(false);
        return;
      }
      onDeleted(editItem.id);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
      setSaving(false);
    }
  };

  const inputClass =
    "w-full h-[30px] border border-text-light pl-3 pr-3 text-sm outline-none focus:border-text transition-colors";
  const labelClass =
    "text-[12px] font-bold tracking-[2.8px] uppercase text-text-secondary mb-1 block";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[110]"
    >
      <div className="absolute inset-0 bg-white/95" onClick={onClose} />

      <button
        onClick={onClose}
        className="absolute top-[64px] right-[64px] z-10 w-[16px] h-[16px] flex items-center justify-center text-text-muted hover:text-text-secondary transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M1 1L15 15M15 1L1 15" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>

      <div
        className="absolute inset-0 flex items-center justify-center p-[64px]"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="bg-white max-w-[520px] w-full max-h-[80vh] overflow-y-auto shadow-[0px_4px_40px_0px_rgba(0,0,0,0.12)] p-[40px]"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-sm font-bold tracking-[2.8px] uppercase text-text-muted mb-8">
            {isEdit ? "Edit Equipment" : "New Equipment"}
          </h2>

          <div className="flex flex-col gap-5">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[12px] font-bold tracking-[2.8px] uppercase text-text-secondary">Name *</label>
                <LangToggle value={nameLang} onChange={setNameLang} />
              </div>
              <input
                className={inputClass}
                value={nameLang === "en" ? nameEn : nameRu}
                onChange={(e) => nameLang === "en" ? setNameEn(e.target.value) : setNameRu(e.target.value)}
                placeholder={nameLang === "en" ? "IMAC 27-INCH" : "ИМАК 27 ДЮЙМОВ"}
                autoFocus
              />
            </div>

            <div>
              <label className={labelClass}>Brand Icon</label>
              {brandIcon ? (
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={brandIcon} alt="" className="h-[24px] w-auto object-contain" />
                  <button
                    type="button"
                    onClick={() => setBrandIcon("")}
                    className="text-[12px] text-text-light hover:text-text-muted"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <ImageUpload onUploaded={setBrandIcon} compact />
              )}
            </div>

            <div>
              <label className={labelClass}>Image</label>
              {image ? (
                <div className="relative aspect-square w-full overflow-hidden bg-[#f5f5f5]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image} alt="" className="w-full h-full object-contain" />
                  <button
                    type="button"
                    onClick={() => setImage("")}
                    className="absolute top-[8px] right-[8px] w-[24px] h-[24px] bg-white/80 rounded-full flex items-center justify-center text-[12px] text-text-muted hover:text-text transition-colors"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <ImageUpload onUploaded={setImage} square sizeClassName="aspect-square w-full" />
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[12px] font-bold tracking-[2.8px] uppercase text-text-secondary">Specs</label>
                <LangToggle value={specLang} onChange={setSpecLang} />
              </div>
              <div className="flex flex-col gap-4">
                {specs.map((s, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <div className="flex-1 flex flex-col gap-1">
                      <input
                        className={inputClass}
                        value={s.key}
                        onChange={(e) => updateSpec(i, "key", e.target.value)}
                        placeholder="key"
                      />
                      <input
                        className={inputClass}
                        value={specLang === "en" ? s.valueEn : s.valueRu}
                        onChange={(e) => updateSpec(i, specLang === "en" ? "valueEn" : "valueRu", e.target.value)}
                        placeholder={specLang === "en" ? "value" : "значение"}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeSpec(i)}
                      className="w-[30px] h-[30px] shrink-0 flex items-center justify-center text-text-light hover:text-red-400 transition-colors"
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" />
                      </svg>
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addSpec}
                  className="text-[12px] text-text-light hover:text-text-muted"
                >
                  + Add spec
                </button>
              </div>
            </div>

            {error && <p className="text-[12px] text-red-400 text-center">{error}</p>}

            <div className="flex gap-3">
              {isEdit && onDeleted && (
                <button
                  onClick={handleDelete}
                  disabled={saving}
                  className="h-[40px] px-6 text-sm font-bold tracking-[2.8px] uppercase border border-red-400 text-red-400 hover:bg-red-400 hover:text-white transition-colors disabled:opacity-30"
                >
                  DELETE
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={saving || !nameEn.trim()}
                className="h-[40px] flex-1 text-sm font-bold tracking-[2.8px] uppercase bg-text-muted text-white hover:bg-text transition-colors disabled:opacity-30"
              >
                {saving ? "..." : isEdit ? "UPDATE" : "SAVE"}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
