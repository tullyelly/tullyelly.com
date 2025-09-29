export type Persona =
  | "mark2"
  | "tullyelly"
  | "cardattack"
  | "theabbott"
  | "unclejimmy";

export type BadgeTone = "info" | "success" | "warn" | "danger" | "new";
export type FeatureKey = string;
export type CapabilityKey = string;

export interface Badge {
  text: string;
  tone?: BadgeTone;
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
