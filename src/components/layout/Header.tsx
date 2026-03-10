"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import ThemeSwitcher from "@/components/ui/ThemeSwitcher";
import { useAdmin } from "@/components/admin/AdminProvider";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

type Notification = {
  id: string;
  type: "visit" | "order" | "view" | "contact_click" | "coworker_click" | "daily_summary";
  message: string;
  data?: Record<string, unknown>;
  createdAt: string;
  read: boolean;
};

const navItems = [
  { href: "/about", key: "about" },
  { href: "/portfolio", key: "portfolio" },
  { href: "/equipment", key: "equipment" },
  { href: "/order", key: "order" },
] as const;

function SummaryMsg({ message }: { message: string }) {
  const match = message.match(/^(.*?Visitors\s*)\((\d+)\)(\s*Views\s*)\((\d+)\)(.*)$/);
  if (!match) return <>{message}</>;
  return (
    <>
      {match[1]}<span className="text-[#5596ea]">({match[2]})</span>{match[3]}<span className="text-[#5596ea]">({match[4]})</span>{match[5]}
    </>
  );
}

export default function Header() {
  const t = useTranslations("nav");
  const tAdmin = useTranslations("admin");
  const pathname = usePathname();
  const { isAdmin, logout } = useAdmin();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [toasts, setToasts] = useState<Notification[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);
  const lastSeenIdRef = useRef<string | null>(null);
  const [soundMuted, setSoundMuted] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem("notif-muted") === "1";
    return false;
  });
  const soundMutedRef = useRef(soundMuted);
  const audioCtxRef = useRef<AudioContext | null>(null);
  useEffect(() => { soundMutedRef.current = soundMuted; }, [soundMuted]);
  const toggleMute = useCallback(() => {
    setSoundMuted((prev) => {
      const next = !prev;
      localStorage.setItem("notif-muted", next ? "1" : "0");
      return next;
    });
  }, []);
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Live thumbnail map
  const [thumbData, setThumbData] = useState<{ id: string; thumbnail?: string; image?: string; clientAvatar?: string; avatar?: string }[]>([]);
  useEffect(() => {
    if (!isAdmin) return;
    let ac = new AbortController();
    const load = () => {
      ac.abort();
      ac = new AbortController();
      Promise.all([
        fetch("/api/artworks", { signal: ac.signal }).then((r) => r.json()).catch(() => []),
        fetch("/api/contacts", { signal: ac.signal }).then((r) => r.json()).catch(() => []),
        fetch("/api/coworkers", { signal: ac.signal }).then((r) => r.json()).catch(() => []),
      ]).then(([arts, contacts, coworkers]) => {
        const items: typeof thumbData = [];
        if (Array.isArray(arts)) for (const a of arts) items.push({ id: a.id, thumbnail: a.thumbnail, image: a.image });
        if (Array.isArray(contacts)) for (const c of contacts) items.push({ id: c.id, clientAvatar: c.clientAvatar });
        if (Array.isArray(coworkers)) for (const c of coworkers) items.push({ id: c.id, avatar: c.avatar });
        setThumbData(items);
      });
    };
    load();
    const handler = () => load();
    window.addEventListener("notif-thumb-refresh", handler);
    return () => { window.removeEventListener("notif-thumb-refresh", handler); ac.abort(); };
  }, [isAdmin]);

  const thumbMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of thumbData) {
      const url = item.thumbnail || item.image || item.clientAvatar || item.avatar;
      if (url) map.set(item.id, url);
    }
    return map;
  }, [thumbData]);

  // Initial fetch + SSE for real-time updates
  useEffect(() => {
    if (!isAdmin) return;

    // Load existing notifications
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((data) => {
        if (!Array.isArray(data)) return;
        if (data.length > 0) lastSeenIdRef.current = data[0].id;
        setNotifications(data);
      })
      .catch(() => {});

    // SSE stream for new notifications
    let es: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
    let disposed = false;

    const connect = () => {
      if (disposed) return;
      es = new EventSource("/api/notifications/stream");
      es.onmessage = async (event) => {
        try {
          const n: Notification = JSON.parse(event.data);
          setNotifications((prev) => {
            // Update existing stacked visit notification
            const existingIdx = prev.findIndex((x) => x.id === n.id);
            if (existingIdx >= 0) {
              const updated = [...prev];
              updated.splice(existingIdx, 1);
              return [n, ...updated].slice(0, 100);
            }
            return [n, ...prev].slice(0, 100);
          });
          setToasts((prev) => {
            const existingIdx = prev.findIndex((x) => x.id === n.id);
            if (existingIdx >= 0) {
              const updated = [...prev];
              updated[existingIdx] = n;
              return updated;
            }
            return [n, ...prev].slice(0, 5);
          });
          lastSeenIdRef.current = n.id;
          if (!soundMutedRef.current) try {
            if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
              audioCtxRef.current = new AudioContext();
            }
            const ctx = audioCtxRef.current;
            if (ctx.state === "suspended") await ctx.resume();
            const now = ctx.currentTime;
            if (n.type === "order") {
              const hit = ctx.createOscillator();
              const hitGain = ctx.createGain();
              hit.type = "square";
              hit.frequency.setValueAtTime(800, now);
              hit.frequency.setValueAtTime(600, now + 0.03);
              hitGain.gain.setValueAtTime(0.12, now);
              hitGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
              hit.connect(hitGain);
              hitGain.connect(ctx.destination);
              hit.start(now);
              hit.stop(now + 0.08);
              const ring = ctx.createOscillator();
              const ringGain = ctx.createGain();
              ring.type = "sine";
              ring.frequency.setValueAtTime(3500, now + 0.08);
              ring.frequency.setValueAtTime(4200, now + 0.12);
              ring.frequency.setValueAtTime(3800, now + 0.2);
              ringGain.gain.setValueAtTime(0.1, now + 0.08);
              ringGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
              ring.connect(ringGain);
              ringGain.connect(ctx.destination);
              ring.start(now + 0.08);
              ring.stop(now + 0.5);
              const ring2 = ctx.createOscillator();
              const ring2Gain = ctx.createGain();
              ring2.type = "sine";
              ring2.frequency.setValueAtTime(4800, now + 0.15);
              ring2.frequency.setValueAtTime(5200, now + 0.2);
              ring2Gain.gain.setValueAtTime(0.08, now + 0.15);
              ring2Gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
              ring2.connect(ring2Gain);
              ring2Gain.connect(ctx.destination);
              ring2.start(now + 0.15);
              ring2.stop(now + 0.55);
            } else if (n.type === "visit") {
              // Door bell chime — two bright bell tones
              const chime = (time: number, freq: number) => {
                const osc = ctx.createOscillator();
                const g = ctx.createGain();
                osc.type = "sine";
                osc.frequency.setValueAtTime(freq, time);
                g.gain.setValueAtTime(0.15, time);
                g.gain.exponentialRampToValueAtTime(0.001, time + 0.6);
                osc.connect(g);
                g.connect(ctx.destination);
                osc.start(time);
                osc.stop(time + 0.6);
                // Overtone
                const osc2 = ctx.createOscillator();
                const g2 = ctx.createGain();
                osc2.type = "sine";
                osc2.frequency.setValueAtTime(freq * 2.5, time);
                g2.gain.setValueAtTime(0.06, time);
                g2.gain.exponentialRampToValueAtTime(0.001, time + 0.4);
                osc2.connect(g2);
                g2.connect(ctx.destination);
                osc2.start(time);
                osc2.stop(time + 0.4);
              };
              chime(now, 1200);
            } else {
              // Default ping
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.frequency.setValueAtTime(880, now);
              osc.frequency.setValueAtTime(1100, now + 0.08);
              gain.gain.setValueAtTime(0.15, now);
              gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
              osc.start(now);
              osc.stop(now + 0.25);
            }
          } catch (audioErr) { console.error("[notif] audio error:", audioErr); }
        } catch (parseErr) { console.error("[notif] parse error:", parseErr); }
      };
      es.onerror = () => {
        es?.close();
        clearTimeout(reconnectTimer);
        reconnectTimer = setTimeout(connect, 5000);
      };
    };
    connect();

    return () => {
      disposed = true;
      es?.close();
      clearTimeout(reconnectTimer);
    };
  }, [isAdmin]);

  // Auto-dismiss toasts
  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = setTimeout(() => {
      setToasts((prev) => prev.slice(0, -1));
    }, 4000);
    return () => clearTimeout(timer);
  }, [toasts]);

  useEffect(() => {
    if (!showNotifications) return;
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showNotifications]);

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
    setNotifications([]);
  }, []);

  // Listen for sync events from NotificationsSection
  useEffect(() => {
    const handler = (e: Event) => {
      const action = (e as CustomEvent).detail;
      if (action === "mark_all_read") {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      } else if (action === "clear_all") {
        setNotifications([]);
      }
    };
    window.addEventListener("notif-sync", handler);
    return () => window.removeEventListener("notif-sync", handler);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
      <div className="px-6 md:px-10 lg:pl-[3.33vw] lg:pr-0 h-20 lg:h-[148px] flex items-center pointer-events-auto">
        {/* Logo */}
        <Link href="/" className="shrink-0 mr-6 lg:mr-[calc(4.38vw_-_17px)]">
          <Image
            src="/images/logo.svg"
            alt="VR"
            width={17}
            height={56}
            className="h-[40px] lg:h-[56px] w-auto opacity-50 hover:opacity-100 transition-opacity"
          />
        </Link>

        {/* Desktop nav — next to logo */}
        <nav className="hidden md:flex items-center gap-[30px]">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.key}
                href={item.href}
                className={`text-[14px] tracking-wide transition-colors ${
                  isActive
                    ? "text-text-muted"
                    : "text-text-light hover:text-text-muted"
                }`}
              >
                {t(item.key)}
              </Link>
            );
          })}
          {isAdmin && (
            <>
              <span className="w-px h-[1em] bg-text-light/50 self-center" />
              <div className="relative flex items-center" ref={notifRef}>
                <button
                  className="relative flex items-center text-text-light hover:text-text-muted transition-colors"
                  title="Notifications"
                  onClick={() => setShowNotifications((v) => !v)}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-[16px] rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center px-[3px] leading-none">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </button>
                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-[calc(100%+12px)] left-1/2 -translate-x-1/2 w-[360px] bg-white shadow-[0_4px_24px_rgba(0,0,0,0.12)] z-50 max-h-[400px] flex flex-col"
                    >
                      <div className="flex items-center justify-between px-[16px] py-[12px] border-b border-border">
                        <span className="text-[12px] font-bold tracking-[2px] uppercase text-text-muted">Notifications</span>
                        <div className="flex items-center gap-[12px]">
                          <button
                            onClick={toggleMute}
                            className="text-text-light hover:text-text-muted transition-colors"
                            title={soundMuted ? "Unmute" : "Mute"}
                          >
                            {soundMuted ? (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 5L6 9H2v6h4l5 4V5Z" />
                                <line x1="23" y1="9" x2="17" y2="15" />
                                <line x1="17" y1="9" x2="23" y2="15" />
                              </svg>
                            ) : (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 5L6 9H2v6h4l5 4V5Z" />
                                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                              </svg>
                            )}
                          </button>
                          {unreadCount > 0 && (
                            <button
                              onClick={handleMarkAllRead}
                              className="text-text-light hover:text-text-muted transition-colors"
                              title="Mark all read"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M1 12l5 5L17 6" />
                                <path d="M7 12l5 5L23 6" />
                              </svg>
                            </button>
                          )}
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
                      <div className="overflow-y-auto flex-1">
                        {notifications.length === 0 ? (
                          <p className="text-[12px] text-text-light px-[16px] py-[20px] text-center">No notifications</p>
                        ) : (
                          notifications.slice(0, 30).map((n) => {
                            const accentColor = n.type === "order" ? "#81AB41" : n.type === "view" ? "#f87777" : n.type === "contact_click" ? "#e8a854" : n.type === "coworker_click" ? "#b07ed6" : n.type === "visit" ? "#5596ea" : "#5596ea";
                            const entityId = (n.data?.artworkId || n.data?.contactId) as string | undefined;
                            const thumb = (entityId && thumbMap.get(entityId)) || (n.data?.thumbnail || n.data?.avatar) as string | undefined;
                            return (
                              <div
                                key={n.id}
                                className={`relative flex items-center pl-[3px] border-b border-border last:border-0 ${!n.read ? "bg-bg" : ""}`}
                              >
                                <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ backgroundColor: accentColor }} />
                                <div className="shrink-0 flex items-center justify-center w-[48px] h-[48px]">
                                  {(n.type === "view" || n.type === "contact_click" || n.type === "coworker_click") && thumb ? (
                                    <div className={`w-[48px] h-[48px] bg-[rgba(217,217,217,0.55)] relative overflow-hidden ${n.type === "contact_click" || n.type === "coworker_click" ? "rounded-full" : ""}`}>
                                      <Image src={thumb} alt="" fill className="object-cover" sizes="48px" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                                    </div>
                                  ) : n.type === "order" ? (
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="#c0c0c0">
                                      <path d="M10.464 8.746c.227-.18.497-.311.786-.394v2.795a2.252 2.252 0 0 1-.786-.394c-.394-.313-.546-.681-.546-1.004 0-.322.152-.691.546-1.003ZM12.75 15.662v-2.824c.347.085.664.228.921.421.427.32.579.686.579.991 0 .305-.152.671-.579.991a2.534 2.534 0 0 1-.921.42Z" />
                                      <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 6a.75.75 0 0 0-1.5 0v.816a3.836 3.836 0 0 0-1.72.756c-.712.566-1.112 1.35-1.112 2.178 0 .829.4 1.612 1.113 2.178.502.4 1.102.647 1.719.756v2.978a2.536 2.536 0 0 1-.921-.421l-.879-.66a.75.75 0 0 0-.9 1.2l.879.66c.533.4 1.169.645 1.821.75V18a.75.75 0 0 0 1.5 0v-.81a4.124 4.124 0 0 0 1.821-.749c.745-.559 1.179-1.344 1.179-2.191 0-.847-.434-1.632-1.179-2.191a4.122 4.122 0 0 0-1.821-.75V8.354c.29.082.559.213.786.393l.415.33a.75.75 0 0 0 .933-1.175l-.415-.33a3.836 3.836 0 0 0-1.719-.755V6Z" clipRule="evenodd" />
                                    </svg>
                                  ) : (
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="#c0c0c0">
                                      <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                </div>
                                <div className="w-px h-[48px] bg-[#e0e0e0] shrink-0" />
                                <div className="min-w-0 flex-1 px-[10px]">
                                  <p className="text-[12px] font-medium text-text-muted truncate">
                                    {n.type === "visit" ? (
                                      <>New visitors{(n.data?.count as number) > 1 && <span style={{ color: accentColor }}> ({n.data?.count as number})</span>}</>
                                    ) : n.type === "order" ? (
                                      "New order"
                                    ) : n.type === "view" ? (
                                      <>New view{(n.data?.count as number) > 1 && <span style={{ color: accentColor }}> ({n.data?.count as number})</span>} — {n.message}</>
                                    ) : n.type === "contact_click" ? (
                                      <>Client click{(n.data?.count as number) > 1 && <span style={{ color: accentColor }}> ({n.data?.count as number})</span>} — {n.message}</>
                                    ) : n.type === "coworker_click" ? (
                                      <>Coworker click{(n.data?.count as number) > 1 && <span style={{ color: accentColor }}> ({n.data?.count as number})</span>} — {n.message}</>
                                    ) : n.type === "daily_summary" ? (
                                      <SummaryMsg message={n.message} />
                                    ) : (
                                      <>{n.message}{(n.data?.count as number) > 1 && <span style={{ color: accentColor }}> ({n.data?.count as number})</span>}</>
                                    )}
                                  </p>
                                  <p className="text-[11px] text-text-light mt-[1px]">
                                    {new Date(n.createdAt).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <Link
                href="/cabinet"
                className={`text-[14px] tracking-wide transition-colors ${
                  pathname === "/cabinet"
                    ? "text-text-muted"
                    : "text-text-light hover:text-text-muted"
                }`}
              >
                {tAdmin("cabinet")}
              </Link>
              <button
                onClick={logout}
                className="text-[14px] tracking-wide text-text-light hover:text-text-muted transition-colors"
              >
                {tAdmin("logout")}
              </button>
            </>
          )}
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden ml-auto flex flex-col gap-1.5 p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <span className={`w-5 h-0.5 bg-text-muted transition-transform ${mobileMenuOpen ? "rotate-45 translate-y-2" : ""}`} />
          <span className={`w-5 h-0.5 bg-text-muted transition-opacity ${mobileMenuOpen ? "opacity-0" : ""}`} />
          <span className={`w-5 h-0.5 bg-text-muted transition-transform ${mobileMenuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.nav
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden bg-bg border-t border-border px-6 py-4 flex flex-col gap-4"
          >
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`text-sm tracking-[0.15em] uppercase ${
                    isActive ? "text-text-muted font-semibold" : "text-text-light"
                  }`}
                >
                  {t(item.key)}
                </Link>
              );
            })}
            <div className="flex items-center gap-2">
              <ThemeSwitcher />
              <LanguageSwitcher />
            </div>
          </motion.nav>
        )}
      </AnimatePresence>

      {/* Toast notifications — bottom right */}
      <div className="fixed bottom-[24px] right-[24px] z-50 flex flex-col gap-[8px] pointer-events-auto">
        <AnimatePresence>
          {toasts.map((n) => {
            const accentColor = n.type === "order" ? "#81AB41" : n.type === "view" ? "#f87777" : n.type === "contact_click" ? "#e8a854" : n.type === "coworker_click" ? "#b07ed6" : n.type === "visit" ? "#5596ea" : "#5596ea";
            const toastEntityId = (n.data?.artworkId || n.data?.contactId) as string | undefined;
            const thumbnail = (toastEntityId && thumbMap.get(toastEntityId)) || (n.data?.thumbnail || n.data?.avatar) as string | undefined;
            return (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 40 }}
                transition={{ duration: 0.25 }}
                className="relative bg-white shadow-[0_4px_24px_rgba(0,0,0,0.12)] w-[400px] h-[64px] flex items-center cursor-pointer overflow-hidden"
                onClick={() => setToasts((prev) => prev.filter((t) => t.id !== n.id))}
              >
                {/* Accent bar */}
                <div className="absolute left-0 top-0 bottom-0 w-[4px]" style={{ backgroundColor: accentColor }} />
                {/* Icon / Thumbnail — vertical padding = (64 - 38) / 2 = 13px, use same for horizontal */}
                <div className="shrink-0 flex items-center justify-center" style={{ padding: "0 13px 0 17px" }}>
                  {(n.type === "view" || n.type === "contact_click" || n.type === "coworker_click") && thumbnail ? (
                    <div className={`w-[38px] h-[38px] relative overflow-hidden ${n.type === "contact_click" || n.type === "coworker_click" ? "rounded-full" : ""} bg-[rgba(217,217,217,0.55)]`}>
                      <Image src={thumbnail} alt="" fill className="object-cover" sizes="38px" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                    </div>
                  ) : n.type === "order" ? (
                    <svg width="38" height="38" viewBox="0 0 24 24" fill="#c0c0c0">
                      <path d="M10.464 8.746c.227-.18.497-.311.786-.394v2.795a2.252 2.252 0 0 1-.786-.394c-.394-.313-.546-.681-.546-1.004 0-.322.152-.691.546-1.003ZM12.75 15.662v-2.824c.347.085.664.228.921.421.427.32.579.686.579.991 0 .305-.152.671-.579.991a2.534 2.534 0 0 1-.921.42Z" />
                      <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 6a.75.75 0 0 0-1.5 0v.816a3.836 3.836 0 0 0-1.72.756c-.712.566-1.112 1.35-1.112 2.178 0 .829.4 1.612 1.113 2.178.502.4 1.102.647 1.719.756v2.978a2.536 2.536 0 0 1-.921-.421l-.879-.66a.75.75 0 0 0-.9 1.2l.879.66c.533.4 1.169.645 1.821.75V18a.75.75 0 0 0 1.5 0v-.81a4.124 4.124 0 0 0 1.821-.749c.745-.559 1.179-1.344 1.179-2.191 0-.847-.434-1.632-1.179-2.191a4.122 4.122 0 0 0-1.821-.75V8.354c.29.082.559.213.786.393l.415.33a.75.75 0 0 0 .933-1.175l-.415-.33a3.836 3.836 0 0 0-1.719-.755V6Z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg width="38" height="38" viewBox="0 0 24 24" fill="#c0c0c0">
                      <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                {/* Separator */}
                <div className="w-px h-[38px] bg-[#e0e0e0] mr-[13px] shrink-0" />
                {/* Text */}
                <div className="flex flex-col justify-center min-w-0 pr-[16px]">
                  <p className="text-[11px] font-bold tracking-[2.8px] uppercase text-[#404040] truncate leading-[16px]">
                    {n.type === "visit" ? "NEW VISITOR" : n.type === "order" ? "NEW ORDER" : n.type === "view" ? "NEW VIEW" : n.type === "contact_click" ? "CLIENT CLICK" : n.type === "coworker_click" ? "COWORKER CLICK" : "SUMMARY"}
                    {n.type !== "order" && (n.data?.count as number) > 1 && (
                      <span style={{ color: accentColor }}> ({n.data?.count as number})</span>
                    )}
                  </p>
                  <p className="text-[11px] font-medium tracking-[2.8px] text-[#787878] truncate leading-[16px] mt-[2px]">
                    {n.type === "visit" ? "Someone visited the site" : n.type === "order" ? "Someone left an order" : n.type === "daily_summary" ? <SummaryMsg message={n.message} /> : n.message}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </header>
  );
}
