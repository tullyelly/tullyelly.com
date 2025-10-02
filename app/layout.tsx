// app/layout.tsx
import "./globals.css";
import { initSentry } from "@/lib/sentry";
import type { Metadata } from "next";
import Script from "next/script";
import Footer from "@/app/_components/Footer";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import PersistentBannerHost from "@/components/PersistentBannerHost";
import Providers from "./providers";
import { inter, jbMono } from "./fonts";
import { getMenuForLayout } from "@/app/_menu/getMenu";
import NavDesktop from "@/components/nav/NavDesktop";
import NavMobile from "@/components/nav/NavMobile";
import CommandMenu, { CommandMenuProvider } from "@/components/nav/CommandMenu";
import HeaderShell from "@/components/nav/HeaderShell";
import InitialScrollGuard from "@/components/system/InitialScrollGuard";

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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const announcement = process.env.NEXT_PUBLIC_ANNOUNCEMENT;
  const menu = await getMenuForLayout();

  return (
    <html lang="en" className={`${inter.variable} ${jbMono.variable}`}>
      <head></head>
      <body className="font-sans text-foreground">
        <Script id="boot-scroll-guard" strategy="beforeInteractive">{`
  (function () {
    try { history.scrollRestoration = 'manual'; } catch (e) {}
    var lock = !location.hash;
    if (lock) {
      var forceTop = function () {
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      };
      forceTop();
      var until = performance.now() + 800;
      var onScroll = function () {
        if (performance.now() < until) forceTop();
      };
      window.addEventListener('scroll', onScroll, { passive: false });
      var release = function () {
        window.removeEventListener('scroll', onScroll, { passive: false });
      };
      window.addEventListener('load', release, { once: true });
      setTimeout(release, 900);
    }
  })();
`}</Script>
        <InitialScrollGuard />
        <CommandMenuProvider items={menu}>
          <Providers>
            <div id="page-root" className="flex min-h-screen flex-col">
              <HeaderShell className="bg-[var(--blue)] text-white">
                {announcement && (
                  <AnnouncementBanner message={announcement} dismissible />
                )}
                <PersistentBannerHost />
                <NavDesktop items={menu} />
                <NavMobile items={menu} />
                <CommandMenu />
              </HeaderShell>
              <main
                id="page-main"
                tabIndex={-1}
                className="m-0 flex-1 bg-transparent p-0 overflow-anchor-none"
              >
                <div
                  id="content-pane"
                  className="crop-block-margins mx-auto max-w-[var(--content-max)] bg-white px-6 py-6 shadow-sm md:px-8 md:py-8 lg:px-10"
                >
                  {children}
                </div>
              </main>
              <div className="mt-auto">
                <Footer />
              </div>
            </div>
          </Providers>
        </CommandMenuProvider>
      </body>
    </html>
  );
}
