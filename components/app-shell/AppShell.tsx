import ClientAppShell from "./ClientAppShell";
import PersonaChip from "./PersonaChip";
import BreadcrumbServer from "@/components/breadcrumb/BreadcrumbServer";
import E2EOnlyNav from "@/components/e2e/E2EOnlyNav";
import { shouldDisableGlobalBreadcrumb } from "@/lib/breadcrumb-disable.server";
import { flags } from "@/lib/flags";
import { breadcrumbDebug } from "@/lib/breadcrumb-debug";
import { getMenuSnapshot } from "@/lib/menu-snapshot.server";
import { headers } from "next/headers";
import type { NavItem } from "@/types/nav";
import type { MenuPayload, PersonaChildren } from "@/lib/menu/types";
import type { ResolvedPersona } from "@/lib/menu/persona";
import type { Crumb } from "@/components/ui/breadcrumb";
import Footer from "@/app/_components/Footer";
import { CONTENT_GUTTER_CLASS } from "./constants";

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
  const personaChipNode = currentPersona ? (
    <PersonaChip persona={currentPersona} className="shrink-0" />
  ) : null;

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
  const shouldRenderBreadcrumb =
    (flags.breadcrumbsV1 || forceBreadcrumb) && !disableGlobalBreadcrumb;

  const menuSnapshot = getMenuSnapshot(menuItems);

  const forcedItems: Crumb[] | undefined = forceBreadcrumb
    ? [
        { label: "home", href: "/" },
        { label: "debug", href: "/debug" },
        { label: "here" },
      ]
    : undefined;

  const showBreadcrumb = shouldRenderBreadcrumb || Boolean(forcedItems);
  const showPersonaChip = Boolean(personaChipNode);
  const hasRow = showBreadcrumb || showPersonaChip;

  const breadcrumbSlot = hasRow ? (
    <div className={CONTENT_GUTTER_CLASS}>
      {DEV ? (
        <span data-testid="appshell-sentinel" className="sr-only">
          appshell-mounted
        </span>
      ) : null}
      <div className="flex flex-wrap items-center gap-3 py-4">
        {showBreadcrumb ? (
          <BreadcrumbServer
            pathname={pathname}
            menuSnapshot={menuSnapshot}
            forcedItems={forcedItems ?? null}
          />
        ) : null}
        {personaChipNode}
      </div>
    </div>
  ) : null;

  return (
    <ClientAppShell
      announcement={announcement}
      menuItems={menuItems}
      menu={menu}
      menuChildren={menuChildren}
      siteTitle={siteTitle}
      initialPersona={currentPersona}
      footerSlot={<Footer />}
      breadcrumbSlot={breadcrumbSlot}
    >
      <>
        {process.env.NEXT_PUBLIC_E2E_MODE === "1" ? <E2EOnlyNav /> : null}
        {children}
      </>
    </ClientAppShell>
  );
}
