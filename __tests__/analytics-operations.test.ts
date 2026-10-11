/** @jest-environment node */
jest.mock("server-only", () => ({}));
jest.mock("@/lib/db", () => ({ queryRows: jest.fn() }));
jest.mock("@/lib/analytics-archive/collector", () => ({
  collectAnalytics: jest.fn(),
}));
jest.mock("@/lib/analytics-archive/client", () => ({
  ...jest.requireActual("@/lib/analytics-archive/client"),
  createAnalyticsClient: jest.fn(),
}));
jest.mock("@/lib/sentry", () => ({ initSentry: jest.fn() }));
jest.mock("@/lib/safeSentry", () => ({ getSentry: jest.fn() }));
import { queryRows } from "@/lib/db";
import { collectAnalytics } from "@/lib/analytics-archive/collector";
import { createAnalyticsClient } from "@/lib/analytics-archive/client";
import {
  runAnalyticsOperation,
  testAnalyticsConnection,
} from "@/lib/analytics-archive/operations";
import {
  dailyCollectionStale,
  getAnalyticsStatus,
} from "@/lib/analytics-archive/status";
import { getSentry } from "@/lib/safeSentry";

const collector = jest.mocked(collectAnalytics);
const client = jest.mocked(createAnalyticsClient);
const rows = jest.mocked(queryRows);
beforeEach(() => {
  jest.clearAllMocks();
  jest
    .useFakeTimers({
      doNotFake: [
        "setTimeout",
        "clearTimeout",
        "setInterval",
        "clearInterval",
        "setImmediate",
        "clearImmediate",
        "nextTick",
        "queueMicrotask",
      ],
    })
    .setSystemTime(new Date("2026-10-10T09:17:00Z"));
  process.env.ANALYTICS_PROJECT_ID = "fixture-project";
  process.env.ANALYTICS_AVAILABLE_FROM = "2026-10-01";
  delete process.env.ANALYTICS_SYNC_ENABLED;
});
afterEach(() => jest.useRealTimers());
test.each([undefined, "false", "1", "TRUE"])(
  "default-off switch rejects collection for %s without any data work",
  async (value) => {
    if (value !== undefined) process.env.ANALYTICS_SYNC_ENABLED = value;
    for (const operation of [
      { kind: "daily" },
      { kind: "continue_import" },
      { kind: "start_import", from: "2026-10-01", through: "2026-10-09" },
    ] as const)
      expect((await runAnalyticsOperation(operation)).status).toBe("disabled");
    expect(collector).not.toHaveBeenCalled();
    expect(rows).not.toHaveBeenCalled();
    expect(client).not.toHaveBeenCalled();
  },
);
test("test connection while disabled performs catalog SELECT and one small API read, never collector writes", async () => {
  const columns = {
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
  rows.mockResolvedValueOnce(
    Object.entries(columns).flatMap(([table_name, names]) =>
      names.map((column_name) => ({ table_name, column_name })),
    ),
  );
  const total = jest.fn().mockResolvedValue(null);
  client.mockReturnValue({ pages: jest.fn(), total });
  expect((await testAnalyticsConnection()).status).toBe("success");
  expect(rows.mock.calls[0][0]).toMatch(/^SELECT /);
  expect(total).toHaveBeenCalledWith("2026-10-09");
  expect(collector).not.toHaveBeenCalled();
});
test("schema not ready avoids the API query and gives migration guidance", async () => {
  rows.mockResolvedValueOnce([]);
  const total = jest.fn();
  client.mockReturnValue({ pages: jest.fn(), total });
  expect((await testAnalyticsConnection()).message).toContain("076 and 077");
  expect(total).not.toHaveBeenCalled();
});
test("same bounded daily service maps duplicate overlap and completion to explicit responses", async () => {
  process.env.ANALYTICS_SYNC_ENABLED = "true";
  collector
    .mockResolvedValueOnce({ status: "overlap", processed: 0, requests: 0 })
    .mockResolvedValueOnce({ status: "complete", processed: 3, requests: 6 });
  expect((await runAnalyticsOperation({ kind: "daily" })).status).toBe(
    "partial",
  );
  expect((await runAnalyticsOperation({ kind: "daily" })).status).toBe(
    "success",
  );
  expect(collector.mock.calls[0][0]).toMatchObject({
    lane: "daily",
    startDay: "2026-10-07",
    maxDays: 4,
    maxRequests: 8,
    maxDurationMs: 35000,
  });
});
test("history bounds reject current day, reversed and unavailable ranges before collector", async () => {
  process.env.ANALYTICS_SYNC_ENABLED = "true";
  for (const [from, through] of [
    ["2026-09-30", "2026-10-09"],
    ["2026-10-01", "2026-10-10"],
    ["2026-10-09", "2026-10-01"],
    ["garbage", "2026-10-09"],
  ])
    expect(
      (await runAnalyticsOperation({ kind: "start_import", from, through }))
        .status,
    ).toBe("failure");
  expect(collector).not.toHaveBeenCalled();
});
test("one import request starts a range; continue uses saved progress without a background loop", async () => {
  process.env.ANALYTICS_SYNC_ENABLED = "true";
  collector.mockResolvedValue({ status: "bounded", processed: 1, requests: 2 });
  expect(
    (
      await runAnalyticsOperation({
        kind: "start_import",
        from: "2026-10-01",
        through: "2026-10-05",
      })
    ).status,
  ).toBe("partial");
  expect(collector).toHaveBeenCalledTimes(1);
  expect(collector.mock.calls[0][0]).toMatchObject({
    initializeImport: true,
    endDay: "2026-10-05",
    lane: "backfill",
  });
  await runAnalyticsOperation({ kind: "continue_import" });
  expect(collector).toHaveBeenCalledTimes(2);
  expect(collector.mock.calls[1][0]).toMatchObject({
    resumeImport: true,
    initializeImport: false,
    lane: "backfill",
  });
});
test("execution failures are redacted and use configured error reporting", async () => {
  process.env.ANALYTICS_SYNC_ENABLED = "true";
  const errorLog = jest.spyOn(console, "error").mockImplementation(() => {});
  const captureException = jest.fn();
  const flush = jest.fn().mockResolvedValue(true);
  jest.mocked(getSentry).mockResolvedValue({ captureException, flush });
  collector.mockRejectedValueOnce(new Error("secret-token database password"));
  try {
    const result = await runAnalyticsOperation({ kind: "daily" });
    expect(result.status).toBe("failure");
    expect(JSON.stringify(result)).not.toContain("secret-token");
    expect(String(captureException.mock.calls[0][0])).not.toContain("password");
    expect(flush).toHaveBeenCalledWith(2000);
  } finally {
    errorLog.mockRestore();
  }
});
test("36-hour freshness uses daily success independently of a recent successful backfill", async () => {
  const now = new Date("2026-10-10T09:17:00Z");
  expect(dailyCollectionStale("2026-10-08T21:17:00Z", now)).toBe(false);
  expect(dailyCollectionStale("2026-10-08T21:16:59Z", now)).toBe(true);
  expect(dailyCollectionStale(null, now)).toBe(true);
  rows
    .mockResolvedValueOnce([
      {
        id: "2",
        lane: "backfill",
        status: "complete",
        started_at: "2026-10-10T08:00:00Z",
        finished_at: "2026-10-10T08:00:00Z",
        error_code: null,
        processed_days: 1,
        request_count: 2,
      },
      {
        id: "1",
        lane: "daily",
        status: "complete",
        started_at: "2026-10-08T20:00:00Z",
        finished_at: "2026-10-08T20:00:00Z",
        error_code: null,
        processed_days: 3,
        request_count: 6,
      },
    ])
    .mockResolvedValueOnce([{ day: "2026-10-09" }])
    .mockResolvedValueOnce([{ day: "2026-10-10" }])
    .mockResolvedValueOnce([]);
  expect((await getAnalyticsStatus(now)).stale).toBe(true);
});
