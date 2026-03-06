"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const HEARTBEAT_INTERVAL = 60_000; // 1 minute

export default function SiteTracker() {
  const pathname = usePathname();

  // One-time visit tracking
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
      body: JSON.stringify({ referrer, page: pathname }),
    }).catch(() => {});
  }, [pathname]);

  // Heartbeat for online presence + current page
  useEffect(() => {
    const send = () => {
      fetch("/api/stats/heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page: pathname }),
      }).catch(() => {});
    };

    send();
    const interval = setInterval(send, HEARTBEAT_INTERVAL);
    return () => clearInterval(interval);
  }, [pathname]);

  return null;
}
