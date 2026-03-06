"use client";

import { useState } from "react";

const tools = [
  { key: "photoshop", label: "Photoshop", ext: "svg" },
  { key: "illustrator", label: "Illustrator", ext: "svg" },
  { key: "procreate", label: "Procreate", ext: "png" },
  { key: "figma", label: "Figma", ext: "svg" },
  { key: "animate", label: "Animate", ext: "svg" },
  { key: "krita", label: "Krita", ext: "svg" },
  { key: "midjourney", label: "Midjourney", ext: "svg", invert: true },
  { key: "chatgpt", label: "ChatGPT", ext: "svg", invert: true },
  { key: "claude-ai", label: "Claude", ext: "svg", invert: true },
];

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export default function ToolSelector({ value, onChange }: Props) {
  const selected = new Set(
    value
      .split(" | ")
      .map((s) => {
        const t = tools.find((t) => t.label.toLowerCase() === s.trim().toLowerCase());
        return t ? t.key : s.trim().toLowerCase();
      })
      .filter(Boolean)
  );

  const toggle = (key: string) => {
    const next = new Set(selected);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    const labels = tools
      .filter((t) => next.has(t.key))
      .map((t) => t.label);
    onChange(labels.join(" | "));
  };

  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div className="flex items-center flex-wrap gap-[12px]">
      {tools.map((tool) => {
        const isSelected = selected.has(tool.key);
        return (
          <div key={tool.key} className="relative">
            <button
              type="button"
              onClick={() => toggle(tool.key)}
              onMouseEnter={() => setHovered(tool.key)}
              onMouseLeave={() => setHovered(null)}
              className="w-[35px] h-[35px] overflow-hidden transition-all"
              style={
                tool.invert
                  ? { opacity: isSelected ? 1 : 0.25, filter: "invert(1)" + (isSelected ? "" : " grayscale(1)") }
                  : { opacity: isSelected ? 1 : 0.25, filter: isSelected ? "none" : "grayscale(1)" }
              }
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/images/programs/${tool.key}.${tool.ext}`}
                alt={tool.label}
                className="w-full h-full object-contain"
              />
            </button>
            {hovered === tool.key && (
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white shadow-sm px-2 py-1 text-[12px] text-text-muted rounded z-10">
                {tool.label}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
