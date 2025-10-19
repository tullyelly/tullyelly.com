import type { NavItem } from "@/types/nav";

export interface MenuIndex {
  byPath: Map<string, NavItem>;
  parents: Map<string, string | null>;
}

function normalizePath(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const [path] = raw.split(/[?#]/, 1);
  if (!path) return null;
  if (!path.startsWith("/")) return null;
  const trimmed = path.replace(/\/+$/, "");
  return trimmed.length ? trimmed : "/";
}

function shouldIndex(
  node: NavItem,
): node is Extract<NavItem, { kind: "link" }> {
  return node.kind === "link";
}

function trimPath(path: string): string | null {
  if (path === "/") return null;
  const idx = path.lastIndexOf("/");
  if (idx <= 0) return "/";
  const next = path.slice(0, idx);
  return next.length ? next : "/";
}

export function buildMenuIndex(tree: NavItem[]): MenuIndex {
  const byPath = new Map<string, NavItem>();
  const parents = new Map<string, string | null>();

  const walk = (nodes: NavItem[] | undefined, parentPath: string | null) => {
    if (!nodes) return;

    for (const node of nodes) {
      if (!node || node.hidden) continue;

      let currentParent = parentPath;

      if (shouldIndex(node)) {
        const path = normalizePath(node.href);
        if (path) {
          byPath.set(path, node);
          parents.set(path, parentPath ?? null);
          currentParent = path;
        }
      }

      if ("children" in node && Array.isArray(node.children)) {
        walk(node.children, currentParent ?? parentPath ?? null);
      }
    }
  };

  walk(tree, null);

  const orderedPaths = Array.from(byPath.keys()).sort(
    (a, b) => a.length - b.length,
  );

  for (const path of orderedPaths) {
    if (path === "/") continue;
    const currentParent = parents.get(path);
    if (currentParent) continue;

    let candidate = trimPath(path);
    while (candidate) {
      if (byPath.has(candidate)) {
        parents.set(path, candidate);
        break;
      }
      candidate = trimPath(candidate);
    }
  }

  return { byPath, parents };
}

export function __normalizeMenuPath(path: string): string | null {
  return normalizePath(path);
}
