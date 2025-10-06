"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
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
import { readRecent, saveRecent, upsertRecent } from "@/lib/menu.recents";

type Ctx = {
  open: boolean;
  setOpen(value: boolean): void;
  toggle(): void;
  items: NavItem[];
};
const CommandMenuContext = React.createContext<Ctx | null>(null);

export function CommandMenuProvider({
  items,
  children,
}: {
  items: NavItem[];
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const toggle = React.useCallback(() => setOpen((value) => !value), []);
  const pathname = usePathname();

  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

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

  const ctx: Ctx = { open, setOpen, toggle, items };

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
  const { open, setOpen, items } = useCommandMenu();
  const router = useRouter();
  const flat = React.useMemo(() => flattenLinks(items), [items]);
  const [recentIds, setRecentIds] = React.useState<string[]>(() =>
    readRecent(),
  );

  React.useEffect(() => {
    setRecentIds(readRecent());
  }, []);

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
    for (const href of recentIds) {
      const link = byHref.get(href);
      if (link) {
        items.push(link);
      }
    }
    return items;
  }, [byHref, recentIds]);

  const personaGroups = React.useMemo(() => buildPersonaGroups(flat), [flat]);

  const handleSelect = React.useCallback(
    (link: FlatLink) => {
      setRecentIds((prev) => {
        const next = upsertRecent(prev, link.href);
        saveRecent(next);
        return next;
      });

      analytics.track("menu.command.select", {
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

      router.push(link.href);
    },
    [router, setOpen],
  );

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

  const renderItem = React.useCallback(
    (link: FlatLink) => {
      const contextLabels = link.pathLabels
        .slice(0, -1)
        .filter((label) => label !== link.persona?.label);
      const contextText = contextLabels.join(" / ");

      const personaLabel = link.persona?.label ?? GENERAL_PERSONA_LABEL;

      return (
        <CommandItem
          key={`${link.kind}:${link.id}`}
          value={[link.label, personaLabel, link.keywords.join(" "), link.href]
            .filter(Boolean)
            .join(" ")}
          keywords={link.keywords}
          onSelect={() => handleSelect(link)}
          data-featured={link.featured ? "true" : undefined}
        >
          <span className="mr-2 inline-flex size-5 items-center justify-center rounded-md border">
            {link.icon ? <Icon name={link.icon} className="size-3.5" /> : null}
          </span>
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

    if (featured.length) {
      nodes.push({
        key: "featured",
        element: (
          <CommandGroup heading="Featured">
            {featured.map((link) => renderItem(link))}
          </CommandGroup>
        ),
      });
    }

    if (recentLinks.length) {
      nodes.push({
        key: "recent",
        element: (
          <CommandGroup heading="Recent">
            {recentLinks.map((link) => renderItem(link))}
          </CommandGroup>
        ),
      });
    }

    if (personaGroups.length) {
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
  }, [featured, personaGroups, recentLinks, renderItem]);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <Command className="bg-[var(--surface)] text-[var(--text)]">
        <CommandInput placeholder="Type a page or feature…" />
        <CommandList>
          <CommandEmpty>No results.</CommandEmpty>
          {sections.map((section, index) => (
            <React.Fragment key={section.key}>
              {section.element}
              {index < sections.length - 1 ? <CommandSeparator /> : null}
            </React.Fragment>
          ))}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
