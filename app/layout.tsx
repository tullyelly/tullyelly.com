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
      <body className="font-sans text-foreground">
        <Providers>
          <div id="site-layout" className="min-h-screen grid grid-rows-[auto_1fr_auto] gap-0">
            <header id="nav-zone">
              {announcement && <AnnouncementBanner message={announcement} dismissible />}
              <NavBar />
            </header>

            <main id="content" tabIndex={-1} className="bg-white">
              <div className="mx-auto w-full max-w-[var(--content-max)] p-6 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                {children}
              </div>
            </main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
