import { Pool } from "pg";
import { DATABASE_URL, isNextBuild } from "@/lib/env";
import { assertValidDatabaseUrl } from "@/db/assert-database-url";

interface Queryable {
  query<T = any>(sql: any, values?: any[]): Promise<any>;
  end?: () => Promise<void>;
}

let pool: Queryable | undefined;

function createE2EPool(): Queryable {
  const scrolls = [
    {
      id: 1,
      release_name: "Test Scroll",
      release_type: "minor",
      status: "draft",
      release_date: "2024-01-01",
      label: "Test Scroll",
    },
  ];
  const releaseTypes = [
    { id: 1, code: "planned" },
    { id: 2, code: "hotfix" },
    { id: 3, code: "minor" },
    { id: 4, code: "major" },
    { id: 5, code: "chore" },
    { id: 6, code: "wax" },
    { id: 7, code: "tcdb" },
  ];

  return {
    async query<T = any>(sql: any, values?: any[]): Promise<any> {
      const text = typeof sql === "string" ? sql : (sql?.text ?? "");
      const params =
        values ?? (typeof sql !== "string" ? sql?.values : undefined) ?? [];

      if (/select\s+1/i.test(text)) {
        return { rows: [{ "?column?": 1 } as unknown as T], rowCount: 1 };
      }

      if (/from\s+dojo\.v_shaolin_scrolls/i.test(text)) {
        if (/count\(\*\)/i.test(text)) {
          return {
            rows: [{ total: scrolls.length } as unknown as T],
            rowCount: 1,
          };
        }

        if (/where\s+id\s*=\s*\$1/i.test(text)) {
          const id = params[0];
          const row = scrolls.find((s) => String(s.id) === String(id));
          return {
            rows: row ? ([row] as unknown as T[]) : [],
            rowCount: row ? 1 : 0,
          };
        }

        return { rows: scrolls as unknown as T[], rowCount: scrolls.length };
      }

      if (/from\s+dojo\.release_type/i.test(text)) {
        return {
          rows: releaseTypes as unknown as T[],
          rowCount: releaseTypes.length,
        };
      }

      return { rows: [] as T[], rowCount: 0 };
    },
    async end() {
      return Promise.resolve();
    },
  };
}

export function getPool(): Queryable {
  if (pool) return pool;

  if (process.env.SKIP_DB === "true") {
    throw new Error("Database access disabled when SKIP_DB=true.");
  }

  if (process.env.E2E_MODE === "1") {
    pool = createE2EPool();
    return pool;
  }

  if (isNextBuild()) {
    throw new Error(
      "Database access is disabled during Next.js production build.",
    );
  }

  const connectionString = DATABASE_URL ?? null;
  if (!connectionString)
    throw new Error("Missing DATABASE_URL. Set it in .env.local");
  assertValidDatabaseUrl(connectionString);
  pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
  return pool;
}
