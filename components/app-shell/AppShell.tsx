import ClientAppShell from "./ClientAppShell";
import E2EOnlyNav from "@/components/e2e/E2EOnlyNav";
import { shouldDisableGlobalBreadcrumb } from "@/lib/breadcrumb-disable.server";
import { breadcrumbDebug } from "@/lib/breadcrumb-debug";
import type { Crumb } from "@/lib/breadcrumbs/types";
import { cn } from "@/lib/utils";
import { headers } from "next/headers";
import type { CSSProperties } from "react";
import type { NavItem } from "@/types/nav";
import type { MenuPayload, PersonaChildren } from "@/lib/menu/types";
import type { ResolvedPersona } from "@/lib/menu/persona";
import Footer from "@/app/_components/Footer";
import { CONTENT_GUTTER_CLASS } from "./constants";
import Breadcrumbs from "@/components/breadcrumbs/Breadcrumbs";

type AppShellProps = {
  announcement?: string | null;
  menuItems: NavItem[];
  menu: MenuPayload;
  menuChildren: PersonaChildren;
  siteTitle: string;
  currentPersona: ResolvedPersona;
  pathname: string;
  children: React.ReactNode;
};

export default async function AppShell({
  announcement,
  menuItems,
  menu,
  menuChildren,
  siteTitle,
  currentPersona,
  pathname,
  children,
}: AppShellProps) {
  const DEV = process.env.NODE_ENV !== "production";

  const hdrs = await headers();

  const headerForce = (() => {
    try {
      const candidate =
        hdrs.get("x-next-url") || hdrs.get("x-invoke-path") || null;
      if (candidate) {
        const url = new URL(candidate, "http://localhost");
        return url.searchParams.get("debugBreadcrumb") === "1";
      }
    } catch {
      /* noop */
    }
    return false;
  })();

  const forceBreadcrumb = breadcrumbDebug.force || headerForce;

  const disableGlobalBreadcrumb = await shouldDisableGlobalBreadcrumb(pathname);
  const forcedItems: Crumb[] | null = forceBreadcrumb
    ? [
        { label: "Home", href: "/", kind: "forced" },
        { label: "debug", href: "/debug", kind: "forced" },
        { label: "here", kind: "forced" },
      ]
    : null;
  const showBreadcrumbs = forcedItems?.length || !disableGlobalBreadcrumb;

  const contentPane = (
    <div
      id="content-pane"
      className={cn(
        "relative crop-block-margins bg-white shadow-sm overflow-visible",
        CONTENT_GUTTER_CLASS,
      )}
      style={
        {
          "--bookmark-offset": "4.5rem",
          "--pane-pt": "1.5rem",
        } as CSSProperties
      }
    >
      {DEV ? (
        <span data-testid="appshell-sentinel" className="sr-only">
          appshell-mounted
        </span>
      ) : null}
      <div
        id="pane-body"
        className={cn(
          "px-6 pt-[var(--pane-pt)] pb-6 md:px-8 md:pl-[--bookmark-offset] md:pb-8 lg:px-10",
        )}
      >
        {process.env.NEXT_PUBLIC_E2E_MODE === "1" ? <E2EOnlyNav /> : null}
        {children}
      </div>
      {showBreadcrumbs ? (
        <Breadcrumbs
          pathname={disableGlobalBreadcrumb ? pathname : undefined}
          forced={forcedItems}
        />
      ) : null}
    </div>
  );

  return (
    <ClientAppShell
      announcement={announcement}
      menuItems={menuItems}
      menu={menu}
      menuChildren={menuChildren}
      siteTitle={siteTitle}
      initialPersona={currentPersona}
      footerSlot={<Footer />}
    >
      {contentPane}
    </ClientAppShell>
  );
}
