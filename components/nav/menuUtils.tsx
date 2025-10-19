import * as React from "react";
import * as Lucide from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { NavItem, Persona } from "@/types/nav";

export type AnyLink = Extract<NavItem, { kind: "link" | "external" }>;

export const PERSONA_EMOJI: Record<Persona, string> = {
  shaolin: "🧘",
  mark2: "🧠",
  tullyelly: "⚒️",
  cardattack: "🃏",
  theabbott: "🪶",
  unclejimmy: "🎙",
};

export const HOME_EMOJI = "🏠";

export function Icon({
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

export function normalizePath(value: string): string {
  return value.replace(/\/+$/, "") || "/";
}

export function isActiveHref(pathname: string, href?: string | null): boolean {
  if (!href) return false;
  try {
    return normalizePath(pathname) === normalizePath(href);
  } catch {
    return false;
  }
}

export function readHotkey(node: AnyLink): string | undefined {
  const anyNode = node as any;
  return anyNode?.meta?.hotkey || node.hotkey;
}
