"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import PersistentBannerHost from "@/components/PersistentBannerHost";
import HeaderShell from "@/components/nav/HeaderShell";
import NavDesktop from "@/components/nav/NavDesktop";
import MobileDrawer from "@/components/nav/MobileDrawer";
import CommandMenu, { useCommandMenu } from "@/components/nav/CommandMenu";
import type { NavItem } from "@/types/nav";
import type { MenuPayload, PersonaChildren } from "@/lib/menu/types";
import { resolvePersonaForPath } from "@/lib/menu/persona";
import { AppShellProvider, type PersonaSummary } from "./context";
import MobileMenuButton from "./MobileMenuButton";
import PersonaSwitcherButton from "./PersonaSwitcherButton";
import SearchButton from "./SearchButton";

type ClientAppShellProps = {
  announcement?: string | null;
  menuItems: NavItem[];
  menu: MenuPayload;
  menuChildren: PersonaChildren;
  siteTitle: string;
  children: React.ReactNode;
  footerSlot: React.ReactNode;
};

export default function ClientAppShell({
  announcement,
  menuItems,
  menu,
  menuChildren,
  siteTitle,
  children,
  footerSlot,
}: ClientAppShellProps) {
  const pathname = usePathname();
  const currentPersona = React.useMemo(
    () => resolvePersonaForPath(menuItems, pathname ?? "/"),
    [menuItems, pathname],
  );

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
      <div id="page-root" className="flex min-h-screen flex-col">
        <HeaderShell className="bg-[var(--blue)] text-white">
          {announcement ? (
            <AnnouncementBanner message={announcement} dismissible />
          ) : null}
          <PersistentBannerHost />
          <div
            className="sticky top-0 border-b border-white/15 bg-[var(--blue)]/95 backdrop-blur md:hidden"
            style={{
              paddingTop: "max(env(safe-area-inset-top), 0px)",
            }}
          >
            <div className="flex h-[var(--topbar-h)] items-center gap-2 px-4">
              <MobileMenuButton />
              <PersonaSwitcherButton />
              <SearchButton variant="compact" />
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
        <main
          id="page-main"
          tabIndex={-1}
          className="m-0 flex-1 bg-transparent p-0 overflow-anchor-none"
          style={{
            paddingBottom: "max(env(safe-area-inset-bottom), 0px)",
          }}
        >
          <div
            id="content-pane"
            className="crop-block-margins mx-auto max-w-[var(--content-max)] bg-white px-6 py-6 shadow-sm md:px-8 md:py-8 lg:px-10"
          >
            {children}
          </div>
        </main>
        <div className="mt-auto">{footerSlot}</div>
      </div>
    </AppShellProvider>
  );
}
