"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import type { Contact } from "@/lib/blob";
import ImageUpload from "./ImageUpload";

const socialOptions = [
  "vk", "instagram", "youtube", "telegram", "artstation", "behance", "deviantart",
];

type Props = {
  contact?: Contact;
  onClose: () => void;
  onSaved: (contact: Contact) => void;
  onDeleted?: (id: string) => void;
};

export default function ContactPickerModal({ contact: editContact, onClose, onSaved, onDeleted }: Props) {
  const isEdit = !!editContact;

  const [clientName, setClientName] = useState(editContact?.clientName || "");
  const [client, setClient] = useState(editContact?.client || "");
  const [clientRole, setClientRole] = useState(editContact?.clientRole || "");
  const [clientAvatar, setClientAvatar] = useState(editContact?.clientAvatar || "");
  const [socials, setSocials] = useState<{ icon: string; url: string }[]>(
    editContact?.clientSocials || []
  );
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

  const addSocial = () => {
    if (socials.length >= 3) return;
    setSocials([...socials, { icon: "vk", url: "" }]);
  };

  const updateSocial = (i: number, field: "icon" | "url", val: string) => {
    const next = [...socials];
    next[i] = { ...next[i], [field]: val };
    setSocials(next);
  };

  const removeSocial = (i: number) => setSocials(socials.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    if (!clientName.trim()) return;
    setSaving(true);
    setError("");
    const contact: Contact = {
      id: editContact?.id || `contact-${Date.now()}`,
      clientName: clientName.trim(),
      client: client || undefined,
      clientRole: clientRole || undefined,
      clientAvatar: clientAvatar || undefined,
      clientSocials: socials.length > 0 ? socials.filter((s) => s.url) : undefined,
    };
    try {
      const res = await fetch("/api/contacts", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contact),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || `Error ${res.status}`);
        setSaving(false);
        return;
      }
      onSaved(contact);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editContact || !onDeleted) return;
    if (!confirm("Удалить этот контакт?")) return;
    setSaving(true);
    try {
      const res = await fetch("/api/contacts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editContact.id }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || `Error ${res.status}`);
        setSaving(false);
        return;
      }
      onDeleted(editContact.id);
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
          className="bg-white max-w-[480px] w-full max-h-[80vh] overflow-y-auto shadow-[0px_4px_40px_0px_rgba(0,0,0,0.12)] p-[40px]"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-sm font-bold tracking-[2.8px] uppercase text-text-muted mb-8">
            {isEdit ? "РЕДАКТИРОВАТЬ КОНТАКТ" : "НОВЫЙ КОНТАКТ"}
          </h2>

          <div className="flex flex-col gap-5">
            <div>
              <label className={labelClass}>ИМЯ *</label>
              <input
                className={inputClass}
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Иван Иванов"
                autoFocus
              />
            </div>

            <div>
              <label className={labelClass}>ПРОЕКТ</label>
              <input
                className={inputClass}
                value={client}
                onChange={(e) => setClient(e.target.value)}
              />
            </div>

            <div>
              <label className={labelClass}>ДОЛЖНОСТЬ</label>
              <input
                className={inputClass}
                value={clientRole}
                onChange={(e) => setClientRole(e.target.value)}
              />
            </div>

            <div>
              <label className={labelClass}>АВАТАР</label>
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
                    Сменить
                  </button>
                </div>
              ) : (
                <ImageUpload onUploaded={setClientAvatar} compact />
              )}
            </div>

            <div>
              <label className={labelClass}>СОЦСЕТИ</label>
              <div className="flex flex-col gap-2">
                {socials.map((s, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <select
                      className="h-[30px] border border-text-light text-sm outline-none px-1"
                      value={s.icon}
                      onChange={(e) => updateSocial(i, "icon", e.target.value)}
                    >
                      {socialOptions.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                    <input
                      className={`${inputClass} flex-1`}
                      value={s.url}
                      onChange={(e) => updateSocial(i, "url", e.target.value)}
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
                    + Добавить ссылку
                  </button>
                )}
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
                  УДАЛИТЬ
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={saving || !clientName.trim()}
                className="h-[40px] flex-1 text-sm font-bold tracking-[2.8px] uppercase bg-text-muted text-white hover:bg-text transition-colors disabled:opacity-30"
              >
                {saving ? "..." : isEdit ? "ОБНОВИТЬ" : "СОХРАНИТЬ"}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
