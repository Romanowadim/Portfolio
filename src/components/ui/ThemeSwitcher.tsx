"use client";

import { useEffect, useState } from "react";
import { useAdmin } from "@/components/admin/AdminProvider";

export default function ThemeSwitcher() {
  const { isAdmin } = useAdmin();
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.getAttribute("data-theme") === "dark");
  }, []);

  if (!isAdmin) return null;

  const toggle = () => {
    const next = !dark;
    setDark(next);
    if (next) {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
      localStorage.removeItem("theme");
    }
  };

  return (
    <button
      onClick={toggle}
      className="px-1.5 py-0.5 text-[14px] tracking-wide text-text-light hover:text-text-muted transition-colors cursor-pointer"
      aria-label="Toggle theme"
    >
      {dark ? "☀" : "☽"}
    </button>
  );
}
