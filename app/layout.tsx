// app/layout.tsx
import "./globals.css";
import { initSentry } from "@/lib/sentry";
import type { Metadata } from "next";
import Script from "next/script";
import { headers } from "next/headers";
import Providers from "./providers";
import { inter, jbMono } from "./fonts";
import { getMenu as getLegacyMenu } from "@/app/_menu/getMenu";
import { getMenuData } from "@/lib/menu/getMenu";
import { resolvePersonaForPath } from "@/lib/menu/persona";
import type { PersonaKey } from "@/lib/menu/types";
import { CommandMenuProvider } from "@/components/nav/CommandMenu";
import AppShell from "@/components/app-shell/AppShell";
import InitialScrollGuard from "@/components/system/InitialScrollGuard";
import GlobalProgressProvider from "./_components/GlobalProgressProvider";
import { buildPageMetadata as buildMenuMetadata } from "@/app/_menu/metadata";

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
  const { index } = await getLegacyMenu();
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
  const [menu, hdrs] = await Promise.all([getLegacyMenu(), headers()]);
  const path = resolveRequestedPath(hdrs);
  const pageMetadata = buildMenuMetadata(path, menu.index);
  const resolvedPersona = resolvePersonaForPath(menu.tree, path);
  const personaKey = (resolvedPersona?.persona ?? "mark2") as PersonaKey;
  const { menu: personaMenu, children: personaChildren } =
    await getMenuData(personaKey);

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
        <CommandMenuProvider items={menu.tree}>
          <Providers>
            <AppShell
              announcement={announcement}
              menuItems={menu.tree}
              menu={personaMenu}
              menuChildren={personaChildren}
              breadcrumbs={pageMetadata.breadcrumbs}
              siteTitle={SITE_TITLE}
              currentPersona={resolvedPersona}
            >
              {children}
            </AppShell>
          </Providers>
        </CommandMenuProvider>
      </body>
    </html>
  );
}
