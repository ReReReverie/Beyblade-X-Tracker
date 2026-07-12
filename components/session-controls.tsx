"use client";

import { signOut } from "next-auth/react";
import { useEffect, useRef, useState } from "react";

type ThemeMode = "system" | "light" | "dark";

export function SessionControls() {
  const [themeMode, setThemeMode] = useState<ThemeMode>("system");
  const initialized = useRef(false);

  useEffect(() => {
    const stored = window.localStorage.getItem("themeMode") as ThemeMode | null;
    if (stored === "light" || stored === "dark" || stored === "system") setThemeMode(stored);
    initialized.current = true;
  }, []);

  useEffect(() => {
    if (!initialized.current) return;
    window.localStorage.setItem("themeMode", themeMode);
    if (themeMode === "system") {
      delete document.documentElement.dataset.theme;
    } else {
      document.documentElement.dataset.theme = themeMode;
    }
  }, [themeMode]);

  return (
    <>
      <label className="nav-setting" htmlFor="theme-mode">
        Theme
        <select id="theme-mode" name="themeMode" value={themeMode} onChange={(event) => setThemeMode(event.target.value as ThemeMode)}>
          <option value="system">System</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </label>
      <button className="button secondary" type="button" onClick={() => signOut({ callbackUrl: "/" })}>
        Log out
      </button>
    </>
  );
}
