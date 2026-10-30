/** @jest-environment node */
jest.mock("server-only", () => ({}));
jest.mock("@/db/pool", () => ({ getPool: jest.fn() }));
jest.mock("@/lib/build-info", () => ({
  buildInfo: { commit: "a".repeat(40) },
}));
import { getPool } from "@/db/pool";
import {
  analyticsConnection,
  getAnalyticsRuntimeState,
} from "@/lib/analytics-archive/readiness";
import { analyticsMigrations } from "@/lib/analytics-archive/readiness-contract";
import expected from "@/scripts/release-db-schema.json";
import { GET } from "@/app/api/health/analytics/route";
const direct =
  "postgresql://tullyelly_admin@ep-fixture.us-east-2.aws.neon.tech/tullyelly_db?sslmode=require";
const env = { ...process.env };
function fixture() {
  const ledger = analyticsMigrations.map((m) => ({
    ...m,
    checksum_algorithm: "sha256",
    status: "applied",
    applied: true,
    has_error: false,
  }));
  const data = {
    identity: {
      database: "tullyelly_db",
      role: "tullyelly_admin",
      read_only: "on",
    },
    columns: structuredClone(expected.columns),
    constraints: structuredClone(expected.constraints),
    feature: true,
    ledger,
    ledgerPresent: true,
  };
  const query = jest.fn(async (sql: string) => {
    if (sql.includes("current_database()")) return { rows: [data.identity] };
    if (sql.includes("a.attname AS column_name")) return { rows: data.columns };
    if (sql.includes("pg_get_constraintdef")) return { rows: data.constraints };
    if (sql.includes("AS ready")) return { rows: [{ ready: data.feature }] };
    if (sql.includes("to_regclass"))
      return {
        rows: [{ ledger: data.ledgerPresent ? "dojo.schema_migration" : null }],
      };
    if (sql.includes("FROM dojo.schema_migration"))
      return { rows: data.ledger };
    return { rows: [] };
  });
  const release = jest.fn();
  const connect = jest.fn(async () => ({ query, release }));
  jest
    .mocked(getPool)
    .mockReturnValue({ query: jest.fn(), connect } as unknown as ReturnType<
      typeof getPool
    >);
  return { data, query, release, connect };
}
beforeEach(() => {
  jest.clearAllMocks();
  process.env = {
    ...env,
    DATABASE_URL: direct,
    ANALYTICS_SYNC_ENABLED: "true",
    ANALYTICS_PROJECT_ID: "fixture-project",
    ANALYTICS_VERCEL_TOKEN: "fixture-token",
    ANALYTICS_AVAILABLE_FROM: "2026-01-01",
    CRON_SECRET: "x".repeat(16),
  };
  delete process.env.NEXT_PHASE;
});
afterAll(() => {
  process.env = env;
});
test.each([undefined, "false", "TRUE", "1"])(
  "disabled %s never accesses a database or collector",
  async (flag) => {
    if (flag === undefined) delete process.env.ANALYTICS_SYNC_ENABLED;
    else process.env.ANALYTICS_SYNC_ENABLED = flag;
    const state = await getAnalyticsRuntimeState();
    expect(state.collectionEnabled).toBe(false);
    expect(getPool).not.toHaveBeenCalled();
  },
);
test("connection fingerprint excludes credentials and normalizes pooled endpoint identity", () => {
  const off = analyticsConnection(direct);
  const pooled = analyticsConnection(
    direct.replace("ep-fixture.", "ep-fixture-pooler."),
  );
  expect(off.connection).toBe("direct");
  expect(pooled.connection).toBe("pooled");
  expect(pooled.targetSha256).toBe(off.targetSha256);
  expect(analyticsConnection(undefined).connection).toBe("missing");
  for (const value of [
    "private-driver-secret",
    "https://attacker.example/db",
    direct + "&host=elsewhere",
    direct.replace(".tech/", ".tech:6543/"),
  ])
    expect(analyticsConnection(value)).toEqual({
      connection: "invalid",
      targetSha256: null,
    });
  expect(
    JSON.stringify(
      analyticsConnection(
        direct.replace(
          "tullyelly_admin@",
          "tullyelly_admin:fixture-private-password@",
        ),
      ),
    ),
  ).not.toContain("fixture-private-password");
});
test.each(["pooled", "missing-config", "build"])(
  "%s cannot be activation ready and makes no connection",
  async (kind) => {
    if (kind === "pooled")
      process.env.DATABASE_URL = direct.replace(
        "ep-fixture.",
        "ep-fixture-pooler.",
      );
    if (kind === "missing-config") delete process.env.ANALYTICS_VERCEL_TOKEN;
    if (kind === "build") process.env.NEXT_PHASE = "phase-production-build";
    expect((await getAnalyticsRuntimeState()).schemaReady).toBe(false);
    expect(getPool).not.toHaveBeenCalled();
  },
);
test("ready state verifies exact schema, owner capability and only selected ledger rows read-only", async () => {
  const db = fixture();
  db.data.constraints = db.data.constraints.map((row) => ({
    ...row,
    definition: row.definition.replaceAll("REFERENCES dojo.", "REFERENCES "),
  }));
  expect(await getAnalyticsRuntimeState()).toMatchObject({
    collectionEnabled: true,
    configured: true,
    schemaReady: true,
    ledgerReady: true,
    commitSha: "a".repeat(40),
  });
  expect(db.query).toHaveBeenNthCalledWith(
    1,
    "BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY",
  );
  expect(db.query).toHaveBeenLastCalledWith("ROLLBACK");
  expect(db.release).toHaveBeenCalledWith(false);
  for (const [sql] of db.query.mock.calls)
    expect(sql).not.toMatch(
      /\b(INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|NOTIFY)\b/,
    );
});
test.each([
  "columns",
  "constraint",
  "capability",
  "identity",
  "read-only",
  "ledger",
  "hash",
  "failed",
  "algorithm",
])("%s drift cannot claim readiness", async (kind) => {
  const db = fixture();
  if (kind === "columns") db.data.columns.pop();
  if (kind === "constraint") db.data.constraints[0].validated = false;
  if (kind === "capability") db.data.feature = false;
  if (kind === "identity") db.data.identity.role = "other";
  if (kind === "read-only") db.data.identity.read_only = "off";
  if (kind === "ledger") db.data.ledgerPresent = false;
  if (kind === "hash")
    db.data.ledger[0].checksum = "b".repeat(
      64,
    ) as (typeof db.data.ledger)[0]["checksum"];
  if (kind === "failed") db.data.ledger[0].status = "failed";
  if (kind === "algorithm") db.data.ledger[0].checksum_algorithm = "other";
  const state = await getAnalyticsRuntimeState();
  expect(state.schemaReady && state.ledgerReady).toBe(false);
  expect(db.query).toHaveBeenLastCalledWith("ROLLBACK");
});
test("database failures expose neither driver errors nor credentials", async () => {
  const db = fixture();
  db.query.mockRejectedValueOnce(new Error("fixture-private-password"));
  const state = await getAnalyticsRuntimeState();
  expect(state.schemaReady).toBe(false);
  expect(JSON.stringify(state)).not.toContain("fixture-private-password");
  expect(db.release).toHaveBeenCalled();
});
test("failed read-only transaction cleanup destroys the connection", async () => {
  const db = fixture();
  db.query.mockImplementation(async (sql: string) => {
    if (sql === "ROLLBACK") throw new Error("cleanup failed");
    throw new Error("catalog unavailable");
  });
  expect((await getAnalyticsRuntimeState()).schemaReady).toBe(false);
  expect(db.release).toHaveBeenCalledWith(true);
});
test("state endpoint is uncached JSON and disabled mode does not call auth, collection or database", async () => {
  process.env.ANALYTICS_SYNC_ENABLED = "false";
  const response = await GET();
  expect(response.status).toBe(200);
  expect(response.headers.get("Cache-Control")).toContain("no-store");
  expect(response.headers.get("Vercel-CDN-Cache-Control")).toBe("no-store");
  expect(await response.json()).toMatchObject({ collectionEnabled: false });
  expect(getPool).not.toHaveBeenCalled();
});
