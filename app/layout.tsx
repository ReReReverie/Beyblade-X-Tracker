import type { Metadata } from "next";
import Link from "next/link";
import { ActivityHeartbeat } from "@/components/activity-heartbeat";
import { ChatBubble } from "@/components/chat-bubble";
import { SessionControls } from "@/components/session-controls";
import { SiteFooter } from "@/components/site-footer";
import { getSessionUser } from "@/lib/session";
import "./globals.css";

export const metadata: Metadata = {
  title: "Beyblade X Tracker",
  description: "Track Beyblade X combo weights, condition, sources, photos, and win-loss records."
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const sessionUser = await getSessionUser();

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
              {sessionUser ? (
                <>
                  {sessionUser.user.role === "ADMIN" ? (
                    <Link className="button secondary" href="/admin">Admin</Link>
                  ) : null}
                  <Link className="button secondary" href="/profile">Profile</Link>
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
          <SiteFooter />
          <ChatBubble />
        </main>
      </body>
    </html>
  );
}
