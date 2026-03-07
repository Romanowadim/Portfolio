"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { PANEL_CLASS, PANEL_STYLE } from "./shared";
import { artworks as staticArtworks, type Artwork } from "@/data/artworks";
import type { Contact, Coworker } from "@/lib/blob";

type Notification = {
  id: string;
  type: "visit" | "order" | "view" | "contact_click" | "coworker_click" | "daily_summary";
  message: string;
  data?: Record<string, unknown>;
  createdAt: string;
  read: boolean;
};

const accentColors: Record<string, string> = {
  visit: "#5596ea",
  order: "#81AB41",
  view: "#f87777",
  contact_click: "#e8a854",
  coworker_click: "#b07ed6",
  daily_summary: "#5596ea",
};

const typeLabels: Record<string, string> = {
  visit: "Visit",
  order: "Order",
  view: "View",
  contact_click: "Client",
  coworker_click: "Coworker",
  daily_summary: "Summary",
};

function formatDate(iso: string) {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return { date, time };
}

function SummaryMessage({ message }: { message: string }) {
  // Format: "[15:00] Visitors (7) Views (2)"
  const match = message.match(/^(.*?Visitors\s*)\((\d+)\)(\s*Views\s*)\((\d+)\)(.*)$/);
  if (!match) return <>{message}</>;
  return (
    <>
      {match[1]}<span className="text-[#5596ea]">({match[2]})</span>{match[3]}<span className="text-[#5596ea]">({match[4]})</span>{match[5]}
    </>
  );
}

export default function NotificationsSection() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [dynamicArtworks, setDynamicArtworks] = useState<Artwork[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [coworkers, setCoworkers] = useState<Coworker[]>([]);

  // Load current artworks, contacts, coworkers for live thumbnails
  useEffect(() => {
    fetch("/api/artworks").then((r) => r.json()).then((data: Artwork[]) => { if (Array.isArray(data)) setDynamicArtworks(data); }).catch(() => {});
    fetch("/api/contacts").then((r) => r.json()).then((data: Contact[]) => { if (Array.isArray(data)) setContacts(data); }).catch(() => {});
    fetch("/api/coworkers").then((r) => r.json()).then((data: Coworker[]) => { if (Array.isArray(data)) setCoworkers(data); }).catch(() => {});
  }, []);

  // Build a map of id -> current thumbnail/avatar
  const thumbMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of staticArtworks) map.set(a.id, a.thumbnail || a.image);
    for (const a of dynamicArtworks) map.set(a.id, a.thumbnail || a.image);
    for (const c of contacts) { if (c.clientAvatar) map.set(c.id, c.clientAvatar); }
    for (const c of coworkers) { if (c.avatar) map.set(c.id, c.avatar); }
    return map;
  }, [dynamicArtworks, contacts, coworkers]);

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setNotifications(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    const es = new EventSource("/api/notifications/stream");
    es.onmessage = (event) => {
      try {
        const n: Notification = JSON.parse(event.data);
        setNotifications((prev) => {
          const idx = prev.findIndex((x) => x.id === n.id);
          if (idx >= 0) {
            const updated = [...prev];
            updated.splice(idx, 1);
            return [n, ...updated].slice(0, 100);
          }
          return [n, ...prev].slice(0, 100);
        });
      } catch {}
    };
    return () => es.close();
  }, []);

  const handleMarkAllRead = useCallback(() => {
    fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark_all_read" }),
    }).then(() => {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      window.dispatchEvent(new CustomEvent("notif-sync", { detail: "mark_all_read" }));
    }).catch(() => {});
  }, []);

  const handleClearAll = useCallback(() => {
    fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "clear_all" }),
    }).then(() => {
      setNotifications([]);
      window.dispatchEvent(new CustomEvent("notif-sync", { detail: "clear_all" }));
    }).catch(() => {});
  }, []);

  const handleMarkRead = useCallback((id: string) => {
    fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark_read", id }),
    }).then(() => {
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
      window.dispatchEvent(new CustomEvent("notif-sync", { detail: "mark_read:" + id }));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const action = (e as CustomEvent).detail as string;
      if (action === "mark_all_read") {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      } else if (action === "clear_all") {
        setNotifications([]);
      } else if (action.startsWith("mark_read:")) {
        const id = action.slice("mark_read:".length);
        setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
      }
    };
    window.addEventListener("notif-sync", handler);
    return () => window.removeEventListener("notif-sync", handler);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const PER_PAGE = 15;
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(notifications.length / PER_PAGE));
  const paged = notifications.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  return (
    <motion.div
      key="notifications"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`${PANEL_CLASS} flex flex-col`}
      style={{ ...PANEL_STYLE, display: "flex" }}
    >
      {/* Table header — matches row layout: px-16 + 52px thumb + gap-16 + 52px type + sep + flex message + sep + 130px date + sep + 16px dot */}
      <div className="flex items-center gap-[16px] px-[16px] mb-[8px] border border-border">
        {/* Type — spans thumbnail (52) + gap (16) + type label (80) = 148px */}
        <p className="w-[148px] shrink-0 text-[12px] font-bold tracking-[1.8px] text-text-light uppercase">
          Type
        </p>
        <span className="w-px h-[2em] bg-border shrink-0" />
        {/* Notification */}
        <p className="flex-1 min-w-0 text-[12px] font-bold tracking-[1.8px] text-text-light uppercase">
          Notification
        </p>
        <span className="w-px h-[2em] bg-border shrink-0" />
        {/* Date */}
        <p className="w-[130px] shrink-0 text-[12px] font-bold tracking-[1.8px] text-text-light uppercase">
          Date
        </p>
        <span className="w-px h-[2em] bg-border shrink-0" />
        <div className="shrink-0 flex items-center gap-[10px]">
          <button
            onClick={handleMarkAllRead}
            className="text-text-light hover:text-text-muted transition-colors"
            title="Mark all read"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-3.5-3.5a.75.75 0 0 1 1.06-1.06l2.894 2.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
              <path fillRule="evenodd" d="M18.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-1.5-1.5a.75.75 0 1 1 1.06-1.06l.894.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
            </svg>
          </button>
          {notifications.length > 0 && (
            <button
              onClick={handleClearAll}
              className="text-text-light hover:text-red-500 transition-colors"
              title="Clear all"
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" clipRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 3.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <p className="text-[12px] text-text-light px-[16px] py-[20px]">Loading...</p>
      ) : notifications.length === 0 ? (
        <p className="text-[12px] text-text-light px-[16px] py-[20px]">No notifications</p>
      ) : (
        <div className="flex flex-col gap-[4px]">
          {paged.map((n, i) => {
            const accent = accentColors[n.type] || "#5596ea";
            const entityId = (n.data?.artworkId || n.data?.contactId) as string | undefined;
            const thumb = (entityId && thumbMap.get(entityId)) || (n.data?.thumbnail || n.data?.avatar) as string | undefined;
            const count = n.data?.count as number | undefined;
            const { date, time } = formatDate(n.createdAt);
            const dayKey = new Date(n.createdAt).toDateString();
            const prevDayKey = i > 0 ? new Date(paged[i - 1].createdAt).toDateString() : null;
            const showDaySeparator = i === 0 || dayKey !== prevDayKey;
            const dayLabel = new Date(n.createdAt).toLocaleDateString("en-US", { month: "short", day: "2-digit" }).toUpperCase();
            return (
              <React.Fragment key={n.id}>
                {showDaySeparator && (
                  <div className="flex items-center gap-[12px] py-[8px]">
                    <p className="text-[12px] font-bold tracking-[2px] text-text-light uppercase shrink-0">
                      {dayLabel}
                    </p>
                    <span className="flex-1 h-px bg-border" />
                  </div>
                )}
              <div
                className={`flex items-center gap-[16px] bg-white px-[16px] py-[12px] cursor-pointer hover:bg-bg transition-colors ${n.read ? "opacity-50" : ""}`}
                onClick={() => !n.read && handleMarkRead(n.id)}
              >
                {/* Accent bar + thumbnail */}
                <div className="relative w-[52px] h-[52px] shrink-0 overflow-hidden" style={{ backgroundColor: "rgba(217,217,217,0.55)" }}>
                  <div className="absolute left-0 top-0 bottom-0 w-[3px] z-10" style={{ backgroundColor: accent }} />
                  {(n.type === "view" || n.type === "contact_click" || n.type === "coworker_click") && thumb ? (
                    <Image src={thumb} alt="" fill className="object-cover" sizes="52px" />
                  ) : n.type === "order" ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="#c0c0c0">
                        <path d="M10.464 8.746c.227-.18.497-.311.786-.394v2.795a2.252 2.252 0 0 1-.786-.394c-.394-.313-.546-.681-.546-1.004 0-.322.152-.691.546-1.003ZM12.75 15.662v-2.824c.347.085.664.228.921.421.427.32.579.686.579.991 0 .305-.152.671-.579.991a2.534 2.534 0 0 1-.921.42Z" />
                        <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 6a.75.75 0 0 0-1.5 0v.816a3.836 3.836 0 0 0-1.72.756c-.712.566-1.112 1.35-1.112 2.178 0 .829.4 1.612 1.113 2.178.502.4 1.102.647 1.719.756v2.978a2.536 2.536 0 0 1-.921-.421l-.879-.66a.75.75 0 0 0-.9 1.2l.879.66c.533.4 1.169.645 1.821.75V18a.75.75 0 0 0 1.5 0v-.81a4.124 4.124 0 0 0 1.821-.749c.745-.559 1.179-1.344 1.179-2.191 0-.847-.434-1.632-1.179-2.191a4.122 4.122 0 0 0-1.821-.75V8.354c.29.082.559.213.786.393l.415.33a.75.75 0 0 0 .933-1.175l-.415-.33a3.836 3.836 0 0 0-1.719-.755V6Z" clipRule="evenodd" />
                      </svg>
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="#c0c0c0">
                        <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Type label */}
                <div className="w-[80px] shrink-0">
                  <span className="text-[11px] font-bold tracking-[1.5px] uppercase" style={{ color: accent }}>
                    {typeLabels[n.type] || n.type}
                  </span>
                </div>

                <span className="w-px h-[32px] bg-bg-dark shrink-0" />

                {/* Message */}
                <div className="flex-1 min-w-0 pr-[16px]">
                  <p className="text-[13px] font-bold tracking-[1.5px] text-text-muted uppercase truncate">
                    {n.type === "visit" ? (
                      <>New visitors{count && count > 1 && <span style={{ color: accent }}> ({count})</span>}</>
                    ) : n.type === "order" ? (
                      "New order"
                    ) : n.type === "view" ? (
                      <>New view{count && count > 1 && <span style={{ color: accent }}> ({count})</span>}</>
                    ) : n.type === "contact_click" ? (
                      <>Client click{count && count > 1 && <span style={{ color: accent }}> ({count})</span>}</>
                    ) : n.type === "coworker_click" ? (
                      <>Coworker click{count && count > 1 && <span style={{ color: accent }}> ({count})</span>}</>
                    ) : n.type === "daily_summary" ? (
                      <SummaryMessage message={n.message} />
                    ) : (
                      <>{n.message}{count && count > 1 && <span style={{ color: accent }}> ({count})</span>}</>
                    )}
                  </p>
                  <p className="text-[12px] font-medium tracking-[1.2px] text-text-light uppercase mt-[2px] truncate">
                    {n.type === "daily_summary" ? "Summary stat" : n.message}
                  </p>
                </div>

                <span className="w-px h-[32px] bg-bg-dark shrink-0" />

                {/* Date */}
                <div className="shrink-0 w-[130px]">
                  <p className="text-[12px] font-medium tracking-[1.2px] text-text-light">{date}</p>
                  <p className="text-[12px] font-medium tracking-[1.2px] text-text-light mt-[2px]">{time}</p>
                </div>

                <span className="w-px h-[32px] bg-bg-dark shrink-0" />

                {/* Unread indicator — matches header buttons width (16+10+16=42px) */}
                <div className="shrink-0 w-[42px] flex items-center justify-center">
                  {!n.read && (
                    <div className="w-[8px] h-[8px] rounded-full bg-red-500" />
                  )}
                </div>
              </div>
              </React.Fragment>
            );
          })}

        </div>
      )}

      {/* Pagination — always at bottom */}
      {totalPages > 1 && (
        <div className="shrink-0 flex items-center justify-center gap-[8px] pb-[20px] mt-auto">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="text-text-light hover:text-text-muted transition-colors disabled:opacity-30"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              className={`w-[24px] h-[24px] flex items-center justify-center text-[11px] font-bold tracking-[1px] transition-colors ${
                i === page ? "text-text-muted" : "text-text-light hover:text-text-muted"
              }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="text-text-light hover:text-text-muted transition-colors disabled:opacity-30"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      )}
    </motion.div>
  );
}
