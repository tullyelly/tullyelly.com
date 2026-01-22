// lib/db-url.ts
const SSLMODE_ALIASES = new Set(["prefer", "require", "verify-ca"]);

export function normalizeDatabaseUrl(url: string): string {
  try {
    const u = new URL(url);
    const mode = u.searchParams.get("sslmode");
    if (mode && SSLMODE_ALIASES.has(mode.toLowerCase())) {
      u.searchParams.set("sslmode", "verify-full");
      return u.toString();
    }
  } catch {
    return url;
  }
  return url;
}

export function getDatabaseUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL missing");

  if (process.env.NODE_ENV !== "production") {
    const u = new URL(url);
    const host = u.host.toLowerCase();
    const db = u.pathname.slice(1).toLowerCase();
    const prodish =
      host.includes("prod") || host.includes("main") || db.includes("prod");
    if (prodish)
      throw new Error(`Refusing prod-looking DB in dev: host=${host} db=${db}`);
  }

  const u = new URL(url);
  u.searchParams.set("sslmode", "verify-full");
  const extra = "-c search_path=auth,dojo,public -c application_name=next-dev";
  const prev = u.searchParams.get("options");
  u.searchParams.set("options", prev ? `${prev} ${extra}` : extra);
  return u.toString();
}
