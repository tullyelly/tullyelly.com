// app/layout.tsx
import "./globals.css";
import { initSentry } from "@/lib/sentry";
import type { Metadata } from "next";
import NavBar from "@/app/_components/NavBar";
import Footer from "@/app/_components/Footer";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import Providers from "./providers";
import { inter, jbMono } from "./fonts";

await initSentry();

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "tullyelly",
    template: "%s; tullyelly",
  },
  description: "Dead-simple static pages with a tiny design system.",
  openGraph: {
    title: "tullyelly",
    description: "Dead-simple static pages with a tiny design system.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const announcement = process.env.NEXT_PUBLIC_ANNOUNCEMENT;

  return (
    <html lang="en" className={`${inter.variable} ${jbMono.variable}`}>
      <head></head>
      <body className="font-sans min-h-screen flex flex-col bg-white text-foreground">
        <Providers>
          {announcement && <AnnouncementBanner message={announcement} dismissible />}

          <header id="nav-zone">
            <NavBar />
          </header>

          <main id="content" className="flex-1 bg-white" tabIndex={-1}>
            <div className="mx-auto w-full max-w-7xl px-4 py-6">
              {children}
            </div>
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
