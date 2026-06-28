"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

function visitorId() {
  const key = "beyblade-x-visitor-id";
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const created = crypto.randomUUID();
  localStorage.setItem(key, created);
  return created;
}

export function ActivityHeartbeat() {
  const pathname = usePathname();

  useEffect(() => {
    let timer: number | undefined;
    async function ping() {
      if (document.visibilityState !== "visible") return;
      await fetch("/api/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorId: visitorId(), path: pathname })
      }).catch(() => undefined);
    }

    ping();
    timer = window.setInterval(ping, 30000);
    return () => {
      if (timer) window.clearInterval(timer);
    };
  }, [pathname]);

  return null;
}
