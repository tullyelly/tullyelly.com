// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";
import { inter, jbMono } from "./fonts";

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
    <html lang="en" className={`${inter.variable} ${jbMono.variable}`}>
      <body className="font-sans min-h-screen flex flex-col bg-background text-foreground">
        <a href="#content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2">
          Skip to content
        </a>
        <header>
          <SiteHeader />
        </header>
        <main id="content" className="container flex-1" tabIndex={-1}>
          {children}
        </main>
        <footer>
          <Footer />
        </footer>
      </body>
    </html>
  );
}