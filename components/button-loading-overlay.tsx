"use client";

import { useEffect, useRef, useState } from "react";
import { hideLoadingOverlayEvent, showLoadingOverlayEvent } from "@/components/loading-overlay-events";

const MAX_OVERLAY_MS = 1000;

function shouldShowOverlay(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;

  const link = target.closest("a[href]");
  if (link instanceof HTMLAnchorElement) {
    const href = link.getAttribute("href");
    if (!href || href.startsWith("#") || link.target === "_blank" || link.hasAttribute("download")) return false;
    return true;
  }

  const button = target.closest("button, input[type='submit'], input[type='button']");
  if (!(button instanceof HTMLButtonElement || button instanceof HTMLInputElement)) return false;
  return button.type === "submit";
}

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
    function handleClick(event: MouseEvent) {
      if (shouldShowOverlay(event.target)) showOverlay();
    }

    window.addEventListener("click", handleClick, true);
    window.addEventListener("pageshow", hideOverlay);
    window.addEventListener("focus", hideOverlay);
    window.addEventListener(showLoadingOverlayEvent, showOverlay);
    window.addEventListener(hideLoadingOverlayEvent, hideOverlay);
    return () => {
      window.removeEventListener("click", handleClick, true);
      window.removeEventListener("pageshow", hideOverlay);
      window.removeEventListener("focus", hideOverlay);
      window.removeEventListener(showLoadingOverlayEvent, showOverlay);
      window.removeEventListener(hideLoadingOverlayEvent, hideOverlay);
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
