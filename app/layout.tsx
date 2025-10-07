// app/layout.tsx
import "./globals.css";
import { initSentry } from "@/lib/sentry";
import type { Metadata } from "next";
import Script from "next/script";
import { headers } from "next/headers";
import Footer from "@/app/_components/Footer";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import PersistentBannerHost from "@/components/PersistentBannerHost";
import Providers from "./providers";
import { inter, jbMono } from "./fonts";
import { getMenu } from "@/app/_menu/getMenu";
import NavDesktop from "@/components/nav/NavDesktop";
import NavMobile from "@/components/nav/NavMobile";
import CommandMenu, { CommandMenuProvider } from "@/components/nav/CommandMenu";
import HeaderShell from "@/components/nav/HeaderShell";
import InitialScrollGuard from "@/components/system/InitialScrollGuard";
import { buildPageMetadata as buildMenuMetadata } from "@/app/_menu/metadata";
import { BreadcrumbTrail } from "@/components/ui/breadcrumb";

await initSentry();

const SITE_TITLE = "tullyelly";
const SITE_DESCRIPTION = "Watch me lose my mind in real-time.";

const baseMetadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  ),
  title: {
    default: SITE_TITLE,
    template: `%s; ${SITE_TITLE}`,
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    type: "website",
  },
};

function resolveRequestedPath(headersList: Headers): string {
  const candidates = [
    headersList.get("x-pathname"),
    headersList.get("next-url"),
    headersList.get("x-invoke-path"),
    headersList.get("x-matched-path"),
  ];
  const match = candidates.find((value) => value && value.startsWith("/"));
  return match ?? "/";
}

export async function generateMetadata(): Promise<Metadata> {
  const hdrs = await headers();
  const path = resolveRequestedPath(hdrs);
  const { index } = await getMenu();
  const { title } = buildMenuMetadata(path, index);

  return {
    ...baseMetadata,
    title: title || SITE_TITLE,
    openGraph: {
      ...baseMetadata.openGraph,
      title: title ? `${title}; ${SITE_TITLE}` : SITE_TITLE,
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const announcement = process.env.NEXT_PUBLIC_ANNOUNCEMENT;
  const [menu, hdrs] = await Promise.all([getMenu(), headers()]);
  const path = resolveRequestedPath(hdrs);
  const pageMetadata = buildMenuMetadata(path, menu.index);

  return (
    <html lang="en" className={`${inter.variable} ${jbMono.variable}`}>
      <head>
        {process.env.NEXT_PUBLIC_TEST_MODE === "1" ? (
          <Script
            id="test-init"
            src="/test-init.js"
            strategy="beforeInteractive"
          />
        ) : null}
      </head>
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
        <CommandMenuProvider items={menu.tree}>
          <Providers>
            <div id="page-root" className="flex min-h-screen flex-col">
              <HeaderShell className="bg-[var(--blue)] text-white">
                {announcement && (
                  <AnnouncementBanner message={announcement} dismissible />
                )}
                <PersistentBannerHost />
                <NavDesktop items={menu.tree} />
                <NavMobile items={menu.tree} />
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
                  {pageMetadata.breadcrumbs.length ? (
                    <div className="mb-6">
                      <BreadcrumbTrail crumbs={pageMetadata.breadcrumbs} />
                    </div>
                  ) : null}
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
