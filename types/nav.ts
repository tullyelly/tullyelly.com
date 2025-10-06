import type { CapabilityKey as CapabilityKeyType } from "@/app/_auth/capabilities";

export type CapabilityKey = CapabilityKeyType;

export type Persona =
  | "mark2"
  | "tullyelly"
  | "cardattack"
  | "theabbott"
  | "unclejimmy";

export type BadgeTone = "info" | "success" | "warn" | "danger" | "new";
export type BadgeType = "featured";
export type FeatureKey = string;

export interface Badge {
  text: string;
  tone?: BadgeTone;
  type?: BadgeType;
}

interface BaseItem {
  id: string;
  label: string;
  icon?: string;
  badge?: Badge;
  hotkey?: string;
  featureKey?: FeatureKey;
  requires?: CapabilityKey[];
  hidden?: boolean;
  featured?: boolean;
  segmentLabel?: string;
  keywords?: string[];
}

export type NavItem = PersonaItem | LinkItem | ExternalItem | GroupItem;

export interface PersonaItem extends BaseItem {
  kind: "persona";
  persona: Persona;
  children?: NavItem[];
}

export interface LinkItem extends BaseItem {
  kind: "link";
  href: string;
}

export interface ExternalItem extends BaseItem {
  kind: "external";
  href: string;
  target?: "_self" | "_blank";
}

export interface GroupItem extends BaseItem {
  kind: "group";
  children: NavItem[];
}

export function isCapabilityKeyArray(value: unknown): value is CapabilityKey[] {
  if (!Array.isArray(value)) return false;
  return value.every(
    (item) => typeof item === "string" && item.trim().length > 0,
  );
}
