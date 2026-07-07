"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const heartbeatIntervalMs = 300000;

function visitorId() {
  const key = "beyblade-x-visitor-id";
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const created = crypto.randomUUID();
  localStorage.setItem(key, created);
  return created;
}

function recentlyPinged(pathname: string) {
  const key = `beyblade-x-activity:${pathname}`;
  const now = Date.now();
  const last = Number(sessionStorage.getItem(key) || 0);
  if (now - last < heartbeatIntervalMs) return true;
  sessionStorage.setItem(key, String(now));
  return false;
}

export function ActivityHeartbeat() {
  const pathname = usePathname();

  useEffect(() => {
    let timer: number | undefined;
    async function ping(force = false) {
      if (document.visibilityState !== "visible") return;
      if (!force && recentlyPinged(pathname)) return;
      await fetch("/api/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorId: visitorId(), path: pathname })
      }).catch(() => undefined);
    }

    const idleId = "requestIdleCallback" in window
      ? window.requestIdleCallback(() => void ping())
      : undefined;
    const fallback = idleId === undefined ? window.setTimeout(() => void ping(), 3000) : undefined;
    timer = window.setInterval(() => void ping(true), heartbeatIntervalMs);
    return () => {
      if (timer) window.clearInterval(timer);
      if (fallback) window.clearTimeout(fallback);
      if (idleId !== undefined && "cancelIdleCallback" in window) window.cancelIdleCallback(idleId);
    };
  }, [pathname]);

  return null;
}
