// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";

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
          <div className="container">tullyelly</div>
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