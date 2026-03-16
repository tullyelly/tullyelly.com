import "server-only";

import { sql } from "@/lib/db";

type IdentityCartoonRow = {
  image_path: string;
  description: string | null;
};

export type IdentityCartoon = {
  imagePath: string;
  description: string | null;
};

export async function getCartoonByTagId(
  tagId: number,
): Promise<IdentityCartoon | null> {
  const [row] = await sql<IdentityCartoonRow>`
    SELECT image_path, description
    FROM dojo.identity_cartoon
    WHERE tag_id = ${tagId}
    ORDER BY created_at DESC, id DESC
    LIMIT 1
  `;

  if (!row) {
    return null;
  }

  return {
    imagePath: row.image_path,
    description: row.description,
  };
}
