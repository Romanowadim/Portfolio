"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
  initialContactId?: string;
  onClose: () => void;
  onSaved: (artwork: Artwork) => void;
  onDeleted?: (id: string) => void;
};

/* ── helper: upload file via /api/upload ── */
async function uploadFile(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  if (!res.ok) throw new Error("Upload failed");
  const data = await res.json();
  return data.url;
}

/* ── inline LangToggle ── */
function LangToggle({ value, onChange }: { value: "en" | "ru"; onChange: (v: "en" | "ru") => void }) {
  return (
    <span className="inline-flex gap-1">
      <button
        type="button"
        onClick={() => onChange("en")}
        className={`text-[12px] font-bold tracking-[2.8px] uppercase transition-colors ${value === "en" ? "text-text-secondary" : "text-text-light"}`}
      >
        EN
      </button>
      <span className="text-text-light text-[12px] font-bold">|</span>
      <button
        type="button"
        onClick={() => onChange("ru")}
        className={`text-[12px] font-bold tracking-[2.8px] uppercase transition-colors ${value === "ru" ? "text-text-secondary" : "text-text-light"}`}
      >
        RU
      </button>
    </span>
  );
}

export default function ArtworkFormModal({
  category,
  subcategory,
  categories: categoriesProp,
  artwork: editArtwork,
  initialImageUrl,
  initialContactId,
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

  // Left panel drag/upload states
  const [mainDragOver, setMainDragOver] = useState(false);
  const [sketchDragOver, setSketchDragOver] = useState(false);
  const [mainUploading, setMainUploading] = useState(false);
  const [sketchUploading, setSketchUploading] = useState(false);
  const mainInputRef = useRef<HTMLInputElement>(null);
  const sketchInputRef = useRef<HTMLInputElement>(null);

  // Lang toggles
  const [nameLang, setNameLang] = useState<"en" | "ru">("en");
  const [reviewLang, setReviewLang] = useState<"en" | "ru">("en");
  const [reviewType, setReviewType] = useState<"review" | "description">(editArtwork?.reviewType || "review");

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

  // Client section — linked contact (by reference) or manual fields
  const [linkedContactId, setLinkedContactId] = useState(editArtwork?.contactId || initialContactId || "");
  const hasClientData = !!(editArtwork?.contactId || initialContactId || editArtwork?.clientName || editArtwork?.client || editArtwork?.clientRole || editArtwork?.clientAvatar);
  const [clientExpanded, setClientExpanded] = useState(hasClientData);
  const [clientName, setClientName] = useState(editArtwork?.clientName || "");
  const [client, setClient] = useState(editArtwork?.client || "");
  const [clientRole, setClientRole] = useState(editArtwork?.clientRole || "");
  const [clientAvatar, setClientAvatar] = useState(editArtwork?.clientAvatar || "");
  const [socials, setSocials] = useState<{ icon: string; url: string }[]>(editArtwork?.clientSocials || []);
  const [displayType, setDisplayType] = useState<"youtube" | "default">(editArtwork?.displayType || (editArtwork?.category === "youtube" ? "youtube" : "default"));
  const isYoutubeType = displayType === "youtube";
  const [subscribers, setSubscribers] = useState(editArtwork?.subscribers || "");
  const [subsFetching, setSubsFetching] = useState(false);
  const subsFetchingRef = useRef(false);
  const [subsChannelInput, setSubsChannelInput] = useState("");
  const [subsError, setSubsError] = useState("");
  const [reviewRu, setReviewRu] = useState(editArtwork?.review?.ru || "");
  const [reviewEn, setReviewEn] = useState(editArtwork?.review?.en || "");

  const [contacts, setContacts] = useState<Contact[]>([]);
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
    fetch("/api/contacts")
      .then((r) => r.json())
      .then((data) => setContacts(Array.isArray(data) ? data : []))
      .catch(() => {});
    fetch("/api/coworkers")
      .then((r) => r.json())
      .then((data: Coworker[]) => {
        if (!Array.isArray(data)) return;
        setCoworkersList(data);
        setSelectedCoworkers((prev) =>
          prev.map((cw) => {
            const fresh = cw.id ? data.find((c) => c.id === cw.id) : undefined;
            return fresh ? { ...fresh } : cw;
          })
        );
      })
      .catch(() => {});
  }, []);

  const linkedContact = contacts.find((c) => c.id === linkedContactId);

  useEffect(() => {
    if (cat !== "youtube") return;
    const youtubeUrl =
      linkedContact?.clientSocials?.find((s) => s.icon === "youtube" && s.url)?.url ||
      socials.find((s) => s.icon === "youtube" && s.url)?.url;
    if (youtubeUrl) fetchSubs(youtubeUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cat, linkedContact]);

  const applyContact = (contact: Contact) => {
    setLinkedContactId(contact.id);
    setClientExpanded(true);
    if (isYoutubeType) {
      const youtubeUrl = contact.clientSocials?.find((s) => s.icon === "youtube" && s.url)?.url;
      if (youtubeUrl) fetchSubs(youtubeUrl);
    }
  };

  const unlinkContact = () => {
    setLinkedContactId("");
    setClientName("");
    setClient("");
    setClientRole("");
    setClientAvatar("");
    setSocials([]);
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

  /* ── Left panel: drag-and-drop upload handlers ── */
  const handleMainDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setMainDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    setMainUploading(true);
    try {
      const url = await uploadFile(file);
      handleImageUploaded(url);
    } catch { /* ignore */ }
    setMainUploading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSketchDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setSketchDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    setSketchUploading(true);
    try {
      const url = await uploadFile(file);
      setSketchUrl(url);
    } catch { /* ignore */ }
    setSketchUploading(false);
  }, []);

  const handleMainFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMainUploading(true);
    try {
      const url = await uploadFile(file);
      handleImageUploaded(url);
    } catch { /* ignore */ }
    setMainUploading(false);
  };

  const handleSketchFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSketchUploading(true);
    try {
      const url = await uploadFile(file);
      setSketchUrl(url);
    } catch { /* ignore */ }
    setSketchUploading(false);
  };

  const addSocial = () => {
    if (socials.length >= 3) return;
    setSocials([...socials, { icon: "vk", url: "" }]);
  };

  const updateSocial = (i: number, field: "icon" | "url", val: string) => {
    const next = [...socials];
    next[i] = { ...next[i], [field]: val };
    setSocials(next);
    if (field === "icon" && val === "youtube" && next[i].url && isYoutubeType) {
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
      displayType: displayType === "youtube" ? "youtube" : undefined,
      // Contact by reference vs manual fields
      contactId: linkedContactId || undefined,
      client: linkedContactId ? undefined : (client || undefined),
      clientName: linkedContactId ? undefined : (clientName || undefined),
      clientRole: linkedContactId ? undefined : (clientRole || undefined),
      clientAvatar: linkedContactId ? undefined : (clientAvatar || undefined),
      clientAvatarBg: linkedContactId ? undefined : editArtwork?.clientAvatarBg,
      objectPosition: editArtwork?.objectPosition,
      subscribers: subscribers || undefined,
      clientSocials: linkedContactId ? undefined : (socials.length > 0 ? socials.filter((s) => s.url) : undefined),
      coworkers: selectedCoworkers.length > 0
        ? selectedCoworkers.map(({ id, name, role, avatar, socials: cws }) => ({ id, name, role, avatar, socials: cws }))
        : undefined,
      review:
        reviewRu || reviewEn
          ? { ru: reviewRu, en: reviewEn }
          : undefined,
      reviewType: reviewType !== "review" ? reviewType : undefined,
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

  /* ── Auto-fill with placeholder data ── */
  const autoFill = () => {
    const loremTitles = ["Концепт-арт замка", "Портрет персонажа", "Пейзаж будущего", "Абстрактная композиция", "Дизайн интерфейса", "Иллюстрация к книге"];
    const loremTitlesEn = ["Castle Concept Art", "Character Portrait", "Futuristic Landscape", "Abstract Composition", "Interface Design", "Book Illustration"];
    const toolsList = ["Photoshop", "Illustrator", "Procreate", "Figma", "Krita", "Midjourney"];
    const reviews = [
      "Отличная работа, очень понравился результат. Рекомендую автора всем знакомым.",
      "Профессиональный подход, всё сделано качественно и в срок.",
      "Превзошло все ожидания, буду обращаться ещё.",
    ];
    const reviewsEn = [
      "Great work, really loved the result. Highly recommend the artist.",
      "Professional approach, everything done with quality and on time.",
      "Exceeded all expectations, will definitely come back.",
    ];
    const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
    const randYear = String(2020 + Math.floor(Math.random() * 6));
    const randHours = String(5 + Math.floor(Math.random() * 95));
    const w = 1920 + Math.floor(Math.random() * 3) * 1080;
    const h = 1080 + Math.floor(Math.random() * 2) * 840;
    const randTools = Array.from({ length: 1 + Math.floor(Math.random() * 3) }, () => pick(toolsList))
      .filter((v, i, a) => a.indexOf(v) === i).join(" | ");

    // Gray placeholder as data URL
    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = `hsl(${Math.floor(Math.random() * 360)}, 10%, ${65 + Math.floor(Math.random() * 15)}%)`;
    ctx.fillRect(0, 0, 800, 600);
    ctx.fillStyle = "rgba(0,0,0,0.15)";
    ctx.font = "bold 32px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("PLACEHOLDER", 400, 310);
    const placeholderUrl = canvas.toDataURL("image/png");

    setImageUrl(placeholderUrl);
    setResolution(`${w}x${h}`);
    setTitleRu(pick(loremTitles));
    setTitleEn(pick(loremTitlesEn));
    setYear(randYear);
    setHours(randHours);
    setTools(randTools);
    setReviewRu(pick(reviews));
    setReviewEn(pick(reviewsEn));
  };

  const inputClass =
    "w-full h-[30px] border border-text-light pl-3 pr-3 text-sm outline-none focus:border-text transition-colors";
  const labelClass =
    "text-[12px] font-bold tracking-[2.8px] uppercase text-text-secondary mb-2 block";

  /* ── SVG icons for left panel ── */
  const photoIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 opacity-50">
      <path fillRule="evenodd" d="M1.5 6a2.25 2.25 0 0 1 2.25-2.25h16.5A2.25 2.25 0 0 1 22.5 6v12a2.25 2.25 0 0 1-2.25 2.25H3.75A2.25 2.25 0 0 1 1.5 18V6ZM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0 0 21 18v-1.94l-2.69-2.689a1.5 1.5 0 0 0-2.12 0l-.88.879.97.97a.75.75 0 1 1-1.06 1.06l-5.16-5.159a1.5 1.5 0 0 0-2.12 0L3 16.061Zm10.125-7.81a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Z" clipRule="evenodd" />
    </svg>
  );

  const pencilIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 opacity-50">
      <path d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712ZM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 0 0-1.32 2.214l-.8 2.685a.75.75 0 0 0 .933.933l2.685-.8a5.25 5.25 0 0 0 2.214-1.32L19.513 8.2Z" />
    </svg>
  );

  /* ── Drag zone component ── */
  const renderDropZone = (
    type: "main" | "sketch",
    currentUrl: string,
    dragOver: boolean,
    uploading: boolean,
    onRemove: () => void,
  ) => {
    const isMain = type === "main";
    const setDrag = isMain ? setMainDragOver : setSketchDragOver;
    const inputRef = isMain ? mainInputRef : sketchInputRef;
    const icon = isMain ? photoIcon : pencilIcon;
    const label = isMain ? t("form.uploadMainImage") : t("form.uploadSketch");

    if (currentUrl) {
      return (
        <div className="flex-1 relative min-h-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={currentUrl} alt="" className="w-full h-full object-contain" />
          <button
            type="button"
            onClick={onRemove}
            className="absolute top-2 right-2 w-6 h-6 bg-white/80 rounded-full flex items-center justify-center text-[12px] text-text-muted hover:text-text transition-colors"
          >
            ✕
          </button>
        </div>
      );
    }

    return (
      <div
        className={`flex-1 relative min-h-0 border-2 border-dashed transition-colors flex flex-col items-center justify-center cursor-pointer ${
          dragOver ? "border-white bg-white/10" : "border-white/60"
        }`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={isMain ? handleMainDrop : handleSketchDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={isMain ? handleMainFileChange : handleSketchFileChange}
        />
        {uploading ? (
          <span className="text-white/80 text-sm">...</span>
        ) : (
          <>
            <div className="text-white/60 mb-4">{icon}</div>
            <span className="text-white/60 text-[24px] font-light mb-4">+</span>
            <span className="text-white text-[12px] font-bold tracking-[2.8px] uppercase">{label}</span>
            <span className="text-white/60 text-[12px] tracking-[1.5px] mt-2">{t("form.clickOrDrop")}</span>
            {!isMain && (
              <span className="text-white/40 text-[12px] tracking-[1.5px] mt-1">{t("form.optional")}</span>
            )}
          </>
        )}
      </div>
    );
  };

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
          className="flex max-h-[90vh] w-full max-w-[1094px] shadow-[0px_4px_40px_0px_rgba(0,0,0,0.12)]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── LEFT PANEL: images ── */}
          <div className="flex-1 bg-text-light flex flex-col gap-[22px] p-[22px] min-w-0">
            {renderDropZone("main", imageUrl, mainDragOver, mainUploading, () => { setImageUrl(""); setThumbnailUrl(""); })}
            {renderDropZone("sketch", sketchUrl, sketchDragOver, sketchUploading, () => setSketchUrl(""))}
          </div>

          {/* ── RIGHT PANEL: form ── */}
          <div className="w-[540px] shrink-0 bg-white overflow-y-auto px-[40px] py-[40px]">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-sm font-bold tracking-[2.8px] uppercase text-text-muted">
                {isEdit ? t("editArtwork") : t("addArtwork")}
              </h2>
              {!isEdit && (
                <button
                  type="button"
                  onClick={autoFill}
                  className="h-[28px] px-3 text-[11px] font-bold tracking-[1.5px] uppercase border border-dashed border-text-light text-text-light hover:text-text-muted hover:border-text-muted transition-colors"
                >
                  Auto-fill
                </button>
              )}
            </div>

            {/* Category / Subcategory */}
            <div className="bg-bg-dark -mx-[40px] px-[40px] py-4 mb-6">
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
              <div className="mt-3">
                <label className={labelClass}>Display type</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setDisplayType("default")}
                    className={`h-[30px] px-4 text-[12px] font-bold tracking-[1.8px] uppercase border transition-colors ${displayType === "default" ? "border-text-muted text-text-muted" : "border-text-light text-text-light hover:border-text-muted hover:text-text-muted"}`}
                  >
                    Illustration
                  </button>
                  <button
                    type="button"
                    onClick={() => setDisplayType("youtube")}
                    className={`h-[30px] px-4 text-[12px] font-bold tracking-[1.8px] uppercase border transition-colors ${displayType === "youtube" ? "border-text-muted text-text-muted" : "border-text-light text-text-light hover:border-text-muted hover:text-text-muted"}`}
                  >
                    YouTube
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              {/* Thumbnail */}
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
                      <div className="flex items-center divide-x divide-bg-dark text-[12px]">
                        <button
                          type="button"
                          onClick={() => setShowCropper(true)}
                          className="text-text-light hover:text-text-muted pr-2 transition-colors"
                        >
                          {t("form.recrop")}
                        </button>
                        <label className="text-text-light hover:text-text-muted px-2 cursor-pointer transition-colors">
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
                          className="text-text-light hover:text-[#F87777] pl-2 transition-colors"
                        >
                          {t("form.delete")}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowCropper(true)}
                        className="text-[12px] text-text-light hover:text-text-muted border border-text-light h-[30px] px-4 transition-colors"
                      >
                        {t("form.cropThumbnail")}
                      </button>
                      <label className="text-[12px] text-text-light hover:text-text-muted border border-dashed border-text-light h-[30px] px-4 flex items-center cursor-pointer transition-colors">
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

              {/* Logo SVG */}
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
                        className="text-[12px] text-text-light hover:text-text-muted"
                      >
                        {t("form.changeImage")}
                      </button>
                    </div>
                  ) : (
                    <label className="inline-flex h-[30px] px-4 border border-dashed border-text-light items-center cursor-pointer hover:border-text-muted transition-colors">
                      <span className="text-[12px] text-text-light">
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

              {/* Separator */}
              <div className="h-px bg-bg-dark" />

              {/* Name with lang toggle */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className={labelClass.replace(" mb-1 block", "")}>{t("form.name")}</span>
                  <LangToggle value={nameLang} onChange={setNameLang} />
                </div>
                {nameLang === "en" ? (
                  <input
                    className={inputClass}
                    value={titleEn}
                    onChange={(e) => setTitleEn(e.target.value)}
                    placeholder="English title"
                  />
                ) : (
                  <input
                    className={inputClass}
                    value={titleRu}
                    onChange={(e) => setTitleRu(e.target.value)}
                    placeholder="Русское название"
                  />
                )}
              </div>

              {/* Subscribers (YouTube only) */}
              {isYoutubeType && (
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
                      className="h-[30px] px-3 border border-text-light text-[12px] text-text-muted hover:border-text-muted transition-colors disabled:opacity-40 shrink-0"
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
                    <p className="text-[12px] text-red-400 mt-1">{subsError}</p>
                  )}
                </div>
              )}

              {/* Year / Hours / Canvas Size */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid grid-cols-2 gap-2">
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
                  <div className="w-full flex items-center h-[30px] border border-text-light focus-within:border-text transition-colors">
                    <span className="pl-2 text-sm text-text-light select-none shrink-0">~</span>
                    <input
                      className="min-w-0 flex-1 h-full text-sm outline-none px-1"
                      value={hours}
                      onChange={(e) => setHours(e.target.value.replace(/[^0-9]/g, ""))}
                      placeholder="20"
                    />
                    <span className="pr-2 text-sm text-text-light select-none shrink-0">h</span>
                  </div>
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

              {/* Separator */}
              <div className="h-px bg-bg-dark" />

              {/* Client info (collapsible) */}
              <div>
                <button
                  type="button"
                  onClick={() => setClientExpanded(!clientExpanded)}
                  className="text-[12px] font-bold tracking-[2.8px] uppercase text-text-secondary hover:text-text-muted transition-colors"
                >
                  {clientExpanded ? "▲" : "▼"} {t("form.clientInfo")}
                </button>

                {/* Contact picker */}
                {!linkedContactId && (
                  <div className="flex gap-2 items-center mt-3">
                    <select
                      className="flex-1 h-[30px] border border-text-light text-sm outline-none px-2 text-text-muted"
                      value=""
                      onChange={(e) => {
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
                      className="w-[30px] h-[30px] border border-text-light text-text-muted hover:border-text-muted hover:text-text-muted flex items-center justify-center text-lg leading-none shrink-0 transition-colors"
                    >
                      +
                    </button>
                  </div>
                )}

                {/* Linked contact card */}
                {linkedContactId && linkedContact && (
                  <div className="mt-3 flex items-center gap-3 bg-bg px-4 py-3">
                    {linkedContact.clientAvatar && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={linkedContact.clientAvatar} alt="" className="w-[40px] h-[40px] rounded-full object-cover shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-bold tracking-[1.2px] text-text-muted uppercase truncate">{linkedContact.clientName}</p>
                      {(linkedContact.client || linkedContact.clientRole) && (
                        <p className="text-[12px] text-text-light tracking-[1px] truncate">
                          {[linkedContact.clientRole, linkedContact.client].filter(Boolean).join(" \u00B7 ")}
                        </p>
                      )}
                      {linkedContact.clientSocials && linkedContact.clientSocials.length > 0 && (
                        <div className="flex gap-[6px] mt-1">
                          {linkedContact.clientSocials.map((social, i) => (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img key={i} src={`/images/social/${social.icon}.svg`} alt={social.icon} className="w-[14px] h-[14px] object-contain opacity-40" />
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={unlinkContact}
                      className="text-text-light hover:text-text-muted text-sm shrink-0"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Linked but contact not found */}
                {linkedContactId && !linkedContact && (
                  <div className="mt-3 flex items-center gap-3 bg-[#fff5f5] px-4 py-3">
                    <p className="text-[12px] text-red-400 flex-1">Contact not found (id: {linkedContactId})</p>
                    <button
                      type="button"
                      onClick={unlinkContact}
                      className="text-text-light hover:text-text-muted text-sm shrink-0"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Manual client fields — only when no linked contact */}
                {clientExpanded && !linkedContactId && (
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
                            className="text-[12px] text-text-light hover:text-text-muted"
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
                              className="h-[30px] border border-text-light text-sm outline-none px-1"
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
                                if (s.icon === "youtube" && s.url && isYoutubeType) {
                                  fetchSubs(s.url);
                                }
                              }}
                              placeholder="https://..."
                            />
                            <button
                              type="button"
                              onClick={() => removeSocial(i)}
                              className="text-text-light hover:text-text-muted text-sm"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                        {socials.length < 3 && (
                          <button
                            type="button"
                            onClick={addSocial}
                            className="text-[12px] text-text-light hover:text-text-muted"
                          >
                            + {t("form.addSocial")}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Separator */}
              <div className="h-px bg-bg-dark" />

              {/* Review / Description with lang toggle */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="relative inline-flex items-center">
                    <span className="absolute left-0 pointer-events-none text-text-secondary text-[12px] font-bold">▼</span>
                    <select
                      value={reviewType}
                      onChange={(e) => setReviewType(e.target.value as "review" | "description")}
                      className="appearance-none bg-transparent text-[12px] font-bold tracking-[2.8px] uppercase text-text-secondary pl-4 cursor-pointer outline-none"
                    >
                      <option value="review">{t("form.review")}</option>
                      <option value="description">{t("form.description")}</option>
                    </select>
                  </div>
                  <LangToggle value={reviewLang} onChange={setReviewLang} />
                </div>
                {reviewLang === "en" ? (
                  <textarea
                    className="w-full h-[80px] bg-bg text-sm outline-none resize-none p-3"
                    value={reviewEn}
                    onChange={(e) => setReviewEn(e.target.value)}
                    placeholder="EN"
                  />
                ) : (
                  <textarea
                    className="w-full h-[80px] bg-bg text-sm outline-none resize-none p-3"
                    value={reviewRu}
                    onChange={(e) => setReviewRu(e.target.value)}
                    placeholder="RU"
                  />
                )}
              </div>

              {/* Coworkers */}
              <div>
                <label className={labelClass}>{t("form.coworkers")}</label>
                <div className="flex flex-col gap-2">
                  {selectedCoworkers.map((cw, i) => (
                    <div key={cw.id} className="flex items-center gap-2 bg-bg px-3 py-2">
                      {cw.avatar && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={cw.avatar} alt="" className="w-[24px] h-[24px] rounded-full object-cover shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-bold tracking-[1.2px] text-text-muted uppercase truncate">{cw.name}</p>
                        {cw.role && (
                          <p className="text-[12px] text-text-light tracking-[1px] uppercase truncate">{cw.role}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedCoworkers((prev) => prev.filter((_, idx) => idx !== i))}
                        className="text-text-light hover:text-text-muted text-sm shrink-0"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2 items-center">
                    <select
                      className="flex-1 h-[30px] border border-text-light text-sm outline-none px-2 text-text-muted"
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
                      className="w-[30px] h-[30px] border border-text-light text-text-muted hover:border-text-muted hover:text-text-muted flex items-center justify-center text-lg leading-none shrink-0 transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Separator */}
              <div className="h-px bg-bg-dark" />

              {/* Programs */}
              <div>
                <label className={labelClass}>{t("form.tools")}</label>
                <ToolSelector value={tools} onChange={setTools} />
              </div>

              {/* Error */}
              {error && (
                <p className="text-[12px] text-red-400 text-center">{error}</p>
              )}

              {/* Actions */}
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
          applyContact(contact);
        }}
        onDeleted={(id) => {
          setContacts((prev) => prev.filter((c) => c.id !== id));
          if (linkedContactId === id) setLinkedContactId("");
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
