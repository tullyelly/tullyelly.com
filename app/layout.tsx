// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import { inter, jbMono } from "./fonts";
import { NEXT_PUBLIC_ANNOUNCEMENT } from "@/lib/env";

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
  const announcement = NEXT_PUBLIC_ANNOUNCEMENT;
  return (
    <html lang="en" className={`${inter.variable} ${jbMono.variable}`}>
      <body className="font-sans min-h-screen flex flex-col bg-[#EEE1C6] text-foreground">
        {announcement && (
          <AnnouncementBanner message={announcement} dismissible />
        )}
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
