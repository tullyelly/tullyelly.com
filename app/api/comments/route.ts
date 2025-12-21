import { sql } from "@/lib/db";

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
