"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";

type Props = {
  onUploaded: (url: string) => void;
  compact?: boolean;
  label?: string;
};

export default function ImageUpload({ onUploaded, compact, label }: Props) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = useCallback(
    async (file: File) => {
      setUploading(true);
      setUploadError("");
      try {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setUploadError(data.error || `Upload failed (${res.status})`);
          setUploading(false);
          return;
        }
        const data = await res.json();
        setPreview(data.url);
        onUploaded(data.url);
      } catch (e) {
        setUploadError(e instanceof Error ? e.message : "Upload failed");
      }
      setUploading(false);
    },
    [onUploaded]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file?.type.startsWith("image/")) upload(file);
    },
    [upload]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) upload(file);
    },
    [upload]
  );

  const size = compact ? "h-[80px] w-[80px]" : "h-[200px] w-full";

  if (preview) {
    return (
      <div className="relative">
        {label && (
          <p className="text-[12px] font-bold tracking-[2.8px] uppercase text-text-secondary mb-2">
            {label}
          </p>
        )}
        <div className={`relative ${size} overflow-hidden ${compact ? "rounded-full" : ""}`}>
          <Image src={preview} alt="" fill className="object-cover" sizes="300px" />
          <button
            onClick={() => {
              setPreview(null);
              if (inputRef.current) inputRef.current.value = "";
            }}
            className="absolute top-1 right-1 w-5 h-5 bg-white/80 rounded-full flex items-center justify-center text-[10px] text-[#808080] hover:text-text"
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {label && (
        <p className="text-[12px] font-bold tracking-[2.8px] uppercase text-text-secondary mb-2">
          {label}
        </p>
      )}
      <div
        className={`${size} border-2 border-dashed border-[#c0c0c0] flex items-center justify-center cursor-pointer transition-colors hover:border-text-muted ${
          dragOver ? "border-text-muted bg-[#f0f0f0]" : ""
        } ${compact ? "rounded-full" : ""}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {uploading ? (
          <span className="text-[12px] text-[#c0c0c0] animate-pulse">...</span>
        ) : uploadError ? (
          <span className="text-[11px] text-red-400 px-2 text-center">{uploadError}</span>
        ) : (
          <span className="text-[24px] text-[#c0c0c0]">+</span>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}
