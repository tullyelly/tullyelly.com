"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import type { NavItem, PersonaItem } from "@/types/nav";
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

type AnyLink = Extract<NavItem, { kind: "link" | "external" }>;
type FlatCmd = {
  id: string;
  persona: string;
  label: string;
  href: string;
  icon?: string;
  hotkey?: string;
  badgeText?: string;
  badgeTone?: string;
  featured?: boolean;
};

function isPersona(x: NavItem): x is PersonaItem {
  return x.kind === "persona";
}

function Icon({ name, className }: { name?: string; className?: string }) {
  if (!name) return null;
  const maybeIcon = Lucide[name as keyof typeof Lucide];
  if (typeof maybeIcon !== "function") return null;
  const IconComponent = maybeIcon as React.ComponentType<{
    className?: string;
  }>;
  return <IconComponent className={className} aria-hidden="true" />;
}

function flatten(items: NavItem[]): FlatCmd[] {
  const out: FlatCmd[] = [];
  for (const node of items) {
    if (isPersona(node)) {
      const persona = node.label;
      for (const c of node.children ?? []) {
        if (c.kind === "link" || c.kind === "external") {
          out.push({
            id: c.id,
            persona,
            label: c.label,
            href: c.href,
            icon: c.icon,
            hotkey: (c as AnyLink).hotkey,
            badgeText: c.badge?.text,
            badgeTone: c.badge?.tone,
            featured: c.badge?.tone === "new" || c.badge?.text === "NEW",
          });
        }
      }
    }
  }
  return out;
}

// ---- Provider

type Ctx = {
  open: boolean;
  setOpen(v: boolean): void;
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
  const toggle = React.useCallback(() => setOpen((v) => !v), []);
  const pathname = usePathname();

  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isMod = navigator.platform.includes("Mac") ? e.metaKey : e.ctrlKey;
      if (isMod && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
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
  if (!ctx)
    throw new Error("useCommandMenu must be used within CommandMenuProvider");
  return ctx;
}

// ---- Component

export default function CommandMenu() {
  const { open, setOpen, items } = useCommandMenu();
  const router = useRouter();
  const flat = React.useMemo(() => flatten(items), [items]);

  const onSelect = (href: string) => {
    try {
      const k = "__cmdmenu_recent";
      const list = JSON.parse(localStorage.getItem(k) || "[]");
      const next = [href, ...list.filter((x: string) => x !== href)].slice(
        0,
        20,
      );
      localStorage.setItem(k, JSON.stringify(next));
    } catch {}
    setOpen(false);
    router.push(href);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <Command className="bg-[var(--surface)] text-[var(--text)]">
        <CommandInput placeholder="Type a page or feature…" />
        <CommandList>
          <CommandEmpty>No results.</CommandEmpty>
          {/* Featured / recent group (in next prompt we’ll rank; for now, basic order) */}
          {/* Persona groups */}
          {Array.from(new Set(flat.map((x) => x.persona))).map((persona) => {
            const items = flat.filter((x) => x.persona === persona);
            if (!items.length) return null;
            return (
              <CommandGroup key={persona} heading={persona}>
                {items.map((it) => (
                  <CommandItem
                    key={it.id}
                    value={`${it.label} ${persona}`}
                    onSelect={() => onSelect(it.href)}
                    keywords={[persona, it.label]}
                  >
                    <span className="mr-2 inline-flex size-5 items-center justify-center rounded-md border">
                      {it.icon
                        ? Icon({ name: it.icon, className: "size-3.5" })
                        : null}
                    </span>
                    <span className="flex-1">
                      <span className="font-medium">{it.label}</span>
                      <span className="ml-1 opacity-60">› {persona}</span>
                    </span>
                    {it.badgeText ? (
                      <span className="mr-2 text-[10px] opacity-70">
                        {it.badgeText}
                      </span>
                    ) : null}
                    {it.hotkey ? (
                      <CommandShortcut>{it.hotkey}</CommandShortcut>
                    ) : null}
                  </CommandItem>
                ))}
              </CommandGroup>
            );
          })}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
