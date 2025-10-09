"use client";

import * as React from "react";
import * as Lucide from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetClose,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import type {
  MenuItem,
  MenuPayload,
  PersonaChildren,
  PersonaKey,
} from "@/lib/menu/types";
import { isPersonaKey } from "@/lib/menu/types";
import { analytics } from "@/lib/analytics";
import DrawerItem from "@/components/nav/DrawerItem";

type MobileDrawerProps = {
  open: boolean;
  onOpenChange(next: boolean): void;
  menu: MenuPayload;
  childrenMap: PersonaChildren;
  onNavigate?(href: string): void;
};

type View =
  | { kind: "root" }
  | { kind: "persona"; key: PersonaKey; title: string };

function Icon({
  name,
  className,
}: {
  name?: string;
  className?: string;
}): React.ReactNode {
  if (!name) return null;
  const IconComponent = Lucide[name as keyof typeof Lucide] as
    | LucideIcon
    | undefined;
  if (!IconComponent) return null;
  return <IconComponent className={className} aria-hidden="true" />;
}

function parsePersonaFromItem(item: MenuItem): PersonaKey | null {
  const fromId = item.id.startsWith("p-") ? item.id.slice(2) : null;
  if (isPersonaKey(fromId)) return fromId;
  if (isPersonaKey(item.label)) return item.label;
  if (item.href) {
    try {
      const url = new URL(item.href, "https://tullyelly.com");
      const qp = url.searchParams.get("persona");
      if (isPersonaKey(qp)) return qp;
      const path = url.pathname.replace(/^\/+/, "");
      if (isPersonaKey(path)) return path;
    } catch {
      // ignore
    }
  }
  return null;
}

function resolvePersonaLabel(
  persona: PersonaKey,
  personaItems: MenuItem[],
): string {
  const match = personaItems.find((item) => {
    const key = parsePersonaFromItem(item);
    return key === persona;
  });
  return match?.label ?? persona;
}

function trackDrawerState(open: boolean, persona: PersonaKey) {
  analytics.track("menu.mobile.open", {
    state: open ? "open" : "closed",
    persona,
  });
}

function trackDrawerClick(
  menu: MenuPayload,
  item: MenuItem,
  extras?: Record<string, unknown>,
) {
  analytics.track("menu.mobile.click", {
    persona: menu.persona,
    path: item.href ?? null,
    featureKey: item.feature ?? null,
    ...extras,
  });
}

export default function MobileDrawer({
  open,
  onOpenChange,
  menu,
  childrenMap,
  onNavigate,
}: MobileDrawerProps) {
  const router = useRouter();
  const [view, setView] = React.useState<View>({ kind: "root" });

  const personaSection = React.useMemo(
    () => menu.sections.find((section) => section.id === "personas"),
    [menu],
  );
  const personaEntries = React.useMemo(() => {
    const entries: Array<{
      key: PersonaKey;
      item: MenuItem;
      label: string;
    }> = [];
    for (const item of personaSection?.items ?? []) {
      if (!item.href) continue;
      const key = parsePersonaFromItem(item);
      if (!key) continue;
      entries.push({ key, item, label: item.label });
    }
    return entries;
  }, [personaSection]);

  const focusTargetId = React.useMemo(() => {
    if (!open) return null;
    if (view.kind === "persona") {
      const links = (childrenMap[view.key] ?? []).filter((item) =>
        Boolean(item.href),
      );
      const first = links[0];
      return first ? `mobile-drawer-persona-${view.key}-${first.id}` : null;
    }
    const firstPersona = personaEntries[0];
    return firstPersona ? `mobile-drawer-root-${firstPersona.item.id}` : null;
  }, [open, view, childrenMap, personaEntries]);

  React.useEffect(() => {
    if (!open) {
      setView({ kind: "root" });
    }
  }, [open]);

  const previousOpenRef = React.useRef(open);

  React.useEffect(() => {
    if (previousOpenRef.current !== open) {
      trackDrawerState(open, menu.persona);
    }
    previousOpenRef.current = open;
  }, [open, menu.persona]);

  React.useEffect(() => {
    if (!open || !focusTargetId) return;
    const frame = window.requestAnimationFrame(() => {
      const node = document.getElementById(focusTargetId);
      if (node instanceof HTMLElement) {
        node.focus();
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [open, focusTargetId]);

  const handleClose = React.useCallback(
    (next: boolean) => {
      onOpenChange(next);
    },
    [onOpenChange],
  );

  const handleNavigate = React.useCallback(
    (item: MenuItem, section: string) => {
      if (!item.href) return;
      trackDrawerClick(menu, item, { section });
      onNavigate?.(item.href);
      if (item.external) {
        window.open(item.href, "_blank", "noopener,noreferrer");
      } else {
        router.push(item.href);
      }
      handleClose(false);
    },
    [handleClose, menu, onNavigate, router],
  );

  const handleSearch = React.useCallback(() => {
    trackDrawerClick(
      menu,
      { id: "utility-search", label: "Search" },
      { section: "utilities", kind: "action" },
    );
    handleClose(false);
    window.dispatchEvent(
      new CustomEvent("menu:action", { detail: { actionKey: "search" } }),
    );
  }, [handleClose, menu]);

  const currentPersonaLinks = React.useMemo(() => {
    if (view.kind !== "persona") return [];
    return (childrenMap[view.key] ?? []).filter((item) => Boolean(item.href));
  }, [view, childrenMap]);

  const headerTitle = view.kind === "persona" ? view.title : "Navigation";

  return (
    <Sheet open={open} onOpenChange={handleClose} modal>
      <SheetContent
        side="bottom"
        id="nav-mobile-drawer"
        showCloseButton={false}
        overlayClassName="bg-black/45 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out"
        className="z-[80] inset-x-0 bottom-0 h-[85vh] rounded-t-2xl border-t border-[color:var(--border-subtle)] bg-[color:var(--surface-page)] p-0 text-[color:var(--text-strong)] sm:h-[80vh]"
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-[color:var(--border-subtle)] px-5 py-4">
            {view.kind === "persona" ? (
              <button
                type="button"
                className="hit-target flex items-center justify-center rounded-full p-2 text-[color:var(--text-muted,#58708c)] transition hover:text-[color:var(--text-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand-blue)]"
                onClick={() => setView({ kind: "root" })}
              >
                <Lucide.ChevronLeft className="size-5" aria-hidden="true" />
                <span className="sr-only">Back to personas</span>
              </button>
            ) : (
              <span className="w-10" aria-hidden="true" />
            )}
            <SheetTitle className="text-lg font-semibold leading-none text-[color:var(--text-strong)]">
              {headerTitle}
            </SheetTitle>
            <SheetDescription className="sr-only">
              Choose a destination
            </SheetDescription>
            <SheetClose asChild>
              <button
                type="button"
                className="hit-target flex items-center justify-center rounded-full p-2 text-[color:var(--text-muted,#58708c)] transition hover:text-[color:var(--text-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand-blue)]"
                aria-label="Close menu"
              >
                <Lucide.X className="size-5" aria-hidden="true" />
              </button>
            </SheetClose>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-4 pb-[max(env(safe-area-inset-bottom),24px)]">
            {view.kind === "root" ? (
              <div className="space-y-3">
                <p className="px-4 pt-4 pb-2 text-xs font-semibold uppercase tracking-[0.2em] text-black/60">
                  By Persona
                </p>
                <div className="space-y-2 px-1">
                  {personaEntries.map(({ key, item, label }) => (
                    <DrawerItem key={item.id}>
                      <button
                        type="button"
                        id={`mobile-drawer-root-${item.id}`}
                        className="flex flex-1 items-center gap-3 rounded-xl px-2 py-2 text-left text-[color:var(--text-strong)] focus-visible:outline-none"
                        onClick={() => handleNavigate(item, "persona-overview")}
                      >
                        <Icon name={item.iconKey} className="size-5" />
                        <span className="truncate">{label}</span>
                      </button>
                      <button
                        type="button"
                        className="flex shrink-0 items-center justify-center rounded-full p-2 text-[color:var(--text-muted,#58708c)] transition hover:text-[color:var(--text-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand-blue)]"
                        aria-label={`View ${label} links`}
                        onClick={() => {
                          const title = resolvePersonaLabel(
                            key,
                            personaSection?.items ?? [],
                          );
                          setView({ kind: "persona", key, title });
                        }}
                      >
                        <Lucide.ChevronRight
                          className="size-4"
                          aria-hidden="true"
                        />
                      </button>
                    </DrawerItem>
                  ))}
                </div>
                <DrawerItem className="mx-1">
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left text-[color:var(--text-strong)] focus-visible:outline-none"
                    onClick={handleSearch}
                  >
                    <Lucide.Search className="size-5" aria-hidden="true" />
                    <span className="flex-1 truncate">Search</span>
                    <span className="text-xs text-[color:var(--text-muted,#58708c)] opacity-70">
                      Command
                    </span>
                  </button>
                </DrawerItem>
              </div>
            ) : (
              <div className="space-y-2">
                {currentPersonaLinks.length ? (
                  currentPersonaLinks.map((item) => (
                    <DrawerItem key={item.id}>
                      <button
                        type="button"
                        id={`mobile-drawer-persona-${view.key}-${item.id}`}
                        className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left text-[color:var(--text-strong)] focus-visible:outline-none"
                        onClick={() =>
                          handleNavigate(item, `persona:${view.key}`)
                        }
                      >
                        <Icon name={item.iconKey} className="size-5" />
                        <span className="flex-1 truncate">{item.label}</span>
                        {item.external ? (
                          <Lucide.ExternalLink
                            className="size-4 text-[color:var(--text-muted,#58708c)]"
                            aria-hidden="true"
                          />
                        ) : (
                          <Lucide.ChevronRight
                            className="size-4 text-[color:var(--text-muted,#58708c)]"
                            aria-hidden="true"
                          />
                        )}
                      </button>
                    </DrawerItem>
                  ))
                ) : (
                  <p className="px-2 py-3 text-sm text-[color:var(--text-muted,#58708c)]">
                    No links yet.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
