import { Pool } from "pg";
import { DATABASE_URL } from "@/lib/env";
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

      return { rows: [] as T[], rowCount: 0 };
    },
    async end() {
      return Promise.resolve();
    },
  };
}

export function getPool(): Queryable {
  if (pool) return pool;

  if (process.env.E2E_MODE === "1") {
    pool = createE2EPool();
    return pool;
  }

  if (!DATABASE_URL)
    throw new Error("Missing DATABASE_URL. Set it in .env.local");
  assertValidDatabaseUrl(DATABASE_URL);
  const user = new URL(DATABASE_URL).username;
  if (process.env.NODE_ENV !== "production") {
    console.log(`DB user: ${user}`);
  }
  pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  return pool;
}
