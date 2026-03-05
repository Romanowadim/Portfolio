"use client";

import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
import { useTranslations } from "next-intl";

type Period = "day" | "week" | "month" | "year";
type Bucket = { label: string; count: number };

const PERIODS: Period[] = ["day", "week", "month", "year"];
const CHART_H = 160;
const LABEL_H = 16;
const Y_LABEL_W = 32;

interface SingleChartProps {
  apiUrl: string;
  title: string;
  icon?: React.ReactNode;
}

function SingleChart({ apiUrl, title, icon }: SingleChartProps) {
  const t = useTranslations("admin");
  const [period, setPeriod] = useState<Period>("week");
  const [data, setData] = useState<Bucket[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const chartRef = useRef<HTMLDivElement>(null);
  const [chartW, setChartW] = useState(800);
  useLayoutEffect(() => {
    const el = chartRef.current;
    if (!el) return;
    setChartW(el.clientWidth);
    const ro = new ResizeObserver(() => setChartW(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    setLoading(true);
    fetch(`${apiUrl}?period=${period}`)
      .then((r) => r.json())
      .then((d: Bucket[]) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [apiUrl, period]);

  const total = data.reduce((s, b) => s + b.count, 0);
  const max = Math.max(...data.map((b) => b.count), 1);

  const n = data.length;
  const gap = n > 20 ? 2 : n > 10 ? 3 : 6;
  const barW = n > 0 ? Math.max(1, (chartW - gap * (n - 1)) / n) : 0;
  const labelEvery = n <= 12 ? 1 : n <= 24 ? 2 : 5;

  const peakY = (b: Bucket) =>
    CHART_H - Math.max(b.count > 0 ? 2 : 0, Math.round((b.count / max) * CHART_H));

  const peakPoints = data
    .map((b, i) => `${i * (barW + gap) + barW / 2},${peakY(b)}`)
    .join(" ");

  const firstCx = barW / 2;
  const lastCx = (n - 1) * (barW + gap) + barW / 2;
  const fillPath = n > 1
    ? `M ${firstCx},${CHART_H} L ${peakPoints.replace(/ /g, " L ")} L ${lastCx},${CHART_H} Z`
    : "";

  const gridLevels = [1 / 3, 2 / 3, 1].map((frac) => ({
    frac,
    svgY: CHART_H - Math.round(frac * CHART_H),
    pxY: (1 - frac) * CHART_H,
    value: Math.round(frac * max),
  }));

  const verticalXs = data
    .map((_, i) => i % labelEvery === 0 ? i * (barW + gap) + barW / 2 : null)
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

  const hovered = hoveredIdx !== null ? data[hoveredIdx] : null;
  const hoveredCx = hoveredIdx !== null ? hoveredIdx * (barW + gap) + barW / 2 : 0;
  const hoveredCy = hovered ? peakY(hovered) : 0;

  const gradId = `chartFill-${apiUrl.replace(/\//g, "-")}`;

  return (
    <div className="flex-1 min-w-0">
      {/* Total + period switcher */}
      <div className="flex items-baseline justify-between mb-[16px]">
        <div className="flex items-center gap-[8px]">
          {icon && <span className="text-[#808080] flex items-center">{icon}</span>}
          <span className="text-[26px] font-bold tracking-tight text-[#808080]">
            {loading ? "—" : total.toLocaleString()}
          </span>
          <span className="text-[12px] font-bold tracking-[2px] uppercase text-[#c0c0c0]">
            {title}
          </span>
        </div>

        <div className="flex items-center gap-[12px]">
          {PERIODS.map((p, i) => (
            <React.Fragment key={p}>
              {i > 0 && <span className="w-px h-[1em] bg-[#c0c0c0]/40 self-center" />}
              <button
                onClick={() => setPeriod(p)}
                className={`text-[12px] font-bold tracking-[1.8px] uppercase transition-colors ${
                  period === p ? "text-[#808080]" : "text-[#c0c0c0] hover:text-[#808080]"
                }`}
              >
                {t(`period.${p}`)}
              </button>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Chart */}
      {loading ? (
        <div
          style={{ height: CHART_H + LABEL_H + 4 }}
          className="flex items-center justify-center"
        >
          <span className="text-[12px] text-[#c0c0c0] tracking-[2px] uppercase animate-pulse">
            ...
          </span>
        </div>
      ) : (
        <div className="flex">
          {/* Y-axis labels */}
          <div className="relative shrink-0" style={{ width: Y_LABEL_W, height: CHART_H }}>
            {gridLevels.map(({ frac, pxY, value }) => (
              <span
                key={frac}
                className="absolute right-[6px] text-[12px] font-bold text-[#c0c0c0] leading-none -translate-y-1/2"
                style={{ top: pxY }}
              >
                {value}
              </span>
            ))}
          </div>

          {/* Chart area */}
          <div className="flex-1 min-w-0 relative" ref={chartRef}>
            <svg
              viewBox={`0 0 ${chartW} ${CHART_H}`}
              width="100%"
              preserveAspectRatio="none"
              overflow="visible"
              style={{ display: "block", height: CHART_H }}
            >
              <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2={CHART_H} gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#81AB41" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#81AB41" stopOpacity="0" />
                </linearGradient>
              </defs>

              {vBands.filter((b) => b.fill).map((b, i) => (
                <rect key={i} x={b.x1} y={0} width={b.x2 - b.x1} height={CHART_H} fill="#808080" fillOpacity="0.06" />
              ))}

              {gridLevels.map(({ frac, svgY }) => (
                <line key={frac} x1={0} y1={svgY} x2={chartW} y2={svgY} stroke="#e0e0e0" strokeWidth="1" strokeDasharray="2 3" />
              ))}

              {data.map((_, i) => {
                if (i % labelEvery !== 0) return null;
                const cx = i * (barW + gap) + barW / 2;
                return <line key={i} x1={cx} y1={0} x2={cx} y2={CHART_H} stroke="#e0e0e0" strokeWidth="0.5" />;
              })}

              {fillPath && (
                <path d={fillPath} fill={`url(#${gradId})`} />
              )}

              {n > 1 && (
                <polyline
                  points={peakPoints}
                  fill="none"
                  stroke="#81AB41"
                  strokeWidth="2"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
              )}

              {hoveredIdx !== null && (
                <line x1={hoveredCx} y1={0} x2={hoveredCx} y2={CHART_H} stroke="#c0c0c0" strokeWidth="1" />
              )}

              <rect
                x={0} y={0} width={chartW} height={CHART_H}
                fill="transparent"
                style={{ cursor: "crosshair" }}
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setHoveredIdx(null)}
              />
            </svg>

            {hoveredIdx !== null && hovered && (
              <div
                className="absolute pointer-events-none z-10"
                style={{
                  left: `${(hoveredCx / chartW) * 100}%`,
                  top: hoveredCy,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <div className="w-[8px] h-[8px] rounded-full bg-[#808080]" />
                <div className="absolute left-1/2 bottom-full mb-[8px] -translate-x-1/2 bg-white text-[#808080] text-[12px] font-bold tracking-[1.5px] px-[8px] py-[5px] shadow-[0_2px_12px_rgba(0,0,0,0.10)] whitespace-nowrap">
                  {hovered.count}
                </div>
              </div>
            )}

            {/* X-axis labels */}
            <div className="relative mt-[4px]" style={{ height: LABEL_H }}>
              {data.map((b, i) => {
                if (i % labelEvery !== 0) return null;
                const pct = ((i * (barW + gap) + barW / 2) / chartW) * 100;
                return (
                  <span
                    key={i}
                    className="absolute text-[12px] font-bold tracking-[1.8px] uppercase text-[#c0c0c0] -translate-x-1/2 leading-none"
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
  );
}

export default function VisitsChart() {
  const t = useTranslations("admin");
  const [summary, setSummary] = useState<{ todayVisitors: number; todayArtworkViews: number; allTimeArtworkViews: number; orderClicks: number } | null>(null);

  useEffect(() => {
    fetch("/api/stats/summary")
      .then((r) => r.json())
      .then(setSummary)
      .catch(() => {});
  }, []);

  return (
    <div className="mb-[28px]">
      {/* Summary cards */}
      <div className="flex gap-[12px] mb-[20px]">
        {[
          { label: "TODAY'S VISITORS", value: summary?.todayVisitors },
          { label: "TODAY'S VIEWS", value: summary?.todayArtworkViews },
          { label: "ALL-TIME VIEWS", value: summary?.allTimeArtworkViews },
          { label: "ORDER CLICKS", value: summary?.orderClicks },
        ].map(({ label, value }, i) => (
          <div key={i} className="flex-1 bg-white px-[16px] py-[12px]">
            <div className="text-[10px] font-bold tracking-[1.8px] uppercase text-[#c0c0c0] mb-[4px]">
              {label}
            </div>
            <div className="flex items-baseline gap-[8px]">
              <span className="text-[22px] font-bold tracking-tight text-[#808080]">
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

      {/* Two charts side by side */}
      <div className="flex border border-[#e0e0e0]">
        <div className="flex-1 min-w-0 px-[20px] py-[16px]">
          <SingleChart apiUrl="/api/stats/visits" title={t("visits")} icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" /></svg>} />
        </div>
        <div className="w-px bg-[#e0e0e0] shrink-0" />
        <div className="flex-1 min-w-0 px-[20px] py-[16px]">
          <SingleChart apiUrl="/api/stats/views-chart" title={t("views")} icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" /><path fillRule="evenodd" d="M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113-1.487 4.471-5.705 7.697-10.677 7.697-4.97 0-9.186-3.223-10.675-7.69a1.762 1.762 0 0 1 0-1.113ZM17.25 12a5.25 5.25 0 1 1-10.5 0 5.25 5.25 0 0 1 10.5 0Z" clipRule="evenodd" /></svg>} />
        </div>
      </div>
    </div>
  );
}
