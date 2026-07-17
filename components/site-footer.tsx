import Link from "next/link";
import { footerLinks } from "@/lib/footer-links";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div>
        <strong>Beyblade X Tracker</strong>
        <p className="meta">Track combos, battles, parts, and feedback.</p>
      </div>
      <nav className="footer-links" aria-label="Footer">
        {footerLinks.map((link) => (
          <Link key={link.href} href={link.href}>
            {link.label}
          </Link>
        ))}
      </nav>
    </footer>
  );
}
