import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { ActivityHeartbeat } from "@/components/activity-heartbeat";
import { ButtonLoadingOverlay } from "@/components/button-loading-overlay";
import { ChatBubble } from "@/components/chat-bubble";
import { NavLinks } from "@/components/nav-links";
import { SiteFooter } from "@/components/site-footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "Beyblade X Tracker",
  description: "Track Beyblade X combo weights, condition, sources, photos, and win-loss records."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main className="shell">
          <nav className="nav">
            <Link className="brand" href="/">
              Beyblade X Tracker
            </Link>
            <Suspense fallback={<div className="navlinks"><a className="button secondary" href="/combos">Public combos</a></div>}>
              <NavLinks />
            </Suspense>
          </nav>
          <ActivityHeartbeat />
          <ButtonLoadingOverlay />
          {children}
          <SiteFooter />
          <ChatBubble />
        </main>
      </body>
    </html>
  );
}

