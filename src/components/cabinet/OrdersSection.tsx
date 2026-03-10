"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { PANEL_CLASS, PANEL_STYLE } from "./shared";
import type { Order } from "@/lib/orders";

function formatDate(iso: string) {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return `${date} ${time}`;
}

export default function OrdersSection() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ac = new AbortController();
    fetch("/api/orders", { signal: ac.signal })
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setOrders(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => ac.abort();
  }, []);

  const handleDelete = useCallback((id: string) => {
    if (!confirm("Delete this order?")) return;
    fetch("/api/orders", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    }).then(() => {
      setOrders((prev) => prev.filter((o) => o.id !== id));
    }).catch(() => {});
  }, []);

  return (
    <motion.div
      key="orders-panel"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={PANEL_CLASS}
      style={PANEL_STYLE}
    >
      <p className="text-[12px] font-bold tracking-[2.8px] uppercase text-text-secondary mb-6">
        Orders ({orders.length})
      </p>

      {loading ? (
        <p className="text-[12px] text-text-light">Loading...</p>
      ) : orders.length === 0 ? (
        <p className="text-[12px] text-text-light">No orders yet</p>
      ) : (
        <div className="grid grid-cols-4 gap-[12px]">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white border border-border px-[20px] py-[16px] relative group flex flex-col"
            >
              {/* Name + Project Name + Delete */}
              <div className="flex items-center justify-between mb-[8px]">
                <div className="min-w-0">
                  <p className="text-[14px] font-bold tracking-[1.5px] text-text-muted uppercase truncate">
                    {order.name}
                  </p>
                  {order.projectName && (
                    <p className="text-[12px] font-medium tracking-[1px] text-text-light mt-[2px]">
                      {order.projectName}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(order.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity ml-[8px] shrink-0 text-[#c0c0c0] hover:text-red-400"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                  </svg>
                </button>
              </div>

              {/* Themes */}
              <div className="flex flex-wrap gap-[6px] mb-[12px]">
                {order.themes.map((theme) => (
                  <span
                    key={theme}
                    className="inline-flex items-center h-[22px] px-[8px] border border-[#c0c0c0] text-[11px] font-medium text-[#7f7f7f] tracking-[0.5px]"
                  >
                    {theme}
                  </span>
                ))}
                {order.totalPrice > 0 && (
                  <span className="inline-flex items-center h-[22px] px-[8px] text-[11px] font-bold text-[#8d9b76] tracking-[0.5px]">
                    ~ {order.totalPrice}$
                  </span>
                )}
              </div>

              {/* Divider */}
              <div className="h-px bg-border mb-[12px]" />

              {/* Description */}
              <p className="text-[13px] text-text-muted leading-[1.6] mb-[12px] whitespace-pre-wrap flex-1">
                {order.description}
              </p>

              {/* Divider */}
              <div className="h-px bg-border mb-[12px]" />

              {/* Email + Date */}
              <div className="flex items-center justify-between">
                <a
                  href={`mailto:${order.email}`}
                  className="text-[13px] font-medium text-[#5596ea] hover:underline"
                >
                  {order.email}
                </a>
                <span className="text-[11px] text-text-light">
                  {formatDate(order.createdAt)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
