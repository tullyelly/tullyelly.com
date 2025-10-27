"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import NestableMenu from "@/app/(components)/menu/NestableMenu";
import type { PersonaItem } from "@/types/nav";
import type { AnyLink } from "@/components/nav/menuUtils";

type MenuTestbedProps = {
  persona: PersonaItem;
};

export default function MenuTestbed({
  persona,
}: MenuTestbedProps): React.ReactNode {
  const pathname = usePathname() ?? "/menu-test";
  const headerRef = React.useRef<HTMLElement | null>(null);
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const pointerGuardRef = React.useRef<(() => boolean) | null>(null);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    document.body.classList.add("menu-test-mode");
    return () => {
      document.body.classList.remove("menu-test-mode");
    };
  }, []);

  const registerTrigger = React.useCallback(
    (id: string, node: HTMLButtonElement | null) => {
      if (id !== persona.id) return;
      triggerRef.current = node;
    },
    [persona.id],
  );

  const registerPointerShield = React.useCallback(
    (id: string, guard: (() => boolean) | null) => {
      if (id !== persona.id) return;
      pointerGuardRef.current = guard ?? null;
    },
    [persona.id],
  );

  const focusTrigger = React.useCallback(
    (id: string) => {
      if (id !== persona.id) return;
      const node = triggerRef.current;
      if (!node) return;
      node.focus();
    },
    [persona.id],
  );

  const handleOpenChange = React.useCallback(
    (id: string, next: boolean) => {
      if (id !== persona.id) return;
      setOpen(next);
    },
    [persona.id],
  );

  const handleTriggerKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>, id: string) => {
      if (id !== persona.id) return;
      if (
        event.key === " " ||
        event.key === "Enter" ||
        event.key === "ArrowDown"
      ) {
        event.preventDefault();
        setOpen(true);
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        focusTrigger(id);
      }
    },
    [focusTrigger, persona.id],
  );

  const handleLinkClick = React.useCallback(
    (
      _event: React.MouseEvent<HTMLAnchorElement>,
      _persona: PersonaItem,
      _link: AnyLink,
    ) => {
      // Analytics and same-route handling are skipped in this isolated testbed.
    },
    [],
  );

  return (
    <>
      <style jsx global>{`
        body.menu-test-mode #site-header,
        body.menu-test-mode [data-testid="cmdk"],
        body.menu-test-mode [data-testid="nav-mobile"],
        body.menu-test-mode [data-testid="nav-mobile-drawer"],
        body.menu-test-mode footer {
          display: none !important;
        }
        body.menu-test-mode main#page-main {
          padding: 0;
        }
      `}</style>
      <div
        data-testid="menu-testbed"
        className="mx-auto flex min-h-[40vh] max-w-xl flex-col gap-6 py-10"
      >
        <header
          ref={headerRef}
          className="flex items-center justify-start gap-4"
          data-testid="menu-testbed-header"
        >
          <nav data-testid="nav-desktop" className="flex items-center">
            <NestableMenu
              persona={persona}
              pathname={pathname}
              isOpen={open}
              onOpenChange={handleOpenChange}
              registerTrigger={registerTrigger}
              registerPointerShield={registerPointerShield}
              focusTrigger={focusTrigger}
              onTriggerKeyDown={handleTriggerKeyDown}
              onLinkClick={handleLinkClick}
              headerRef={headerRef}
              disablePointerAim
            />
          </nav>
        </header>
        <p className="text-sm text-muted-foreground">
          Tap a persona item to navigate to the target page.
        </p>
        {pointerGuardRef.current ? (
          <span className="sr-only">pointer shield active</span>
        ) : null}
      </div>
    </>
  );
}
