import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CommentRow = {
  id: number;
  post_slug: string;
  user_id: string;
  body: string;
  created_at: string;
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const postSlug = searchParams.get("postSlug");

  if (!postSlug) {
    return Response.json({ error: "postSlug is required" }, { status: 400 });
  }

  try {
    const comments = await sql<CommentRow>`
      SELECT id, post_slug, user_id, body, created_at
      FROM dojo.blog_comment
      WHERE post_slug = ${postSlug}
      ORDER BY created_at DESC;
    `;
    return Response.json(comments);
  } catch (err) {
    console.error("comments fetch failed:", err);
    return Response.json({ error: "database error" }, { status: 500 });
  }
}

type CreateInput = {
  postSlug?: unknown;
  body?: unknown;
};

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

  const postSlug =
    typeof payload.postSlug === "string" ? payload.postSlug.trim() : "";
  const body = typeof payload.body === "string" ? payload.body.trim() : "";

  if (!postSlug) {
    return Response.json({ error: "postSlug is required" }, { status: 400 });
  }
  if (!body) {
    return Response.json({ error: "body is required" }, { status: 400 });
  }
  if (body.length > 2000) {
    return Response.json({ error: "body too long" }, { status: 400 });
  }

  try {
    const [created] = await sql<CommentRow>`
      INSERT INTO dojo.blog_comment (post_slug, user_id, body)
      VALUES (${postSlug}, ${user.id}::uuid, ${body})
      RETURNING id, post_slug, user_id, body, created_at
    `;
    return Response.json(created, { status: 201 });
  } catch (err) {
    console.error("comment create failed:", err);
    return Response.json({ error: "database error" }, { status: 500 });
  }
}
