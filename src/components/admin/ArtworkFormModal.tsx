"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import type { Artwork } from "@/data/artworks";
import ImageUpload from "./ImageUpload";
import ImageCropper from "./ImageCropper";
import ToolSelector from "./ToolSelector";
import ContactPickerModal from "./ContactPickerModal";
import CoworkerPickerModal from "./CoworkerPickerModal";
import type { Contact, Coworker } from "@/lib/blob";
import type { Category } from "@/types/category";

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
  categories?: Category[];
  artwork?: Artwork;
  initialImageUrl?: string;
  onClose: () => void;
  onSaved: (artwork: Artwork) => void;
  onDeleted?: (id: string) => void;
};

export default function ArtworkFormModal({
  category,
  subcategory,
  categories: categoriesProp,
  artwork: editArtwork,
  initialImageUrl,
  onClose,
  onSaved,
  onDeleted,
}: Props) {
  const isEdit = !!editArtwork;
  const t = useTranslations("admin");

  // Categories state (fallback fetch if not passed as prop)
  const [categoriesLocal, setCategoriesLocal] = useState<Category[]>(categoriesProp ?? []);
  useEffect(() => {
    if (categoriesProp) { setCategoriesLocal(categoriesProp); return; }
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data: Category[]) => setCategoriesLocal(data))
      .catch(() => {});
  }, [categoriesProp]);

  // Image state
  const [imageUrl, setImageUrl] = useState(editArtwork?.image || initialImageUrl || "");
  const [thumbnailUrl, setThumbnailUrl] = useState(editArtwork?.thumbnail || "");
  const [showCropper, setShowCropper] = useState(false);
  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  const [logoUrl, setLogoUrl] = useState(editArtwork?.logo || "");
  const [logoUploading, setLogoUploading] = useState(false);
  const [sketchUrl, setSketchUrl] = useState(editArtwork?.sketch || "");

  // Fields
  const [titleRu, setTitleRu] = useState(editArtwork?.title.ru || "");
  const [titleEn, setTitleEn] = useState(editArtwork?.title.en || "");
  const [cat, setCat] = useState(editArtwork?.category || category);

  const currentCatData = categoriesLocal.find((c) => c.id === cat);
  const availableSubs = currentCatData?.subcategories ?? [];
  const [subcat, setSubcat] = useState(editArtwork?.subcategory || subcategory || "");
  const [year, setYear] = useState(editArtwork?.year || String(new Date().getFullYear()));
  const [hours, setHours] = useState(editArtwork?.hours?.replace(/^~/, "").replace(/h$/, "") || "");
  const [resolution, setResolution] = useState(editArtwork?.resolution || "");
  const [tools, setTools] = useState(editArtwork?.tools || "");

  // Client section
  const hasClientData = !!(editArtwork?.clientName || editArtwork?.client || editArtwork?.clientRole || editArtwork?.clientAvatar);
  const [clientExpanded, setClientExpanded] = useState(hasClientData);
  const [clientName, setClientName] = useState(editArtwork?.clientName || "");
  const [client, setClient] = useState(editArtwork?.client || "");
  const [clientRole, setClientRole] = useState(editArtwork?.clientRole || "");
  const [clientAvatar, setClientAvatar] = useState(editArtwork?.clientAvatar || "");
  const [socials, setSocials] = useState<{ icon: string; url: string }[]>(editArtwork?.clientSocials || []);
  const [subscribers, setSubscribers] = useState(editArtwork?.subscribers || "");
  const [subsFetching, setSubsFetching] = useState(false);
  const subsFetchingRef = useRef(false);
  const [subsChannelInput, setSubsChannelInput] = useState("");
  const [subsError, setSubsError] = useState("");
  const [reviewRu, setReviewRu] = useState(editArtwork?.review?.ru || "");
  const [reviewEn, setReviewEn] = useState(editArtwork?.review?.en || "");

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContactId, setSelectedContactId] = useState("");
  const [showContactModal, setShowContactModal] = useState(false);

  const [coworkersList, setCoworkersList] = useState<Coworker[]>([]);
  const [selectedCoworkers, setSelectedCoworkers] = useState<Coworker[]>(
    (editArtwork?.coworkers ?? []).map((cw, i) => ({ id: cw.id ?? `cw-init-${i}`, ...cw }))
  );
  const [showCoworkerModal, setShowCoworkerModal] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const fetchSubs = async (url: string) => {
    if (!url || subsFetchingRef.current) return;
    subsFetchingRef.current = true;
    setSubsFetching(true);
    setSubsError("");
    try {
      const res = await fetch(`/api/youtube-subs?url=${encodeURIComponent(url)}`);
      const data = await res.json();
      if (!res.ok) setSubsError(data.error || "Error");
      else { setSubscribers(data.formatted); setSubsChannelInput(""); }
    } catch {
      setSubsError("Network error");
    }
    subsFetchingRef.current = false;
    setSubsFetching(false);
  };

  useEffect(() => {
    if (cat !== "youtube") return;
    const youtubeUrl = socials.find((s) => s.icon === "youtube" && s.url)?.url;
    if (youtubeUrl) fetchSubs(youtubeUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cat]);

  useEffect(() => {
    fetch("/api/contacts")
      .then((r) => r.json())
      .then((data) => setContacts(Array.isArray(data) ? data : []))
      .catch(() => {});
    fetch("/api/coworkers")
      .then((r) => r.json())
      .then((data: Coworker[]) => {
        if (!Array.isArray(data)) return;
        setCoworkersList(data);
        // Обновляем selectedCoworkers свежими данными из списка (на случай если соцсети были добавлены позже)
        setSelectedCoworkers((prev) =>
          prev.map((cw) => {
            const fresh = cw.id ? data.find((c) => c.id === cw.id) : undefined;
            return fresh ? { ...fresh } : cw;
          })
        );
      })
      .catch(() => {});
  }, []);

  const applyContact = (contact: Contact) => {
    setClientName(contact.clientName);
    setClient(contact.client || "");
    setClientRole(contact.clientRole || "");
    setClientAvatar(contact.clientAvatar || "");
    setSocials(contact.clientSocials || []);
    setClientExpanded(true);
    if (cat === "youtube") {
      const youtubeUrl = contact.clientSocials?.find((s) => s.icon === "youtube" && s.url)?.url;
      if (youtubeUrl) {
        setSubscribers("");
        fetchSubs(youtubeUrl);
      }
    }
  };

  const handleImageUploaded = (url: string) => {
    setImageUrl(url);
    const img = new window.Image();
    img.onload = () => setResolution(`${img.naturalWidth}x${img.naturalHeight}`);
    img.src = url;
  };

  const handleCropped = (url: string) => {
    setThumbnailUrl(url);
    setShowCropper(false);
  };

  const handleThumbnailUpload = async (file: File) => {
    setThumbnailUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (res.ok) {
        const data = await res.json();
        setThumbnailUrl(data.url);
        setShowCropper(false);
      }
    } finally {
      setThumbnailUploading(false);
    }
  };

  const handleLogoUpload = async (file: File) => {
    setLogoUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (res.ok) {
        const data = await res.json();
        setLogoUrl(data.url);
      }
    } finally {
      setLogoUploading(false);
    }
  };

  const addSocial = () => {
    if (socials.length >= 3) return;
    setSocials([...socials, { icon: "vk", url: "" }]);
  };

  const updateSocial = (i: number, field: "icon" | "url", val: string) => {
    const next = [...socials];
    next[i] = { ...next[i], [field]: val };
    setSocials(next);
    if (field === "icon" && val === "youtube" && next[i].url && cat === "youtube") {
      fetchSubs(next[i].url);
    }
  };

  const removeSocial = (i: number) => {
    setSocials(socials.filter((_, idx) => idx !== i));
  };

  const handleSave = async () => {
    if (!imageUrl || !titleRu || !titleEn) return;
    setSaving(true);
    setError("");

    const artwork: Artwork = {
      id: editArtwork?.id || `dyn-${Date.now()}`,
      title: { ru: titleRu, en: titleEn },
      image: imageUrl,
      thumbnail: thumbnailUrl || undefined,
      logo: logoUrl || undefined,
      sketch: sketchUrl || undefined,
      year: year || undefined,
      hours: hours ? `~${hours}h` : undefined,
      resolution: resolution || undefined,
      tools: tools || undefined,
      category: cat,
      subcategory: subcat || undefined,
      client: client || undefined,
      clientName: clientName || undefined,
      clientRole: clientRole || undefined,
      clientAvatar: clientAvatar || undefined,
      clientAvatarBg: editArtwork?.clientAvatarBg,
      objectPosition: editArtwork?.objectPosition,
      subscribers: subscribers || undefined,
      clientSocials: socials.length > 0 ? socials.filter((s) => s.url) : undefined,
      coworkers: selectedCoworkers.length > 0
        ? selectedCoworkers.map(({ id, name, role, avatar, socials: cws }) => ({ id, name, role, avatar, socials: cws }))
        : undefined,
      review:
        reviewRu || reviewEn
          ? { ru: reviewRu, en: reviewEn }
          : undefined,
    };

    try {
      const res = await fetch("/api/artworks", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(artwork),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || `Error ${res.status}`);
        setSaving(false);
        return;
      }

      onSaved(artwork);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editArtwork || !onDeleted) return;
    if (!confirm("Delete this artwork?")) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/artworks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editArtwork.id }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || `Error ${res.status}`);
        setSaving(false);
        return;
      }
      onDeleted(editArtwork.id);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
      setSaving(false);
    }
  };

  const inputClass =
    "w-full h-[30px] border border-[#c0c0c0] pl-3 pr-3 text-sm outline-none focus:border-text transition-colors";
  const labelClass =
    "text-[12px] font-bold tracking-[2.8px] uppercase text-text-secondary mb-1 block";

  return (
    <>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[100]"
    >
      <div className="absolute inset-0 bg-white/95" onClick={onClose} />

      {/* Content */}
      <div
        className="absolute inset-0 flex items-center justify-center px-[40px] py-[48px]"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-white max-w-[600px] w-full max-h-[90vh] overflow-y-auto shadow-[0px_4px_40px_0px_rgba(0,0,0,0.12)] px-[80px] py-[40px]"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-sm font-bold tracking-[2.8px] uppercase text-text-muted mb-8">
            {isEdit ? t("editArtwork") : t("addArtwork")}
          </h2>

          <div className="flex flex-col gap-6">
            {/* 1. Main image + Sketch — side by side */}
            <div className="grid grid-cols-2 gap-4">
              {/* Main image */}
              <div>
                <label className={labelClass}>{t("form.image")}</label>
                {!imageUrl ? (
                  <ImageUpload onUploaded={handleImageUploaded} square />
                ) : (
                  <div className="relative aspect-square w-full overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => { setImageUrl(""); setThumbnailUrl(""); }}
                      className="absolute top-1 right-1 w-5 h-5 bg-white/80 rounded-full flex items-center justify-center text-[10px] text-[#808080] hover:text-text"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              {/* Sketch */}
              <div>
                <label className={labelClass}>{t("form.sketch")}</label>
                {!sketchUrl ? (
                  <ImageUpload onUploaded={setSketchUrl} square />
                ) : (
                  <div className="relative aspect-square w-full overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={sketchUrl} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setSketchUrl("")}
                      className="absolute top-1 right-1 w-5 h-5 bg-white/80 rounded-full flex items-center justify-center text-[10px] text-[#808080] hover:text-text"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 1b. Thumbnail (crop or upload) */}
            {imageUrl && (
              <div>
                <label className={labelClass}>{t("form.thumbnail")}</label>
                {showCropper ? (
                  <ImageCropper imageUrl={imageUrl} onCropped={handleCropped} />
                ) : thumbnailUrl ? (
                  <div className="flex items-center gap-3">
                    <div className="relative w-[80px] h-[80px] overflow-hidden shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={thumbnailUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        onClick={() => setShowCropper(true)}
                        className="text-[12px] text-[#c0c0c0] hover:text-text-muted text-left"
                      >
                        {t("form.recrop")}
                      </button>
                      <label className="text-[12px] text-[#c0c0c0] hover:text-text-muted cursor-pointer">
                        {thumbnailUploading ? "..." : t("form.reupload")}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleThumbnailUpload(file);
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => setThumbnailUrl("")}
                        className="text-[12px] text-[#c0c0c0] hover:text-[#F87777] text-left"
                      >
                        {t("form.changeImage")} ✕
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowCropper(true)}
                      className="text-[12px] text-[#c0c0c0] hover:text-text-muted border border-[#c0c0c0] h-[30px] px-4 transition-colors"
                    >
                      {t("form.cropThumbnail")}
                    </button>
                    <label className="text-[12px] text-[#c0c0c0] hover:text-text-muted border border-dashed border-[#c0c0c0] h-[30px] px-4 flex items-center cursor-pointer transition-colors">
                      {thumbnailUploading ? "..." : t("form.uploadThumbnail")}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleThumbnailUpload(file);
                        }}
                      />
                    </label>
                  </div>
                )}
              </div>
            )}

            {/* 1c. Logo SVG (shown on hover in catalog) */}
            {imageUrl && (
              <div>
                <label className={labelClass}>{t("form.logo")}</label>
                {logoUrl ? (
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={logoUrl} alt="" className="h-[40px] w-auto max-w-[160px] object-contain" />
                    <button
                      type="button"
                      onClick={() => setLogoUrl("")}
                      className="text-[12px] text-[#c0c0c0] hover:text-text-muted"
                    >
                      {t("form.changeImage")}
                    </button>
                  </div>
                ) : (
                  <label className="inline-flex h-[30px] px-4 border border-dashed border-[#c0c0c0] items-center cursor-pointer hover:border-text-muted transition-colors">
                    <span className="text-[12px] text-[#c0c0c0]">
                      {logoUploading ? "..." : "+ SVG"}
                    </span>
                    <input
                      type="file"
                      accept=".svg,image/svg+xml"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleLogoUpload(file);
                      }}
                    />
                  </label>
                )}
              </div>
            )}

            {/* 3. Title */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>{t("form.titleEn")}</label>
                <input
                  className={inputClass}
                  value={titleEn}
                  onChange={(e) => setTitleEn(e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>{t("form.titleRu")}</label>
                <input
                  className={inputClass}
                  value={titleRu}
                  onChange={(e) => setTitleRu(e.target.value)}
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
                  onChange={(e) => { setCat(e.target.value); setSubcat(""); }}
                >
                  {categoriesLocal.map((c) => (
                    <option key={c.id} value={c.id}>{c.label.en}</option>
                  ))}
                  {categoriesLocal.length === 0 && (
                    <option value={cat}>{cat}</option>
                  )}
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
                  {availableSubs.map((s) => (
                    <option key={s.id} value={s.id}>{s.label.en}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 4b. Subscribers (YouTube only) */}
            {cat === "youtube" && (
              <div>
                <label className={labelClass}>{t("form.subscribers")}</label>
                <div className="flex gap-2">
                  <input
                    className={`${inputClass} flex-1`}
                    value={subscribers}
                    onChange={(e) => setSubscribers(e.target.value)}
                    placeholder="1.5M"
                  />
                  <button
                    type="button"
                    disabled={subsFetching}
                    onClick={() => {
                      const youtubeUrl =
                        socials.find((s) => s.icon === "youtube" && s.url)?.url ||
                        subsChannelInput;
                      if (!youtubeUrl) { setSubsChannelInput(" "); return; }
                      fetchSubs(youtubeUrl);
                    }}
                    className="h-[30px] px-3 border border-[#c0c0c0] text-[12px] text-[#808080] hover:border-[#808080] transition-colors disabled:opacity-40 shrink-0"
                  >
                    {subsFetching ? "..." : "↓"}
                  </button>
                </div>
                {subsChannelInput !== "" && !socials.find((s) => s.icon === "youtube" && s.url) && (
                  <input
                    className={`${inputClass} mt-2`}
                    value={subsChannelInput.trim()}
                    onChange={(e) => setSubsChannelInput(e.target.value)}
                    placeholder="youtube.com/@channel"
                    autoFocus
                  />
                )}
                {subsError && (
                  <p className="text-[11px] text-red-400 mt-1">{subsError}</p>
                )}
              </div>
            )}

            {/* 5. Year / Hours / Resolution */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>{t("form.year")}</label>
                <input
                  className={inputClass}
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="2024"
                />
              </div>
              <div>
                <label className={labelClass}>{t("form.hours")}</label>
                <div className="w-full flex items-center h-[30px] border border-[#c0c0c0] focus-within:border-text transition-colors">
                  <span className="pl-3 text-sm text-[#c0c0c0] select-none shrink-0">~</span>
                  <input
                    className="min-w-0 flex-1 h-full text-sm outline-none px-1"
                    value={hours}
                    onChange={(e) => setHours(e.target.value.replace(/[^0-9]/g, ""))}
                    placeholder="20"
                  />
                  <span className="pr-3 text-sm text-[#c0c0c0] select-none shrink-0">h</span>
                </div>
              </div>
              <div>
                <label className={labelClass}>{t("form.resolution")}</label>
                <input
                  className={inputClass}
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  placeholder="1920x1080"
                />
              </div>
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

              {/* Contact picker */}
              <div className="flex gap-2 items-center mt-3">
                <select
                  className="flex-1 h-[30px] border border-[#c0c0c0] text-sm outline-none px-2 text-[#808080]"
                  value={selectedContactId}
                  onChange={(e) => {
                    setSelectedContactId(e.target.value);
                    const contact = contacts.find((c) => c.id === e.target.value);
                    if (contact) applyContact(contact);
                  }}
                >
                  <option value="">— выбрать контакт —</option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>{c.clientName}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowContactModal(true)}
                  className="w-[30px] h-[30px] border border-[#c0c0c0] text-[#808080] hover:border-[#808080] hover:text-text-muted flex items-center justify-center text-lg leading-none shrink-0 transition-colors"
                >
                  +
                </button>
              </div>

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
                    {clientAvatar ? (
                      <div className="flex items-center gap-3">
                        <div className="relative w-[80px] h-[80px] rounded-full overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={clientAvatar} alt="" className="w-full h-full object-cover" />
                        </div>
                        <button
                          type="button"
                          onClick={() => setClientAvatar("")}
                          className="text-[12px] text-[#c0c0c0] hover:text-text-muted"
                        >
                          {t("form.changeImage")}
                        </button>
                      </div>
                    ) : (
                      <ImageUpload onUploaded={setClientAvatar} compact />
                    )}
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
                            onBlur={() => {
                              if (s.icon === "youtube" && s.url && cat === "youtube") {
                                fetchSubs(s.url);
                              }
                            }}
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

            {/* 10. Coworkers */}
            <div>
              <label className={labelClass}>{t("form.coworkers")}</label>
              <div className="flex flex-col gap-2">
                {selectedCoworkers.map((cw, i) => (
                  <div key={cw.id} className="flex items-center gap-2 bg-[#f5f5f5] px-3 py-2">
                    {cw.avatar && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={cw.avatar} alt="" className="w-[24px] h-[24px] rounded-full object-cover shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-bold tracking-[1.2px] text-[#808080] uppercase truncate">{cw.name}</p>
                      {cw.role && (
                        <p className="text-[11px] text-[#c0c0c0] tracking-[1px] uppercase truncate">{cw.role}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedCoworkers((prev) => prev.filter((_, idx) => idx !== i))}
                      className="text-[#c0c0c0] hover:text-text-muted text-sm shrink-0"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <div className="flex gap-2 items-center">
                  <select
                    className="flex-1 h-[30px] border border-[#c0c0c0] text-sm outline-none px-2 text-[#808080]"
                    value=""
                    onChange={(e) => {
                      const cw = coworkersList.find((c) => c.id === e.target.value);
                      if (cw && !selectedCoworkers.find((s) => s.id === cw.id)) {
                        setSelectedCoworkers((prev) => [...prev, cw]);
                      }
                    }}
                  >
                    <option value="">— добавить коворкера —</option>
                    {coworkersList
                      .filter((cw) => !selectedCoworkers.find((s) => s.id === cw.id))
                      .map((cw) => (
                        <option key={cw.id} value={cw.id}>{cw.name}</option>
                      ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowCoworkerModal(true)}
                    className="w-[30px] h-[30px] border border-[#c0c0c0] text-[#808080] hover:border-[#808080] hover:text-text-muted flex items-center justify-center text-lg leading-none shrink-0 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* 11. Review */}
            <div>
              <label className={labelClass}>{t("form.review")}</label>
              <div className="flex flex-col gap-2">
                <textarea
                  className="w-full h-[80px] bg-[#f5f5f5] text-sm outline-none resize-none p-3"
                  value={reviewEn}
                  onChange={(e) => setReviewEn(e.target.value)}
                  placeholder="EN"
                />
                <textarea
                  className="w-full h-[80px] bg-[#f5f5f5] text-sm outline-none resize-none p-3"
                  value={reviewRu}
                  onChange={(e) => setReviewRu(e.target.value)}
                  placeholder="RU"
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <p className="text-[12px] text-red-400 text-center">{error}</p>
            )}

            {/* 11. Actions */}
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
                disabled={saving || !imageUrl || !titleRu || !titleEn}
                className="h-[40px] flex-1 text-sm font-bold tracking-[2.8px] uppercase bg-text-muted text-white hover:bg-text transition-colors disabled:opacity-30"
              >
                {saving ? "..." : isEdit ? t("form.update") : t("form.save")}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>

    {showContactModal && (
      <ContactPickerModal
        onClose={() => setShowContactModal(false)}
        onSaved={(contact) => {
          setContacts((prev) => {
            const idx = prev.findIndex((c) => c.id === contact.id);
            if (idx === -1) return [...prev, contact];
            const next = [...prev];
            next[idx] = contact;
            return next;
          });
          setSelectedContactId(contact.id);
          applyContact(contact);
        }}
        onDeleted={(id) => {
          setContacts((prev) => prev.filter((c) => c.id !== id));
          if (selectedContactId === id) setSelectedContactId("");
        }}
      />
    )}

    {showCoworkerModal && (
      <CoworkerPickerModal
        onClose={() => setShowCoworkerModal(false)}
        onSaved={(coworker) => {
          setCoworkersList((prev) => {
            const idx = prev.findIndex((c) => c.id === coworker.id);
            if (idx === -1) return [...prev, coworker];
            const next = [...prev];
            next[idx] = coworker;
            return next;
          });
          setSelectedCoworkers((prev) =>
            prev.find((c) => c.id === coworker.id)
              ? prev.map((c) => c.id === coworker.id ? coworker : c)
              : [...prev, coworker]
          );
        }}
        onDeleted={(id) => {
          setCoworkersList((prev) => prev.filter((c) => c.id !== id));
          setSelectedCoworkers((prev) => prev.filter((c) => c.id !== id));
        }}
      />
    )}
    </>
  );
}
