// app/layout.tsx
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import type { Viewport } from "next";
import { initSentry } from "@/lib/sentry";
import Script from "next/script";
import Providers from "./providers";
import { inter, jbMono } from "./fonts";
import { getMenuDataCached } from "@/lib/menu/getMenu";
import { CommandMenuProvider } from "@/components/nav/CommandMenu";
import AppShell from "@/components/app-shell/AppShell";
import InitialScrollGuard from "@/components/system/InitialScrollGuard";
import GlobalProgressProvider from "./_components/GlobalProgressProvider";
import { buildPageMetadata as buildMenuMetadata } from "@/app/_menu/metadata";
import { MenuProvider } from "@/components/menu/MenuProvider";
import { getRootRequestData } from "@/lib/root-request-data";
import { GREAT_LAKES_BLUE, SITE_TITLE } from "@/lib/seo/constants";
import { buildRootMetadata } from "@/lib/seo/root-metadata";
import { isTestMenuModeEnabled } from "@/lib/escape-hatches";

// Ensure menu data is always fetched at runtime (not during build),
// so we never bake TEST_MENU_ITEMS into static output.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

export const viewport: Viewport = {
  themeColor: GREAT_LAKES_BLUE,
};

await initSentry();

export async function generateMetadata() {
  const { pathname, menu } = await getRootRequestData();
  const { title } = buildMenuMetadata(pathname, menu.index);

  return buildRootMetadata(title || undefined);
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isE2ERun = process.env.E2E === "1";
  const announcement = process.env.NEXT_PUBLIC_ANNOUNCEMENT;
  const isE2EStable = process.env.NEXT_PUBLIC_E2E_STABLE === "true";
  const {
    pathname,
    menu,
    menuTree,
    capabilities,
    currentPersona,
    personaKey,
    breadcrumbDebugForced,
  } = await getRootRequestData();
  const { menu: personaMenu, children: personaChildren } =
    await getMenuDataCached(personaKey, capabilities.all);

  return (
    <html
      lang="en"
      className={`${inter.variable} ${jbMono.variable} ${isE2ERun ? "e2e" : ""}`.trim()}
      data-e2e-stable={isE2EStable ? "true" : undefined}
    >
      <head>
        {isTestMenuModeEnabled() ? (
          <Script
            id="test-init"
            src="/test-init.js"
            strategy="beforeInteractive"
          />
        ) : null}
      </head>
      <body className="font-sans text-foreground">
        {/* Keep overlay provider first so it sits above all UI */}
        <GlobalProgressProvider />
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
        <MenuProvider value={menuTree}>
          <CommandMenuProvider items={menu.tree}>
            <Providers>
              <AppShell
                announcement={announcement}
                menuItems={menu.tree}
                menu={personaMenu}
                menuChildren={personaChildren}
                siteTitle={SITE_TITLE}
                currentPersona={currentPersona}
                pathname={pathname}
                breadcrumbDebugForced={breadcrumbDebugForced}
              >
                {children}
              </AppShell>
            </Providers>
          </CommandMenuProvider>
        </MenuProvider>
        <Analytics />
      </body>
    </html>
  );
}
