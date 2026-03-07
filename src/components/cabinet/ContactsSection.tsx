"use client";

import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import type { Contact } from "@/lib/blob";
import type { Artwork } from "@/data/artworks";
import { EyeIcon, ClickIcon, CLICK_ICON_22, EYE_ICON_22, SOCIAL_ICONS, PANEL_CLASS, PANEL_STYLE } from "./shared";
import EntityChart from "./EntityChart";

/* ── ContactRow ──────────────────────────────────────────────────── */

function ContactRow({ contact, onEdit, onDeleted, artworks, onArtworkClick, onCreateArtwork, totalViews, totalClicks }: {
  contact: Contact;
  onEdit: () => void;
  onDeleted: (id: string) => void;
  artworks: Artwork[];
  onArtworkClick: (artwork: Artwork) => void;
  onCreateArtwork: () => void;
  totalViews: number;
  totalClicks: number;
}) {
  const t = useTranslations("admin");
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Delete "${contact.clientName}"?`)) return;
    setDeleting(true);
    try {
      await fetch("/api/contacts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: contact.id }),
      });
      onDeleted(contact.id);
    } catch {
      setDeleting(false);
    }
  };

  const thumbsRef = React.useRef<HTMLDivElement>(null);
  const [slotsPerRow, setSlotsPerRow] = React.useState(4);
  const [itemSize, setItemSize] = React.useState(104);

  React.useEffect(() => {
    const el = thumbsRef.current;
    if (!el) return;
    const gap = 10, pad = 10, minItem = 90;
    const update = () => {
      const available = el.clientWidth - pad * 2;
      const cols = Math.floor((available + gap) / (minItem + gap)) || 1;
      const size = (available - (cols - 1) * gap) / cols;
      setSlotsPerRow(cols);
      setItemSize(Math.floor(size));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const rows = Math.max(1, Math.ceil(artworks.length / slotsPerRow));
  const slotCount = rows * slotsPerRow;

  return (
    <div className="bg-bg-dark">
      {/* Top row — info + actions */}
      <div className="flex items-center gap-[16px] px-[16px] py-[12px] bg-white">
        {/* Avatar */}
        <div className="relative w-[52px] h-[52px] shrink-0 rounded-full overflow-hidden bg-bg-dark flex items-center justify-center">
          {contact.clientAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={contact.clientAvatar} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-[18px] font-bold text-text-light">
              {contact.clientName.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold tracking-[1.5px] text-text-muted uppercase truncate">
            {contact.clientName}
          </p>
          {(contact.clientRole || contact.client) && (
            <p className="text-[12px] font-medium tracking-[1.2px] text-text-light uppercase mt-[2px] truncate">
              {[contact.clientRole, contact.client].filter(Boolean).join(" · ")}
            </p>
          )}
          {contact.clientSocials && contact.clientSocials.length > 0 && (
            <div className="flex gap-[6px] mt-[4px]">
              {contact.clientSocials.map((s, i) => (
                <span key={i} className="text-[12px] font-bold tracking-[1px] text-text-light bg-bg px-[5px] py-[1px]">
                  {SOCIAL_ICONS[s.icon] ?? s.icon.toUpperCase()}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-[12px] shrink-0">
          {/* Artworks count */}
          <div className="flex items-center gap-[5px] text-text-light">
            <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
              <path d="M1 3.5A1.5 1.5 0 0 1 2.5 2h15A1.5 1.5 0 0 1 19 3.5v13a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 1 16.5v-13ZM3 5v10l4-4 3 3 4-5 3 3.5V5H3Z" />
            </svg>
            <span className="text-[13px] font-bold tracking-[0.5px]">{artworks.length}</span>
          </div>

          <span className="w-px h-[20px] bg-bg-dark shrink-0" />

          {/* Views */}
          <div className="flex items-center gap-[5px] text-text-light">
            <EyeIcon />
            <span className="text-[13px] font-bold tracking-[0.5px]">{totalViews}</span>
          </div>

          <span className="w-px h-[20px] bg-bg-dark shrink-0" />

          {/* Clicks */}
          <div className="flex items-center gap-[5px] text-text-light">
            <ClickIcon />
            <span className="text-[13px] font-bold tracking-[0.5px]">{totalClicks}</span>
          </div>
        </div>

        <span className="w-px h-[32px] bg-bg-dark shrink-0" />

        {/* Edit */}
        <button
          onClick={onEdit}
          className="shrink-0 w-[16px] h-[16px] flex items-center justify-center text-text-light hover:text-text-muted transition-colors"
          title="Edit"
        >
          <svg width="16" height="16" viewBox="0 0 20 19.9025" fill="none">
            <path d="M12.4365 3.32148L16.5049 7.38989L6.20657 17.6883L2.14042 13.6198L12.4365 3.32148ZM19.5921 2.34027L17.7777 0.525894C17.0765 -0.175298 15.938 -0.175298 15.2344 0.525894L13.4964 2.26388L17.5648 6.33233L19.5921 4.30507C20.136 3.76118 20.136 2.88411 19.5921 2.34027ZM0.0113215 19.3383C-0.0627191 19.6716 0.238132 19.9701 0.571391 19.8891L5.105 18.7899L1.03885 14.7215L0.0113215 19.3383Z" fill="currentColor" />
          </svg>
        </button>

        {/* Delete */}
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="shrink-0 flex items-center gap-[5px] text-text-light hover:text-[#F87777] transition-colors disabled:opacity-40"
          title="Delete"
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" clipRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 3.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" />
          </svg>
          <span className="text-[12px] font-medium tracking-wide">{t("delete")}</span>
        </button>
      </div>

      {/* Bottom row — artwork thumbnails + placeholders */}
      <div ref={thumbsRef} className="grid gap-[10px] p-[10px] bg-bg-dark overflow-y-auto" style={{ gridTemplateColumns: `repeat(${slotsPerRow}, 1fr)`, maxHeight: 20 + itemSize * 2 + 10 }}>
        {Array.from({ length: slotCount }, (_, i) => {
          const artwork = artworks[i];
          if (artwork) {
            return (
              <button
                key={artwork.id}
                onClick={(e) => { e.stopPropagation(); onArtworkClick(artwork); }}
                className="relative aspect-square overflow-hidden bg-bg-dark hover:brightness-75 transition-all"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={artwork.thumbnail || artwork.image}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </button>
            );
          }
          if (i === artworks.length) {
            return (
              <button
                key="add-artwork"
                onClick={onCreateArtwork}
                className="aspect-square border-2 border-dashed border-text-light flex items-center justify-center text-text-light hover:border-text-muted hover:text-text-muted transition-colors"
              >
                <svg width="24" height="24" viewBox="0 0 16 16" fill="none">
                  <path d="M8 1v14M1 8h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            );
          }
          return (
            <div
              key={`placeholder-${i}`}
              className="aspect-square border border-dashed border-text-light"
            />
          );
        })}
      </div>
    </div>
  );
}

/* ── Contact Views Chart ─────────────────────────────────────────── */

type CVPeriod = "day" | "week" | "month" | "year";
type CVBucket = { label: string; count: number };
type CVContact = { id: string; name: string; totalViews: number; buckets: CVBucket[] };
const CV_PERIODS: CVPeriod[] = ["day", "week", "month", "year"];
const CV_CHART_H = 160;
const CV_LABEL_H = 16;
const CV_Y_LABEL_W = 32;
const CV_COLORS = ["#81AB41", "#E8913A", "#5B8DEF", "#E85B8D", "#8B5CF6", "#14B8A6", "#F59E0B", "#EF4444"];

function ContactViewsChart({ resetKey, onReset }: { resetKey?: number; onReset?: () => void }) {
  const t = useTranslations("admin");
  const [mounted, setMounted] = useState(false);
  const [period, setPeriod] = useState<CVPeriod>("week");
  const [data, setData] = useState<CVContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const chartRef = useRef<HTMLDivElement>(null);
  const [chartW, setChartW] = useState(600);

  useEffect(() => setMounted(true), []);

  useLayoutEffect(() => {
    const el = chartRef.current;
    if (!el) return;
    setChartW(el.clientWidth);
    const ro = new ResizeObserver(() => setChartW(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, [mounted]);

  useEffect(() => {
    if (!selectedId) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("[data-cv-sidebar]") || target.closest("[data-cv-periods]")) return;
      setSelectedId(null);
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [selectedId]);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/stats/views-by-contact?period=${period}`)
      .then((r) => r.json())
      .then((d: { contacts: CVContact[] }) => { setData(d.contacts); setLoading(false); })
      .catch(() => setLoading(false));
  }, [period, resetKey]);

  const selected = selectedId ? data.find((c) => c.id === selectedId) : null;
  const chartData = selected ? [selected] : data.slice(0, 3);
  const total = data.reduce((s, c) => s + c.totalViews, 0);
  const n = chartData.length > 0 ? chartData[0].buckets.length : 0;
  const gap = n > 20 ? 2 : n > 10 ? 3 : 6;
  const barW = n > 0 ? Math.max(1, (chartW - gap * (n - 1)) / n) : 0;
  const labelEvery = n <= 12 ? 1 : n <= 24 ? 2 : 5;

  // Global max across all contacts
  const globalMax = Math.max(
    ...chartData.flatMap((c) => c.buckets.map((b) => b.count)),
    1,
  );

  const peakY = (count: number) =>
    CV_CHART_H - Math.max(count > 0 ? 2 : 0, Math.round((count / globalMax) * CV_CHART_H));

  const makePoints = (buckets: CVBucket[]) =>
    buckets.map((b, i) => `${i * (barW + gap) + barW / 2},${peakY(b.count)}`).join(" ");

  const makeFillPath = (buckets: CVBucket[]) => {
    if (buckets.length < 2) return "";
    const firstCx = barW / 2;
    const lastCx = (buckets.length - 1) * (barW + gap) + barW / 2;
    const pts = buckets.map((b, i) => `${i * (barW + gap) + barW / 2},${peakY(b.count)}`).join(" L ");
    return `M ${firstCx},${CV_CHART_H} L ${pts} L ${lastCx},${CV_CHART_H} Z`;
  };

  const gridLevels = [1 / 3, 2 / 3, 1].map((frac) => ({
    frac,
    svgY: CV_CHART_H - Math.round(frac * CV_CHART_H),
    pxY: (1 - frac) * CV_CHART_H,
    value: Math.round(frac * globalMax),
  }));

  const labels = chartData.length > 0 ? chartData[0].buckets : [];

  const verticalXs = labels
    .map((_, i) => (i % labelEvery === 0 ? i * (barW + gap) + barW / 2 : null))
    .filter((x): x is number => x !== null);
  const vBandEdges = [0, ...verticalXs, chartW];
  const vBands = vBandEdges.slice(0, -1).map((x1, i) => ({ x1, x2: vBandEdges[i + 1], fill: i % 2 === 0 }));

  const handleMouseMove = (e: React.MouseEvent<SVGRectElement>) => {
    const svgEl = e.currentTarget.closest("svg")!;
    const rect = svgEl.getBoundingClientRect();
    const svgX = (e.clientX - rect.left) * (chartW / rect.width);
    const idx = Math.max(0, Math.min(n - 1, Math.round((svgX - barW / 2) / (barW + gap))));
    setHoveredIdx(idx);
  };

  const hoveredCx = hoveredIdx !== null ? hoveredIdx * (barW + gap) + barW / 2 : 0;

  if (!mounted) return null;

  return (
    <div className="border border-border mb-[4px] overflow-hidden">
      <div className="flex max-h-[260px]">
        {/* Chart section */}
        <div className="w-2/3 min-w-0 px-[20px] py-[16px]">
          {/* Total + period switcher */}
          <div className="flex items-center justify-between mb-[16px]">
            <div className="flex items-center gap-[8px]">
              <span className="text-text-muted flex items-center">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" /><path fillRule="evenodd" d="M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113-1.487 4.471-5.705 7.697-10.677 7.697-4.97 0-9.186-3.223-10.675-7.69a1.762 1.762 0 0 1 0-1.113ZM17.25 12a5.25 5.25 0 1 1-10.5 0 5.25 5.25 0 0 1 10.5 0Z" clipRule="evenodd" /></svg>
              </span>
              <span className="text-[26px] font-bold tracking-tight text-text-muted">
                {loading ? "—" : total.toLocaleString()}
              </span>
              <span className="text-[12px] font-bold tracking-[2px] uppercase text-text-light">
                VIEWS BY CLIENTS
              </span>
            </div>
            <div className="flex items-center gap-[12px]" data-cv-periods>
              {CV_PERIODS.map((p, i) => (
                <React.Fragment key={p}>
                  {i > 0 && <span className="w-px h-[1em] bg-text-light/40 self-center" />}
                  <button
                    onClick={() => setPeriod(p)}
                    className={`text-[12px] font-bold tracking-[1.8px] uppercase transition-colors ${
                      period === p ? "text-text-muted" : "text-text-light hover:text-text-muted"
                    }`}
                  >
                    {t(`period.${p}`)}
                  </button>
                </React.Fragment>
              ))}
              {onReset && (
                <>
                  <span className="w-px h-[1em] bg-text-light/40 self-center" />
                  <button onClick={onReset} className="text-text-light hover:text-red-500 transition-colors" title="Reset">
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" clipRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 3.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" /></svg>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Chart */}
          {loading ? (
            <div style={{ height: CV_CHART_H + CV_LABEL_H + 4 }} className="flex items-center justify-center">
              <span className="text-[12px] text-text-light tracking-[2px] uppercase animate-pulse">...</span>
            </div>
          ) : (
            <div className="flex">
              {/* Y-axis labels */}
              <div className="relative shrink-0" style={{ width: CV_Y_LABEL_W, height: CV_CHART_H }}>
                {gridLevels.map(({ frac, pxY, value }) => (
                  <span
                    key={frac}
                    className="absolute right-[6px] text-[12px] font-bold text-text-light leading-none -translate-y-1/2"
                    style={{ top: pxY }}
                  >
                    {value}
                  </span>
                ))}
              </div>

              {/* Chart area */}
              <div className="flex-1 min-w-0 relative" ref={chartRef}>
                <svg
                  viewBox={`0 0 ${chartW} ${CV_CHART_H}`}
                  width="100%"
                  preserveAspectRatio="none"
                  overflow="visible"
                  style={{ display: "block", height: CV_CHART_H }}
                >
                  <defs>
                    {chartData.map((contact, ci) => (
                      <linearGradient
                        key={contact.id}
                        id={`cvFill-${ci}`}
                        x1="0" y1="0" x2="0" y2={CV_CHART_H}
                        gradientUnits="userSpaceOnUse"
                      >
                        <stop offset="0%" stopColor={CV_COLORS[ci % CV_COLORS.length]} stopOpacity="0.15" />
                        <stop offset="100%" stopColor={CV_COLORS[ci % CV_COLORS.length]} stopOpacity="0" />
                      </linearGradient>
                    ))}
                  </defs>

                  {vBands.filter((b) => b.fill).map((b, i) => (
                    <rect key={i} x={b.x1} y={0} width={b.x2 - b.x1} height={CV_CHART_H} fill="var(--color-text-muted)" fillOpacity="0.06" />
                  ))}

                  {gridLevels.map(({ frac, svgY }) => (
                    <line key={frac} x1={0} y1={svgY} x2={chartW} y2={svgY} stroke="var(--color-border)" strokeWidth="1" strokeDasharray="2 3" />
                  ))}

                  {labels.map((_, i) => {
                    if (i % labelEvery !== 0) return null;
                    const cx = i * (barW + gap) + barW / 2;
                    return <line key={i} x1={cx} y1={0} x2={cx} y2={CV_CHART_H} stroke="var(--color-border)" strokeWidth="0.5" />;
                  })}

                  {/* Fill + polyline per contact */}
                  {chartData.map((contact, ci) => {
                    const color = CV_COLORS[ci % CV_COLORS.length];
                    const fillPath = makeFillPath(contact.buckets);
                    const points = makePoints(contact.buckets);
                    return (
                      <React.Fragment key={contact.id}>
                        {fillPath && <path d={fillPath} fill={`url(#cvFill-${ci})`} />}
                        {contact.buckets.length > 1 && (
                          <polyline
                            points={points}
                            fill="none"
                            stroke={color}
                            strokeWidth="2"
                            strokeLinejoin="round"
                            strokeLinecap="round"
                            vectorEffect="non-scaling-stroke"
                          />
                        )}
                      </React.Fragment>
                    );
                  })}

                  {/* Hover vertical line */}
                  {hoveredIdx !== null && (
                    <line x1={hoveredCx} y1={0} x2={hoveredCx} y2={CV_CHART_H} stroke="var(--color-text-light)" strokeWidth="1" />
                  )}

                  <rect
                    x={0} y={0} width={chartW} height={CV_CHART_H}
                    fill="transparent"
                    style={{ cursor: "crosshair" }}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={() => setHoveredIdx(null)}
                  />
                </svg>

                {/* Dots on lines */}
                {hoveredIdx !== null && chartData.map((contact, ci) => {
                  const val = contact.buckets[hoveredIdx]?.count ?? 0;
                  if (val === 0) return null;
                  const cy = peakY(val);
                  return (
                    <div
                      key={contact.id}
                      className="absolute pointer-events-none z-10"
                      style={{
                        left: `${(hoveredCx / chartW) * 100}%`,
                        top: cy,
                        transform: "translate(-50%, -50%)",
                      }}
                    >
                      <div className="w-[8px] h-[8px] rounded-full" style={{ background: CV_COLORS[ci % CV_COLORS.length] }} />
                    </div>
                  );
                })}

                {/* Tooltip */}
                {hoveredIdx !== null && chartData.length > 0 && (
                  <div
                    className="absolute pointer-events-none z-10"
                    style={{
                      left: `${(hoveredCx / chartW) * 100}%`,
                      top: 0,
                      transform: "translateX(-50%)",
                    }}
                  >
                    <div className="bg-white text-[12px] font-bold tracking-[1px] px-[10px] py-[6px] shadow-[0_2px_12px_rgba(0,0,0,0.10)] whitespace-nowrap mt-[4px]">
                      <div className="text-text-light mb-[4px]">{labels[hoveredIdx]?.label}</div>
                      {chartData.map((contact, ci) => {
                        const val = contact.buckets[hoveredIdx]?.count ?? 0;
                        if (val === 0) return null;
                        return (
                          <div key={contact.id} className="flex items-center gap-[6px]">
                            <span className="w-[6px] h-[6px] rounded-full shrink-0" style={{ background: CV_COLORS[ci % CV_COLORS.length] }} />
                            <span className="text-text-muted">{contact.name}</span>
                            <span className="text-text-muted ml-auto pl-[8px]">{val}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* X-axis labels */}
                <div className="relative mt-[4px]" style={{ height: CV_LABEL_H }}>
                  {labels.map((b, i) => {
                    if (i % labelEvery !== 0) return null;
                    const pct = ((i * (barW + gap) + barW / 2) / chartW) * 100;
                    return (
                      <span
                        key={i}
                        className="absolute text-[12px] font-bold tracking-[1.8px] uppercase text-text-light -translate-x-1/2 leading-none"
                        style={{ left: `${pct}%`, top: 0 }}
                      >
                        {b.label}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Top clients sidebar */}
        <div className="w-px bg-border shrink-0" />
        <div className="w-1/3 shrink-0 px-[16px] py-[16px] flex flex-col overflow-hidden" data-cv-sidebar>
          <div className="text-[12px] font-bold tracking-[2px] uppercase text-text-light mb-[12px] shrink-0">
            TOP CLIENTS
          </div>
          <div className="overflow-y-auto min-h-0 flex-1">
            {loading ? (
              <span className="text-[12px] text-text-light animate-pulse">...</span>
            ) : data.length === 0 ? (
              <span className="text-[12px] text-text-light">—</span>
            ) : (
              <div className="flex flex-col">
                {data.map((contact, ci) => {
                  const isSelected = selectedId === contact.id;
                  const color = isSelected ? CV_COLORS[0] : CV_COLORS[ci % CV_COLORS.length];
                  return (
                    <button
                      key={contact.id}
                      onClick={() => setSelectedId(isSelected ? null : contact.id)}
                      className={`flex items-center gap-[6px] text-left transition-opacity py-[6px] ${
                        ci > 0 ? "border-t border-border" : ""
                      } ${selectedId && !isSelected ? "opacity-40" : ""}`}
                    >
                      <span className="text-[12px] font-bold text-text-light tabular-nums w-[16px] text-right shrink-0">{ci + 1}</span>
                      <span className="w-px h-[12px] bg-border shrink-0" />
                      <svg className="shrink-0" width="12" height="12" viewBox="0 0 24 24" fill="var(--color-text-muted)">
                        <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                        <path fillRule="evenodd" d="M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113-1.487 4.471-5.705 7.697-10.677 7.697-4.97 0-9.186-3.223-10.675-7.69a1.762 1.762 0 0 1 0-1.113ZM17.25 12a5.25 5.25 0 1 1-10.5 0 5.25 5.25 0 0 1 10.5 0Z" clipRule="evenodd" />
                      </svg>
                      <span className="text-[12px] font-bold text-text-muted tabular-nums shrink-0">{contact.totalViews}</span>
                      <span className="w-px h-[12px] bg-border shrink-0" />
                      <span
                        className="w-[8px] h-[8px] rounded-full shrink-0"
                        style={{ background: color }}
                      />
                      <span className="text-[12px] font-bold text-text-muted truncate">{contact.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── ContactsSection ─────────────────────────────────────────────── */

type Props = {
  locale: "ru" | "en";
  contacts: Contact[];
  allArtworks: Artwork[];
  viewCounts: Record<string, { total: number; recent: number }>;
  clickCounts: Record<string, { total: number; recent: number }>;
  onEditContact: (contact: Contact) => void;
  onDeletedContact: (id: string) => void;
  onCreateContact: () => void;
  onViewArtwork: (artwork: Artwork) => void;
  onCreateArtworkForContact: (contactId: string) => void;
};

export default function ContactsSection({
  locale,
  contacts,
  allArtworks,
  viewCounts,
  clickCounts,
  onEditContact,
  onDeletedContact,
  onCreateContact,
  onViewArtwork,
  onCreateArtworkForContact,
}: Props) {
  const t = useTranslations("admin");
  const [resetKey, setResetKey] = useState(0);

  const handleReset = useCallback(async (target: string) => {
    if (!confirm(`Reset ${target} data?`)) return;
    await fetch("/api/stats/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target }),
    });
    setResetKey((k) => k + 1);
  }, []);

  return (
    <motion.div
      key="contacts-panel"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={PANEL_CLASS}
      style={PANEL_STYLE}
    >
      <div className="flex flex-col gap-[4px]">
        <div className="grid grid-cols-2 gap-[4px]">
          <ContactViewsChart resetKey={resetKey} onReset={() => handleReset("views")} />
          <EntityChart chartId="cc-contacts" apiUrl="/api/stats/clicks-by-entity?type=contacts" title="CLICKS BY CLIENTS" sidebarTitle="TOP CLIENTS" resetKey={resetKey} onReset={() => handleReset("contact-clicks")} icon={<svg width="22" height="22" viewBox="0 0 20 20" fill="currentColor"><path d="M6.111 11.8891C3.96311 9.7412 3.96311 6.2588 6.111 4.11091C8.25888 1.96303 11.7413 1.96303 13.8892 4.11091C14.9633 5.185 15.5001 6.59127 15.5001 8C15.5001 8.41421 15.8359 8.75 16.2501 8.75C16.6643 8.75 17.0001 8.41421 17.0001 8C17.0001 6.2097 16.3165 4.41694 14.9498 3.05025C12.2162 0.316582 7.78401 0.316582 5.05034 3.05025C2.31667 5.78392 2.31667 10.2161 5.05034 12.9497C5.34323 13.2426 5.8181 13.2426 6.111 12.9497C6.40389 12.6569 6.40389 12.182 6.111 11.8891Z" /><path d="M8.23235 6.23223C7.25604 7.20854 7.25604 8.79146 8.23235 9.76777C8.52525 10.0607 8.52525 10.5355 8.23235 10.8284C7.93946 11.1213 7.46459 11.1213 7.17169 10.8284C5.60959 9.26633 5.60959 6.73367 7.17169 5.17157C8.73379 3.60948 11.2664 3.60948 12.8285 5.17157C13.6094 5.95247 14.0001 6.97747 14.0001 8C14.0001 8.41421 13.6643 8.75 13.2501 8.75C12.8359 8.75 12.5001 8.41421 12.5001 8C12.5001 7.35903 12.2562 6.72054 11.7679 6.23223C10.7916 5.25592 9.20866 5.25592 8.23235 6.23223Z" /><path d="M10.7657 7.51062C10.5871 7.24492 10.2596 7.12184 9.95029 7.20417C9.64095 7.2865 9.41795 7.5561 9.3951 7.8754L8.90409 14.7363C8.88303 15.0306 9.0365 15.3099 9.29622 15.4499C9.55595 15.59 9.87365 15.5647 10.108 15.3854L11.1508 14.5873L12.1363 18.2653C12.2436 18.6654 12.6548 18.9028 13.0549 18.7956C13.455 18.6884 13.6924 18.2771 13.5852 17.877L12.6083 14.2312L13.9005 14.4349C14.1951 14.4814 14.4893 14.3489 14.6497 14.0974C14.8101 13.846 14.8062 13.5233 14.6398 13.2758L10.7657 7.51062Z" /></svg>} sidebarIcon={<ClickIcon />} />
        </div>

        {/* Add button — spans full width */}
        <button
          onClick={onCreateContact}
          className="w-full flex items-center justify-center gap-[8px] border-2 border-dashed border-border px-[16px] py-[14px] text-text-light hover:text-text-muted hover:border-text-light hover:bg-text-light/5 transition-all duration-200"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 1v14M1 8h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span className="text-[12px] font-bold tracking-[1.8px] uppercase">{t("addContact")}</span>
        </button>

        <div style={{ height: 5 }} />

        {contacts.length === 0 && (
          <p className="text-center text-[12px] text-text-light py-[32px] tracking-[1.5px] uppercase">—</p>
        )}

        {contacts.map((contact, i) => {
          if (i % 2 !== 0) return null;
          const getArtworks = (c: Contact) =>
            allArtworks.filter((a) => a.contactId === c.id);
          const getViews = (c: Contact) =>
            getArtworks(c).reduce((sum, a) => sum + (viewCounts[a.id]?.total ?? 0), 0);
          return (
            <div key={contact.id} className="grid grid-cols-2 gap-[4px]">
              <ContactRow
                contact={contact}
                onEdit={() => onEditContact(contact)}
                onDeleted={onDeletedContact}
                artworks={getArtworks(contact)}
                onArtworkClick={onViewArtwork}
                onCreateArtwork={() => onCreateArtworkForContact(contact.id)}
                totalViews={getViews(contact)}
                totalClicks={clickCounts[contact.id]?.total ?? 0}
              />
              {contacts[i + 1] && (
                <ContactRow
                  contact={contacts[i + 1]}
                  onEdit={() => onEditContact(contacts[i + 1])}
                  onDeleted={onDeletedContact}
                  artworks={getArtworks(contacts[i + 1])}
                  onArtworkClick={onViewArtwork}
                  onCreateArtwork={() => onCreateArtworkForContact(contacts[i + 1].id)}
                  totalViews={getViews(contacts[i + 1])}
                  totalClicks={clickCounts[contacts[i + 1].id]?.total ?? 0}
                />
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
