"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SessionControls } from "@/components/session-controls";

type SessionPayload = {
  user?: {
    role?: string | null;
  } | null;
} | null;

export function NavLinks() {
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

    void loadSession();
    return () => {
      cancelled = true;
    };
  }, []);

  const signedIn = Boolean(session?.user);

  return (
    <div className="navlinks">
      <Link className="button secondary" href="/combos">
        Public combos
      </Link>
      {signedIn ? (
        <>
          {session?.user?.role === "ADMIN" ? <Link className="button secondary" href="/admin">Admin</Link> : null}
          <Link className="button secondary" href="/profile">Profile</Link>
          <Link className="button" href="/dashboard">Dashboard</Link>
          <SessionControls />
        </>
      ) : loaded ? (
        <Link className="button" href="/auth/signin">
          Sign in
        </Link>
      ) : null}
    </div>
  );
}
