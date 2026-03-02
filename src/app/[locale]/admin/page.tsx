"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

export default function AdminLoginPage() {
  const t = useTranslations("admin");
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(false);
    setLoading(true);

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push("/portfolio");
      router.refresh();
    } else {
      setError(true);
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <form onSubmit={handleSubmit} className="flex flex-col items-center gap-6">
        <h1 className="text-sm font-bold tracking-[2.8px] uppercase text-text-muted">
          {t("login")}
        </h1>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t("password")}
          className={`w-[280px] h-[30px] border pl-3 pr-3 text-sm outline-none transition-colors ${
            error ? "border-red-400" : "border-[#c0c0c0] focus:border-text"
          }`}
          autoFocus
        />
        {error && (
          <p className="text-[12px] text-red-400">{t("wrongPassword")}</p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="h-[30px] px-6 text-sm font-bold tracking-[2.8px] uppercase text-[#c0c0c0] hover:text-text-muted transition-colors disabled:opacity-50"
        >
          {t("submit")}
        </button>
      </form>
    </div>
  );
}
