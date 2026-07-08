"use client";

import { useEffect, useRef, useState } from "react";
import type { MutableRefObject } from "react";
import { usePathname } from "next/navigation";
import { loadingOverlayEventName } from "@/components/loading-overlay-events";

const TRIGGER_SELECTOR = "a[href]";
const NAVIGATION_OVERLAY_DELAY_MS = 250;
const MAX_OVERLAY_MS = 4500;

export function ButtonLoadingOverlay() {
  const [visible, setVisible] = useState(false);
  const pendingLocation = useRef<string | null>(null);
  const showTimer = useRef<number | null>(null);
  const hideTimer = useRef<number | null>(null);
  const pathname = usePathname();

  function clearTimer(timer: MutableRefObject<number | null>) {
    if (timer.current === null) return;
    window.clearTimeout(timer.current);
    timer.current = null;
  }

  function hideOverlay() {
    clearTimer(showTimer);
    clearTimer(hideTimer);
    pendingLocation.current = null;
    setVisible(false);
  }

  function scheduleOverlayShow(destination: string) {
    clearTimer(showTimer);
    clearTimer(hideTimer);
    pendingLocation.current = destination;
    showTimer.current = window.setTimeout(() => {
      showTimer.current = null;
      setVisible(true);
      hideTimer.current = window.setTimeout(hideOverlay, MAX_OVERLAY_MS);
    }, NAVIGATION_OVERLAY_DELAY_MS);
  }

  function showOverlayNow() {
    clearTimer(showTimer);
    clearTimer(hideTimer);
    setVisible(true);
    hideTimer.current = window.setTimeout(hideOverlay, MAX_OVERLAY_MS);
  }

  useEffect(() => {
    const currentLocation = `${window.location.pathname}${window.location.search}`;
    if (pendingLocation.current && pendingLocation.current === currentLocation) {
      hideOverlay();
    }
  }, [pathname]);

  useEffect(() => {
    function handleOverlay(event: Event) {
      const detail = (event as CustomEvent<{ visible?: boolean }>).detail;
      if (detail?.visible === true) showOverlayNow();
      if (detail?.visible === false) hideOverlay();
    }

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

      scheduleOverlayShow(destination);
    }

    document.addEventListener("click", showOverlay, true);
    window.addEventListener(loadingOverlayEventName, handleOverlay);
    return () => {
      document.removeEventListener("click", showOverlay, true);
      window.removeEventListener(loadingOverlayEventName, handleOverlay);
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
