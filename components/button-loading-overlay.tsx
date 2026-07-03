"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const TRIGGER_SELECTOR = "a[href]";

export function ButtonLoadingOverlay() {
  const [visible, setVisible] = useState(false);
  const pendingLocation = useRef<string | null>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentLocation = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;

  useEffect(() => {
    if (pendingLocation.current && pendingLocation.current === currentLocation) {
      pendingLocation.current = null;
      setVisible(false);
    }
  }, [currentLocation]);

  useEffect(() => {
    function showOverlay(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const target = event.target as HTMLElement | null;
      const anchor = target?.closest(TRIGGER_SELECTOR) as HTMLAnchorElement | null;
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;

      const destination = `${url.pathname}${url.search}`;
      if (destination === `${window.location.pathname}${window.location.search}`) return;

      pendingLocation.current = destination;
      setVisible(true);
    }

    document.addEventListener("click", showOverlay, true);
    return () => {
      document.removeEventListener("click", showOverlay, true);
      pendingLocation.current = null;
    };
  }, []);

  if (!visible) return null;

  return (
    <div className="loading-overlay" aria-hidden="true">
      <div className="loading-overlay__panel">
        <div className="loading-overlay__spinner" />
        <span>Loading</span>
      </div>
    </div>
  );
}