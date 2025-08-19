// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: {
    default: "tullyelly",
    template: "%s — tullyelly",
  },
  description: "Dead-simple static pages with a tiny design system.",
  openGraph: {
    title: "tullyelly",
    description: "Dead-simple static pages with a tiny design system.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="header">
          <div className="container">
            <nav className="nav" aria-label="Main">
              <Link href="/">Home</Link>
              <Link href="/roadwork-rappin">Roadwork Rappin’</Link>
              <Link href="/heels-have-eyes">HEELS HAVE EYES</Link>
            </nav>
          </div>
        </header>

        <main id="content" className="container" tabIndex={-1}>
          {children}
        </main>

        <footer className="footer">
          <div className="container">
            <small className="muted">© {new Date().getFullYear()} tullyelly</small>
          </div>
        </footer>
      </body>
    </html>
  );
}