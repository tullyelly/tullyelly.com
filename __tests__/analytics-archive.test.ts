/** @jest-environment node */
jest.mock("server-only", () => ({}));
jest.mock("@/db/pool", () => ({ getPool: jest.fn() }));
import type { PoolClient } from "pg";
import {
  createAnalyticsClient,
  addDays,
  AnalyticsApiError,
} from "@/lib/analytics-archive/client";
import { collectAnalytics } from "@/lib/analytics-archive/collector";
import { readFileSync } from "node:fs";

const row = (requestPath: string, pageviews = 2) => ({
  requestPath,
  pageviews,
  visitors: 1,
});
const response = (data: unknown) =>
  ({
    ok: true,
    json: async () => ({ version: 1, query: {}, data }),
  }) as Response;
beforeEach(() => {
  process.env.ANALYTICS_PROJECT_ID = "fixture-project";
  process.env.ANALYTICS_VERCEL_TOKEN = "secret-fixture-token";
});
test("UTC boundaries include leap days and reject invalid dates", () => {
  expect(addDays("2024-03-01", -1)).toBe("2024-02-29");
  expect(() => addDays("2024-02-30", 1)).toThrow();
});
test("production filter, exact paths, escaped exclusions and inclusive completed-day boundaries", async () => {
  const fetcher = jest.fn().mockResolvedValue(response([row("/new")]));
  await createAnalyticsClient(fetcher).pages("2026-10-09", ["/it's"]);
  const url = fetcher.mock.calls[0][0] as URL;
  expect(url.searchParams.get("filter")).toBe(
    "environment eq 'production' and requestPath ne '/it''s'",
  );
  expect(url.searchParams.get("until")).toBe("2026-10-09T23:59:59.999Z");
});
test("Others, duplicates, malformed values and empty history fail closed", async () => {
  for (const data of [
    [row("Others")],
    [row("/a"), row("/a")],
    [row("/a", -1)],
  ]) {
    await expect(
      createAnalyticsClient(jest.fn().mockResolvedValue(response(data))).pages(
        "2026-10-09",
        [],
      ),
    ).rejects.toThrow();
  }
  expect(
    await createAnalyticsClient(
      jest.fn().mockResolvedValue(response([])),
    ).total("2026-10-09"),
  ).toBeNull();
});
test("transient failures retry boundedly and redact upstream secrets; permanent failures do not retry", async () => {
  const sleep = jest.fn().mockResolvedValue(undefined);
  const fetcher = jest.fn().mockResolvedValue({ ok: false, status: 503 });
  await expect(
    createAnalyticsClient(fetcher, sleep).pages("2026-10-09", []),
  ).rejects.toThrow("HTTP 503");
  expect(fetcher).toHaveBeenCalledTimes(3);
  fetcher.mockClear().mockResolvedValue({ ok: false, status: 401 });
  await expect(
    createAnalyticsClient(fetcher, sleep).pages("2026-10-09", []),
  ).rejects.toThrow("check token access");
  expect(fetcher).toHaveBeenCalledTimes(1);
});

// Stateful fixture models committed progress and staging; it is not a SQL engine.
function fixture(
  locked = true,
  failCompletion = false,
  firstDay = "2026-10-09",
) {
  let next = firstDay;
  let saved = {
    start: null as string | null,
    end: null as string | null,
    available: null as string | null,
  };
  let stage: ReturnType<typeof row>[] = [];
  let archive: ReturnType<typeof row>[] = [];
  let status = "incomplete";
  let snapshot:
    | {
        next: string;
        stage: typeof stage;
        archive: typeof archive;
        status: string;
      }
    | undefined;
  const queries: string[] = [];
  const query = jest.fn(async (sql: string, values: unknown[] = []) => {
    queries.push(sql);
    if (sql === "BEGIN")
      snapshot = { next, stage: [...stage], archive: [...archive], status };
    if (sql === "ROLLBACK" && snapshot)
      ({ next, stage, archive, status } = snapshot);
    if (failCompletion && sql.includes("SET status=$3,pageviews"))
      throw new Error("fixture database fault with sensitive details");
    if (sql.includes("pg_try_advisory")) return { rows: [{ locked }] };
    if (sql.includes("RETURNING id")) return { rows: [{ id: "1" }] };
    if (sql.includes("to_char(start_day"))
      return { rows: [{ ...saved, next }] };
    if (sql.includes("SET start_day=$2")) {
      saved = {
        start: String(values[1]),
        end: String(values[2]),
        available: String(values[3]),
      };
      next = String(values[1]);
    }
    if (sql.includes("to_char(next_day")) return { rows: [{ day: next }] };
    if (sql.startsWith("SELECT request_path"))
      return { rows: stage.map((p) => ({ request_path: p.requestPath })) };
    if (sql.includes("sum(pageviews)"))
      return {
        rows: [
          { total: String(stage.reduce((sum, p) => sum + p.pageviews, 0)) },
        ],
      };
    if (sql.startsWith("INSERT INTO dojo.analytics_stage")) {
      const page = row(String(values[2]), Number(values[3]));
      stage = [
        ...stage.filter((p) => p.requestPath !== page.requestPath),
        page,
      ];
    }
    if (sql.startsWith("DELETE FROM dojo.analytics_stage")) stage = [];
    if (sql.startsWith("DELETE FROM dojo.analytics_page_day")) archive = [];
    if (sql.startsWith("INSERT INTO dojo.analytics_page_day"))
      archive = [...stage];
    if (sql.includes("SET status=$3,pageviews")) status = String(values[2]);
    if (sql.includes("SET next_day") && values[2] === next)
      next = addDays(next, 1);
    return { rows: [] };
  });
  return {
    client: { query, release: jest.fn() } as unknown as PoolClient,
    queries,
    state: () => ({ next, stage, archive, status, saved }),
  };
}
const options = {
  lane: "backfill" as const,
  startDay: "2026-10-09",
  availableFrom: "2026-10-01",
  now: new Date("2026-10-10T00:00:00Z"),
  maxRequests: 2,
};
test("overlap does no collection or writes", async () => {
  const db = fixture(false);
  const api = { pages: jest.fn(), total: jest.fn() };
  expect((await collectAnalytics(options, api, db.client)).status).toBe(
    "overlap",
  );
  expect(api.pages).not.toHaveBeenCalled();
  expect(db.queries).toHaveLength(1);
});
test("truncation persists staging, interruption resumes exclusions, and reruns replace rather than add", async () => {
  const db = fixture();
  const api = {
    pages: jest
      .fn()
      .mockResolvedValueOnce({ pages: [row("/a")], others: true })
      .mockResolvedValue({ pages: [row("/b")], others: false }),
    total: jest.fn().mockResolvedValue({ pageviews: 4, visitors: 1 }),
  };
  expect((await collectAnalytics(options, api, db.client)).status).toBe(
    "bounded",
  );
  expect(db.state().next).toBe("2026-10-09");
  expect(db.state().archive).toEqual([]);
  expect((await collectAnalytics(options, api, db.client)).status).toBe(
    "complete",
  );
  expect(api.pages.mock.calls[1][1]).toEqual(["/a"]);
  expect(db.state().archive).toHaveLength(2);
  expect(db.state().next).toBe("2026-10-10");
  const daily = { ...options, lane: "daily" as const, maxRequests: 8 };
  api.pages.mockResolvedValue({
    pages: [row("/replacement", 4)],
    others: false,
  });
  await collectAnalytics(daily, api, db.client);
  expect(db.state().archive).toEqual([row("/replacement", 4)]);
  const completion = db.queries.findIndex((q) =>
    q.includes("SET status=$3,pageviews"),
  );
  expect(db.queries.slice(0, completion).lastIndexOf("BEGIN")).toBeGreaterThan(
    db.queries.slice(0, completion).lastIndexOf("COMMIT"),
  );
});
test("partial API failure and missing daily data do not advance or publish; zero must be explicit", async () => {
  const db = fixture();
  const api = {
    pages: jest.fn().mockResolvedValue({ pages: [], others: false }),
    total: jest
      .fn()
      .mockRejectedValue(new AnalyticsApiError("api_failure", "safe error")),
  };
  expect((await collectAnalytics(options, api, db.client)).status).toBe(
    "failed",
  );
  expect(db.state().next).toBe("2026-10-09");
  expect(db.state().archive).toEqual([]);
  api.total.mockResolvedValue(null);
  expect((await collectAnalytics(options, api, db.client)).status).toBe(
    "failed",
  );
  api.total.mockResolvedValue({ pageviews: 0, visitors: 0 });
  await collectAnalytics(options, api, db.client);
  expect(db.state().status).toBe("zero");
});
test("unavailable history is explicit and current UTC day is never queried", async () => {
  const db = fixture();
  const api = { pages: jest.fn(), total: jest.fn() };
  await collectAnalytics(
    { ...options, availableFrom: "2026-10-10" },
    api,
    db.client,
  );
  expect(api.pages).not.toHaveBeenCalled();
  expect(db.queries.some((q) => q.includes("status='unavailable'"))).toBe(true);
  await collectAnalytics(options, api, db.client);
  expect(api.pages).not.toHaveBeenCalled();
});
test("forward migration has exact page/day uniqueness, separate staging, lanes and status constraints", () => {
  const sql = readFileSync(
    "db/migrations/076_create_analytics_archive.sql",
    "utf8",
  );
  expect(sql).toContain("PRIMARY KEY (project_id, day, request_path)");
  expect(sql).toContain("PRIMARY KEY (project_id, lane)");
  expect(sql).toContain("'unavailable', 'api_failure'");
  expect(sql).not.toMatch(/visitor_id|DROP TABLE/i);
});
test("completion failure rolls back archive replacement and cursor while keeping committed staging", async () => {
  const db = fixture(true, true);
  const api = {
    pages: jest.fn().mockResolvedValue({ pages: [row("/a")], others: false }),
    total: jest.fn().mockResolvedValue({ pageviews: 2, visitors: 1 }),
  };
  const result = await collectAnalytics(options, api, db.client);
  expect(result.status).toBe("failed");
  expect(result.error).not.toContain("sensitive");
  expect(db.state().archive).toEqual([]);
  expect(db.state().stage).toEqual([row("/a")]);
  expect(db.state().next).toBe("2026-10-09");
  expect(db.queries).toContain("ROLLBACK");
});
test("mismatched independent sitewide total cannot establish complete coverage", async () => {
  const db = fixture();
  const api = {
    pages: jest.fn().mockResolvedValue({ pages: [row("/a")], others: false }),
    total: jest.fn().mockResolvedValue({ pageviews: 20, visitors: 1 }),
  };
  expect((await collectAnalytics(options, api, db.client)).status).toBe(
    "failed",
  );
  expect(db.state().stage).toEqual([]);
  expect(db.state().next).toBe("2026-10-09");
});
test("request timeouts abort every attempt with a bounded retry count", async () => {
  jest.useFakeTimers();
  try {
    const fetcher = jest.fn(
      (_url: unknown, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) =>
          init?.signal?.addEventListener("abort", () =>
            reject(new Error("private network error")),
          ),
        ),
    );
    const promise = createAnalyticsClient(fetcher, async () => {}).pages(
      "2026-10-09",
      [],
    );
    const assertion = expect(promise).rejects.toThrow("timed out or failed");
    await jest.advanceTimersByTimeAsync(30000);
    await assertion;
    expect(fetcher).toHaveBeenCalledTimes(3);
  } finally {
    jest.useRealTimers();
  }
});
test("build guard rejects before touching an injected database or API", async () => {
  process.env.NEXT_PHASE = "phase-production-build";
  try {
    const db = fixture();
    await expect(
      collectAnalytics(options, undefined, db.client),
    ).rejects.toThrow("disabled during builds");
    expect(db.queries).toEqual([]);
  } finally {
    delete process.env.NEXT_PHASE;
  }
});
test("daily refresh allocates work to catch-up despite truncated recent days", async () => {
  const db = fixture(true, false, "2026-10-01");
  const api = {
    pages: jest.fn().mockResolvedValue({ pages: [row("/a")], others: true }),
    total: jest.fn(),
  };
  const result = await collectAnalytics(
    {
      ...options,
      lane: "daily",
      startDay: "2026-10-01",
      maxDays: 4,
      maxRequests: 8,
    },
    api,
    db.client,
  );
  expect(result.status).toBe("bounded");
  expect([...new Set(api.pages.mock.calls.map((call) => call[0]))]).toEqual([
    "2026-10-07",
    "2026-10-08",
    "2026-10-09",
    "2026-10-01",
  ]);
  expect(result.requests).toBeLessThanOrEqual(8);
  expect(api.total).not.toHaveBeenCalled();
  expect(db.state().next).toBe("2026-10-01");
});
test("selected history range resumes across duplicate starts and continuation stops at its saved end", async () => {
  const db = fixture(true, false, "2026-10-06");
  const api = {
    pages: jest.fn().mockResolvedValue({ pages: [], others: false }),
    total: jest.fn().mockResolvedValue({ pageviews: 0, visitors: 0 }),
  };
  const selection = {
    ...options,
    startDay: "2026-10-06",
    endDay: "2026-10-08",
    initializeImport: true,
    maxDays: 1,
  };
  expect((await collectAnalytics(selection, api, db.client)).status).toBe(
    "bounded",
  );
  expect(db.state().next).toBe("2026-10-07");
  expect((await collectAnalytics(selection, api, db.client)).status).toBe(
    "bounded",
  );
  expect(db.state().next).toBe("2026-10-08");
  expect(
    (
      await collectAnalytics(
        { ...options, resumeImport: true, maxDays: 1 },
        api,
        db.client,
      )
    ).status,
  ).toBe("complete");
  expect(db.state().next).toBe("2026-10-09");
  expect(api.pages.mock.calls.map((call) => call[0])).toEqual([
    "2026-10-06",
    "2026-10-07",
    "2026-10-08",
  ]);
  expect(
    db.queries.filter((query) => query.includes("SET start_day=$2")),
  ).toHaveLength(1);
});
test("a different pending import range cannot replace durable progress", async () => {
  const db = fixture(true, false, "2026-10-06");
  const api = {
    pages: jest.fn().mockResolvedValue({ pages: [], others: false }),
    total: jest.fn().mockResolvedValue({ pageviews: 0, visitors: 0 }),
  };
  const selection = {
    ...options,
    startDay: "2026-10-06",
    endDay: "2026-10-08",
    initializeImport: true,
    maxDays: 1,
  };
  await collectAnalytics(selection, api, db.client);
  expect(
    (
      await collectAnalytics(
        { ...selection, startDay: "2026-10-05" },
        api,
        db.client,
      )
    ).status,
  ).toBe("failed");
  expect(db.state().next).toBe("2026-10-07");
  expect(db.state().saved.start).toBe("2026-10-06");
  expect(api.pages).toHaveBeenCalledTimes(1);
});
test("deadline exhaustion cannot commit completion markers or lose saved staging", async () => {
  jest.useFakeTimers().setSystemTime(new Date("2026-10-10T09:17:00Z"));
  try {
    const db = fixture();
    const api = {
      pages: jest.fn().mockResolvedValue({ pages: [row("/a")], others: false }),
      total: jest.fn().mockImplementation(async () => {
        jest.setSystemTime(new Date("2026-10-10T09:17:02Z"));
        return { pageviews: 2, visitors: 1 };
      }),
    };
    const result = await collectAnalytics(
      { ...options, maxDurationMs: 1000 },
      api,
      db.client,
    );
    expect(result.status).toBe("bounded");
    expect(db.state().next).toBe("2026-10-09");
    expect(db.state().archive).toEqual([]);
    expect(db.state().stage).toEqual([row("/a")]);
    expect(db.queries).toContain("ROLLBACK");
  } finally {
    jest.useRealTimers();
  }
});
test("phase 2 migration preserves existing data and scopes the capability with revision notifications", () => {
  const sql = readFileSync(
    "db/migrations/077_analytics_operations.sql",
    "utf8",
  );
  expect(sql).toContain("ADD COLUMN end_day DATE");
  expect(sql).toContain("'admin.analytics.manage'");
  expect(sql).toContain("membership.app_id = feature.app_id");
  expect(sql).toContain("dojo.authz_bump_revision(affected)");
  expect(sql).toContain("pg_notify('authz_changed'");
  expect(sql).not.toMatch(/DROP TABLE|INSERT INTO dojo.authz_user_app_role/i);
});
