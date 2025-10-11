import "server-only";

import { unstable_cache } from "next/cache";

import { sql } from "@/lib/db";

export type HomieOption = {
  value: string | number;
  label: string;
};

async function loadHomieOptions(): Promise<HomieOption[]> {
  const rows = await sql<{ id: string | number; name: string }>`
    SELECT id, name
    FROM dojo.homie
    ORDER BY name ASC
  `;

  return rows.map((row) => ({
    value: row.id,
    label: row.name,
  }));
}

export const getHomieOptions = unstable_cache(
  loadHomieOptions,
  ["tcdb-homie-options"],
  {
    tags: ["homies"],
  },
);
