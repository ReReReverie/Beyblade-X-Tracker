"use client";

import { useEffect, useRef, useState } from "react";

const TRIGGER_SELECTOR = "button, .button, a.button, input[type='submit']";

export function ButtonLoadingOverlay() {
  const [visible, setVisible] = useState(false);
  const hideTimer = useRef<number | null>(null);

  useEffect(() => {
    function showOverlay(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      if (!target?.closest(TRIGGER_SELECTOR)) return;

      setVisible(true);
      if (hideTimer.current) {
        window.clearTimeout(hideTimer.current);
      }
      hideTimer.current = window.setTimeout(() => {
        setVisible(false);
        hideTimer.current = null;
      }, 650);
    }

    document.addEventListener("click", showOverlay, true);
    return () => {
      document.removeEventListener("click", showOverlay, true);
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
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