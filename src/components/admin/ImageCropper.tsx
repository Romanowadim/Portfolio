"use client";

import { useState, useRef, useEffect, useCallback } from "react";

type Props = {
  imageUrl: string;
  onCropped: (url: string) => void;
};

export default function ImageCropper({ imageUrl, onCropped }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
  const [displaySize, setDisplaySize] = useState({ w: 0, h: 0 });
  const [crop, setCrop] = useState({ x: 0, y: 0, size: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ mx: 0, my: 0, cx: 0, cy: 0 });
  const [uploading, setUploading] = useState(false);

  // Load image
  useEffect(() => {
    const img = new window.Image();
    img.onload = () => {
      imgRef.current = img;
      setImgSize({ w: img.naturalWidth, h: img.naturalHeight });
      const minDim = Math.min(img.naturalWidth, img.naturalHeight);
      const s = Math.floor(minDim * 0.8);
      setCrop({
        x: Math.floor((img.naturalWidth - s) / 2),
        y: Math.floor((img.naturalHeight - s) / 2),
        size: s,
      });
      setImgLoaded(true);
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // Calculate display size after container renders
  useEffect(() => {
    if (!imgLoaded || !containerRef.current || !imgSize.w) return;
    const maxW = containerRef.current.clientWidth || 520;
    const maxH = 380;
    const scale = Math.min(maxW / imgSize.w, maxH / imgSize.h, 1);
    setDisplaySize({ w: Math.round(imgSize.w * scale), h: Math.round(imgSize.h * scale) });
  }, [imgLoaded, imgSize]);

  // Single scale factor (image is always uniform)
  const scale = displaySize.w > 0 ? displaySize.w / imgSize.w : 1;

  // Crop rect in screen coords
  const rx = crop.x * scale;
  const ry = crop.y * scale;
  const rs = crop.size * scale;

  // Zoom range
  const minSize = Math.max(50, Math.floor(Math.min(imgSize.w, imgSize.h) * 0.1));
  const maxSize = Math.min(imgSize.w, imgSize.h);

  const handleZoom = useCallback((newSize: number) => {
    setCrop((prev) => {
      const cx = prev.x + prev.size / 2;
      const cy = prev.y + prev.size / 2;
      const x = Math.max(0, Math.min(imgSize.w - newSize, Math.round(cx - newSize / 2)));
      const y = Math.max(0, Math.min(imgSize.h - newSize, Math.round(cy - newSize / 2)));
      return { x, y, size: newSize };
    });
  }, [imgSize]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(true);
    setDragStart({ mx: e.clientX, my: e.clientY, cx: crop.x, cy: crop.y });
  }, [crop.x, crop.y]);

  useEffect(() => {
    if (!dragging) return;
    const handleMove = (e: MouseEvent) => {
      const dx = Math.round((e.clientX - dragStart.mx) / scale);
      const dy = Math.round((e.clientY - dragStart.my) / scale);
      setCrop((prev) => ({
        ...prev,
        x: Math.max(0, Math.min(imgSize.w - prev.size, dragStart.cx + dx)),
        y: Math.max(0, Math.min(imgSize.h - prev.size, dragStart.cy + dy)),
      }));
    };
    const handleUp = () => setDragging(false);
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [dragging, dragStart, scale, imgSize]);

  const handleConfirm = async () => {
    if (!imgRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const outSize = Math.min(crop.size, 800);
    canvas.width = outSize;
    canvas.height = outSize;
    ctx.drawImage(imgRef.current, crop.x, crop.y, crop.size, crop.size, 0, 0, outSize, outSize);
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      setUploading(true);
      const fd = new FormData();
      fd.append("file", blob, "thumbnail.jpg");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      onCropped(data.url);
      setUploading(false);
    }, "image/jpeg", 0.9);
  };

  const ready = imgLoaded && displaySize.w > 0;

  return (
    <div ref={containerRef} className="select-none">
      {!ready && (
        <div className="h-[200px] flex items-center justify-center text-text-light text-sm">
          Loading...
        </div>
      )}

      {ready && (
        <>
          {/* Preview area */}
          <div
            className="relative overflow-hidden"
            style={{ width: displaySize.w, height: displaySize.h }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt=""
              style={{ width: displaySize.w, height: displaySize.h }}
              className="block"
              draggable={false}
            />

            {/* 4-rect dark overlay */}
            <div className="absolute bg-black/50 pointer-events-none"
              style={{ left: 0, top: 0, right: 0, height: ry }} />
            <div className="absolute bg-black/50 pointer-events-none"
              style={{ left: 0, top: ry + rs, right: 0, bottom: 0 }} />
            <div className="absolute bg-black/50 pointer-events-none"
              style={{ left: 0, top: ry, width: rx, height: rs }} />
            <div className="absolute bg-black/50 pointer-events-none"
              style={{ left: rx + rs, top: ry, right: 0, height: rs }} />

            {/* Crop box */}
            <div
              className={`absolute border-2 border-white ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
              style={{ left: rx, top: ry, width: rs, height: rs }}
              onMouseDown={handleMouseDown}
            >
              {([
                { top: -2, left: -2 },
                { top: -2, right: -2 },
                { bottom: -2, left: -2 },
                { bottom: -2, right: -2 },
              ] as React.CSSProperties[]).map((pos, i) => (
                <div key={i} className="absolute w-[8px] h-[8px] bg-white" style={pos} />
              ))}
              <div className="absolute inset-0 pointer-events-none opacity-40">
                <div className="absolute top-1/3 left-0 right-0 border-t border-white" />
                <div className="absolute top-2/3 left-0 right-0 border-t border-white" />
                <div className="absolute left-1/3 top-0 bottom-0 border-l border-white" />
                <div className="absolute left-2/3 top-0 bottom-0 border-l border-white" />
              </div>
            </div>
          </div>

          {/* Zoom slider */}
          <div className="flex items-center gap-[10px] mt-3">
            <span className="text-[12px] font-bold tracking-[1.5px] uppercase text-text-light shrink-0 w-[36px]">
              zoom
            </span>
            <input
              type="range"
              min={minSize}
              max={maxSize}
              step={1}
              value={crop.size}
              onChange={(e) => handleZoom(Number(e.target.value))}
              className="flex-1 accent-text-muted"
              style={{ height: 2 }}
            />
            <span className="text-[12px] font-bold tracking-[1px] text-text-light shrink-0 w-[56px] text-right">
              {crop.size}px
            </span>
          </div>

          {/* Confirm */}
          <button
            onClick={handleConfirm}
            disabled={uploading}
            className="mt-3 h-[30px] px-4 text-[12px] font-bold tracking-[2.8px] uppercase text-text-light border border-text-light hover:text-text-muted hover:border-text-muted transition-colors disabled:opacity-50"
          >
            {uploading ? "..." : "CROP"}
          </button>
        </>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
