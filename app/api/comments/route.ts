import { z } from "zod";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CommentRow = {
  id: number;
  post_slug: string;
  user_id: string;
  user_name: string;
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
      SELECT id, post_slug, user_id, user_name, body, created_at
      FROM dojo.v_blog_comment
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

const createSchema = z.object({
  postSlug: z.string().min(1, "postSlug is required"),
  body: z.string().trim().min(1, "body is required").max(2000, "body too long"),
});

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
    const [created] = await sql<CommentRow>`
      WITH ins AS (
        INSERT INTO dojo.blog_comment (post_slug, user_id, body)
        VALUES (${postSlug}, ${user.id}::uuid, ${body})
        RETURNING id
      )
      SELECT v.id, v.post_slug, v.user_id, v.user_name, v.body, v.created_at
      FROM ins
      JOIN dojo.v_blog_comment v ON v.id = ins.id
    `;
    return Response.json(created, { status: 201 });
  } catch (err) {
    console.error("comment create failed:", err);
    return Response.json({ error: "database error" }, { status: 500 });
  }
}
