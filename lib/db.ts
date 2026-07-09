import { getPool } from "@/db/pool";
import { isNextBuild } from "@/lib/env";

type SqlRow = Record<string, unknown>;

type SqlResult<T> = T extends SqlRow ? T : SqlRow;

function assertDatabaseAccessAllowed() {
  if (isNextBuild()) {
    throw new Error(
      "Database access is disabled during Next.js production build.",
    );
  }
}

/**
 * Lightweight tagged template helper that maps template literals to parameterized pg queries.
 * Usage: const rows = await sql`SELECT * FROM table WHERE id = ${id}`;
 */
export async function sql<T extends SqlRow = SqlRow>(
  strings: TemplateStringsArray,
  ...values: unknown[]
): Promise<SqlResult<T>[]> {
  assertDatabaseAccessAllowed();
  const text = strings.reduce((acc, part, index) => {
    const placeholder = index < values.length ? `$${index + 1}` : "";
    return acc + part + placeholder;
  }, "");

  const pool = getPool();
  const result = await pool.query<SqlResult<T>>(text, values);
  return result.rows;
}

/**
 * Preferred helper for dynamic dojo SQL that cannot use the tagged template form.
 * Uses the shared pg pool from db/pool.ts so safety checks and test behavior stay centralized.
 */
export async function queryRows<T extends SqlRow = SqlRow>(
  text: string,
  values?: readonly unknown[],
): Promise<T[]> {
  assertDatabaseAccessAllowed();
  const pool = getPool();
  const result = await pool.query<T>(text, values ? [...values] : undefined);
  return result.rows;
}

export async function queryOne<T extends SqlRow = SqlRow>(
  text: string,
  values?: readonly unknown[],
): Promise<T | null> {
  const rows = await queryRows<T>(text, values);
  return rows.length > 0 ? rows[0] : null;
}
