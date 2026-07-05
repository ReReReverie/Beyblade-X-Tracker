"use client";

const EVENT_NAME = "beyblade-loading-overlay";

export function showLoadingOverlay() {
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { visible: true } }));
}

export function hideLoadingOverlay() {
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { visible: false } }));
}

export const loadingOverlayEventName = EVENT_NAME;
