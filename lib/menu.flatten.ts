import type { Badge, FeatureKey, NavItem, Persona } from "@/types/nav";

export type FlatPersona = {
  id: Persona;
  label: string;
};

export type FlatLink = {
  id: string;
  kind: "link" | "external";
  label: string;
  href: string;
  target?: "_self" | "_blank";
  icon?: string;
  hotkey?: string;
  hotkeyIndex?: number;
  badge?: Badge;
  featured: boolean;
  featureKey?: FeatureKey;
  persona?: FlatPersona;
  pathLabels: string[];
  keywords: string[];
};

function cleanLabel(label: unknown): string | undefined {
  if (typeof label !== "string") return undefined;
  const trimmed = label.trim();
  return trimmed.length ? trimmed : undefined;
}

function readSegmentLabel(node: NavItem): string {
  if ("segmentLabel" in node) {
    const label = cleanLabel((node as { segmentLabel?: unknown }).segmentLabel);
    if (label) return label;
  }
  return node.label;
}

function readKeywords(node: NavItem): string[] {
  if ("keywords" in node) {
    const raw = (node as { keywords?: unknown }).keywords;
    if (Array.isArray(raw)) {
      return raw
        .map(cleanLabel)
        .filter((entry): entry is string => Boolean(entry));
    }
  }
  return [];
}

function parseHotkeyIndex(hotkey: string | undefined): number | undefined {
  if (!hotkey) return undefined;
  const match = hotkey.match(/(\d)/);
  if (!match) return undefined;
  const value = Number.parseInt(match[1], 10);
  if (!Number.isFinite(value)) return undefined;
  if (value < 1 || value > 9) return undefined;
  return value;
}

function buildHrefKeywords(href: string): string[] {
  try {
    const normalized = href.split(/[?#]/, 1)[0];
    const parts = normalized.split("/").filter(Boolean);
    if (!parts.length) return [];
    const tail = parts[parts.length - 1];
    const keywords = new Set<string>();
    keywords.add(tail);
    if (parts.length > 1) {
      keywords.add(parts.slice(-2).join("/"));
    }
    return Array.from(keywords);
  } catch {
    return [];
  }
}

function collectPathLabels(path: string[], label: string): string[] {
  return [...path, label];
}

export function flattenLinks(tree: NavItem[]): FlatLink[] {
  const results: FlatLink[] = [];

  const walk = (
    nodes: NavItem[] | undefined,
    context: {
      persona?: FlatPersona;
      path: string[];
    },
  ) => {
    if (!nodes) return;

    for (const node of nodes) {
      if (!node || node.hidden) continue;

      if (node.kind === "persona") {
        const persona: FlatPersona = {
          id: node.persona,
          label: node.label,
        };
        const label = readSegmentLabel(node);
        const path = collectPathLabels(context.path, label);
        walk(node.children, { persona, path });
        continue;
      }

      if (node.kind === "group") {
        const label = readSegmentLabel(node);
        const path = collectPathLabels(context.path, label);
        walk(node.children, { persona: context.persona, path });
        continue;
      }

      if (node.kind === "link" || node.kind === "external") {
        const label = readSegmentLabel(node);
        const pathLabels = collectPathLabels(context.path, label);
        const keywords = new Set<string>([
          ...pathLabels,
          ...readKeywords(node),
          ...buildHrefKeywords(node.href),
        ]);
        const entry: FlatLink = {
          id: node.id,
          kind: node.kind,
          label: node.label,
          href: node.href,
          target: node.kind === "external" ? node.target : undefined,
          icon: node.icon,
          hotkey: node.hotkey,
          hotkeyIndex: parseHotkeyIndex(node.hotkey),
          badge: node.badge,
          featured: Boolean(node.featured || node.badge?.type === "featured"),
          featureKey: node.featureKey,
          persona: context.persona,
          pathLabels,
          keywords: Array.from(keywords).filter(Boolean),
        };
        results.push(entry);
        continue;
      }
    }
  };

  walk(tree, { path: [] });

  return results;
}
