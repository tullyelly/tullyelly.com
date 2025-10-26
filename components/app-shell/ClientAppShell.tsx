"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import PersistentBannerHost from "@/components/PersistentBannerHost";
import HeaderShell from "@/components/nav/HeaderShell";
import NavDesktop from "@/components/nav/NavDesktop";
import MobileDrawer from "@/components/nav/MobileDrawer";
import { NavControllerProvider } from "@/components/nav/NavController";
import CommandMenu, { useCommandMenu } from "@/components/nav/CommandMenu";
import type { NavItem } from "@/types/nav";
import type { MenuPayload, PersonaChildren } from "@/lib/menu/types";
import { resolvePersonaForPath } from "@/lib/menu/persona";
import type { ResolvedPersona } from "@/lib/menu/persona";
import { AppShellProvider, type PersonaSummary } from "./context";
import MobileMenuButton from "./MobileMenuButton";
import BrandHomeLink from "@/components/brand/BrandHomeLink";

type ClientAppShellProps = {
  announcement?: string | null;
  menuItems: NavItem[];
  menu: MenuPayload;
  menuChildren: PersonaChildren;
  siteTitle: string;
  children: React.ReactNode;
  footerSlot: React.ReactNode;
  initialPersona: ResolvedPersona;
};

export default function ClientAppShell({
  announcement,
  menuItems,
  menu,
  menuChildren,
  siteTitle,
  children,
  footerSlot,
  initialPersona,
}: ClientAppShellProps) {
  const pathname = usePathname();
  const currentPersona = React.useMemo<PersonaSummary>(() => {
    const resolved = resolvePersonaForPath(menuItems, pathname ?? "/");
    return (resolved ?? initialPersona) as PersonaSummary;
  }, [menuItems, pathname, initialPersona]);

  const [mobileNavOpen, setMobileNavOpenState] = React.useState(false);
  const [mobileNavPersonaId, setMobileNavPersonaIdState] = React.useState<
    string | null
  >(null);

  const { setOpen: setCommandMenuOpen } = useCommandMenu();
  const setMobileNavOpen = React.useCallback((next: boolean) => {
    setMobileNavOpenState(next);
  }, []);

  const openMobileNav = React.useCallback(
    (options?: { personaId?: string | null }) => {
      if (options && "personaId" in options) {
        setMobileNavPersonaIdState(options.personaId ?? null);
      }
      setMobileNavOpenState(true);
    },
    [setMobileNavPersonaIdState, setMobileNavOpenState],
  );

  const contextValue = React.useMemo(
    () => ({
      mobileNavOpen,
      setMobileNavOpen,
      openMobileNav,
      mobileNavPersonaId,
      setMobileNavPersonaId: setMobileNavPersonaIdState,
      currentPersona,
      siteTitle,
    }),
    [
      mobileNavOpen,
      setMobileNavOpen,
      openMobileNav,
      mobileNavPersonaId,
      setMobileNavPersonaIdState,
      currentPersona,
      siteTitle,
    ],
  );

  React.useEffect(() => {
    if (!mobileNavOpen) {
      setMobileNavPersonaIdState(null);
    }
  }, [mobileNavOpen, setMobileNavPersonaIdState]);

  React.useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname, setMobileNavOpen]);

  React.useEffect(() => {
    const handleMenuAction = (event: Event) => {
      const detail = (event as CustomEvent<{ actionKey?: string }>).detail;
      if (detail?.actionKey === "search") {
        setCommandMenuOpen(true);
      }
    };
    window.addEventListener("menu:action", handleMenuAction);
    return () => window.removeEventListener("menu:action", handleMenuAction);
  }, [setCommandMenuOpen]);

  return (
    <AppShellProvider value={contextValue}>
      <NavControllerProvider>
        <div id="page-root" className="flex min-h-dvh flex-col">
          <div className="flex flex-col">
            <HeaderShell className="bg-[var(--blue)] text-white">
              {announcement ? (
                <AnnouncementBanner message={announcement} dismissible />
              ) : null}
              <PersistentBannerHost />
              <div className="sticky top-0 z-50 bg-[var(--blue)]/95 text-white shadow-sm pt-[max(env(safe-area-inset-top),0px)] backdrop-blur md:hidden">
                <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-start gap-2 px-3 sm:px-4 lg:px-6">
                  <MobileMenuButton />
                  <BrandHomeLink />
                </div>
              </div>
              <NavDesktop menu={menu} childrenMap={menuChildren} />
              <div className="md:hidden">
                <MobileDrawer
                  open={mobileNavOpen}
                  onOpenChange={setMobileNavOpen}
                  menu={menu}
                  childrenMap={menuChildren}
                />
              </div>
              <CommandMenu />
            </HeaderShell>
          </div>
          <main
            id="page-main"
            tabIndex={-1}
            className="m-0 flex-1 bg-transparent p-0 overflow-anchor-none"
          >
            {children}
          </main>
          <div className="mt-auto">{footerSlot}</div>
        </div>
      </NavControllerProvider>
    </AppShellProvider>
  );
}
