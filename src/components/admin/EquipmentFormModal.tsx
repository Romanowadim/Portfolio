"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import type { Equipment } from "@/data/equipment";
import ImageUpload from "./ImageUpload";

type Props = {
  equipment?: Equipment;
  onClose: () => void;
  onSaved: (item: Equipment) => void;
  onDeleted?: (id: string) => void;
};

export default function EquipmentFormModal({ equipment: editItem, onClose, onSaved, onDeleted }: Props) {
  const isEdit = !!editItem;

  const [name, setName] = useState(editItem?.name || "");
  const [brandIcon, setBrandIcon] = useState(editItem?.brandIcon || "");
  const [image, setImage] = useState(editItem?.image || "");
  const [imagePos, setImagePos] = useState(editItem?.imagePos || { width: "100%", height: "100%", left: "0%", top: "0%" });
  const [specKeyWidth, setSpecKeyWidth] = useState(editItem?.specKeyWidth || 60);
  const [specs, setSpecs] = useState<{ key: string; value: string }[]>(editItem?.specs || []);
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

  const addSpec = () => setSpecs([...specs, { key: "", value: "" }]);

  const updateSpec = (i: number, field: "key" | "value", val: string) => {
    const next = [...specs];
    next[i] = { ...next[i], [field]: val };
    setSpecs(next);
  };

  const removeSpec = (i: number) => setSpecs(specs.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setError("");
    const item: Equipment = {
      id: editItem?.id || `eq-${Date.now()}`,
      name: name.trim(),
      brandIcon,
      image,
      imagePos,
      specKeyWidth,
      specs: specs.filter((s) => s.key || s.value),
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
              <label className={labelClass}>Name *</label>
              <input
                className={inputClass}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="IMAC 27-INCH"
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
                <div className="flex items-center gap-3">
                  <div className="relative w-[80px] h-[80px] overflow-hidden bg-[#f5f5f5]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={image} alt="" className="w-full h-full object-contain" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setImage("")}
                    className="text-[12px] text-text-light hover:text-text-muted"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <ImageUpload onUploaded={setImage} square sizeClassName="w-[80px] h-[80px]" />
              )}
            </div>

            <div>
              <label className={labelClass}>Image Position</label>
              <div className="grid grid-cols-4 gap-2">
                {(["width", "height", "left", "top"] as const).map((field) => (
                  <div key={field}>
                    <span className="text-[10px] text-text-light uppercase">{field}</span>
                    <input
                      className={inputClass}
                      value={imagePos[field]}
                      onChange={(e) => setImagePos({ ...imagePos, [field]: e.target.value })}
                      placeholder="100%"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className={labelClass}>Spec Key Width (px)</label>
              <input
                className={inputClass}
                type="number"
                value={specKeyWidth}
                onChange={(e) => setSpecKeyWidth(Number(e.target.value) || 60)}
              />
            </div>

            <div>
              <label className={labelClass}>Specs</label>
              <div className="flex flex-col gap-2">
                {specs.map((s, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input
                      className={`${inputClass} w-[100px] shrink-0`}
                      value={s.key}
                      onChange={(e) => updateSpec(i, "key", e.target.value)}
                      placeholder="key"
                    />
                    <input
                      className={`${inputClass} flex-1`}
                      value={s.value}
                      onChange={(e) => updateSpec(i, "value", e.target.value)}
                      placeholder="value"
                    />
                    <button
                      type="button"
                      onClick={() => removeSpec(i)}
                      className="text-text-light hover:text-text-muted text-sm shrink-0"
                    >
                      ✕
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
                disabled={saving || !name.trim()}
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
