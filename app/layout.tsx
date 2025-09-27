// app/layout.tsx
import "./globals.css";
import { initSentry } from "@/lib/sentry";
import type { Metadata } from "next";
import NavBar from "@/app/_components/NavBar";
import Footer from "@/app/_components/Footer";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import PersistentBannerHost from "@/components/PersistentBannerHost";
import Providers from "./providers";
import { inter, jbMono } from "./fonts";

await initSentry();

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  ),
  title: {
    default: "tullyelly",
    template: "%s; tullyelly",
  },
  description: "Watch me lose my mind in real-time.",
  openGraph: {
    title: "tullyelly",
    description: "Watch me lose my mind in real-time.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const announcement = process.env.NEXT_PUBLIC_ANNOUNCEMENT;

  return (
    <html lang="en" className={`${inter.variable} ${jbMono.variable}`}>
      <head></head>
      <body className="font-sans text-foreground">
        <Providers>
          <div
            id="site-layout"
            className="min-h-screen grid grid-rows-[auto_1fr_auto] gap-0"
          >
            <header id="nav-zone">
              {announcement && (
                <AnnouncementBanner message={announcement} dismissible />
              )}
              <PersistentBannerHost />
              <NavBar />
            </header>

            <main id="content" tabIndex={-1} className="m-0 p-0 bg-transparent">
              <div
                id="content-pane"
                className="mx-auto max-w-[var(--content-max)] bg-white shadow-sm px-6 md:px-8 lg:px-10 py-6 md:py-8 crop-block-margins"
              >
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
