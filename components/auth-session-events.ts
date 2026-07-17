"use client";

export const authSessionChangedEvent = "auth-session:changed";

export function notifyAuthSessionChanged() {
  window.dispatchEvent(new Event(authSessionChangedEvent));
}
