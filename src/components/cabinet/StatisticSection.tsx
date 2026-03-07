"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { SingleChart } from "@/components/admin/VisitsChart";
import WorldMap from "./WorldMap";
import EntityChart from "./EntityChart";
import { ClickIcon, PANEL_CLASS, PANEL_STYLE } from "./shared";

export default function StatisticSection() {
  const t = useTranslations("admin");
  const [summary, setSummary] = useState<{ todayVisitors: number; todayArtworkViews: number; allTimeArtworkViews: number; orderClicks: number } | null>(null);
  const [referrers, setReferrers] = useState<{ host: string; count: number }[]>([]);
  const [onlinePages, setOnlinePages] = useState<{ page: string; count: number }[]>([]);
  const [resetKey, setResetKey] = useState(0);

  const handleReset = useCallback(async (target: string) => {
    if (!confirm(`Reset ${target} data?`)) return;
    await fetch("/api/stats/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target }),
    });
    setResetKey((k) => k + 1);
    // Refresh summary
    fetch("/api/stats/summary").then((r) => r.json()).then(setSummary).catch(() => {});
    if (target === "referrers") {
      fetch("/api/stats/referrers").then((r) => r.json()).then((data) => { if (Array.isArray(data)) setReferrers(data); }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    fetch("/api/stats/summary")
      .then((r) => r.json())
      .then(setSummary)
      .catch(() => {});
    fetch("/api/stats/referrers")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setReferrers(data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const fetchOnline = () => {
      fetch("/api/stats/online-pages")
        .then((r) => r.json())
        .then((data) => { if (Array.isArray(data)) setOnlinePages(data); })
        .catch(() => {});
    };
    fetchOnline();
    const interval = setInterval(fetchOnline, 15_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      key="stat-panel"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={PANEL_CLASS}
      style={PANEL_STYLE}
    >
      {/* World map with geo cards */}
      <WorldMap className="mb-12" />

      {/* Summary cards */}
      <div className="flex gap-[12px] mb-[20px]">
        {[
          { label: "TODAY'S VISITORS", value: summary?.todayVisitors },
          { label: "TODAY'S VIEWS", value: summary?.todayArtworkViews },
          { label: "ALL-TIME VIEWS", value: summary?.allTimeArtworkViews },
          { label: "ORDER CLICKS", value: summary?.orderClicks, resetTarget: "order-clicks" },
        ].map(({ label, value, resetTarget }, i) => (
          <div key={i} className="flex-1 bg-white px-[16px] py-[12px]">
            <div className="flex items-center justify-between mb-[4px]">
              <span className="text-[12px] font-bold tracking-[1.8px] uppercase text-text-light">
                {label}
              </span>
              {resetTarget && (
                <button onClick={() => handleReset(resetTarget)} className="text-text-light hover:text-red-500 transition-colors" title={`Reset ${label.toLowerCase()}`}>
                  <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" clipRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 3.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" /></svg>
                </button>
              )}
            </div>
            <div className="flex items-baseline gap-[8px]">
              <span className="text-[22px] font-bold tracking-tight text-text-muted">
                {value !== undefined ? value.toLocaleString() : "—"}
              </span>
              {i === 3 && (
                <span className="text-[22px] font-bold tracking-tight" style={{ color: "#81AB41" }}>
                  (~000$)
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Visits + Social clicks side by side */}
      <div className="flex border border-border mb-12">
        <div className="w-1/2 min-w-0 px-[20px] py-[16px]">
          <SingleChart key={`visits-${resetKey}`} apiUrl="/api/stats/visits" title={t("visits")} onReset={() => handleReset("visits")} icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" /></svg>} />
        </div>
        <div className="w-px bg-border shrink-0" />
        <div className="w-1/2 min-w-0 [&>div]:border-0 [&>div]:mb-0">
          <EntityChart
            chartId="social-clicks"
            apiUrl="/api/stats/clicks-by-social"
            title="SOCIAL CLICKS"
            sidebarTitle="TOP SOCIALS"
            sidebarWidth="calc(25% - 4.5px)"
            stretch
            resetKey={resetKey}
            onReset={() => handleReset("social-clicks")}
            icon={<svg width="22" height="22" viewBox="0 0 20 20" fill="currentColor"><path d="M6.111 11.8891C3.96311 9.7412 3.96311 6.2588 6.111 4.11091C8.25888 1.96303 11.7413 1.96303 13.8892 4.11091C14.9633 5.185 15.5001 6.59127 15.5001 8C15.5001 8.41421 15.8359 8.75 16.2501 8.75C16.6643 8.75 17.0001 8.41421 17.0001 8C17.0001 6.2097 16.3165 4.41694 14.9498 3.05025C12.2162 0.316582 7.78401 0.316582 5.05034 3.05025C2.31667 5.78392 2.31667 10.2161 5.05034 12.9497C5.34323 13.2426 5.8181 13.2426 6.111 12.9497C6.40389 12.6569 6.40389 12.182 6.111 11.8891Z" /><path d="M8.23235 6.23223C7.25604 7.20854 7.25604 8.79146 8.23235 9.76777C8.52525 10.0607 8.52525 10.5355 8.23235 10.8284C7.93946 11.1213 7.46459 11.1213 7.17169 10.8284C5.60959 9.26633 5.60959 6.73367 7.17169 5.17157C8.73379 3.60948 11.2664 3.60948 12.8285 5.17157C13.6094 5.95247 14.0001 6.97747 14.0001 8C14.0001 8.41421 13.6643 8.75 13.2501 8.75C12.8359 8.75 12.5001 8.41421 12.5001 8C12.5001 7.35903 12.2562 6.72054 11.7679 6.23223C10.7916 5.25592 9.20866 5.25592 8.23235 6.23223Z" /><path d="M10.7657 7.51062C10.5871 7.24492 10.2596 7.12184 9.95029 7.20417C9.64095 7.2865 9.41795 7.5561 9.3951 7.8754L8.90409 14.7363C8.88303 15.0306 9.0365 15.3099 9.29622 15.4499C9.55595 15.59 9.87365 15.5647 10.108 15.3854L11.1508 14.5873L12.1363 18.2653C12.2436 18.6654 12.6548 18.9028 13.0549 18.7956C13.455 18.6884 13.6924 18.2771 13.5852 17.877L12.6083 14.2312L13.9005 14.4349C14.1951 14.4814 14.4893 14.3489 14.6497 14.0974C14.8101 13.846 14.8062 13.5233 14.6398 13.2758L10.7657 7.51062Z" /></svg>}
            sidebarIcon={<ClickIcon />}
          />
        </div>
      </div>

      {/* Referrer sites + Online by page */}
      <div className="flex gap-[12px]">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-[8px] mb-3">
            <p className="text-[12px] font-bold tracking-[2.8px] uppercase text-text-secondary">
              Referrer sites
            </p>
            <button onClick={() => handleReset("referrers")} className="text-text-light hover:text-red-500 transition-colors" title="Reset referrers">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" clipRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 3.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" /></svg>
            </button>
          </div>
          <div className="border border-border overflow-y-auto" style={{ height: `${6 * 33}px` }}>
            {referrers.length === 0 ? (
              <div className="py-[6px] px-4">
                <span className="text-[12px] text-text-light">—</span>
              </div>
            ) : (() => {
              const rows: { host: string; count: number }[][] = [];
              for (let i = 0; i < referrers.length; i += 3) {
                rows.push(referrers.slice(i, i + 3));
              }
              return rows.map((row, ri) => (
                <div key={ri} className={`grid shrink-0 ${ri > 0 ? "border-t border-border" : ""} ${ri % 2 === 1 ? "bg-text-muted/[0.06]" : ""} hover:bg-text-muted/[0.10] transition-colors`} style={{ gridTemplateColumns: "1fr auto 1fr auto 1fr" }}>
                  {row.map((r, ci) => {
                    const idx = ri * 3 + ci;
                    return (
                      <React.Fragment key={r.host}>
                        {ci > 0 && <div className="w-px bg-border" />}
                        <div className="flex items-center justify-between py-[6px] px-4">
                          <div className="flex items-center gap-[6px] truncate mr-4">
                            <span className="text-[12px] font-bold text-text-light tabular-nums w-[16px] text-right shrink-0">{idx + 1}</span>
                            <span className="w-px h-[12px] bg-border shrink-0" />
                            <span className="text-[13px] text-text-muted truncate">{r.host}</span>
                          </div>
                          <span className="text-[13px] font-bold text-text-muted shrink-0">{r.count}</span>
                        </div>
                      </React.Fragment>
                    );
                  })}
                  {row.length < 3 && Array.from({ length: 3 - row.length }).map((_, ci) => (
                    <React.Fragment key={`empty-${ci}`}>
                      <div className="w-px bg-border" />
                      <div className="py-[6px] px-4">&nbsp;</div>
                    </React.Fragment>
                  ))}
                </div>
              ));
            })()}
          </div>
        </div>
        <div className="shrink-0" style={{ width: "calc(25% - 9px)" }}>
          <p className="text-[12px] font-bold tracking-[2.8px] uppercase text-text-secondary mb-3">
            Online by page
          </p>
          <div className="border border-border overflow-y-auto">
            {[
              { path: "/", label: "Home" },
              { path: "/about", label: "About" },
              { path: "/portfolio", label: "Portfolio" },
              { path: "/equipment", label: "Equipment" },
              { path: "/order", label: "Order" },
              { path: "/cabinet", label: "Cabinet" },
            ].map((page, i) => {
              const online = onlinePages.find((p) => p.page === page.path || p.page.endsWith(page.path));
              const count = online?.count ?? 0;
              return (
                <div key={page.path} className={`flex items-center justify-between py-[6px] px-4 ${i > 0 ? "border-t border-border" : ""} ${i % 2 === 1 ? "bg-text-muted/[0.06]" : ""} hover:bg-text-muted/[0.10] transition-colors`}>
                  <span className={`text-[13px] font-bold ${count > 0 ? "text-text-muted" : "text-text-light"}`}>{page.label}</span>
                  <div className="flex items-center gap-[6px] shrink-0">
                    {count > 0 && (
                      <>
                        <span className="text-[13px] font-bold text-text-muted">{count}</span>
                        <span className="relative flex h-[8px] w-[8px]">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                          <span className="relative inline-flex rounded-full h-[8px] w-[8px] bg-red-500" />
                        </span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
