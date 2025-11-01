"use client";

import * as React from "react";
import * as Lucide from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
import NavigationSearch from "@/components/navigation/NavigationSearch";
import {
  useLocalSuggestions,
  type SuggestionSource,
} from "@/components/navigation/useLocalSuggestions";
import DrawerItem from "@/components/nav/DrawerItem";
import { cn } from "@/lib/utils";
import { useNavController } from "@/components/nav/NavController";
import { useNavResetOnRouteChange } from "@/hooks/useNavResetOnRouteChange";
import { HOME_EMOJI, PERSONA_EMOJI } from "@/components/nav/menuUtils";
import { handleSameRouteNoop, isSameRoute } from "@/components/nav/sameRoute";
import twemoji from "twemoji";

type MobileDrawerProps = {
  open: boolean;
  onOpenChange(next: boolean): void;
  menu: MenuPayload;
  childrenMap: PersonaChildren;
  onNavigate?(href: string): void;
};

const drawerActionClasses =
  "flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-[color:var(--text-strong,#0e2240)] leading-6 transition-colors hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand-blue,#0077c0)] focus-visible:ring-offset-0";

const drawerPersonaLinkClasses =
  "flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-base leading-6 text-[color:var(--text-strong,#0e2240)] transition-colors hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand-blue,#0077c0)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent";

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
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentRoute = React.useMemo(() => {
    const path = pathname ?? "/";
    const search = searchParams?.toString() ?? "";
    return search ? `${path}?${search}` : path;
  }, [pathname, searchParams]);
  const { registerCloseHandler } = useNavController();
  useNavResetOnRouteChange();
  const sheetContentRef = React.useRef<HTMLDivElement | null>(null);
  const twemojiFrameRef = React.useRef<number | null>(null);
  const [expandedPersona, setExpandedPersona] =
    React.useState<PersonaKey | null>(null);
  const [searchActive, setSearchActive] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const searchButtonRef = React.useRef<HTMLButtonElement | null>(null);

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
  const personaEmojiKeys = React.useMemo(
    () => personaEntries.map(({ key }) => key).join("|"),
    [personaEntries],
  );

  React.useEffect(() => {
    if (!open) {
      setExpandedPersona(null);
      setSearchActive(false);
      setSearchQuery("");
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
    const node = sheetContentRef.current;
    if (!node) return;
    if (twemojiFrameRef.current !== null) {
      window.cancelAnimationFrame(twemojiFrameRef.current);
      twemojiFrameRef.current = null;
    }
    twemojiFrameRef.current = window.requestAnimationFrame(() => {
      twemoji.parse(node, { folder: "svg", ext: ".svg" });
      twemojiFrameRef.current = null;
    });
    return () => {
      if (twemojiFrameRef.current !== null) {
        window.cancelAnimationFrame(twemojiFrameRef.current);
        twemojiFrameRef.current = null;
      }
    };
  }, [open, personaEmojiKeys]);

  React.useEffect(() => {
    if (!open || expandedPersona) return;
    const firstPersona = personaEntries[0];
    if (!firstPersona) return;
    const frame = window.requestAnimationFrame(() => {
      const node = document.getElementById(
        `mobile-drawer-root-${firstPersona.item.id}`,
      );
      if (node instanceof HTMLElement) {
        node.focus();
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [open, expandedPersona, personaEntries]);

  React.useEffect(() => {
    if (!open || !expandedPersona) return;
    const links = (childrenMap[expandedPersona] ?? []).filter((item) =>
      Boolean(item.href),
    );
    const first = links[0];
    if (!first) return;
    const frame = window.requestAnimationFrame(() => {
      const node = document.getElementById(
        `mobile-drawer-persona-${expandedPersona}-${first.id}`,
      );
      if (node instanceof HTMLElement) {
        node.focus();
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [open, expandedPersona, childrenMap]);

  const handleClose = React.useCallback(
    (next: boolean) => {
      if (!next) {
        setSearchActive(false);
        setSearchQuery("");
      }
      onOpenChange(next);
    },
    [onOpenChange],
  );

  const handleSearch = React.useCallback(() => {
    trackDrawerClick(
      menu,
      { id: "utility-search", label: "Search" },
      { section: "utilities", kind: "action" },
    );
    setExpandedPersona(null);
    setSearchActive(true);
  }, [menu]);

  const closeDrawer = React.useCallback(() => {
    setSearchActive(false);
    setSearchQuery("");
    handleClose(false);
  }, [handleClose]);

  const handleNavigate = React.useCallback(
    (
      event: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>,
      item: MenuItem,
      section: string,
    ) => {
      if (!item.href) return;

      const internal = !item.external;
      if (internal && isSameRoute(currentRoute, item.href)) {
        handleSameRouteNoop(event, closeDrawer);
        return;
      }

      trackDrawerClick(menu, item, { section });
      onNavigate?.(item.href);
      if (item.external) {
        window.open(item.href, "_blank", "noopener,noreferrer");
        closeDrawer();
        return;
      }
      router.push(item.href as Route);
      setTimeout(() => closeDrawer(), 0);
    },
    [closeDrawer, currentRoute, menu, onNavigate, router],
  );

  React.useEffect(
    () => registerCloseHandler(closeDrawer),
    [registerCloseHandler, closeDrawer],
  );

  const exitSearch = React.useCallback(() => {
    setSearchActive(false);
    setSearchQuery("");
    const button = searchButtonRef.current;
    if (button) {
      window.requestAnimationFrame(() => {
        button.focus();
      });
    }
  }, []);

  const suggestionSeeds = React.useMemo(() => {
    const seeds: SuggestionSource[] = [];
    const personaLabelLookup = new Map<PersonaKey, string>();
    for (const entry of personaEntries) {
      personaLabelLookup.set(entry.key, entry.label);
      if (entry.item.href) {
        seeds.push({
          id: `persona:${entry.key}`,
          title: entry.label,
          href: entry.item.href,
          subtitle: "Persona overview",
          persona: entry.label,
        });
      }
    }

    for (const [personaKey, links] of Object.entries(childrenMap) as Array<
      [PersonaKey, MenuItem[]]
    >) {
      const personaLabel = personaLabelLookup.get(personaKey) ?? personaKey;
      for (const link of links) {
        if (!link.href) continue;
        seeds.push({
          id: `link:${personaKey}:${link.id}`,
          title: link.label,
          href: link.href,
          subtitle: personaLabel,
          persona: personaLabel,
        });
      }
    }

    return seeds;
  }, [childrenMap, personaEntries]);

  const inlineSuggestions = useLocalSuggestions(suggestionSeeds, searchQuery);

  const handleTogglePersona = (key: PersonaKey) => {
    setExpandedPersona((current) => {
      if (current === key) {
        return null;
      }
      analytics.track("menu_expand", {
        persona: key,
        method: "menu_toggle",
      });
      return key;
    });
  };

  const handleSheetKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Escape" && expandedPersona) {
        event.preventDefault();
        event.stopPropagation();
        setExpandedPersona(null);
      }
    },
    [expandedPersona],
  );

  const handleHome = React.useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      const href = "/";
      const section = "utility";
      if (isSameRoute(currentRoute, href)) {
        handleSameRouteNoop(event, closeDrawer);
        return;
      }

      trackDrawerClick(
        menu,
        { id: "utility-home", label: "Home", href: "/" },
        { section, kind: "link" },
      );
      onNavigate?.(href);
      router.push(href as Route);
      setTimeout(() => closeDrawer(), 0);
    },
    [closeDrawer, currentRoute, menu, onNavigate, router],
  );

  return (
    <Sheet open={open} onOpenChange={handleClose} modal>
      <SheetContent
        ref={sheetContentRef}
        side="bottom"
        id="nav-mobile-drawer"
        showCloseButton={false}
        onKeyDownCapture={handleSheetKeyDown}
        overlayClassName="bg-black/45 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out"
        className="z-[80] inset-x-0 bottom-0 h-[85vh] rounded-t-2xl border-t border-[color:var(--border-subtle)] bg-[color:var(--surface-page)] p-0 text-[color:var(--text-strong)] sm:h-[80vh]"
        data-emoji-scope="mobile-drawer"
      >
        <div data-testid="nav-mobile-drawer" className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-[color:var(--border-subtle)] px-5 py-4">
            <span className="w-10" aria-hidden="true" />
            <SheetTitle className="text-lg font-semibold leading-none text-[color:var(--text-strong)]">
              Navigation
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
            <div>
              {searchActive ? (
                <div className="mx-1 mb-3 flex items-center gap-2">
                  <NavigationSearch
                    autoFocus
                    focusDelayMs={260}
                    escCloses
                    persona={menu.persona}
                    onSubmitted={closeDrawer}
                    onCancel={exitSearch}
                    placeholder="Search pages, personas, and posts..."
                    className="flex-1"
                    suggestions={inlineSuggestions}
                    onSuggestionClick={() => setSearchQuery("")}
                    onQueryChange={setSearchQuery}
                  />
                  <button
                    type="button"
                    className="hit-target rounded-full border border-[color:var(--border-subtle,#d1d5db)] bg-white px-3 py-2 text-sm font-medium text-[color:var(--text-strong,#0e2240)] transition hover:bg-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand-blue,#0077c0)]"
                    onClick={exitSearch}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <DrawerItem className="mx-1 mb-3">
                  <button
                    ref={searchButtonRef}
                    type="button"
                    className={cn(drawerActionClasses, "justify-start")}
                    onClick={handleSearch}
                  >
                    <Lucide.Search className="size-5" aria-hidden="true" />
                    <span className="flex-1 truncate">Search</span>
                  </button>
                </DrawerItem>
              )}
              <DrawerItem className="mx-1 mb-3">
                <Link
                  href={"/" as Route}
                  aria-label="Home"
                  className={cn(drawerActionClasses, "justify-start")}
                  onClick={handleHome}
                >
                  <span
                    className="emoji text-xl leading-none"
                    aria-hidden="true"
                  >
                    {HOME_EMOJI}
                  </span>
                  <span className="flex-1 truncate">Home</span>
                </Link>
              </DrawerItem>
              {/* Mobile-only: surface shaolin once just under Home */}
              {(() => {
                const shaolinEntry = personaEntries.find(
                  (entry) => entry.key === "shaolin",
                );
                if (!shaolinEntry?.item?.href) return null;
                const personaEmoji = PERSONA_EMOJI["shaolin"];
                const buttonId = `mobile-drawer-root-${shaolinEntry.item.id}`;
                return (
                  <DrawerItem className="mx-1 mb-3">
                    <button
                      type="button"
                      id={buttonId}
                      className={cn(drawerActionClasses, "justify-start")}
                      aria-label="shaolin"
                      onClick={(event) =>
                        handleNavigate(event, shaolinEntry.item, "primary")
                      }
                    >
                      {personaEmoji ? (
                        <span
                          className="emoji text-xl leading-none"
                          aria-hidden="true"
                        >
                          {personaEmoji}
                        </span>
                      ) : (
                        <Icon
                          name={shaolinEntry.item.iconKey}
                          className="size-5"
                        />
                      )}
                      <span className="flex-1 truncate">
                        {shaolinEntry.label}
                      </span>
                    </button>
                  </DrawerItem>
                );
              })()}
              <div className="space-y-3">
                <p className="px-4 pt-4 pb-2 text-xs font-semibold uppercase tracking-[0.2em] text-black/60">
                  By alter ego
                </p>
                <div className="space-y-2 px-1">
                  {personaEntries
                    .filter(({ key }) => key !== "shaolin")
                    .map(({ key, item, label }) => {
                      const personaLinks = (childrenMap[key] ?? []).filter(
                        (link) => Boolean(link.href),
                      );
                      const isExpanded = expandedPersona === key;
                      const buttonId = `mobile-drawer-root-${item.id}`;
                      const panelId = `mobile-drawer-persona-panel-${key}`;
                      const personaEmoji = PERSONA_EMOJI[key];
                      return (
                        <div
                          key={item.id}
                          className={cn("space-y-2", isExpanded && "space-y-0")}
                        >
                          <DrawerItem
                            className={cn(
                              isExpanded &&
                                "relative z-10 rounded-b-none border-b-transparent ring-1 ring-black/10",
                            )}
                          >
                            <button
                              type="button"
                              id={buttonId}
                              className={cn(
                                drawerActionClasses,
                                isExpanded && "rounded-b-none bg-black/5",
                              )}
                              aria-expanded={isExpanded}
                              aria-controls={panelId}
                              onClick={() => handleTogglePersona(key)}
                            >
                              {personaEmoji ? (
                                <span
                                  className="emoji text-xl leading-none"
                                  aria-hidden="true"
                                >
                                  {personaEmoji}
                                </span>
                              ) : (
                                <Icon name={item.iconKey} className="size-5" />
                              )}
                              <span className="flex-1 truncate">{label}</span>
                              <Lucide.ChevronRight
                                className={`size-4 text-[color:var(--text-muted,#58708c)] transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
                                aria-hidden="true"
                              />
                            </button>
                          </DrawerItem>
                          <div
                            id={panelId}
                            role="region"
                            aria-labelledby={buttonId}
                            hidden={!isExpanded}
                            className="relative z-0 mt-0 transition-[height,opacity] duration-150 ease-out"
                          >
                            <div className="mx-1 mt-1 overflow-visible rounded-2xl border border-black/10 bg-[rgba(0,0,0,0.02)]">
                              <div
                                className={cn(
                                  "flex flex-col overflow-visible rounded-2xl border-l-2 border-[color:var(--persona-accent,#00471B)] pl-4 pr-3 py-2",
                                  personaLinks.length &&
                                    "divide-y divide-black/5",
                                )}
                              >
                                {personaLinks.length ? (
                                  personaLinks.map((link) => (
                                    <button
                                      type="button"
                                      key={link.id}
                                      id={`mobile-drawer-persona-${key}-${link.id}`}
                                      className={cn(
                                        drawerPersonaLinkClasses,
                                        "pr-2",
                                      )}
                                      onClick={(event) =>
                                        handleNavigate(
                                          event,
                                          link,
                                          `persona:${key}`,
                                        )
                                      }
                                    >
                                      <Icon
                                        name={link.iconKey}
                                        className="size-5"
                                      />
                                      <span className="flex-1 truncate">
                                        {link.label}
                                      </span>
                                      {link.external ? (
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
                                  ))
                                ) : (
                                  <p className="px-0 py-3 text-sm text-[color:var(--text-muted,#58708c)]">
                                    No links yet.
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
