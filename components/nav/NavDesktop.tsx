"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
} from "@/components/ui/navigation-menu";
import type { NavItem, PersonaItem } from "@/types/nav";
import * as Lucide from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useHasReducedMotion } from "@/hooks/use-has-reduced-motion";
import { useCommandMenu } from "@/components/nav/CommandMenu";

type Props = {
  items?: NavItem[]; // Expect personas at top level
};

function isPersona(x: NavItem): x is PersonaItem {
  return x.kind === "persona";
}

function Icon({
  name,
  className,
}: {
  name?: string;
  className?: string;
}): React.ReactNode {
  if (!name) return null;
  const maybeIcon = Lucide[name as keyof typeof Lucide];
  if (typeof maybeIcon !== "function") return null;
  const IconComponent = maybeIcon as LucideIcon;
  return <IconComponent className={className} aria-hidden="true" />;
}

function isActiveHref(pathname: string, href?: string | null): boolean {
  if (!href) return false;
  try {
    const a = pathname.replace(/\/$/, "");
    const b = href.replace(/\/$/, "");
    return a === b || a.startsWith(`${b}/`);
  } catch {
    return false;
  }
}

export default function NavDesktop({ items }: Props): React.ReactNode {
  const pathname = usePathname();
  const personas = (items ?? []).filter(isPersona);

  const { setOpen } = useCommandMenu();
  const openCommand = React.useCallback(() => setOpen(true), [setOpen]);

  const HOVER_OPEN_DELAY = 120;
  const HOVER_CLOSE_DELAY = 180;
  const prefersReduced = useHasReducedMotion();
  const [openIdx, setOpenIdx] = React.useState<number | null>(null);
  const openTimer = React.useRef<number | null>(null);
  const closeTimer = React.useRef<number | null>(null);

  function scheduleOpen(i: number) {
    if (prefersReduced) {
      setOpenIdx(i);
      return;
    }
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    if (openTimer.current) window.clearTimeout(openTimer.current);
    openTimer.current = window.setTimeout(
      () => setOpenIdx(i),
      HOVER_OPEN_DELAY,
    );
  }
  function scheduleClose() {
    if (prefersReduced) {
      setOpenIdx(null);
      return;
    }
    if (openTimer.current) {
      window.clearTimeout(openTimer.current);
      openTimer.current = null;
    }
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(
      () => setOpenIdx(null),
      HOVER_CLOSE_DELAY,
    );
  }

  // Nothing to render if no data yet (layout will pass it later)
  if (!personas.length) return null;

  return (
    <nav className="hidden md:block bg-transparent text-white shadow-sm relative z-40">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-2">
        <NavigationMenu
          // Radix manages focus & roving tabindex for keyboard use
          className="w-full max-w-none"
        >
          <NavigationMenuList className="gap-3 justify-start">
            {personas.map((p, i) => (
              <NavigationMenuItem
                key={p.id}
                onMouseEnter={() => scheduleOpen(i)}
                onMouseLeave={scheduleClose}
              >
                <NavigationMenuTrigger className="gap-2 rounded-md bg-blue/0 text-white hover:bg-white/10 focus-visible:ring-white/60 data-[state=open]:bg-white/20">
                  <Icon name={p.icon} className="size-4" />
                  <span>{p.label}</span>
                </NavigationMenuTrigger>
                <NavigationMenuContent
                  className="z-[90] mt-2 rounded-xl border border-blue/20 bg-background p-3 shadow-xl"
                  onMouseEnter={() => scheduleOpen(i)}
                  onMouseLeave={scheduleClose}
                >
                  <PersonaPanel persona={p} pathname={pathname ?? ""} />
                </NavigationMenuContent>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>
        <button
          type="button"
          onClick={openCommand}
          className="ml-4 inline-flex items-center gap-2 rounded-md border border-white/40 bg-white/10 px-3 py-2 text-sm font-medium text-white hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
        >
          <Lucide.Command className="size-4" aria-hidden="true" />
          <span>Search</span>
          <span className="hidden text-xs opacity-75 lg:inline">⌘K</span>
        </button>
      </div>
    </nav>
  );
}

type AnyLink = Extract<NavItem, { kind: "link" | "external" }>;

function readDesc(node: AnyLink): string | undefined {
  const anyNode = node as any;
  return anyNode?.meta?.desc as string | undefined;
}

function readHotkey(node: AnyLink): string | undefined {
  const anyNode = node as any;
  return anyNode?.meta?.hotkey || node.hotkey;
}

function PersonaPanel({
  persona,
  pathname,
}: {
  persona: PersonaItem;
  pathname: string;
}): React.ReactNode {
  const links = (persona.children ?? []).filter(
    (c) => c.kind === "link" || c.kind === "external",
  );

  return (
    <div className="grid min-w-[520px] grid-cols-2 gap-3 md:min-w-[680px]">
      {links.map((child) => {
        const href =
          child.kind === "link" || child.kind === "external" ? child.href : "#";
        const active =
          href &&
          pathname &&
          (pathname === href || pathname.startsWith(`${href}/`));
        return (
          <Link
            key={child.id}
            href={href ?? "#"}
            prefetch
            className={[
              "group rounded-xl border p-3 outline-none transition",
              "hover:shadow-sm focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "border-foreground/30 bg-accent/30"
                : "border-border bg-background",
            ].join(" ")}
          >
            <div className="flex items-center gap-2">
              <Icon name={child.icon} className="size-4" />
              <span className="font-medium">{child.label}</span>
              {child.badge?.text ? (
                <span
                  className="ml-auto inline-flex items-center rounded-md px-2 py-0.5 text-xs"
                  data-tone={child.badge.tone || "new"}
                >
                  {child.badge.text}
                </span>
              ) : null}
            </div>
            {/* Optional description if present in meta; DB meta may carry it as 'desc' */}
            {/* We intentionally keep this light; full renderer comes next prompt */}
          </Link>
        );
      })}
    </div>
  );
}
