import { timingSafeEqual } from "node:crypto";
import { runAnalyticsOperation } from "@/lib/analytics-archive/operations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 60;

function json(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "CDN-Cache-Control": "no-store",
      "Vercel-CDN-Cache-Control": "no-store",
    },
  });
}
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const header = request.headers.get("authorization");
  if (!secret?.trim() || !header) return json({ status: "unauthorized" }, 401);
  const expected = Buffer.from(`Bearer ${secret}`);
  const actual = Buffer.from(header);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected))
    return json({ status: "unauthorized" }, 401);
  const result = await runAnalyticsOperation({ kind: "daily" });
  return json(
    result,
    result.status === "failure" ? 500 : result.status === "partial" ? 202 : 200,
  );
}
