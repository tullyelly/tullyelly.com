import "server-only";
import { allPosts } from "contentlayer/generated";
import { unstable_cache } from "next/cache";
import { z } from "zod";
import { queryRows } from "@/lib/db";
import { isNextBuild } from "@/lib/env";

export type PublicAnalyticsPage = { id: string; path: string; title: string };
// Deliberate allowlist; never derive public visibility from archived paths.
export function publicAnalyticsPages(): PublicAnalyticsPage[] {
  return [
    { id: "chronicles-index", path: "/shaolin", title: "Chronicles" },
    { id: "traffic-statistics", path: "/stats", title: "Traffic statistics" },
    ...allPosts
      .filter((post) => !post.draft)
      .map((post) => ({
        id: post._id,
        path: post.url,
        title: post.title,
      })),
  ];
}
const count = z.string().regex(/^\d+$/);
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const snapshotSchema = z.object({
  total: count,
  from: day.nullable(),
  through: day.nullable(),
  verified: count,
  expected: count,
  updated: z.string().nullable(),
  trend: z.array(z.object({ day, views: count.nullable() })),
  pages: z.array(z.object({ path: z.string(), views: count })),
});
export type PublicAnalyticsSnapshot = z.infer<typeof snapshotSchema>;
export type PublicAnalytics = {
  snapshot: PublicAnalyticsSnapshot | null;
  pages: PublicAnalyticsPage[];
};

export async function readPublicAnalytics(
  project: string,
  paths: string[],
): Promise<PublicAnalyticsSnapshot> {
  const rows = await queryRows<{ snapshot: unknown }>(
    `WITH days AS (
       SELECT day, status, collected_at FROM dojo.analytics_day
       WHERE project_id=$1 AND day < (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')::date
     ), verified AS (
       SELECT * FROM days WHERE status IN ('complete','zero')
     ), public_views AS (
       SELECT p.day, p.request_path, p.pageviews FROM dojo.analytics_page_day p
       JOIN verified d USING(day)
       WHERE p.project_id=$1 AND p.request_path=ANY($2::text[])
     ), bounds AS (
       SELECT min(day) AS first_day, max(day) AS last_day FROM days
     ), calendar AS (
       SELECT generate_series(
         greatest(first_day, last_day - 89), last_day, interval '1 day')::date AS day
       FROM bounds
     ), trend AS (
       SELECT c.day, CASE WHEN v.day IS NULL THEN NULL
         ELSE coalesce(sum(p.pageviews),0)::text END AS views
       FROM calendar c LEFT JOIN verified v USING(day)
       LEFT JOIN public_views p USING(day) GROUP BY c.day,v.day
     ), ranked AS (
       SELECT request_path AS path,sum(pageviews)::text AS views
       FROM public_views GROUP BY request_path
     ) SELECT jsonb_build_object(
       'total',(SELECT coalesce(sum(pageviews),0)::text FROM public_views),
       'from',first_day::text,'through',last_day::text,
       'verified',(SELECT count(*)::text FROM verified),
       'expected',CASE WHEN first_day IS NULL THEN '0'
         ELSE (last_day-first_day+1)::text END,
       'updated',(SELECT to_char(max(collected_at) AT TIME ZONE 'UTC',
         'YYYY-MM-DD"T"HH24:MI:SS"Z"') FROM verified),
       'trend',coalesce((SELECT jsonb_agg(to_jsonb(t) ORDER BY day) FROM trend t),'[]'::jsonb),
       'pages',coalesce((SELECT jsonb_agg(to_jsonb(r)) FROM ranked r),'[]'::jsonb)
     ) AS snapshot FROM bounds`,
    [project, paths],
  );
  return snapshotSchema.parse(rows[0]?.snapshot);
}
const cachedRead = unstable_cache(
  readPublicAnalytics,
  ["public-analytics-v1"],
  {
    revalidate: 300,
  },
);
export async function getPublicAnalytics(): Promise<PublicAnalytics> {
  const pages = publicAnalyticsPages();
  const project = process.env.ANALYTICS_PROJECT_ID;
  if (isNextBuild() || !project) return { snapshot: null, pages };
  try {
    const snapshot = await cachedRead(
      project,
      pages.map((page) => page.path),
    );
    // Defense in depth; titles and links always originate from current public content.
    snapshot.pages = snapshot.pages.filter((row) =>
      pages.some((p) => p.path === row.path),
    );
    return { snapshot, pages };
  } catch {
    return { snapshot: null, pages };
  }
}
export function formatViews(value: string): string {
  return BigInt(value).toLocaleString("en-US");
}
