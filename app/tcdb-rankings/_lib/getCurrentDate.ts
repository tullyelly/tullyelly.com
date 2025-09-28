import "server-only";

import { sql } from "@/lib/db";

export async function getCurrentDateIso(): Promise<string> {
  const [row] = await sql<{ today: string }>`
    SELECT CURRENT_DATE::text AS today
  `;
  return row?.today ?? "";
}
