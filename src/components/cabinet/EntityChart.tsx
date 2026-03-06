"use client";

import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
import { useTranslations } from "next-intl";

type CVPeriod = "day" | "week" | "month" | "year";
type CVBucket = { label: string; count: number };
type ECEntity = { id: string; name: string; total: number; buckets: CVBucket[] };
const CV_PERIODS: CVPeriod[] = ["day", "week", "month", "year"];
const CV_CHART_H = 160;
const CV_LABEL_H = 16;
const CV_Y_LABEL_W = 32;
const CV_COLORS = ["#81AB41", "#E8913A", "#5B8DEF", "#E85B8D", "#8B5CF6", "#14B8A6", "#F59E0B", "#EF4444"];

export { CV_COLORS, CV_CHART_H, CV_LABEL_H, CV_Y_LABEL_W, CV_PERIODS };
export type { CVPeriod, CVBucket };

export default function EntityChart({ chartId, apiUrl, title, sidebarTitle, icon, sidebarIcon, sidebarWidth, stretch }: {
  chartId: string;
  apiUrl: string;
  title: string;
  sidebarTitle: string;
  icon: React.ReactNode;
  sidebarIcon?: React.ReactNode;
  sidebarWidth?: string;
  stretch?: boolean;
}) {
  const t = useTranslations("admin");
  const [mounted, setMounted] = useState(false);
  const [period, setPeriod] = useState<CVPeriod>("week");
  const [data, setData] = useState<ECEntity[]>([]);
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
      if (target.closest(`[data-ec-sidebar-${chartId}]`) || target.closest(`[data-ec-periods-${chartId}]`)) return;
      setSelectedId(null);
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [selectedId, chartId]);

  useEffect(() => {
    setLoading(true);
    const sep = apiUrl.includes("?") ? "&" : "?";
    fetch(`${apiUrl}${sep}period=${period}`)
      .then((r) => r.json())
      .then((d: { entities: ECEntity[] }) => { setData(d.entities); setLoading(false); })
      .catch(() => setLoading(false));
  }, [period, apiUrl]);

  const selected = selectedId ? data.find((c) => c.id === selectedId) : null;
  const chartData = selected ? [selected] : data.slice(0, 3);
  const total = data.reduce((s, c) => s + c.total, 0);
  const n = chartData.length > 0 ? chartData[0].buckets.length : 0;
  const gap = n > 20 ? 2 : n > 10 ? 3 : 6;
  const barW = n > 0 ? Math.max(1, (chartW - gap * (n - 1)) / n) : 0;
  const labelEvery = n <= 12 ? 1 : n <= 24 ? 2 : 5;
  const globalMax = Math.max(...chartData.flatMap((c) => c.buckets.map((b) => b.count)), 1);
  const peakY = (count: number) => CV_CHART_H - Math.max(count > 0 ? 2 : 0, Math.round((count / globalMax) * CV_CHART_H));
  const makePoints = (buckets: CVBucket[]) => buckets.map((b, i) => `${i * (barW + gap) + barW / 2},${peakY(b.count)}`).join(" ");
  const makeFillPath = (buckets: CVBucket[]) => {
    if (buckets.length < 2) return "";
    const firstCx = barW / 2;
    const lastCx = (buckets.length - 1) * (barW + gap) + barW / 2;
    const pts = buckets.map((b, i) => `${i * (barW + gap) + barW / 2},${peakY(b.count)}`).join(" L ");
    return `M ${firstCx},${CV_CHART_H} L ${pts} L ${lastCx},${CV_CHART_H} Z`;
  };
  const gridLevels = [1 / 3, 2 / 3, 1].map((frac) => ({ frac, svgY: CV_CHART_H - Math.round(frac * CV_CHART_H), pxY: (1 - frac) * CV_CHART_H, value: Math.round(frac * globalMax) }));
  const labels = chartData.length > 0 ? chartData[0].buckets : [];
  const verticalXs = labels.map((_, i) => (i % labelEvery === 0 ? i * (barW + gap) + barW / 2 : null)).filter((x): x is number => x !== null);
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
    <div className={`border border-border mb-[4px] overflow-hidden ${stretch ? "h-full" : ""}`}>
      <div className={`flex ${stretch ? "h-full" : "max-h-[260px]"}`}>
        <div className={`${sidebarWidth ? "" : "w-2/3"} min-w-0 px-[20px] py-[16px]`} style={sidebarWidth ? { width: `calc(100% - ${sidebarWidth})` } : undefined}>
          <div className="flex items-center justify-between mb-[16px]">
            <div className="flex items-center gap-[8px]">
              <span className="text-text-muted flex items-center">{icon}</span>
              <span className="text-[26px] font-bold tracking-tight text-text-muted">{loading ? "—" : total.toLocaleString()}</span>
              <span className="text-[12px] font-bold tracking-[2px] uppercase text-text-light">{title}</span>
            </div>
            <div className="flex items-center gap-[12px]" {...{ [`data-ec-periods-${chartId}`]: true }}>
              {CV_PERIODS.map((p, i) => (
                <React.Fragment key={p}>
                  {i > 0 && <span className="w-px h-[1em] bg-text-light/40 self-center" />}
                  <button onClick={() => setPeriod(p)} className={`text-[12px] font-bold tracking-[1.8px] uppercase transition-colors ${period === p ? "text-text-muted" : "text-text-light hover:text-text-muted"}`}>{t(`period.${p}`)}</button>
                </React.Fragment>
              ))}
            </div>
          </div>
          {loading ? (
            <div style={{ height: CV_CHART_H + CV_LABEL_H + 4 }} className="flex items-center justify-center">
              <span className="text-[12px] text-text-light tracking-[2px] uppercase animate-pulse">...</span>
            </div>
          ) : (
            <div className="flex">
              <div className="relative shrink-0" style={{ width: CV_Y_LABEL_W, height: CV_CHART_H }}>
                {gridLevels.map(({ frac, pxY, value }) => (
                  <span key={frac} className="absolute right-[6px] text-[12px] font-bold text-text-light leading-none -translate-y-1/2" style={{ top: pxY }}>{value}</span>
                ))}
              </div>
              <div className="flex-1 min-w-0 relative" ref={chartRef}>
                <svg viewBox={`0 0 ${chartW} ${CV_CHART_H}`} width="100%" preserveAspectRatio="none" overflow="visible" style={{ display: "block", height: CV_CHART_H }}>
                  <defs>
                    {chartData.map((entity, ci) => (
                      <linearGradient key={entity.id} id={`ecFill-${chartId}-${ci}`} x1="0" y1="0" x2="0" y2={CV_CHART_H} gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor={CV_COLORS[ci % CV_COLORS.length]} stopOpacity="0.15" />
                        <stop offset="100%" stopColor={CV_COLORS[ci % CV_COLORS.length]} stopOpacity="0" />
                      </linearGradient>
                    ))}
                  </defs>
                  {vBands.filter((b) => b.fill).map((b, i) => (<rect key={i} x={b.x1} y={0} width={b.x2 - b.x1} height={CV_CHART_H} fill="var(--color-text-muted)" fillOpacity="0.06" />))}
                  {gridLevels.map(({ frac, svgY }) => (<line key={frac} x1={0} y1={svgY} x2={chartW} y2={svgY} stroke="var(--color-border)" strokeWidth="1" strokeDasharray="2 3" />))}
                  {labels.map((_, i) => { if (i % labelEvery !== 0) return null; const cx = i * (barW + gap) + barW / 2; return <line key={i} x1={cx} y1={0} x2={cx} y2={CV_CHART_H} stroke="var(--color-border)" strokeWidth="0.5" />; })}
                  {chartData.map((entity, ci) => { const color = CV_COLORS[ci % CV_COLORS.length]; const fillPath = makeFillPath(entity.buckets); const points = makePoints(entity.buckets); return (<React.Fragment key={entity.id}>{fillPath && <path d={fillPath} fill={`url(#ecFill-${chartId}-${ci})`} />}{entity.buckets.length > 1 && (<polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />)}</React.Fragment>); })}
                  {hoveredIdx !== null && (<line x1={hoveredCx} y1={0} x2={hoveredCx} y2={CV_CHART_H} stroke="var(--color-text-light)" strokeWidth="1" />)}
                  <rect x={0} y={0} width={chartW} height={CV_CHART_H} fill="transparent" style={{ cursor: "crosshair" }} onMouseMove={handleMouseMove} onMouseLeave={() => setHoveredIdx(null)} />
                </svg>
                {hoveredIdx !== null && chartData.map((entity, ci) => { const val = entity.buckets[hoveredIdx]?.count ?? 0; if (val === 0) return null; const cy = peakY(val); return (<div key={entity.id} className="absolute pointer-events-none z-10" style={{ left: `${(hoveredCx / chartW) * 100}%`, top: cy, transform: "translate(-50%, -50%)" }}><div className="w-[8px] h-[8px] rounded-full" style={{ background: CV_COLORS[ci % CV_COLORS.length] }} /></div>); })}
                {hoveredIdx !== null && chartData.length > 0 && (
                  <div className="absolute pointer-events-none z-10" style={{ left: `${(hoveredCx / chartW) * 100}%`, top: 0, transform: "translateX(-50%)" }}>
                    <div className="bg-white text-[12px] font-bold tracking-[1px] px-[10px] py-[6px] shadow-[0_2px_12px_rgba(0,0,0,0.10)] whitespace-nowrap mt-[4px]">
                      <div className="text-text-light mb-[4px]">{labels[hoveredIdx]?.label}</div>
                      {chartData.map((entity, ci) => { const val = entity.buckets[hoveredIdx]?.count ?? 0; if (val === 0) return null; return (<div key={entity.id} className="flex items-center gap-[6px]"><span className="w-[6px] h-[6px] rounded-full shrink-0" style={{ background: CV_COLORS[ci % CV_COLORS.length] }} /><span className="text-text-muted">{entity.name}</span><span className="text-text-muted ml-auto pl-[8px]">{val}</span></div>); })}
                    </div>
                  </div>
                )}
                <div className="relative mt-[4px]" style={{ height: CV_LABEL_H }}>
                  {labels.map((b, i) => { if (i % labelEvery !== 0) return null; const pct = ((i * (barW + gap) + barW / 2) / chartW) * 100; return (<span key={i} className="absolute text-[12px] font-bold tracking-[1.8px] uppercase text-text-light -translate-x-1/2 leading-none" style={{ left: `${pct}%`, top: 0 }}>{b.label}</span>); })}
                </div>
              </div>
            </div>
          )}
        </div>
        <div className={`${sidebarWidth ? "" : "w-1/3"} shrink-0 py-[16px] flex flex-col overflow-hidden border-l border-border`} style={sidebarWidth ? { width: sidebarWidth } : undefined} {...{ [`data-ec-sidebar-${chartId}`]: true }}>
          <div className="text-[12px] font-bold tracking-[2px] uppercase text-text-light mb-[16px] shrink-0 px-[16px]" style={{ height: 32, lineHeight: "36px" }}>{sidebarTitle}</div>
          <div className="overflow-y-auto min-h-0 flex-1">
            {loading ? (<span className="text-[12px] text-text-light animate-pulse px-[16px]">...</span>) : data.length === 0 ? (<span className="text-[12px] text-text-light px-[16px]">—</span>) : (
              <div className="flex flex-col">
                {data.map((entity, ci) => { const isSelected = selectedId === entity.id; const color = isSelected ? CV_COLORS[0] : CV_COLORS[ci % CV_COLORS.length]; return (
                  <button key={entity.id} onClick={() => setSelectedId(isSelected ? null : entity.id)} className={`flex items-center gap-[6px] text-left transition-all py-[6px] px-[16px] ${ci > 0 ? "border-t border-border" : ""} ${selectedId && !isSelected ? "opacity-40" : ""} hover:bg-text-muted/[0.06]`}>
                    <span className="text-[12px] font-bold text-text-light tabular-nums w-[16px] text-right shrink-0">{ci + 1}</span>
                    <span className="w-px h-[12px] bg-border shrink-0" />
                    <span className="shrink-0 text-text-muted">{sidebarIcon ?? icon}</span>
                    <span className="text-[12px] font-bold text-text-muted tabular-nums shrink-0">{entity.total}</span>
                    <span className="w-px h-[12px] bg-border shrink-0" />
                    <span className="w-[8px] h-[8px] rounded-full shrink-0" style={{ background: color }} />
                    <span className="text-[12px] font-bold text-text-muted truncate">{entity.name}</span>
                  </button>
                ); })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
