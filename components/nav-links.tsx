"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { authSessionChangedEvent } from "@/components/auth-session-events";
import { showLoadingOverlay } from "@/components/loading-overlay-events";
import { SessionControls } from "@/components/session-controls";

type SessionPayload = {
  user?: {
    role?: string | null;
  } | null;
} | null;

export function NavLinks() {
  const pathname = usePathname();
  const [session, setSession] = useState<SessionPayload>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadSession() {
      try {
        const response = await fetch("/api/auth/session", { cache: "no-store" });
        if (!response.ok) return;
        const payload = (await response.json()) as SessionPayload;
        if (!cancelled) setSession(payload);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    }

    function reloadSession() {
      void loadSession();
    }

    void loadSession();
    window.addEventListener(authSessionChangedEvent, reloadSession);
    return () => {
      cancelled = true;
      window.removeEventListener(authSessionChangedEvent, reloadSession);
    };
  }, []);

  const signedIn = Boolean(session?.user);

  function handleNavClick(href: string) {
    if (pathname !== href) {
      showLoadingOverlay();
    }
  }

  return (
    <div className="navlinks">
      <Link className="button secondary" href="/combos" prefetch={false} onClick={() => handleNavClick("/combos")}>
        Public combos
      </Link>
      {signedIn ? (
        <>
          {session?.user?.role === "ADMIN" ? <Link className="button secondary" href="/admin" prefetch={false} onClick={() => handleNavClick("/admin")}>Admin</Link> : null}
          <Link className="button secondary" href="/profile" prefetch={false} onClick={() => handleNavClick("/profile")}>Profile</Link>
          <Link className="button" href="/dashboard" prefetch={false} onClick={() => handleNavClick("/dashboard")}>Create</Link>
          <SessionControls />
        </>
      ) : loaded ? (
        <Link className="button" href="/auth/signin" onClick={() => handleNavClick("/auth/signin")}>
          Sign in
        </Link>
      ) : null}
    </div>
  );
}
