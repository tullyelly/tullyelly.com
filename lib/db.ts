import { getPool } from "@/db/pool";
import { isNextBuild } from "@/lib/env";

type SqlRow = Record<string, unknown>;

type SqlResult<T> = T extends SqlRow ? T : SqlRow;

/**
 * Lightweight tagged template helper that maps template literals to parameterized pg queries.
 * Usage: const rows = await sql`SELECT * FROM table WHERE id = ${id}`;
 */
export async function sql<T extends SqlRow = SqlRow>(
  strings: TemplateStringsArray,
  ...values: unknown[]
): Promise<SqlResult<T>[]> {
  if (isNextBuild()) {
    throw new Error(
      "Database access is disabled during Next.js production build.",
    );
  }
  const text = strings.reduce((acc, part, index) => {
    const placeholder = index < values.length ? `$${index + 1}` : "";
    return acc + part + placeholder;
  }, "");

  const pool = getPool();
  const result = await pool.query<SqlResult<T>>(text, values);
  return result.rows;
}
