import type { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { ActivityHeartbeat } from "@/components/activity-heartbeat";
import { SessionControls } from "@/components/session-controls";
import { authOptions } from "@/lib/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "Beyblade X Tracker",
  description: "Track Beyblade X combo weights, condition, sources, photos, and win-loss records."
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en">
      <body>
        <main className="shell">
          <nav className="nav">
            <Link className="brand" href="/">
              Beyblade X Tracker
            </Link>
            <div className="navlinks">
              <Link className="button secondary" href="/combos">
                Public combos
              </Link>
              {session ? (
                <>
                  {session.user.role === "ADMIN" ? (
                    <Link className="button secondary" href="/admin">Admin</Link>
                  ) : null}
                  <Link className="button" href="/dashboard">Dashboard</Link>
                  <SessionControls />
                </>
              ) : (
                <Link className="button" href="/auth/signin">
                  Sign in
                </Link>
              )}
            </div>
          </nav>
          <ActivityHeartbeat />
          {children}
        </main>
      </body>
    </html>
  );
}
