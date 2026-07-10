"use client";

export const showLoadingOverlayEvent = "loading-overlay:show";
export const hideLoadingOverlayEvent = "loading-overlay:hide";

export function showLoadingOverlay() {
  window.dispatchEvent(new Event(showLoadingOverlayEvent));
}

export function hideLoadingOverlay() {
  window.dispatchEvent(new Event(hideLoadingOverlayEvent));
}
