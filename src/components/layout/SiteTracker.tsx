"use client";

import { useEffect } from "react";

export default function SiteTracker() {
  useEffect(() => {
    if (sessionStorage.getItem("_tracked")) return;
    sessionStorage.setItem("_tracked", "1");
    fetch("/api/stats/track", { method: "POST" }).catch(() => {});
  }, []);

  return null;
}
