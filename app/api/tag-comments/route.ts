import { sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TagCommentRow = {
  id: string;
  body: string;
  created_at: string | Date;
  user_name: string;
};

class InputError extends Error {}

function parseTag(raw: string | null): string {
  if (!raw) {
    throw new InputError("tag is required");
  }

  const tag = raw.trim().toLowerCase();
  if (!tag || tag.length > 120 || !/^[a-z0-9][a-z0-9._&-]*$/.test(tag)) {
    throw new InputError("invalid tag");
  }

  return tag;
}

function parseLimit(raw: string | null): number {
  if (raw === null) return 10;

  const limit = Number.parseInt(raw, 10);
  if (Number.isNaN(limit)) {
    throw new InputError("invalid limit");
  }

  return Math.min(Math.max(limit, 1), 100);
}

function parseCursor(raw: string | null): Date | null {
  if (!raw) return null;

  const cursor = new Date(raw);
  if (Number.isNaN(cursor.getTime())) {
    throw new InputError("invalid cursor");
  }

  return cursor;
}

function parseQuery(url: string) {
  const { searchParams } = new URL(url);

  return {
    tag: parseTag(searchParams.get("tag")),
    limit: parseLimit(searchParams.get("limit")),
    cursor: parseCursor(searchParams.get("cursor")),
  };
}

function serializeComment(row: TagCommentRow) {
  return {
    id: row.id,
    body: row.body,
    created_at:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at),
    user_name: row.user_name,
  };
}

export async function GET(req: Request) {
  try {
    const { tag, limit, cursor } = parseQuery(req.url);

    const comments = cursor
      ? await sql<TagCommentRow>`
          SELECT
            c.id::text AS id,
            c.body,
            c.created_at,
            COALESCE(
              t.name,
              split_part(u.name, ' ', 1),
              split_part(u.email, '@', 1),
              'Anonymous'
            ) AS user_name
          FROM dojo.blog_comment c
          JOIN auth.users u
            ON u.id = c.user_id
          LEFT JOIN dojo.tags t
            ON t.id = u.secret_identity_tag_id
          WHERE t.slug = ${tag}
            AND c.created_at < ${cursor}
          ORDER BY c.created_at DESC, c.id DESC
          LIMIT ${limit};
        `
      : await sql<TagCommentRow>`
          SELECT
            c.id::text AS id,
            c.body,
            c.created_at,
            COALESCE(
              t.name,
              split_part(u.name, ' ', 1),
              split_part(u.email, '@', 1),
              'Anonymous'
            ) AS user_name
          FROM dojo.blog_comment c
          JOIN auth.users u
            ON u.id = c.user_id
          LEFT JOIN dojo.tags t
            ON t.id = u.secret_identity_tag_id
          WHERE t.slug = ${tag}
          ORDER BY c.created_at DESC, c.id DESC
          LIMIT ${limit};
        `;

    return Response.json(comments.map(serializeComment));
  } catch (err) {
    if (err instanceof InputError) {
      return Response.json({ error: err.message }, { status: 400 });
    }

    console.error("[tag-comments] fetch failed", err);
    const detail =
      process.env.NODE_ENV !== "production" && err instanceof Error
        ? err.message
        : undefined;
    return Response.json({ error: "database error", detail }, { status: 500 });
  }
}

