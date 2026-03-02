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

  // Load image and calculate initial crop
  useEffect(() => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imgRef.current = img;
      setImgSize({ w: img.naturalWidth, h: img.naturalHeight });

      const container = containerRef.current;
      if (!container) return;
      const maxW = container.clientWidth;
      const maxH = 400;
      const scale = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight, 1);
      const dw = img.naturalWidth * scale;
      const dh = img.naturalHeight * scale;
      setDisplaySize({ w: dw, h: dh });

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

  // Scale factor from display to natural
  const scaleX = imgSize.w / displaySize.w || 1;
  const scaleY = imgSize.h / displaySize.h || 1;

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setDragging(true);
      setDragStart({ mx: e.clientX, my: e.clientY, cx: crop.x, cy: crop.y });
    },
    [crop]
  );

  useEffect(() => {
    if (!dragging) return;
    const handleMove = (e: MouseEvent) => {
      const dx = (e.clientX - dragStart.mx) * scaleX;
      const dy = (e.clientY - dragStart.my) * scaleY;
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
  }, [dragging, dragStart, scaleX, scaleY, imgSize]);

  const handleConfirm = async () => {
    if (!imgRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const outSize = Math.min(crop.size, 800);
    canvas.width = outSize;
    canvas.height = outSize;
    ctx.drawImage(
      imgRef.current,
      crop.x,
      crop.y,
      crop.size,
      crop.size,
      0,
      0,
      outSize,
      outSize
    );

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

  if (!imgLoaded) {
    return <div className="h-[200px] flex items-center justify-center text-[#c0c0c0] text-sm">Loading...</div>;
  }

  // Display crop rect in screen coordinates
  const rx = crop.x / scaleX;
  const ry = crop.y / scaleY;
  const rs = crop.size / scaleX;

  return (
    <div ref={containerRef} className="relative select-none">
      <div className="relative inline-block" style={{ width: displaySize.w, height: displaySize.h }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt=""
          style={{ width: displaySize.w, height: displaySize.h }}
          className="block"
          draggable={false}
        />
        {/* Dark overlay outside crop */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div
            style={{
              position: "absolute",
              left: rx,
              top: ry,
              width: rs,
              height: rs,
              background: "transparent",
              boxShadow: "0 0 0 9999px rgba(0,0,0,0.5)",
            }}
          />
        </div>
        {/* Crop handle */}
        <div
          className="absolute border-2 border-white cursor-move"
          style={{ left: rx, top: ry, width: rs, height: rs }}
          onMouseDown={handleMouseDown}
        />
      </div>
      <canvas ref={canvasRef} className="hidden" />
      <button
        onClick={handleConfirm}
        disabled={uploading}
        className="mt-3 h-[30px] px-4 text-[12px] font-bold tracking-[2.8px] uppercase text-[#c0c0c0] border border-[#c0c0c0] hover:text-text-muted hover:border-text-muted transition-colors disabled:opacity-50"
      >
        {uploading ? "..." : "CROP"}
      </button>
    </div>
  );
}
