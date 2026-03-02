"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import type { Artwork } from "@/data/artworks";
import ImageUpload from "./ImageUpload";
import ImageCropper from "./ImageCropper";
import ToolSelector from "./ToolSelector";

const socialOptions = [
  "vk",
  "instagram",
  "youtube",
  "telegram",
  "artstation",
  "behance",
  "deviantart",
];

type Props = {
  category: string;
  subcategory?: string;
  onClose: () => void;
  onSaved: (artwork: Artwork) => void;
};

export default function AddArtworkModal({
  category,
  subcategory,
  onClose,
  onSaved,
}: Props) {
  const t = useTranslations("admin");

  // Image state
  const [imageUrl, setImageUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [showCropper, setShowCropper] = useState(false);
  const [sketchUrl, setSketchUrl] = useState("");

  // Fields
  const [titleRu, setTitleRu] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [cat, setCat] = useState(category);
  const [subcat, setSubcat] = useState(subcategory || "");
  const [year, setYear] = useState("");
  const [hours, setHours] = useState("");
  const [resolution, setResolution] = useState("");
  const [tools, setTools] = useState("");

  // Client section
  const [clientExpanded, setClientExpanded] = useState(false);
  const [clientName, setClientName] = useState("");
  const [client, setClient] = useState("");
  const [clientRole, setClientRole] = useState("");
  const [clientAvatar, setClientAvatar] = useState("");
  const [socials, setSocials] = useState<{ icon: string; url: string }[]>([]);
  const [reviewRu, setReviewRu] = useState("");
  const [reviewEn, setReviewEn] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  const handleImageUploaded = (url: string) => {
    setImageUrl(url);
    setShowCropper(true);
  };

  const handleCropped = (url: string) => {
    setThumbnailUrl(url);
    setShowCropper(false);
  };

  const addSocial = () => {
    if (socials.length >= 3) return;
    setSocials([...socials, { icon: "vk", url: "" }]);
  };

  const updateSocial = (i: number, field: "icon" | "url", val: string) => {
    const next = [...socials];
    next[i] = { ...next[i], [field]: val };
    setSocials(next);
  };

  const removeSocial = (i: number) => {
    setSocials(socials.filter((_, idx) => idx !== i));
  };

  const handleSave = async () => {
    if (!imageUrl || !titleRu || !titleEn) return;
    setSaving(true);
    setError("");

    const artwork: Artwork = {
      id: `dyn-${Date.now()}`,
      title: { ru: titleRu, en: titleEn },
      image: imageUrl,
      thumbnail: thumbnailUrl || undefined,
      sketch: sketchUrl || undefined,
      year: year || undefined,
      hours: hours || undefined,
      resolution: resolution || undefined,
      tools: tools || undefined,
      category: cat as Artwork["category"],
      subcategory: subcat ? (subcat as Artwork["subcategory"]) : undefined,
      client: client || undefined,
      clientName: clientName || undefined,
      clientRole: clientRole || undefined,
      clientAvatar: clientAvatar || undefined,
      clientSocials: socials.length > 0 ? socials.filter((s) => s.url) : undefined,
      review:
        reviewRu || reviewEn
          ? { ru: reviewRu, en: reviewEn }
          : undefined,
    };

    try {
      const res = await fetch("/api/artworks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(artwork),
      });

      if (res.ok) {
        onSaved(artwork);
        onClose();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || `Error ${res.status}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    }
    setSaving(false);
  };

  const inputClass =
    "w-full h-[30px] border border-[#c0c0c0] pl-3 pr-3 text-sm outline-none focus:border-text transition-colors";
  const labelClass =
    "text-[12px] font-bold tracking-[2.8px] uppercase text-text-secondary mb-1 block";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[100]"
    >
      <div className="absolute inset-0 bg-white/95" onClick={onClose} />

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-[64px] right-[64px] z-10 w-[16px] h-[16px] flex items-center justify-center text-[#808080] hover:text-[#404040] transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M1 1L15 15M15 1L1 15" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>

      {/* Content */}
      <div
        className="absolute inset-0 flex items-center justify-center p-[64px]"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-white max-w-[600px] w-full max-h-[80vh] overflow-y-auto shadow-[0px_4px_40px_0px_rgba(0,0,0,0.12)] p-[40px]"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-sm font-bold tracking-[2.8px] uppercase text-text-muted mb-8">
            {t("addArtwork")}
          </h2>

          <div className="flex flex-col gap-6">
            {/* 1. Main image */}
            <div>
              <label className={labelClass}>{t("form.image")}</label>
              {!imageUrl ? (
                <ImageUpload onUploaded={handleImageUploaded} />
              ) : showCropper ? (
                <ImageCropper imageUrl={imageUrl} onCropped={handleCropped} />
              ) : (
                <div className="flex items-center gap-3">
                  <div className="relative w-[80px] h-[80px] overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={thumbnailUrl || imageUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setImageUrl("");
                      setThumbnailUrl("");
                    }}
                    className="text-[12px] text-[#c0c0c0] hover:text-text-muted"
                  >
                    {t("form.changeImage")}
                  </button>
                </div>
              )}
            </div>

            {/* 2. Sketch */}
            <div>
              <label className={labelClass}>{t("form.sketch")}</label>
              <ImageUpload
                onUploaded={setSketchUrl}
                compact
              />
            </div>

            {/* 3. Title */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>{t("form.titleRu")}</label>
                <input
                  className={inputClass}
                  value={titleRu}
                  onChange={(e) => setTitleRu(e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>{t("form.titleEn")}</label>
                <input
                  className={inputClass}
                  value={titleEn}
                  onChange={(e) => setTitleEn(e.target.value)}
                />
              </div>
            </div>

            {/* 4. Category / Subcategory */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>{t("form.category")}</label>
                <select
                  className={inputClass}
                  value={cat}
                  onChange={(e) => setCat(e.target.value)}
                >
                  <option value="personal">Personal</option>
                  <option value="orders">Orders</option>
                  <option value="youtube">YouTube</option>
                  <option value="other">Other</option>
                  <option value="gamedev">Gamedev</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>{t("form.subcategory")}</label>
                <select
                  className={inputClass}
                  value={subcat}
                  onChange={(e) => setSubcat(e.target.value)}
                >
                  <option value="">—</option>
                  <option value="cg">CG</option>
                  <option value="lineart">Line Art</option>
                </select>
              </div>
            </div>

            {/* 5. Year */}
            <div>
              <label className={labelClass}>{t("form.year")}</label>
              <input
                className={inputClass}
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="2024"
              />
            </div>

            {/* 6. Hours */}
            <div>
              <label className={labelClass}>{t("form.hours")}</label>
              <input
                className={inputClass}
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="~20h"
              />
            </div>

            {/* 7. Resolution */}
            <div>
              <label className={labelClass}>{t("form.resolution")}</label>
              <input
                className={inputClass}
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                placeholder="1920x1080"
              />
            </div>

            {/* 8. Tools */}
            <div>
              <label className={labelClass}>{t("form.tools")}</label>
              <ToolSelector value={tools} onChange={setTools} />
            </div>

            {/* 9. Client info (collapsible) */}
            <div className="border-t border-[#e8e8e8] pt-4">
              <button
                type="button"
                onClick={() => setClientExpanded(!clientExpanded)}
                className="text-[12px] font-bold tracking-[2.8px] uppercase text-text-secondary hover:text-text-muted transition-colors"
              >
                {t("form.clientInfo")} {clientExpanded ? "▲" : "▼"}
              </button>

              {clientExpanded && (
                <div className="mt-4 flex flex-col gap-4">
                  <div>
                    <label className={labelClass}>{t("form.clientName")}</label>
                    <input
                      className={inputClass}
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>{t("form.client")}</label>
                    <input
                      className={inputClass}
                      value={client}
                      onChange={(e) => setClient(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>{t("form.clientRole")}</label>
                    <input
                      className={inputClass}
                      value={clientRole}
                      onChange={(e) => setClientRole(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>{t("form.clientAvatar")}</label>
                    <ImageUpload
                      onUploaded={setClientAvatar}
                      compact
                    />
                  </div>

                  {/* Socials */}
                  <div>
                    <label className={labelClass}>{t("form.socials")}</label>
                    <div className="flex flex-col gap-2">
                      {socials.map((s, i) => (
                        <div key={i} className="flex gap-2 items-center">
                          <select
                            className="h-[30px] border border-[#c0c0c0] text-sm outline-none px-1"
                            value={s.icon}
                            onChange={(e) =>
                              updateSocial(i, "icon", e.target.value)
                            }
                          >
                            {socialOptions.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                          <input
                            className={`${inputClass} flex-1`}
                            value={s.url}
                            onChange={(e) =>
                              updateSocial(i, "url", e.target.value)
                            }
                            placeholder="https://..."
                          />
                          <button
                            type="button"
                            onClick={() => removeSocial(i)}
                            className="text-[#c0c0c0] hover:text-text-muted text-sm"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      {socials.length < 3 && (
                        <button
                          type="button"
                          onClick={addSocial}
                          className="text-[12px] text-[#c0c0c0] hover:text-text-muted"
                        >
                          + {t("form.addSocial")}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 10. Review */}
            <div>
              <label className={labelClass}>{t("form.review")}</label>
              <div className="flex flex-col gap-2">
                <textarea
                  className="w-full h-[80px] bg-[#f5f5f5] text-sm outline-none resize-none p-3"
                  value={reviewRu}
                  onChange={(e) => setReviewRu(e.target.value)}
                  placeholder="RU"
                />
                <textarea
                  className="w-full h-[80px] bg-[#f5f5f5] text-sm outline-none resize-none p-3"
                  value={reviewEn}
                  onChange={(e) => setReviewEn(e.target.value)}
                  placeholder="EN"
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <p className="text-[12px] text-red-400 text-center">{error}</p>
            )}

            {/* 11. Save */}
            <button
              onClick={handleSave}
              disabled={saving || !imageUrl || !titleRu || !titleEn}
              className="h-[40px] w-full text-sm font-bold tracking-[2.8px] uppercase bg-text-muted text-white hover:bg-text transition-colors disabled:opacity-30"
            >
              {saving ? "..." : t("form.save")}
            </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
