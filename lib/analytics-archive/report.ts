import "server-only";
import { z } from "zod";
import { queryRows } from "@/lib/db";
import { parseDateish } from "@/lib/datetime";
import { isNextBuild } from "@/lib/env";
import { requireAnalyticsOwner } from "./authorization";
import { addDays, assertDay, utcDay } from "./client";

export type ReportParams = {
  from?: string | string[];
  through?: string | string[];
};
export type ReportRange = { from: string; through: string };
const count = z.string().regex(/^\d+$/);
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const snapshotSchema = z.object({
  total: count,
  verified: z.number().int().min(0).max(366),
  expected: z.number().int().min(1).max(366),
  unavailable: z.number().int().min(0),
  incomplete: z.number().int().min(0),
  failures: z.number().int().min(0),
  missing: z.number().int().min(0),
  updated: z.string().nullable(),
  pathCount: z.number().int().min(0),
  trend: z
    .array(
      z.object({
        day,
        status: z.enum([
          "complete",
          "zero",
          "unavailable",
          "incomplete",
          "api_failure",
          "missing",
        ]),
        views: count.nullable(),
        visitors: count.nullable(),
      }),
    )
    .max(366),
  pages: z
    .array(z.object({ path: z.string().startsWith("/"), views: count }))
    .max(50),
});
export type OwnerAnalyticsSnapshot = z.infer<typeof snapshotSchema>;
export type OwnerAnalyticsReport = {
  range: ReportRange;
  maxDay: string;
  snapshot: OwnerAnalyticsSnapshot | null;
  error: string | null;
};
export function analyticsReportRange(
  params: ReportParams,
  now: Date,
): ReportRange {
  const yesterday = addDays(utcDay(now), -1);
  const from = params.from ?? addDays(yesterday, -29);
  const through = params.through ?? yesterday;
  if (typeof from !== "string" || typeof through !== "string")
    throw new Error("Invalid range");
  assertDay(from);
  assertDay(through);
  const first = parseDateish(from)!;
  const last = parseDateish(through)!;
  // Date.UTC in the shared date parser maps years 0-99 to 1900-1999.
  // Restore the validated year before enforcing the query's calendar bound.
  first.setUTCFullYear(Number(from.slice(0, 4)));
  last.setUTCFullYear(Number(through.slice(0, 4)));
  if (
    from.startsWith("0000") ||
    from > through ||
    through > yesterday ||
    (last.getTime() - first.getTime()) / 86400000 >= 366
  )
    throw new Error("Invalid range");
  return { from, through };
}

export async function getOwnerAnalyticsReport(
  params: ReportParams = {},
  now = new Date(),
): Promise<OwnerAnalyticsReport> {
  const fallback = analyticsReportRange({}, now);
  const empty = {
    range: fallback,
    maxDay: addDays(utcDay(now), -1),
    snapshot: null,
    error: null,
  };
  if (isNextBuild())
    return {
      ...empty,
      error: "Private reporting is unavailable during builds.",
    };
  // This helper is a private-data boundary too, even when called outside the page.
  await requireAnalyticsOwner();
  let range: ReportRange;
  try {
    range = analyticsReportRange(params, now);
  } catch {
    return {
      ...empty,
      error: "Select an ordered UTC period of at most 366 completed days.",
    };
  }
  const project = process.env.ANALYTICS_PROJECT_ID?.trim();
  if (!project)
    return {
      ...empty,
      range,
      error: "Configure ANALYTICS_PROJECT_ID before reading archived traffic.",
    };
  try {
    // One statement supplies a consistent snapshot; no API, writes or shared cache.
    const rows = await queryRows<{ snapshot: unknown }>(
      `WITH days AS (
        SELECT day,status,pageviews,visitors,collected_at FROM dojo.analytics_day
        WHERE project_id=$1 AND day BETWEEN $2::date AND $3::date
      ), verified AS (
        SELECT * FROM days WHERE status IN ('complete','zero')
      ), calendar AS (
        SELECT generate_series($2::date,$3::date,interval '1 day')::date AS day
      ), trend AS (
        SELECT c.day::text AS day,coalesce(d.status,'missing') AS status,
          CASE WHEN d.status IN ('complete','zero') THEN d.pageviews::text END AS views,
          CASE WHEN d.status IN ('complete','zero') THEN d.visitors::text END AS visitors
        FROM calendar c LEFT JOIN days d USING(day)
      ), ranked AS (
        SELECT p.request_path AS path,sum(p.pageviews) AS views
        FROM dojo.analytics_page_day p JOIN verified d ON d.day=p.day
        WHERE p.project_id=$1 AND p.day BETWEEN $2::date AND $3::date
        GROUP BY p.request_path
      ), top_pages AS (
        SELECT path,views::text AS views FROM ranked ORDER BY ranked.views DESC,path LIMIT 50
      ) SELECT jsonb_build_object(
        'total',(SELECT coalesce(sum(pageviews),0)::text FROM verified),
        'verified',(SELECT count(*)::int FROM verified),
        'expected',($3::date-$2::date+1),
        'unavailable',(SELECT count(*)::int FROM days WHERE status='unavailable'),
        'incomplete',(SELECT count(*)::int FROM days WHERE status='incomplete'),
        'failures',(SELECT count(*)::int FROM days WHERE status='api_failure'),
        'missing',($3::date-$2::date+1)-(SELECT count(*)::int FROM days),
        'updated',(SELECT to_char(max(collected_at) AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"') FROM verified),
        'pathCount',(SELECT count(*)::int FROM ranked),
        'trend',(SELECT jsonb_agg(to_jsonb(t) ORDER BY day) FROM trend t),
        'pages',coalesce((SELECT jsonb_agg(to_jsonb(p) ORDER BY p.views::numeric DESC,p.path) FROM top_pages p),'[]'::jsonb)
      ) AS snapshot`,
      [project, range.from, range.through],
    );
    return {
      ...empty,
      range,
      snapshot: snapshotSchema.parse(rows[0]?.snapshot),
    };
  } catch {
    return {
      ...empty,
      range,
      error:
        "Archived traffic is unavailable. Check database connectivity and analytics schema readiness.",
    };
  }
}
