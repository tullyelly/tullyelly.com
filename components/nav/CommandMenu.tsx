"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import type { Route } from "next";
import type { NavItem } from "@/types/nav";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import * as Lucide from "lucide-react";
import { analytics } from "@/lib/analytics";
import { flattenLinks, type FlatLink } from "@/lib/menu.flatten";
import {
  readRecent,
  RECENTS_UPDATED_EVENT,
  saveRecent,
  upsertRecent,
} from "@/lib/menu.recents";
import { TEST_MENU_ITEMS } from "@/lib/menu.test-data";
import { isTestMenuModeEnabled } from "@/lib/escape-hatches";

const TEST_MODE = isTestMenuModeEnabled();

type Ctx = {
  open: boolean;
  setOpen(value: boolean): void;
  toggle(): void;
  items: NavItem[];
  restoreFocus(): void;
};
const CommandMenuContext = React.createContext<Ctx | null>(null);

export function CommandMenuProvider({
  items,
  children,
}: {
  items: NavItem[];
  children: React.ReactNode;
}) {
  const [open, setOpenState] = React.useState(false);
  const lastTriggerRef = React.useRef<HTMLElement | null>(null);

  const captureActiveElement = React.useCallback(() => {
    const active = document.activeElement;
    if (
      active instanceof HTMLElement &&
      active !== document.body &&
      active.tagName !== "BODY"
    ) {
      lastTriggerRef.current = active;
    } else {
      lastTriggerRef.current = null;
    }
  }, []);

  const setOpen = React.useCallback(
    (value: boolean) => {
      if (value) {
        captureActiveElement();
      }
      setOpenState(value);
    },
    [captureActiveElement],
  );

  const toggle = React.useCallback(() => {
    setOpenState((value) => {
      if (!value) captureActiveElement();
      return !value;
    });
  }, [captureActiveElement]);

  const restoreFocus = React.useCallback(() => {
    const target = lastTriggerRef.current ?? document.body;
    lastTriggerRef.current = null;
    target?.focus?.();
  }, []);
  const pathname = usePathname();
  const resolvedItems = React.useMemo(() => {
    if (items.length) return items;
    if (TEST_MODE) return TEST_MENU_ITEMS;
    return items;
  }, [items]);

  React.useEffect(() => {
    setOpen(false);
  }, [pathname, setOpen]);

  React.useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      const platform = globalThis.navigator?.platform ?? "";
      const isMod = /Mac|iPhone|iPad/i.test(platform)
        ? event.metaKey
        : event.ctrlKey;
      if (!isMod) return;
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [toggle]);

  const ctx: Ctx = {
    open,
    setOpen,
    toggle,
    items: resolvedItems,
    restoreFocus,
  };

  return (
    <CommandMenuContext.Provider value={ctx}>
      {children}
    </CommandMenuContext.Provider>
  );
}

export function useCommandMenu() {
  const ctx = React.useContext(CommandMenuContext);
  if (!ctx) {
    throw new Error("useCommandMenu must be used within CommandMenuProvider");
  }
  return ctx;
}

type PersonaGroup = {
  key: string;
  label: string;
  items: FlatLink[];
};

const GENERAL_PERSONA_KEY = "__general";
const GENERAL_PERSONA_LABEL = "General";

function Icon({ name, className }: { name?: string; className?: string }) {
  if (!name) return null;
  const maybeIcon = Lucide[name as keyof typeof Lucide];
  if (typeof maybeIcon !== "function") return null;
  const Component = maybeIcon as React.ComponentType<{ className?: string }>;
  return <Component className={className} aria-hidden="true" />;
}

function buildPersonaGroups(flat: FlatLink[]): PersonaGroup[] {
  const order: string[] = [];
  const lookup = new Map<string, PersonaGroup>();

  for (const link of flat) {
    const key = link.persona?.id ?? GENERAL_PERSONA_KEY;
    if (!lookup.has(key)) {
      lookup.set(key, {
        key,
        label: link.persona?.label ?? GENERAL_PERSONA_LABEL,
        items: [],
      });
      order.push(key);
    }
    const group = lookup.get(key);
    if (group) {
      group.items.push(link);
    }
  }

  return order.map((key) => {
    const group = lookup.get(key);
    if (!group) {
      return {
        key,
        label: GENERAL_PERSONA_LABEL,
        items: [],
      } satisfies PersonaGroup;
    }
    return group;
  });
}

function buildHotkeyLookup(flat: FlatLink[]): Map<number, FlatLink> {
  const map = new Map<number, FlatLink>();
  for (const link of flat) {
    if (!link.hotkeyIndex) continue;
    if (!map.has(link.hotkeyIndex)) {
      map.set(link.hotkeyIndex, link);
    }
  }
  return map;
}

export default function CommandMenu() {
  const { open, setOpen, items, restoreFocus } = useCommandMenu();
  const router = useRouter();
  const flat = React.useMemo(() => flattenLinks(items), [items]);
  const [recentItems, setRecentItems] = React.useState(() => readRecent());
  const prevOpenRef = React.useRef(open);
  const lastSearchLen = React.useRef<number | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const openViaTest = React.useCallback(() => setOpen(true), [setOpen]);

  React.useEffect(() => {
    const refresh = () => setRecentItems(readRecent());
    refresh();
    window.addEventListener(RECENTS_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(RECENTS_UPDATED_EVENT, refresh);
  }, []);

  React.useEffect(() => {
    if (open && !prevOpenRef.current) {
      analytics.track("menu.cmdk.open");
    }
    prevOpenRef.current = open;
    if (!open) {
      lastSearchLen.current = null;
      setSearchQuery("");
    }
  }, [open]);

  React.useEffect(() => {
    if (!TEST_MODE) return;
    if (typeof globalThis === "undefined") return;
    const scope = globalThis as any;
    const target = scope.__navTest ?? {};
    target.openCmdk = openViaTest;
    scope.__navTest = target;
    return () => {
      if (scope.__navTest?.openCmdk === openViaTest) {
        delete scope.__navTest.openCmdk;
      }
    };
  }, [openViaTest]);

  const featured = React.useMemo(
    () => flat.filter((link) => link.featured),
    [flat],
  );

  const hotkeyLookup = React.useMemo(() => buildHotkeyLookup(flat), [flat]);

  const byHref = React.useMemo(() => {
    const map = new Map<string, FlatLink>();
    for (const link of flat) {
      if (!map.has(link.href)) {
        map.set(link.href, link);
      }
    }
    return map;
  }, [flat]);

  const recentLinks = React.useMemo(() => {
    const items: FlatLink[] = [];
    const featuredHrefs = new Set(featured.map((link) => link.href));
    const seenHrefs = new Set<string>();
    for (const recent of recentItems) {
      if (featuredHrefs.has(recent.href) || seenHrefs.has(recent.href))
        continue;
      seenHrefs.add(recent.href);
      const link = byHref.get(recent.href);
      items.push(
        link ?? {
          id: `recent:${recent.href}`,
          kind: "link",
          label: recent.title,
          href: recent.href,
          featured: false,
          pathLabels: recent.category
            ? [recent.category, recent.title]
            : [recent.title],
          keywords: [recent.title, recent.category ?? ""].filter(Boolean),
        },
      );
    }
    return items;
  }, [byHref, featured, recentItems]);

  const personaGroups = React.useMemo(() => buildPersonaGroups(flat), [flat]);

  const handleSelect = React.useCallback(
    (link: FlatLink) => {
      setRecentItems((prev) => {
        const next = upsertRecent(prev, {
          href: link.href,
          title: link.label,
          ...(link.persona?.label ? { category: link.persona.label } : {}),
        });
        saveRecent(next);
        return next;
      });

      analytics.track("menu.cmdk.select", {
        path: link.href,
        featureKey: link.featureKey ?? null,
        persona: link.persona?.id ?? null,
      });

      setOpen(false);

      if (link.kind === "external") {
        const win = globalThis.window;
        if (win) {
          if (link.target === "_blank") {
            win.open(link.href, "_blank", "noopener");
          } else {
            win.location.assign(link.href);
          }
        }
        return;
      }

      router.push(link.href as Route);
    },
    [router, setOpen],
  );

  const handleSiteSearch = React.useCallback(() => {
    const query = searchQuery.trim();
    if (!query) return;
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(query)}` as Route);
  }, [router, searchQuery, setOpen]);

  React.useEffect(() => {
    if (!open) return;
    const handleNumberHotkey = (event: KeyboardEvent) => {
      const platform = globalThis.navigator?.platform ?? "";
      const isMod = /Mac|iPhone|iPad/i.test(platform)
        ? event.metaKey
        : event.ctrlKey;
      if (!isMod) return;

      const value = Number.parseInt(event.key, 10);
      if (!Number.isFinite(value)) return;

      const link = hotkeyLookup.get(value);
      if (!link) return;

      event.preventDefault();
      handleSelect(link);
    };

    window.addEventListener("keydown", handleNumberHotkey);
    return () => window.removeEventListener("keydown", handleNumberHotkey);
  }, [handleSelect, hotkeyLookup, open]);

  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
      queueMicrotask(restoreFocus);
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [open, restoreFocus, setOpen]);

  const renderItem = React.useCallback(
    (link: FlatLink) => {
      const contextLabels = link.pathLabels
        .slice(0, -1)
        .filter((label) => label !== link.persona?.label);
      const contextText = contextLabels.join(" / ");

      const personaLabel = link.persona?.label ?? GENERAL_PERSONA_LABEL;
      const menuItemTestId = link.featureKey
        ? `menu-item-${link.featureKey}`
        : `menu-item-${link.id}`;

      return (
        <CommandItem
          key={`${link.kind}:${link.id}`}
          value={[link.label, personaLabel, link.keywords.join(" "), link.href]
            .filter(Boolean)
            .join(" ")}
          keywords={link.keywords}
          onSelect={() => handleSelect(link)}
          data-featured={link.featured ? "true" : undefined}
          data-testid={menuItemTestId}
        >
          {link.icon ? (
            <span className="mr-2 inline-flex size-6 items-center justify-center rounded-md bg-[color:var(--surface-page)] text-[color:var(--blue-contrast)]">
              <Icon name={link.icon} className="size-3.5" />
            </span>
          ) : null}
          <span className="min-w-0 flex-1">
            <span className="block truncate font-medium">{link.label}</span>
            {contextText ? (
              <span className="block truncate text-xs opacity-60">
                {contextText}
              </span>
            ) : link.persona ? (
              <span className="block truncate text-xs opacity-60">
                {link.persona.label}
              </span>
            ) : null}
          </span>
          {link.badge ? (
            <span
              className="ml-2 rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-wide opacity-80"
              data-tone={link.badge.tone}
              data-type={link.badge.type}
            >
              {link.badge.text}
            </span>
          ) : null}
          {link.hotkey ? (
            <CommandShortcut>{link.hotkey}</CommandShortcut>
          ) : null}
        </CommandItem>
      );
    },
    [handleSelect],
  );

  const sections = React.useMemo(() => {
    const nodes: Array<{ key: string; element: React.ReactNode }> = [];
    const isSearching = searchQuery.trim().length > 0;

    if (!isSearching && featured.length) {
      nodes.push({
        key: "featured",
        element: (
          <CommandGroup heading="Featured">
            {featured.map((link) => renderItem(link))}
          </CommandGroup>
        ),
      });
    }

    if (!isSearching && recentLinks.length) {
      nodes.push({
        key: "recent",
        element: (
          <CommandGroup heading="Recently Viewed">
            {recentLinks.map((link) => renderItem(link))}
          </CommandGroup>
        ),
      });
    }

    if (isSearching && personaGroups.length) {
      nodes.push({
        key: "all",
        element: (
          <>
            {personaGroups.map((group) => (
              <CommandGroup key={group.key} heading={group.label}>
                {group.items.map((link) => renderItem(link))}
              </CommandGroup>
            ))}
          </>
        ),
      });
    }

    return nodes;
  }, [featured, personaGroups, recentLinks, renderItem, searchQuery]);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <Command
        data-testid="cmdk"
        data-state={open ? "open" : "closed"}
        aria-hidden={open ? undefined : "true"}
        hidden={!open}
        className="bg-[var(--surface)] text-[var(--text)]"
      >
        <CommandInput
          placeholder="Find a page or search tullyelly…"
          onValueChange={(value) => {
            setSearchQuery(value);
            const trimmed = value.trim();
            const length = trimmed.length;
            if (lastSearchLen.current === length) return;
            lastSearchLen.current = length;
            analytics.track("menu.cmdk.search", { qLen: length });
          }}
        />
        <CommandList>
          <CommandEmpty>
            {searchQuery.trim()
              ? "No navigation matches."
              : "Start typing to find a destination."}
          </CommandEmpty>
          {sections.map((section, index) => (
            <React.Fragment key={section.key}>
              {section.element}
              {index < sections.length - 1 ? <CommandSeparator /> : null}
            </React.Fragment>
          ))}
          {searchQuery.trim() ? (
            <div className="sticky bottom-0 mt-2 border-t border-black/10 bg-[var(--surface)] pt-2">
              <CommandGroup heading="Search the whole site" className="mb-0">
                <CommandItem
                  value={`Search all tullyelly ${searchQuery}`}
                  onSelect={handleSiteSearch}
                  className="font-medium text-[color:var(--blue-contrast)]"
                >
                  <Icon name="Search" className="mr-2 size-4" />
                  <span className="truncate">
                    Search all tullyelly for &quot;{searchQuery.trim()}&quot;
                  </span>
                  <Icon name="ArrowRight" className="ml-auto size-4" />
                </CommandItem>
              </CommandGroup>
            </div>
          ) : null}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
