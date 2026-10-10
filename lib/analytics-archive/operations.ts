import "server-only";
import { queryRows } from "@/lib/db";
import { initSentry } from "@/lib/sentry";
import { getSentry } from "@/lib/safeSentry";
import { addDays, assertDay, createAnalyticsClient, utcDay } from "./client";
import { collectAnalytics } from "./collector";

export type OperationResult = {
  status: "success" | "partial" | "disabled" | "failure";
  message: string;
  processed?: number;
  requests?: number;
};
export type Operation =
  | { kind: "daily" | "continue_import" }
  | { kind: "start_import"; from: string; through: string };
export function analyticsSyncEnabled(): boolean {
  return process.env.ANALYTICS_SYNC_ENABLED === "true";
}
export function supportedRange(now = new Date()) {
  const from = process.env.ANALYTICS_AVAILABLE_FROM?.trim();
  if (!from)
    throw new Error(
      "Set ANALYTICS_AVAILABLE_FROM to the operator-confirmed first fully available UTC day.",
    );
  assertDay(from);
  const through = addDays(utcDay(now), -1);
  if (from > through)
    throw new Error(
      "ANALYTICS_AVAILABLE_FROM must include at least one completed UTC day.",
    );
  return { from, through };
}
export async function reportAnalyticsFailure(code: string): Promise<void> {
  // Never report upstream payloads, headers, tokens, SQL errors or input values.
  console.error("Analytics operation failed:", code);
  try {
    await initSentry();
    const sentry = await getSentry();
    sentry?.captureException(new Error(`Analytics operation failed: ${code}`), {
      tags: { subsystem: "analytics-archive" },
    });
    await sentry?.flush(2000);
  } catch {
    /* Error reporting must not turn a controlled response into a crash. */
  }
}
export async function runAnalyticsOperation(
  operation: Operation,
): Promise<OperationResult> {
  if (!analyticsSyncEnabled())
    return {
      status: "disabled",
      message: "Collection is disabled. Test connection remains available.",
    };
  let range: ReturnType<typeof supportedRange>;
  try {
    range = supportedRange();
  } catch {
    await reportAnalyticsFailure("supported_window_configuration");
    return {
      status: "failure",
      message:
        "Configure ANALYTICS_AVAILABLE_FROM with a valid, supported completed UTC day before collection.",
    };
  }
  if (operation.kind === "start_import") {
    try {
      assertDay(operation.from);
      assertDay(operation.through);
    } catch {
      return {
        status: "failure",
        message: "Select both import dates as UTC calendar days.",
      };
    }
    if (
      operation.from < range.from ||
      operation.through > range.through ||
      operation.from > operation.through
    )
      return {
        status: "failure",
        message:
          "Select an ordered range inside the supported reporting window shown on this page.",
      };
  }
  try {
    const start =
      operation.kind === "daily"
        ? addDays(range.through, -2) > range.from
          ? addDays(range.through, -2)
          : range.from
        : operation.kind === "start_import"
          ? operation.from
          : range.from;
    const result = await collectAnalytics({
      lane: operation.kind === "daily" ? "daily" : "backfill",
      startDay: start,
      availableFrom: range.from,
      endDay: operation.kind === "start_import" ? operation.through : undefined,
      initializeImport: operation.kind === "start_import",
      resumeImport: operation.kind === "continue_import",
      maxDays: 4,
      maxRequests: 8,
      maxDurationMs: 35000,
    });
    if (result.status === "failed") {
      await reportAnalyticsFailure("collector_failed");
      return {
        status: "failure",
        message:
          result.error ?? "Collection failed; saved progress can be retried.",
        processed: result.processed,
        requests: result.requests,
      };
    }
    return {
      status: result.status === "complete" ? "success" : "partial",
      message:
        result.status === "overlap"
          ? "Another collector holds the lock. No collection was started; retry later."
          : result.status === "bounded"
            ? "Bounded batch finished. Saved progress remains; request another batch to continue."
            : "All selected work completed and committed.",
      processed: result.processed,
      requests: result.requests,
    };
  } catch {
    await reportAnalyticsFailure("configuration_or_database_failure");
    return {
      status: "failure",
      message:
        "Collection could not execute. Check analytics credentials, migrations 076/077, and database connectivity; credentials and internal errors are omitted.",
    };
  }
}

const requiredColumns = {
  analytics_run: [
    "id",
    "project_id",
    "started_at",
    "finished_at",
    "status",
    "error_code",
    "lane",
    "processed_days",
    "request_count",
  ],
  analytics_progress: [
    "project_id",
    "lane",
    "next_day",
    "start_day",
    "end_day",
    "available_from",
  ],
  analytics_day: [
    "project_id",
    "day",
    "status",
    "pageviews",
    "visitors",
    "collected_at",
    "run_id",
  ],
  analytics_page_day: [
    "project_id",
    "day",
    "request_path",
    "pageviews",
    "visitors",
  ],
  analytics_stage: [
    "project_id",
    "day",
    "request_path",
    "pageviews",
    "visitors",
  ],
};
export async function testAnalyticsConnection(): Promise<OperationResult> {
  try {
    const api = createAnalyticsClient(undefined, undefined, {
      deadlineAt: Date.now() + 12000,
      timeoutMs: 3000,
    });
    // Catalog and aggregate SELECTs only; no migration ledger initialization or collector call.
    const columns = await queryRows<{
      table_name: string;
      column_name: string;
    }>(
      "SELECT table_name,column_name FROM information_schema.columns WHERE table_schema='dojo' AND table_name = ANY($1::text[])",
      [Object.keys(requiredColumns)],
    );
    const missing = Object.entries(requiredColumns).some(([table, names]) =>
      names.some(
        (name) =>
          !columns.some(
            (column) =>
              column.table_name === table && column.column_name === name,
          ),
      ),
    );
    if (missing)
      return {
        status: "failure",
        message:
          "Archive schema is not ready. Apply migrations 076 and 077 to the confirmed target before collection.",
      };
    const total = await api.total(addDays(utcDay(new Date()), -1));
    return {
      status: "success",
      message: total
        ? "Configuration, archive schema and a read-only production analytics query passed."
        : "Configuration, archive schema and API access passed. The empty daily response does not establish zero traffic or available history.",
    };
  } catch {
    await reportAnalyticsFailure("connection_test_failed");
    return {
      status: "failure",
      message:
        "Connection test failed. Check database connectivity and analytics token, project/team access and API contract; credentials are omitted.",
    };
  }
}
