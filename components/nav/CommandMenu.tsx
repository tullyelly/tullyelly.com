"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import type { NavItem, PersonaItem } from "@/types/nav";
import {
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
      <CommandInput placeholder="Type a page or feature…" />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>
        {/* Command groups wired in follow-up prompt */}
      </CommandList>
    </CommandDialog>
  );
}
