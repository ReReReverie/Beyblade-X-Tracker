"use client";

const EVENT_NAME = "beyblade-loading-overlay";
const MAX_OVERLAY_MS = 1500;
let hideTimer: number | null = null;

function dispatchOverlay(visible: boolean) {
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { visible } }));
}

export function showLoadingOverlay() {
  if (hideTimer !== null) window.clearTimeout(hideTimer);
  dispatchOverlay(true);
  hideTimer = window.setTimeout(() => {
    hideTimer = null;
    dispatchOverlay(false);
  }, MAX_OVERLAY_MS);
}

export function hideLoadingOverlay() {
  if (hideTimer !== null) {
    window.clearTimeout(hideTimer);
    hideTimer = null;
  }
  dispatchOverlay(false);
}

export const loadingOverlayEventName = EVENT_NAME;
