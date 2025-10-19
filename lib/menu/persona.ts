import type { NavItem, PersonaItem } from "@/types/nav";
import { __normalizeMenuPath } from "@/lib/menu.index";

export type ResolvedPersona = {
  id: string;
  persona: PersonaItem["persona"];
  label: string;
  icon?: string;
} | null;

export function resolvePersonaForPath(
  tree: NavItem[],
  pathname: string,
): ResolvedPersona {
  const normalizedPath = __normalizeMenuPath(pathname);
  if (!normalizedPath) return null;

  let match: ResolvedPersona = null;

  const visit = (
    nodes: NavItem[] | undefined,
    activePersona: ResolvedPersona,
  ) => {
    if (!nodes || match) return;

    for (const node of nodes) {
      if (!node || node.hidden) continue;

      if (node.kind === "persona") {
        const persona: ResolvedPersona = {
          id: node.id,
          persona: node.persona,
          label: node.label,
          icon: node.icon ?? undefined,
        };
        visit(node.children, persona);
        continue;
      }

      if (node.kind === "group") {
        visit(node.children, activePersona);
        continue;
      }

      if (node.kind === "link" || node.kind === "external") {
        if (!activePersona) continue;
        const href = __normalizeMenuPath(node.href);
        if (href && href === normalizedPath) {
          match = activePersona;
          return;
        }
      }

      if ("children" in node && Array.isArray(node.children)) {
        visit(node.children, activePersona);
      }
    }
  };

  visit(tree, null);
  return match;
}
