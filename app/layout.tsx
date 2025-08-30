// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import { inter, jbMono } from "./fonts";
import { Env } from "@/lib/env";

export const metadata: Metadata = {
  metadataBase: new URL(Env.SITE_URL ?? "http://localhost:3000"),
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
      <body className="font-sans min-h-screen flex flex-col bg-[#EEE1C6] text-foreground">
        <AnnouncementBanner dismissible />
        <header>
          <SiteHeader />
        </header>

        <main id="content" className="flex-1 p-4" tabIndex={-1}>
          <div className="mx-auto w-full max-w-7xl bg-white rounded-lg shadow-sm p-6">
            {children}
          </div>
        </main>

        <Footer />
      </body>
    </html>
  );
}
