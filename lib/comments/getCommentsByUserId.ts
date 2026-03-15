import "server-only";

import { sql } from "@/lib/db";

type UserCommentRow = {
  id: string;
  post_slug: string;
  user_id: string;
  user_name: string;
  body: string;
  created_at: string | Date;
};

export type UserComment = {
  id: string;
  postSlug: string;
  userId: string;
  userName: string;
  body: string;
  createdAt: string;
};

function toIsoString(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : String(value);
}

export async function getCommentsByUserId(
  userId: string,
): Promise<UserComment[]> {
  const rows = await sql<UserCommentRow>`
    SELECT
      id::text AS id,
      post_slug,
      user_id::text AS user_id,
      user_name,
      body,
      created_at
    FROM dojo.v_blog_comment
    WHERE user_id = ${userId}::uuid
    ORDER BY created_at DESC, id DESC
  `;

  return rows.map((row) => ({
    id: row.id,
    postSlug: row.post_slug,
    userId: row.user_id,
    userName: row.user_name,
    body: row.body,
    createdAt: toIsoString(row.created_at),
  }));
}
