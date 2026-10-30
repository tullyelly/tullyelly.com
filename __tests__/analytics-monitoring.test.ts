/** @jest-environment node */
jest.mock("server-only", () => ({}));
jest.mock("@/lib/db", () => ({ queryRows: jest.fn() }));
jest.mock("@/lib/sentry", () => ({ initSentry: jest.fn() }));
jest.mock("@/lib/safeSentry", () => ({ getSentry: jest.fn() }));
jest.mock("@/lib/analytics-archive/operations", () => ({
  analyticsSyncEnabled: jest.fn(),
  runAnalyticsOperation: jest.fn(),
}));
import { queryRows } from "@/lib/db";
import { getSentry } from "@/lib/safeSentry";
import { initSentry } from "@/lib/sentry";
import {
  analyticsSyncEnabled,
  runAnalyticsOperation,
} from "@/lib/analytics-archive/operations";
import {
  dailyDataRefreshed,
  runScheduledAnalytics,
} from "@/lib/analytics-archive/monitoring";
import { GET } from "@/app/api/cron/analytics/route";
const env = { ...process.env };
const captureCheckIn = jest.fn(() => "fixture-check-in");
const flush = jest.fn(async () => true);
let info: jest.SpyInstance;
beforeEach(() => {
  jest.resetAllMocks();
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
    .setSystemTime(new Date("2026-10-29T09:17:00Z"));
  process.env.VERCEL_ENV = "production";
  process.env.ANALYTICS_PROJECT_ID = "fixture-project";
  process.env.CRON_SECRET = "fixture-private-secret";
  jest.mocked(analyticsSyncEnabled).mockReturnValue(true);
  jest
    .mocked(runAnalyticsOperation)
    .mockResolvedValue({ status: "success", message: "fixture" });
  captureCheckIn.mockReturnValue("fixture-check-in");
  flush.mockResolvedValue(true);
  jest.mocked(getSentry).mockResolvedValue({ captureCheckIn, flush });
  jest.mocked(queryRows).mockResolvedValue([{ ready: true }]);
  info = jest.spyOn(console, "info").mockImplementation(() => {});
});
afterEach(() => {
  jest.useRealTimers();
  info.mockRestore();
  process.env = { ...env };
});
test("one scheduled invocation pairs a single start/terminal ID, without monitor settings or payloads", async () => {
  await runScheduledAnalytics();
  expect(captureCheckIn.mock.calls).toEqual([
    [{ monitorSlug: "analytics-daily", status: "in_progress" }],
    [
      {
        monitorSlug: "analytics-daily",
        status: "ok",
        checkInId: "fixture-check-in",
        duration: 0,
      },
    ],
  ]);
  expect(flush).toHaveBeenCalledTimes(2);
  expect(JSON.stringify(captureCheckIn.mock.calls)).not.toContain(
    "fixture-private-secret",
  );
  expect(info).toHaveBeenCalledWith("Analytics daily monitor:", "healthy");
});
test.each(["failure", "throw"])(
  "%s reports execution failure, not stale or healthy",
  async (kind) => {
    if (kind === "throw")
      jest
        .mocked(runAnalyticsOperation)
        .mockRejectedValue(new Error("private upstream data"));
    else
      jest.mocked(runAnalyticsOperation).mockResolvedValue({
        status: "failure",
        message: "private upstream data",
      });
    await runScheduledAnalytics().catch(() => {});
    expect(queryRows).not.toHaveBeenCalled();
    expect(info).toHaveBeenCalledWith(
      "Analytics daily monitor:",
      "execution_failure",
    );
    expect(captureCheckIn).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: "error" }),
    );
    expect(JSON.stringify(captureCheckIn.mock.calls)).not.toContain(
      "private upstream data",
    );
  },
);
test.each([false, "database-error"])(
  "a completed execution with %s freshness reports stale data",
  async (freshness) => {
    if (freshness === false)
      jest.mocked(queryRows).mockResolvedValue([{ ready: false }]);
    else
      jest
        .mocked(queryRows)
        .mockRejectedValue(new Error("private driver data"));
    await runScheduledAnalytics();
    expect(info).toHaveBeenCalledWith("Analytics daily monitor:", "stale_data");
    expect(captureCheckIn).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: "error" }),
    );
  },
);
test("freshness binds yesterday to a daily run in this invocation; imports/old verified rows cannot satisfy it", async () => {
  const started = new Date("2026-10-29T09:17:00Z");
  expect(await dailyDataRefreshed(started)).toBe(true);
  const [sql, params] = jest.mocked(queryRows).mock.calls[0];
  expect(sql).toContain("r.lane='daily'");
  expect(sql).toContain("r.started_at >= $3::timestamptz");
  expect(sql).toContain("r.id=d.run_id");
  expect(params).toEqual([
    "fixture-project",
    "2026-10-28",
    started.toISOString(),
  ]);
  expect(sql).not.toMatch(/\b(INSERT|UPDATE|DELETE|CREATE|NOTIFY)\b/);
});
test("a missing/unauthorized invocation cannot manufacture a heartbeat or invoke collection", async () => {
  // No invocation at the schedule: only the external monitor can detect absence.
  jest.advanceTimersByTime(16 * 60 * 1000);
  expect(captureCheckIn).not.toHaveBeenCalled();
  expect(runAnalyticsOperation).not.toHaveBeenCalled();
  expect(
    (await GET(new Request("https://tullyelly.com/api/cron/analytics"))).status,
  ).toBe(401);
  expect(captureCheckIn).not.toHaveBeenCalled();
  expect(runAnalyticsOperation).not.toHaveBeenCalled();
});
test.each(["disabled", "preview", "development"])(
  "%s sends no production check-ins",
  async (kind) => {
    if (kind === "disabled")
      jest.mocked(analyticsSyncEnabled).mockReturnValue(false);
    else process.env.VERCEL_ENV = kind;
    await runScheduledAnalytics();
    expect(initSentry).not.toHaveBeenCalled();
    expect(captureCheckIn).not.toHaveBeenCalled();
  },
);
test("Sentry transport failure cannot prevent collection or change its controlled result", async () => {
  captureCheckIn.mockImplementationOnce(() => {
    throw new Error("private transport data");
  });
  expect((await runScheduledAnalytics()).status).toBe("success");
  expect(runAnalyticsOperation).toHaveBeenCalledTimes(1);
});
