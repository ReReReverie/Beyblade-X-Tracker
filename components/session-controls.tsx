"use client";

import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";

type ThemeMode = "system" | "light" | "dark";

export function SessionControls() {
  const [themeMode, setThemeMode] = useState<ThemeMode>("system");

  useEffect(() => {
    const stored = window.localStorage.getItem("themeMode") as ThemeMode | null;
    if (stored === "light" || stored === "dark" || stored === "system") setThemeMode(stored);
  }, []);

  useEffect(() => {
    window.localStorage.setItem("themeMode", themeMode);
    document.documentElement.dataset.theme = themeMode;
  }, [themeMode]);

  return (
    <>
      <label className="nav-setting">
        Theme
        <select value={themeMode} onChange={(event) => setThemeMode(event.target.value as ThemeMode)}>
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
