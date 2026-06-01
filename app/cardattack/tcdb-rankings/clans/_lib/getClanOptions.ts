import "server-only";

import { unstable_cache } from "next/cache";

import { sql } from "@/lib/db";

export type ClanOption = {
  value: string | number;
  label: string;
  slug: string;
};

async function loadClanOptions(): Promise<ClanOption[]> {
  const rows = await sql<{ id: string | number; name: string; slug: string }>`
    SELECT id, name, slug
    FROM dojo.clan
    ORDER BY name ASC
  `;

  return rows.map((row) => ({
    value: row.id,
    label: row.name,
    slug: row.slug,
  }));
}

export const getClanOptions = unstable_cache(
  loadClanOptions,
  ["tcdb-clan-options"],
  {
    tags: ["clans"],
  },
);
