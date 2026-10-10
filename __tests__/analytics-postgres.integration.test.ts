/** @jest-environment node */
// Explicit opt-in only; never uses DATABASE_URL or an implicit .env file.
jest.mock("server-only", () => ({}));
jest.mock("next/cache", () => ({ unstable_cache: (fn: unknown) => fn }));
jest.mock("contentlayer/generated", () => ({ allPosts: [] }));
jest.mock("@/db/pool", () => ({ getPool: jest.fn() }));
import { Pool } from "pg";
import { analyticsTestTarget } from "@/db/analytics-test-target";
import { getPool } from "@/db/pool";
import { collectAnalytics } from "@/lib/analytics-archive/collector";
import { readPublicAnalytics } from "@/lib/analytics-archive/public";
import { addDays, type AnalyticsClient } from "@/lib/analytics-archive/client";
import { readFileSync } from "node:fs";

const integration =
  process.env.ANALYTICS_INTEGRATION_CONFIRMED === "true"
    ? describe
    : describe.skip;
integration(
  "confirmed disposable PostgreSQL archive integration; API responses are fixtures",
  () => {
    let pool: Pool;
    let project: string;
    const start = "2024-02-27";
    const options = {
      lane: "backfill" as const,
      startDay: start,
      availableFrom: start,
      endDay: "2024-03-02",
      now: new Date("2024-03-03T00:00:00Z"),
      maxDays: 2,
      maxRequests: 4,
      initializeImport: true,
    };
    const api: AnalyticsClient = {
      pages: async () => ({
        pages: [
          { requestPath: "/shaolin/public", pageviews: 2, visitors: 1 },
          { requestPath: "/mark2/admin/secret", pageviews: 3, visitors: 1 },
        ],
        others: false,
      }),
      total: async () => ({ pageviews: 5, visitors: 1 }),
    };
    beforeAll(async () => {
      const target = analyticsTestTarget();
      pool = new Pool({
        connectionString: target.connectionString,
        connectionTimeoutMillis: 5000,
        statement_timeout: 5000,
      });
      const identity = await pool.query(
        "SELECT current_database() AS database,current_user AS role",
      );
      if (
        identity.rows[0].database !== target.metadata.database ||
        identity.rows[0].role !== target.metadata.role
      )
        throw new Error("Test database identity mismatch");
      jest.mocked(getPool).mockReturnValue(pool);
      project = `analytics-integration-${process.pid}-${Date.now()}`;
      process.env.ANALYTICS_PROJECT_ID = project;
      const readiness = await pool.query(
        "SELECT to_regclass('dojo.analytics_stage') AS stage, exists(SELECT 1 FROM information_schema.columns WHERE table_schema='dojo' AND table_name='analytics_progress' AND column_name='end_day') AS ready",
      );
      if (!readiness.rows[0].stage || !readiness.rows[0].ready)
        throw new Error(
          "Apply reviewed 076/077 to this disposable target first",
        );
    });
    afterAll(async () => {
      if (pool && project) {
        // Remove this test's project only, respecting foreign keys.
        for (const table of [
          "analytics_stage",
          "analytics_page_day",
          "analytics_day",
          "analytics_progress",
          "analytics_run",
        ])
          await pool.query(`DELETE FROM dojo.${table} WHERE project_id=$1`, [
            project,
          ]);
      }
      if (pool) await pool.end();
      delete process.env.ANALYTICS_PROJECT_ID;
    });
    test("SQL rollback fixtures execute", async () => {
      const client = await pool.connect();
      try {
        for (const fixture of [
          "076_analytics_archive_test.sql",
          "077_analytics_operations_test.sql",
        ])
          await client.query(readFileSync(`db/tests/${fixture}`, "utf8"));
      } finally {
        await client.query("ROLLBACK");
        client.release();
      }
    });
    test("two real connections exclude overlaps without writes", async () => {
      const lock = await pool.connect();
      try {
        await lock.query("SELECT pg_advisory_lock(hashtextextended($1,0))", [
          `analytics-archive:${project}`,
        ]);
        expect((await collectAnalytics(options, api)).status).toBe("overlap");
        expect(
          (
            await pool.query(
              "SELECT count(*)::int AS n FROM dojo.analytics_run WHERE project_id=$1",
              [project],
            )
          ).rows[0].n,
        ).toBe(0);
      } finally {
        await lock.query("SELECT pg_advisory_unlock(hashtextextended($1,0))", [
          `analytics-archive:${project}`,
        ]);
        lock.release();
      }
    });
    test("bounded duplicate selections resume durable progress, replace recent days and filter public output", async () => {
      expect((await collectAnalytics(options, api)).status).toBe("bounded");
      expect((await collectAnalytics(options, api)).status).toBe("bounded");
      expect(
        (
          await collectAnalytics(
            { ...options, initializeImport: false, resumeImport: true },
            api,
          )
        ).status,
      ).toBe("complete");
      const progress = await pool.query(
        "SELECT next_day::text FROM dojo.analytics_progress WHERE project_id=$1 AND lane='backfill'",
        [project],
      );
      expect(progress.rows[0].next_day).toBe(addDays(options.endDay, 1));
      const daily = {
        ...options,
        lane: "daily" as const,
        endDay: undefined,
        initializeImport: false,
        maxDays: 4,
        maxRequests: 8,
      };
      await collectAnalytics(daily, api);
      await collectAnalytics(daily, api);
      const publicSnapshot = await readPublicAnalytics(project, [
        "/shaolin/public",
      ]);
      expect(publicSnapshot.total).toBe("10");
      expect(publicSnapshot.verified).toBe("5");
      expect(publicSnapshot.pages).toEqual([
        { path: "/shaolin/public", views: "10" },
      ]);
      expect(publicSnapshot.trend).toHaveLength(5);
    });
  },
);
