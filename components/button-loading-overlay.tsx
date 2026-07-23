"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { hideLoadingOverlayEvent, showLoadingOverlayEvent } from "@/components/loading-overlay-events";

const MAX_OVERLAY_MS = 1000;

export function ButtonLoadingOverlay() {
  const [visible, setVisible] = useState(false);
  const hideTimer = useRef<number | null>(null);

  const clearHideTimer = useCallback(() => {
    if (hideTimer.current === null) return;
    window.clearTimeout(hideTimer.current);
    hideTimer.current = null;
  }, []);

  const hideOverlay = useCallback(() => {
    clearHideTimer();
    setVisible(false);
  }, [clearHideTimer]);

  const showOverlay = useCallback(() => {
    clearHideTimer();
    setVisible(true);
    hideTimer.current = window.setTimeout(hideOverlay, MAX_OVERLAY_MS);
  }, [clearHideTimer, hideOverlay]);

  useEffect(() => {
    window.addEventListener("pageshow", hideOverlay);
    window.addEventListener("focus", hideOverlay);
    window.addEventListener(showLoadingOverlayEvent, showOverlay);
    window.addEventListener(hideLoadingOverlayEvent, hideOverlay);
    return () => {
      window.removeEventListener("pageshow", hideOverlay);
      window.removeEventListener("focus", hideOverlay);
      window.removeEventListener(showLoadingOverlayEvent, showOverlay);
      window.removeEventListener(hideLoadingOverlayEvent, hideOverlay);
      hideOverlay();
    };
  }, [hideOverlay, showOverlay]);

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
