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

  // Nothing to render if no data yet (layout will pass it later)
  if (!personas.length) return null;

  return (
    <nav className="hidden border-b md:block">
      <div className="mx-auto max-w-7xl px-4">
        <NavigationMenu
          // Radix manages focus & roving tabindex for keyboard use
          className="w-full"
        >
          <NavigationMenuList className="gap-2">
            {personas.map((p) => (
              <NavigationMenuItem key={p.id}>
                <NavigationMenuTrigger className="gap-2">
                  <Icon name={p.icon} className="size-4" />
                  <span className="capitalize">{p.label}</span>
                </NavigationMenuTrigger>
                <NavigationMenuContent className="p-3">
                  <PersonaPanel persona={p} pathname={pathname ?? ""} />
                </NavigationMenuContent>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>
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
