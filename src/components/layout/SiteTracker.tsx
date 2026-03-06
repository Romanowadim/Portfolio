"use client";

import { useEffect } from "react";

export default function SiteTracker() {
  useEffect(() => {
    if (sessionStorage.getItem("_tracked")) return;
    sessionStorage.setItem("_tracked", "1");
    let referrer = "";
    try {
      const ref = document.referrer;
      if (ref && new URL(ref).hostname !== window.location.hostname) {
        referrer = ref;
      }
    } catch { /* invalid URL */ }
    fetch("/api/stats/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ referrer }),
    }).catch(() => {});
  }, []);

  return null;
}
