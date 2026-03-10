"use client";

import React, { useState, useEffect, useRef } from "react";
import { COUNTRY_PATHS } from "./countryPaths";

const W = 800;
const H = 400;
const CROP_TOP = 60;
const CROP_BOTTOM = 100;

const COUNTRY_NAMES: Record<string, string> = {
  US: "United States", CA: "Canada", MX: "Mexico", BR: "Brazil", AR: "Argentina",
  CL: "Chile", CO: "Colombia", PE: "Peru", VE: "Venezuela", GB: "United Kingdom",
  FR: "France", DE: "Germany", IT: "Italy", ES: "Spain", PT: "Portugal",
  NL: "Netherlands", BE: "Belgium", CH: "Switzerland", AT: "Austria", PL: "Poland",
  CZ: "Czech Republic", SE: "Sweden", NO: "Norway", FI: "Finland", DK: "Denmark",
  IE: "Ireland", RU: "Russia", UA: "Ukraine", BY: "Belarus", KZ: "Kazakhstan",
  UZ: "Uzbekistan", GE: "Georgia", AM: "Armenia", AZ: "Azerbaijan", TR: "Turkey",
  IL: "Israel", SA: "Saudi Arabia", AE: "UAE", IR: "Iran", IQ: "Iraq",
  IN: "India", CN: "China", JP: "Japan", KR: "South Korea", TW: "Taiwan",
  TH: "Thailand", VN: "Vietnam", ID: "Indonesia", MY: "Malaysia", PH: "Philippines",
  SG: "Singapore", AU: "Australia", NZ: "New Zealand", ZA: "South Africa", EG: "Egypt",
  NG: "Nigeria", KE: "Kenya", ET: "Ethiopia", MA: "Morocco", GH: "Ghana",
  RO: "Romania", BG: "Bulgaria", HU: "Hungary", RS: "Serbia", HR: "Croatia",
  SK: "Slovakia", LT: "Lithuania", LV: "Latvia", EE: "Estonia", MD: "Moldova",
  GR: "Greece", CY: "Cyprus", LU: "Luxembourg", SI: "Slovenia", BA: "Bosnia",
  AL: "Albania", MK: "North Macedonia", ME: "Montenegro", TN: "Tunisia",
  PK: "Pakistan", BD: "Bangladesh", LK: "Sri Lanka", MM: "Myanmar", KH: "Cambodia",
  NP: "Nepal", MN: "Mongolia", KG: "Kyrgyzstan", TJ: "Tajikistan", TM: "Turkmenistan",
  AF: "Afghanistan", JO: "Jordan", LB: "Lebanon", QA: "Qatar", KW: "Kuwait",
  OM: "Oman", BH: "Bahrain", CU: "Cuba", DO: "Dominican Rep.", HN: "Honduras",
  GT: "Guatemala", SV: "El Salvador", NI: "Nicaragua", CR: "Costa Rica", PA: "Panama",
  EC: "Ecuador", BO: "Bolivia", PY: "Paraguay", UY: "Uruguay", IS: "Iceland", MT: "Malta",
};

type GeoPeriod = "all" | "year" | "month" | "week" | "day";
const PERIODS: GeoPeriod[] = ["day", "week", "month", "year", "all"];

type Props = { className?: string };

export default function WorldMap({ className }: Props) {
  const [geoData, setGeoData] = useState<Record<string, number>>({});
  const [allData, setAllData] = useState<Record<string, number>>({});
  const [dayData, setDayData] = useState<Record<string, number>>({});
  const [online, setOnline] = useState<number | null>(null);
  const [onlineCountries, setOnlineCountries] = useState<string[]>([]);
  const [period, setPeriod] = useState<GeoPeriod>("all");
  const [hovered, setHovered] = useState<string | null>(null);
  const [mouse, setMouse] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [countryCenters, setCountryCenters] = useState<Record<string, { cx: number; cy: number }>>({});

  useEffect(() => {
    const ac = new AbortController();
    fetch(`/api/stats/geo-visits?period=${period}`, { signal: ac.signal })
      .then((r) => r.json())
      .then((data) => { if (data && typeof data === "object" && !data.error) setGeoData(data); })
      .catch(() => {});
    return () => ac.abort();
  }, [period]);

  useEffect(() => {
    const ac = new AbortController();
    fetch("/api/stats/geo-visits?period=all", { signal: ac.signal })
      .then((r) => r.json())
      .then((data) => { if (data && typeof data === "object" && !data.error) setAllData(data); })
      .catch(() => {});
    fetch("/api/stats/geo-visits?period=day", { signal: ac.signal })
      .then((r) => r.json())
      .then((data) => { if (data && typeof data === "object" && !data.error) setDayData(data); })
      .catch(() => {});
    return () => ac.abort();
  }, []);

  useEffect(() => {
    let ac = new AbortController();
    const fetchOnline = () => {
      ac.abort();
      ac = new AbortController();
      fetch("/api/stats/online", { signal: ac.signal })
        .then((r) => r.json())
        .then((data) => {
          if (typeof data?.count === "number") setOnline(data.count);
          if (Array.isArray(data?.countries)) setOnlineCountries(data.countries);
        })
        .catch(() => {});
    };
    fetchOnline();
    const interval = setInterval(fetchOnline, 15_000);
    return () => { clearInterval(interval); ac.abort(); };
  }, []);


  // Compute country path centers for online dots
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const centers: Record<string, { cx: number; cy: number }> = {};
    svg.querySelectorAll<SVGPathElement>("path[data-code]").forEach((el) => {
      const code = el.getAttribute("data-code")!;
      const bbox = el.getBBox();
      centers[code] = { cx: bbox.x + bbox.width / 2, cy: bbox.y + bbox.height / 2 };
    });
    setCountryCenters(centers);
  }, []);

  // Summary card data
  const allSorted = Object.entries(allData).sort(([, a], [, b]) => b - a);
  const topCountry = allSorted[0];
  const topCountryDay = topCountry ? (dayData[topCountry[0]] ?? 0) : 0;
  const totalCountries = allSorted.length;

  const maxCount = Math.max(...Object.values(geoData), 1);
  const sorted = Object.entries(geoData)
    .sort(([, a], [, b]) => b - a);

  const numColW = String(maxCount).length * 8;

  const topCode = sorted.length > 0 ? sorted[0][0] : null;

  const fillColor = (code: string) => {
    const count = geoData[code];
    if (!count) return undefined;
    if (code === topCode) return "#81AB41";
    const ratio = count / maxCount;
    const l = 85 - ratio * 65;
    return `hsl(0, 0%, ${l}%)`;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setMouse({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div className={className}>
      {/* Summary cards */}
      <div className="flex gap-[12px] mb-[20px]">
        <div className="flex-1 bg-white px-[16px] py-[12px]">
          <div className="text-[12px] font-bold tracking-[1.8px] uppercase text-text-light mb-[4px]">Top country</div>
          <div className="flex items-baseline gap-[12px]">
            <span className="text-[22px] font-bold tracking-tight text-text-muted uppercase">
              {topCountry ? (COUNTRY_NAMES[topCountry[0]] || topCountry[0]) : "—"}
            </span>
            {topCountry && (
              <>
                <span className="w-px h-[1em] bg-text-light/40 self-center" />
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" className="text-text-muted shrink-0 self-center"><path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" /></svg>
                <span className="text-[22px] font-bold tracking-tight text-text-muted">{topCountry[1].toLocaleString()}</span>
              </>
            )}
            {topCountryDay > 0 && (
              <span className="text-[22px] font-bold tracking-tight" style={{ color: "#81AB41" }}>+{topCountryDay}</span>
            )}
          </div>
        </div>
        <div className="flex-1 bg-white px-[16px] py-[12px]">
          <div className="text-[12px] font-bold tracking-[1.8px] uppercase text-text-light mb-[4px]">Total countries</div>
          <div className="flex items-baseline gap-[8px]">
            <span className="text-[22px] font-bold tracking-tight text-text-muted">
              {totalCountries > 0 ? totalCountries : "—"}
            </span>
          </div>
        </div>
        <div className="flex-1 bg-white px-[16px] py-[12px]">
          <div className="text-[12px] font-bold tracking-[1.8px] uppercase text-text-light mb-[4px]">Online now</div>
          <div className="flex items-center gap-[8px]">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" className="text-text-muted shrink-0"><path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" /></svg>
            <span className="text-[22px] font-bold tracking-tight text-text-muted">
              {online !== null ? online : "—"}
            </span>
            <span className="relative flex h-[10px] w-[10px]">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-[10px] w-[10px] bg-red-500" />
            </span>
          </div>
        </div>
        <div className="flex-1 bg-white px-[16px] py-[12px]">
          <div className="text-[12px] font-bold tracking-[1.8px] uppercase text-text-light mb-[4px]">&nbsp;</div>
          <div className="flex items-baseline gap-[8px]">
            <span className="text-[22px] font-bold tracking-tight text-text-muted">—</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <p className="text-[12px] font-bold tracking-[2.8px] uppercase text-text-secondary">
          Visitor geography
        </p>
        <div className="flex items-center">
          {PERIODS.map((p, i) => (
            <React.Fragment key={p}>
              {i > 0 && <span className="w-px h-[1em] bg-text-light/40" />}
              <button
                onClick={() => setPeriod(p)}
                className={`text-[12px] font-bold tracking-[1.8px] uppercase px-[12px] transition-colors ${period === p ? "text-text-muted" : "text-text-light hover:text-text-muted"}`}
              >
                {p === "all" ? "All" : p}
              </button>
            </React.Fragment>
          ))}
        </div>
      </div>
      <div className="relative border border-border">
        {/* Map */}
        <div style={{ width: "calc(75% + 9px)" }}>
          <div
            ref={containerRef}
            className="overflow-hidden relative"
            onMouseMove={handleMouseMove}
          >
            <svg ref={svgRef} viewBox={`0 ${CROP_TOP} ${W} ${H - CROP_TOP - CROP_BOTTOM}`} className="w-full block">
              <style>{`
                @keyframes ping-dot {
                  0% { r: 3; opacity: 0.9; }
                  75%, 100% { r: 8; opacity: 0; }
                }
              `}</style>
              {Object.entries(COUNTRY_PATHS).map(([code, d]) => {
                const fill = fillColor(code);
                const hasData = !!geoData[code];
                const isHovered = hovered === code;
                return (
                  <path
                    key={code}
                    d={d}
                    data-code={code}
                    fill={fill || "var(--color-text-muted)"}
                    fillOpacity={fill ? (isHovered ? 0.95 : 0.75) : 0.08}
                    stroke="var(--color-text-muted)"
                    strokeOpacity={0.2}
                    strokeWidth={0.3}
                    onMouseEnter={hasData ? () => setHovered(code) : undefined}
                    onMouseLeave={hasData ? () => setHovered(null) : undefined}
                    className={hasData ? "cursor-pointer transition-[fill-opacity] duration-150" : ""}
                  />
                );
              })}
              {onlineCountries.map((code) => {
                const c = countryCenters[code];
                if (!c) return null;
                return (
                  <g key={`online-${code}`}>
                    <circle cx={c.cx} cy={c.cy} r="3" fill="#ef4444" opacity="0.9" style={{ animation: "ping-dot 1.5s cubic-bezier(0,0,0.2,1) infinite" }} />
                    <circle cx={c.cx} cy={c.cy} r="2.5" fill="#ef4444" />
                  </g>
                );
              })}
            </svg>

            {hovered && geoData[hovered] && (
              <div
                className="absolute pointer-events-none z-10"
                style={{ left: mouse.x, top: mouse.y, transform: "translate(-50%, -110%)" }}
              >
                <div className="bg-white shadow-[0_2px_12px_rgba(0,0,0,0.10)] px-[10px] py-[6px] whitespace-nowrap">
                  <span className="text-[12px] font-bold tracking-[1.5px] text-text-muted">{COUNTRY_NAMES[hovered] || hovered}</span>
                  <span className="text-[12px] text-text-light ml-2">{geoData[hovered]}</span>
                </div>
              </div>
            )}
          </div>
        </div>
        {/* Country list */}
        <div className="absolute top-0 right-0 bottom-0 border-l border-border py-[16px] flex flex-col overflow-hidden" style={{ width: "calc(25% - 9px)" }}>
          <div className="text-[12px] font-bold tracking-[2px] uppercase text-text-light mb-[12px] shrink-0 px-[16px]">Top countries</div>
          <div className="overflow-y-auto min-h-0 flex-1">
            {sorted.length === 0 ? (
              <span className="text-[12px] text-text-light px-[16px]">—</span>
            ) : (
              <div className="flex flex-col">
                {sorted.map(([code, count], i) => (
                  <div
                    key={code}
                    className={`flex items-center gap-[6px] py-[6px] px-[16px] ${i > 0 ? "border-t border-border" : ""} ${hovered === code ? "bg-text-muted/[0.06]" : hovered ? "opacity-40" : ""} transition-all hover:bg-text-muted/[0.06]`}
                    onMouseEnter={() => setHovered(code)}
                    onMouseLeave={() => setHovered(null)}
                    style={{ cursor: "default" }}
                  >
                    <span className="text-[12px] font-bold text-text-light tabular-nums w-[16px] text-right shrink-0">{i + 1}</span>
                    <span className="w-px h-[12px] bg-border shrink-0" />
                    <span className="text-[12px] font-bold text-text-muted tabular-nums shrink-0" style={{ width: numColW, textAlign: "right" }}>{count}</span>
                    <span className="w-px h-[12px] bg-border shrink-0" />
                    <span className="text-[12px] font-bold text-text-muted truncate">{COUNTRY_NAMES[code] || code}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
