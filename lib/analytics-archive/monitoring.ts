import "server-only";
import { queryRows } from "@/lib/db";
import { initSentry } from "@/lib/sentry";
import { getSentry } from "@/lib/safeSentry";
import { addDays, utcDay } from "./client";
import { analyticsSyncEnabled, runAnalyticsOperation } from "./operations";

export const analyticsDailyMonitor = "analytics-daily";
export type DailyCondition = "healthy" | "execution_failure" | "stale_data";
interface MonitorSdk {
  captureCheckIn(checkIn: {
    monitorSlug: string;
    status: "in_progress" | "ok" | "error";
    checkInId?: string;
    duration?: number;
  }): string;
  flush(timeout: number): Promise<boolean>;
}
/** Read-only; a backfill or an older verified row cannot satisfy this invocation. */
export async function dailyDataRefreshed(startedAt: Date): Promise<boolean> {
  const project = process.env.ANALYTICS_PROJECT_ID?.trim();
  if (!project) return false;
  const day = addDays(utcDay(startedAt), -1);
  const rows = await queryRows<{ ready: boolean }>(
    `SELECT EXISTS (
      SELECT 1 FROM dojo.analytics_day d JOIN dojo.analytics_run r ON r.id=d.run_id
      WHERE d.project_id=$1 AND r.project_id=$1 AND d.day=$2::date
        AND d.status IN ('complete','zero') AND r.lane='daily'
        AND r.status IN ('complete','bounded') AND r.finished_at IS NOT NULL
        AND r.started_at >= $3::timestamptz
    ) AS ready`,
    [project, day, startedAt.toISOString()],
  );
  return rows[0]?.ready === true;
}

/** Cron route only. Owner controls/imports never send scheduled check-ins. */
export async function runScheduledAnalytics() {
  // No check-ins while paused, in preview/local, or during anonymous health reads.
  if (!analyticsSyncEnabled() || process.env.VERCEL_ENV !== "production")
    return runAnalyticsOperation({ kind: "daily" });
  const startedAt = new Date();
  let sdk: MonitorSdk | null = null;
  let checkInId: string | undefined;
  try {
    await initSentry();
    sdk = (await getSentry()) as MonitorSdk | null;
    checkInId = sdk?.captureCheckIn({
      monitorSlug: analyticsDailyMonitor,
      status: "in_progress",
    });
    await sdk?.flush(1000);
  } catch {
    // Monitoring transport must not prevent the scheduled operation.
    sdk = null;
  }
  let condition: DailyCondition = "execution_failure";
  try {
    const result = await runAnalyticsOperation({ kind: "daily" });
    if (result.status === "success" || result.status === "partial") {
      try {
        condition = (await dailyDataRefreshed(startedAt))
          ? "healthy"
          : "stale_data";
      } catch {
        condition = "stale_data";
      }
    }
    return result;
  } finally {
    // Fixed labels only; upstream errors, headers, IDs and credentials stay out.
    console.info("Analytics daily monitor:", condition);
    if (sdk && checkInId) {
      try {
        sdk.captureCheckIn({
          monitorSlug: analyticsDailyMonitor,
          checkInId,
          status: condition === "healthy" ? "ok" : "error",
          duration: Math.max(0, (Date.now() - startedAt.getTime()) / 1000),
        });
        await sdk.flush(1000);
      } catch {
        // Missing terminal check-in is detected externally as a timeout.
      }
    }
  }
}
