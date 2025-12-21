import { z } from "zod";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CommentRow = {
  id: string;
  post_slug: string;
  user_id: string;
  user_name: string;
  body: string;
  created_at: string | Date;
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const postSlug = searchParams.get("postSlug");

  if (!postSlug) {
    return Response.json({ error: "postSlug is required" }, { status: 400 });
  }

  try {
    const comments = await sql<CommentRow>`
      SELECT id::text AS id, post_slug, user_id, user_name, body, created_at
      FROM dojo.v_blog_comment
      WHERE post_slug = ${postSlug}
      ORDER BY created_at DESC;
    `;
    return Response.json(comments.map(serializeComment));
  } catch (err) {
    console.error("[comments] fetch failed", err);
    const detail =
      process.env.NODE_ENV !== "production" && err instanceof Error
        ? err.message
        : undefined;
    return Response.json({ error: "database error", detail }, { status: 500 });
  }
}

type CreateInput = {
  postSlug?: unknown;
  body?: unknown;
};

const createSchema = z.object({
  postSlug: z.string().min(1, "postSlug is required"),
  body: z.string().trim().min(1, "body is required").max(2000, "body too long"),
});

function serializeComment(row: CommentRow) {
  return {
    id: row.id,
    post_slug: row.post_slug,
    user_id: row.user_id,
    user_name: row.user_name,
    body: row.body,
    created_at:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at),
  };
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user?.id) {
    return Response.json({ error: "unauthenticated" }, { status: 401 });
  }

  let payload: CreateInput;
  try {
    payload = (await req.json()) as CreateInput;
  } catch {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(payload);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "invalid input";
    return Response.json({ error: message }, { status: 400 });
  }
  const { postSlug, body } = parsed.data;

  try {
    const rows = await sql<CommentRow>`
      INSERT INTO dojo.blog_comment (post_slug, user_id, body)
      VALUES (${postSlug}, ${user.id}::uuid, ${body})
      RETURNING
        id::text AS id,
        post_slug,
        user_id::text AS user_id,
        (
          SELECT COALESCE(u.name, u.email, 'Anonymous')
          FROM auth.users u
          WHERE u.id = blog_comment.user_id
        ) AS user_name,
        body,
        created_at
    `;
    const created = rows?.[0];
    if (!created) {
      console.error("[comments] insert returned no rows");
      return Response.json({ error: "database error" }, { status: 500 });
    }
    return Response.json(serializeComment(created), { status: 201 });
  } catch (err) {
    console.error("[comments] create failed", err);
    const detail =
      process.env.NODE_ENV !== "production" && err instanceof Error
        ? err.message
        : undefined;
    return Response.json({ error: "database error", detail }, { status: 500 });
  }
}
