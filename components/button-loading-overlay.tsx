"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { loadingOverlayEventName } from "@/components/loading-overlay-events";

const MAX_OVERLAY_MS = 1000;

export function ButtonLoadingOverlay() {
  const [visible, setVisible] = useState(false);
  const hideTimer = useRef<number | null>(null);
  const pathname = usePathname();

  function clearHideTimer() {
    if (hideTimer.current === null) return;
    window.clearTimeout(hideTimer.current);
    hideTimer.current = null;
  }

  function hideOverlay() {
    clearHideTimer();
    setVisible(false);
  }

  function showOverlay() {
    clearHideTimer();
    setVisible(true);
    hideTimer.current = window.setTimeout(hideOverlay, MAX_OVERLAY_MS);
  }

  useEffect(() => {
    hideOverlay();
  }, [pathname]);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const target = event.target;
      if (target instanceof Element && target.closest(".profile-tabs")) return;
      showOverlay();
    }

    function handleOverlay(event: Event) {
      const detail = (event as CustomEvent<{ visible?: boolean }>).detail;
      if (detail?.visible === true) showOverlay();
      if (detail?.visible === false) hideOverlay();
    }

    window.addEventListener("click", handleClick, true);
    window.addEventListener(loadingOverlayEventName, handleOverlay);
    window.addEventListener("pageshow", hideOverlay);
    window.addEventListener("focus", hideOverlay);
    return () => {
      window.removeEventListener("click", handleClick, true);
      window.removeEventListener(loadingOverlayEventName, handleOverlay);
      window.removeEventListener("pageshow", hideOverlay);
      window.removeEventListener("focus", hideOverlay);
      hideOverlay();
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
