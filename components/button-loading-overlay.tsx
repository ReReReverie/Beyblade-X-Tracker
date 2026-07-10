"use client";

import { useEffect, useRef, useState } from "react";

const MAX_OVERLAY_MS = 1000;

export function ButtonLoadingOverlay() {
  const [visible, setVisible] = useState(false);
  const hideTimer = useRef<number | null>(null);

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
    function handleClick() {
      showOverlay();
    }

    window.addEventListener("click", handleClick, true);
    window.addEventListener("pageshow", hideOverlay);
    window.addEventListener("focus", hideOverlay);
    return () => {
      window.removeEventListener("click", handleClick, true);
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
