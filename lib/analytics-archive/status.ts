import "server-only";
import { queryRows } from "@/lib/db";
import {
  analyticsSyncEnabled,
  reportAnalyticsFailure,
  supportedRange,
} from "./operations";

export type RunStatus = {
  id: string;
  lane: string | null;
  status: string;
  started_at: string;
  finished_at: string | null;
  error_code: string | null;
  processed_days: number;
  request_count: number;
};
export type ImportStatus = {
  start_day: string;
  end_day: string;
  next_day: string;
  total: number;
  verified: number;
  unavailable: number;
  incomplete: number;
  api_failures: number;
  recorded: number;
};
export const analyticsErrorLabels: Record<string, string> = {
  api_failure:
    "API or database work failed. Check connection and run Test connection; retry the saved day.",
  incomplete:
    "Coverage could not be verified. Check the supported window, grouped result limits and daily reconciliation.",
  database_failure:
    "Database operation failed. Check connectivity and schema readiness; progress was not advanced by failed writes.",
};
export function dailyCollectionStale(
  lastSuccess: string | null,
  now: Date,
): boolean {
  return (
    !lastSuccess ||
    !Number.isFinite(Date.parse(lastSuccess)) ||
    now.getTime() - Date.parse(lastSuccess) > 36 * 60 * 60 * 1000
  );
}
export async function getAnalyticsStatus(now = new Date()) {
  const enabled = analyticsSyncEnabled();
  let range: { from: string; through: string } | null = null;
  try {
    range = supportedRange(now);
  } catch {
    /* Render configuration guidance without exposing values. */
  }
  const project = process.env.ANALYTICS_PROJECT_ID?.trim();
  const empty = {
    enabled,
    range,
    lastAttempt: null as RunStatus | null,
    lastSuccess: null as RunStatus | null,
    lastDailySuccess: null as RunStatus | null,
    latestDay: null as string | null,
    dailyNext: null as string | null,
    history: null as ImportStatus | null,
    stale: true,
    error: null as string | null,
  };
  if (!project)
    return {
      ...empty,
      error: "Configure ANALYTICS_PROJECT_ID before reading archive status.",
    };
  try {
    const runs = await queryRows<RunStatus>(
      `SELECT id::text,lane,status,
      to_char(started_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS started_at,
      to_char(finished_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS finished_at,
      error_code,processed_days,request_count
      FROM dojo.analytics_run WHERE project_id=$1 AND id IN (
        (SELECT id FROM dojo.analytics_run WHERE project_id=$1 ORDER BY started_at DESC,id DESC LIMIT 1),
        (SELECT id FROM dojo.analytics_run WHERE project_id=$1 AND status='complete' ORDER BY finished_at DESC,id DESC LIMIT 1),
        (SELECT id FROM dojo.analytics_run WHERE project_id=$1 AND lane='daily' AND status='complete' ORDER BY finished_at DESC,id DESC LIMIT 1)
      ) ORDER BY dojo.analytics_run.started_at DESC,dojo.analytics_run.id DESC`,
      [project],
    );
    const lastAttempt: RunStatus | null = runs.length ? runs[0] : null;
    const lastSuccess = runs.find((run) => run.status === "complete") ?? null;
    const lastDailySuccess =
      runs.find((run) => run.lane === "daily" && run.status === "complete") ??
      null;
    const latest = await queryRows<{ day: string | null }>(
      "SELECT to_char(max(day),'YYYY-MM-DD') AS day FROM dojo.analytics_day WHERE project_id=$1 AND status IN ('complete','zero')",
      [project],
    );
    const daily = await queryRows<{ day: string }>(
      "SELECT to_char(next_day,'YYYY-MM-DD') AS day FROM dojo.analytics_progress WHERE project_id=$1 AND lane='daily'",
      [project],
    );
    const imports = await queryRows<ImportStatus>(
      `SELECT to_char(progress.start_day,'YYYY-MM-DD') AS start_day,to_char(progress.end_day,'YYYY-MM-DD') AS end_day,
      to_char(progress.next_day,'YYYY-MM-DD') AS next_day,(progress.end_day-progress.start_day+1)::int AS total,
      count(day.day)::int AS recorded,
      count(day.day) FILTER (WHERE day.status IN ('complete','zero'))::int AS verified,
      count(day.day) FILTER (WHERE day.status='unavailable')::int AS unavailable,
      count(day.day) FILTER (WHERE day.status='incomplete')::int AS incomplete,
      count(day.day) FILTER (WHERE day.status='api_failure')::int AS api_failures
      FROM dojo.analytics_progress AS progress LEFT JOIN dojo.analytics_day AS day ON day.project_id=progress.project_id
        AND day.day BETWEEN progress.start_day AND progress.end_day
      WHERE progress.project_id=$1 AND progress.lane='backfill' AND progress.start_day IS NOT NULL
      GROUP BY progress.start_day,progress.end_day,progress.next_day`,
      [project],
    );
    return {
      ...empty,
      lastAttempt,
      lastSuccess,
      lastDailySuccess,
      latestDay: latest[0]?.day ?? null,
      dailyNext: daily[0]?.day ?? null,
      history: imports[0] ?? null,
      stale: dailyCollectionStale(lastDailySuccess?.finished_at ?? null, now),
    };
  } catch {
    await reportAnalyticsFailure("status_read_failed");
    return {
      ...empty,
      error:
        "Archive status is unavailable. Check database connectivity and apply migrations 076 and 077 to the confirmed target.",
    };
  }
}
