// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";

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
      <body className="min-h-screen flex flex-col">
        <SiteHeader />
        <main id="content" className="flex-1" tabIndex={-1}>
          {children}
        </main>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <Footer />
      </body>
    </html>
  );
}
