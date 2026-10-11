import "server-only";
import type { Pool, PoolClient } from "pg";
import { getPool } from "@/db/pool";
import { isNextBuild } from "@/lib/env";
import {
  addDays,
  AnalyticsApiError,
  AnalyticsBudgetError,
  assertDay,
  createAnalyticsClient,
  utcDay,
  type AnalyticsClient,
} from "./client";

export interface CollectOptions {
  lane: "daily" | "backfill";
  startDay: string;
  // Operator-confirmed earliest available UTC day; never inferred from empty rows.
  availableFrom: string;
  maxDays?: number;
  maxRequests?: number;
  now?: Date;
  endDay?: string;
  initializeImport?: boolean;
  resumeImport?: boolean;
  maxDurationMs?: number;
}
export interface CollectResult {
  status: "overlap" | "complete" | "bounded" | "failed";
  processed: number;
  requests: number;
  error?: string;
}
export async function collectAnalytics(
  options: CollectOptions,
  api?: AnalyticsClient,
  connection?: PoolClient,
): Promise<CollectResult> {
  if (isNextBuild())
    throw new Error("Analytics collection is disabled during builds.");
  if (process.env.DATABASE_URL) {
    let host: string;
    try {
      host = new URL(process.env.DATABASE_URL).hostname;
    } catch {
      throw new Error(
        "Invalid analytics database connection; details omitted.",
      );
    }
    if (host.includes("-pooler."))
      throw new Error(
        "Analytics collection requires a direct Neon connection for session locking; use the unpooled DATABASE_URL.",
      );
  }
  assertDay(options.startDay);
  assertDay(options.availableFrom);
  const today = utcDay(options.now ?? new Date());
  const yesterday = addDays(today, -1);
  let lastDay = yesterday;
  let availableFrom = options.availableFrom;
  if (options.endDay) {
    assertDay(options.endDay);
    if (options.endDay >= today || options.endDay < options.startDay)
      throw new Error("Import range must contain completed UTC days.");
    lastDay = options.endDay;
  }
  const deadlineAt = Date.now() + (options.maxDurationMs ?? Infinity);
  if (
    options.maxDurationMs !== undefined &&
    (options.maxDurationMs < 1000 || options.maxDurationMs > 45000)
  )
    throw new Error("Invocation budget must be 1-45 seconds.");
  const maxDays = options.maxDays ?? 7;
  const maxRequests = options.maxRequests ?? 20;
  if (
    !Number.isInteger(maxDays) ||
    maxDays < 1 ||
    maxDays > 31 ||
    !Number.isInteger(maxRequests) ||
    maxRequests < 2 ||
    maxRequests > 100
  )
    throw new Error("Collector bounds: 1-31 days and 2-100 requests.");
  if (options.lane === "daily" && (maxDays < 4 || maxRequests < 8)) {
    throw new Error(
      "Daily collection requires at least four day slots and eight requests for refresh and catch-up.",
    );
  }
  const project = process.env.ANALYTICS_PROJECT_ID?.trim();
  if (!project) throw new Error("Missing ANALYTICS_PROJECT_ID.");
  const source =
    api ??
    createAnalyticsClient(
      undefined,
      undefined,
      options.maxDurationMs ? { deadlineAt, timeoutMs: 3000 } : undefined,
    );
  const client = connection ?? (await (getPool() as Pool).connect());
  let locked = false;
  let run: string | undefined;
  let requests = 0;
  let processed = 0;
  let failure: Error | undefined;
  let destroyed = false;
  const params = [project];
  async function transaction(work: () => Promise<void>) {
    await client.query("BEGIN");
    try {
      await work();
      if (Date.now() >= deadlineAt)
        throw new AnalyticsBudgetError(
          "Invocation budget reached before commit.",
        );
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  }
  try {
    if (options.maxDurationMs) {
      await client.query("SET statement_timeout = '2000ms'");
      await client.query("SET lock_timeout = '1000ms'");
    }
    locked = (
      await client.query<{ locked: boolean }>(
        "SELECT pg_try_advisory_lock(hashtextextended($1, 0)) AS locked",
        [`analytics-archive:${project}`],
      )
    ).rows[0].locked;
    if (!locked) return { status: "overlap" as const, processed, requests };
    await client.query(
      "UPDATE dojo.analytics_run SET status='interrupted', finished_at=now() WHERE project_id=$1 AND status='running'",
      params,
    );
    if (Date.now() >= deadlineAt)
      throw new AnalyticsBudgetError(
        "Invocation time budget reached before collection.",
      );
    run = (
      await client.query<{ id: string }>(
        "INSERT INTO dojo.analytics_run(project_id,status,lane) VALUES ($1,'running',$2) RETURNING id",
        [project, options.lane],
      )
    ).rows[0].id;
    await client.query(
      "INSERT INTO dojo.analytics_progress(project_id,lane,next_day) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING",
      [project, options.lane, options.startDay],
    );
    if (options.initializeImport || options.resumeImport) {
      const saved = (
        await client.query<{
          start: string | null;
          end: string | null;
          next: string;
          available: string | null;
        }>(
          "SELECT to_char(start_day,'YYYY-MM-DD') AS start,to_char(end_day,'YYYY-MM-DD') AS end,to_char(next_day,'YYYY-MM-DD') AS next,to_char(available_from,'YYYY-MM-DD') AS available FROM dojo.analytics_progress WHERE project_id=$1 AND lane='backfill'",
          [project],
        )
      ).rows[0];
      if (options.resumeImport) {
        if (!saved?.start || !saved.end || !saved.available)
          throw new AnalyticsApiError(
            "incomplete",
            "No saved import range; select a supported range first.",
          );
        lastDay = saved.end;
        // Current configured retention floor may move forward since import selection.
        availableFrom =
          options.availableFrom > saved.available
            ? options.availableFrom
            : saved.available;
      } else {
        if (!options.endDay || options.startDay < options.availableFrom)
          throw new AnalyticsApiError(
            "incomplete",
            "Select a range within the supported reporting window.",
          );
        if (
          saved?.end &&
          saved.next <= saved.end &&
          (saved.start !== options.startDay || saved.end !== options.endDay)
        )
          throw new AnalyticsApiError(
            "incomplete",
            "An import is pending; continue the saved range before selecting a different range.",
          );
        if (
          !saved?.end ||
          saved.start !== options.startDay ||
          saved.end !== options.endDay
        ) {
          await client.query(
            "UPDATE dojo.analytics_progress SET start_day=$2,end_day=$3,available_from=$4,next_day=$2 WHERE project_id=$1 AND lane='backfill'",
            [project, options.startDay, options.endDay, options.availableFrom],
          );
        }
      }
    }
    const cursor = (
      await client.query<{ day: string }>(
        "SELECT to_char(next_day,'YYYY-MM-DD') AS day FROM dojo.analytics_progress WHERE project_id=$1 AND lane=$2",
        [project, options.lane],
      )
    ).rows[0].day;
    const days: string[] = [];
    // Refresh recent completed days first; catch-up uses the remaining budget.
    if (options.lane === "daily") {
      for (let offset = -3; offset <= -1 && days.length < maxDays; offset++) {
        const day = addDays(today, offset);
        if (day >= options.startDay) days.push(day);
      }
    }
    for (
      let day = cursor;
      day <= lastDay && days.length < maxDays;
      day = addDays(day, 1)
    ) {
      if (!days.includes(day)) days.push(day);
    }
    for (const [index, day] of days.entries()) {
      if (requests + 2 > maxRequests || Date.now() >= deadlineAt) break;
      const dayRequestLimit =
        requests +
        Math.max(
          2,
          Math.floor((maxRequests - requests) / (days.length - index)),
        );
      await client.query(
        "INSERT INTO dojo.analytics_day(project_id,day,status,run_id) VALUES ($1,$2,'incomplete',$3) ON CONFLICT (project_id,day) DO UPDATE SET run_id=$3",
        [project, day, run],
      );
      try {
        if (day < availableFrom) {
          await transaction(async () => {
            await client.query(
              "UPDATE dojo.analytics_day SET status='unavailable',pageviews=NULL,visitors=NULL WHERE project_id=$1 AND day=$2 AND status NOT IN ('complete','zero')",
              [project, day],
            );
            await advance(day);
          });
          processed++;
          continue;
        }
        const staged = (
          await client.query<{ request_path: string }>(
            "SELECT request_path FROM dojo.analytics_stage WHERE project_id=$1 AND day=$2 ORDER BY request_path",
            [project, day],
          )
        ).rows.map((row) => row.request_path);
        let exhausted = false;
        while (requests + 1 < Math.min(maxRequests, dayRequestLimit)) {
          if (Date.now() >= deadlineAt) break;
          requests++;
          const batch = await source.pages(day, [...staged]);
          await transaction(async () => {
            for (const page of batch.pages) {
              if (Date.now() >= deadlineAt)
                throw new AnalyticsBudgetError(
                  "Invocation budget reached during staging.",
                );
              await client.query(
                "INSERT INTO dojo.analytics_stage(project_id,day,request_path,pageviews,visitors) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (project_id,day,request_path) DO UPDATE SET pageviews=$4,visitors=$5",
                [project, day, page.requestPath, page.pageviews, page.visitors],
              );
            }
          });
          staged.push(...batch.pages.map((page) => page.requestPath));
          if (!batch.others) {
            exhausted = true;
            break;
          }
        }
        if (!exhausted || Date.now() >= deadlineAt) continue;
        requests++;
        const total = await source.total(day);
        if (!total)
          throw new AnalyticsApiError(
            "incomplete",
            "Empty daily result cannot distinguish unavailable history from zero traffic.",
          );
        const sum = (
          await client.query<{ total: string }>(
            "SELECT COALESCE(sum(pageviews),0)::text AS total FROM dojo.analytics_stage WHERE project_id=$1 AND day=$2",
            [project, day],
          )
        ).rows[0].total;
        if (BigInt(sum) !== BigInt(total.pageviews)) {
          // Source changed or omitted data; retry the entire day next time.
          await client.query(
            "DELETE FROM dojo.analytics_stage WHERE project_id=$1 AND day=$2",
            [project, day],
          );
          throw new AnalyticsApiError(
            "incomplete",
            "Enumerated page views do not reconcile with sitewide daily total; retry day.",
          );
        }
        await transaction(async () => {
          await client.query(
            "DELETE FROM dojo.analytics_page_day WHERE project_id=$1 AND day=$2",
            [project, day],
          );
          await client.query(
            "INSERT INTO dojo.analytics_page_day SELECT project_id,day,request_path,pageviews,visitors FROM dojo.analytics_stage WHERE project_id=$1 AND day=$2",
            [project, day],
          );
          await client.query(
            "UPDATE dojo.analytics_day SET status=$3,pageviews=$4,visitors=$5,collected_at=now(),run_id=$6 WHERE project_id=$1 AND day=$2",
            [
              project,
              day,
              total.pageviews === 0 && total.visitors === 0
                ? "zero"
                : "complete",
              total.pageviews,
              total.visitors,
              run,
            ],
          );
          await client.query(
            "DELETE FROM dojo.analytics_stage WHERE project_id=$1 AND day=$2",
            [project, day],
          );
          await advance(day);
        });
        processed++;
      } catch (error) {
        if (error instanceof AnalyticsBudgetError) break;
        const kind =
          error instanceof AnalyticsApiError ? error.kind : "api_failure";
        await client.query(
          "UPDATE dojo.analytics_day SET status=$3 WHERE project_id=$1 AND day=$2 AND status NOT IN ('complete','zero')",
          [project, day, kind],
        );
        // Persist only controlled codes, never upstream bodies or DB error text.
        failure = new AnalyticsApiError(
          kind,
          error instanceof AnalyticsApiError
            ? error.message
            : "Archive database operation failed; inspect database health. Details omitted.",
        );
        break;
      }
    }
    const next = (
      await client.query<{ day: string }>(
        "SELECT to_char(next_day,'YYYY-MM-DD') AS day FROM dojo.analytics_progress WHERE project_id=$1 AND lane=$2",
        [project, options.lane],
      )
    ).rows[0].day;
    const status = failure
      ? "failed"
      : next <= lastDay || processed < days.length
        ? "bounded"
        : "complete";
    await client.query(
      "UPDATE dojo.analytics_run SET status=$2,finished_at=now(),error_code=$3,processed_days=$4,request_count=$5 WHERE id=$1",
      [
        run,
        status,
        failure instanceof AnalyticsApiError ? failure.kind : null,
        processed,
        requests,
      ],
    );
    return { status, processed, requests, error: failure?.message };
  } catch (error) {
    if (run) {
      try {
        await client.query(
          "UPDATE dojo.analytics_run SET status=$2,finished_at=now(),error_code=$3 WHERE id=$1",
          [
            run,
            error instanceof AnalyticsBudgetError ? "bounded" : "failed",
            error instanceof AnalyticsBudgetError
              ? null
              : error instanceof AnalyticsApiError
                ? error.kind
                : "database_failure",
          ],
        );
      } catch {
        /* Preserve the redacted error if the connection is lost. */
      }
    }
    if (error instanceof AnalyticsApiError)
      return {
        status: "failed" as const,
        processed,
        requests,
        error: error.message,
      };
    if (error instanceof AnalyticsBudgetError)
      return { status: "bounded" as const, processed, requests };
    throw new Error(
      "Analytics archive database operation failed; details omitted.",
    );
  } finally {
    if (locked) {
      try {
        await client.query(
          "SELECT pg_advisory_unlock(hashtextextended($1, 0))",
          [`analytics-archive:${project}`],
        );
      } catch {
        client.release(true);
        destroyed = true;
      }
    }
    if (!connection && !destroyed)
      client.release(options.maxDurationMs ? true : undefined);
  }
  async function advance(day: string) {
    await client.query(
      "UPDATE dojo.analytics_progress SET next_day=$3::date + 1 WHERE project_id=$1 AND lane=$2 AND next_day=$3::date",
      [project, options.lane, day],
    );
  }
}
