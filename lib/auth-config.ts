// lib/auth-config.ts
type Rules = {
  ownerDomains: string[];
  publicPaths: string[];
  protectedPaths: string[];
  ownerOnlyPaths: string[];
  toggles?: {
    allowAnyEmailOnPreview?: boolean;
  };
};

const DEFAULT_RULES: Rules = {
  ownerDomains: ["tullyelly.com"],
  publicPaths: ["/", "/login", "/api/auth"],
  protectedPaths: ["/shaolin-scrolls", "/admin"],
  ownerOnlyPaths: ["/shaolin-scrolls/admin"],
  toggles: { allowAnyEmailOnPreview: false }
};

function normPath(p: string): string {
  if (!p) return "/";
  if (!p.startsWith("/")) p = `/${p}`;
  if (p !== "/" && p.endsWith("/")) p = p.slice(0, -1);
  return p;
}
function unique(a: string[]) {
  return Array.from(new Set(a));
}

function parseRules(): Rules {
  const raw = process.env.AUTH_RULES_JSON;
  if (!raw) return DEFAULT_RULES;
  try {
    const o = JSON.parse(raw);
    const ownerDomains = Array.isArray(o.ownerDomains) ? o.ownerDomains.map(String) : DEFAULT_RULES.ownerDomains;
    const publicPaths = Array.isArray(o.publicPaths) ? o.publicPaths.map(String).map(normPath) : DEFAULT_RULES.publicPaths;
    const protectedPaths = Array.isArray(o.protectedPaths) ? o.protectedPaths.map(String).map(normPath) : DEFAULT_RULES.protectedPaths;
    const ownerOnlyPaths = Array.isArray(o.ownerOnlyPaths) ? o.ownerOnlyPaths.map(String).map(normPath) : DEFAULT_RULES.ownerOnlyPaths;
    const toggles = {
      allowAnyEmailOnPreview:
        !!(o.toggles && typeof o.toggles.allowAnyEmailOnPreview === "boolean"
          ? o.toggles.allowAnyEmailOnPreview
          : DEFAULT_RULES.toggles?.allowAnyEmailOnPreview)
    };
    return {
      ownerDomains: unique(ownerDomains.map(s => s.toLowerCase())),
      publicPaths: unique(publicPaths),
      protectedPaths: unique(protectedPaths),
      ownerOnlyPaths: unique(ownerOnlyPaths),
      toggles
    };
  } catch {
    return DEFAULT_RULES;
  }
}

export const RULES = parseRules();

function startsWithAny(pathname: string, prefixes: string[]) {
  const path = normPath(pathname);
  return prefixes.some(prefix => {
    const p = normPath(prefix);
    return path === p || path.startsWith(p + "/");
  });
}

export function isPublicPath(pathname: string) {
  // Root is always public
  if (normPath(pathname) === "/") return true;
  return startsWithAny(pathname, RULES.publicPaths);
}
export function isOwnerOnlyPath(pathname: string) {
  return startsWithAny(pathname, RULES.ownerOnlyPaths);
}
export function isProtectedPath(pathname: string) {
  return isOwnerOnlyPath(pathname) || startsWithAny(pathname, RULES.protectedPaths);
}
export function emailIsOwner(email?: string | null) {
  if (!email) return false;
  const lower = email.toLowerCase();
  return RULES.ownerDomains.some(d => lower.endsWith("@" + d));
}
export function primaryOwnerDomain(): string | null {
  return RULES.ownerDomains[0] ?? null;
}