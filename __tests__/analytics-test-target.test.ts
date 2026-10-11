/** @jest-environment node */
import { analyticsTestTarget } from "@/db/analytics-test-target";
const connection =
  "postgresql://tullyelly_admin@ep-test-example.us-east-2.aws.neon.tech/tullyelly_db?sslmode=require";
const env: NodeJS.ProcessEnv = {
  NODE_ENV: "test",
  VERCEL_ENV: "development",
  ANALYTICS_TEST_CONFIRMED: "true",
  ANALYTICS_TEST_PROJECT_ID: "project-fixture",
  ANALYTICS_TEST_BRANCH_ID: "br-test",
  ANALYTICS_TEST_BRANCH_NAME: "dev/analytics",
  ANALYTICS_TEST_HOST: "ep-test-example.us-east-2.aws.neon.tech",
  ANALYTICS_TEST_DATABASE: "tullyelly_db",
  ANALYTICS_TEST_ROLE: "tullyelly_admin",
  ANALYTICS_PRODUCTION_BRANCH_ID: "br-production",
  ANALYTICS_PRODUCTION_HOST: "ep-production-example.us-east-2.aws.neon.tech",
  DATABASE_URL: connection,
  TEST_DATABASE_URL: connection,
};
test("a manually confirmed branch can retain the parent's application database name", () => {
  expect(analyticsTestTarget(env).metadata).toEqual({
    project: "project-fixture",
    branch: "br-test",
    branchName: "dev/analytics",
    host: env.ANALYTICS_TEST_HOST,
    database: "tullyelly_db",
    role: "tullyelly_admin",
  });
});
test.each<Partial<NodeJS.ProcessEnv>>([
  { ANALYTICS_TEST_CONFIRMED: "false" },
  { ANALYTICS_TEST_BRANCH_ID: "br-production" },
  { ANALYTICS_TEST_BRANCH_NAME: "production" },
  { ANALYTICS_PRODUCTION_HOST: env.ANALYTICS_TEST_HOST },
  {
    ANALYTICS_PRODUCTION_HOST: "ep-test-example-pooler.us-east-2.aws.neon.tech",
  },
  { ANALYTICS_TEST_HOST: "ep-different.neon.tech" },
  { ANALYTICS_TEST_DATABASE: "other" },
  { ANALYTICS_TEST_ROLE: "other" },
  {
    DATABASE_URL: "postgresql://private@production.neon.tech/prod",
  },
  { NODE_ENV: "production" },
  { VERCEL_ENV: "production" },
  { SKIP_DB: "true" },
  { NEXT_PHASE: "phase-production-build" },
  { ANALYTICS_TEST_PROJECT_ID: "" },
  {
    TEST_DATABASE_URL: connection + "&host=production.neon.tech",
    DATABASE_URL: connection + "&host=production.neon.tech",
  },
  {
    TEST_DATABASE_URL: connection.replace(".neon.tech/", ".neon.tech:6543/"),
    DATABASE_URL: connection.replace(".neon.tech/", ".neon.tech:6543/"),
  },
  {
    TEST_DATABASE_URL: connection.replace("sslmode=require", "sslmode=disable"),
    DATABASE_URL: connection.replace("sslmode=require", "sslmode=disable"),
  },
])(
  "unsafe/mismatched metadata is rejected before any connection: %j",
  (overrides) => {
    expect(() => analyticsTestTarget({ ...env, ...overrides })).toThrow();
  },
);
test("errors do not reveal credentials", () => {
  try {
    analyticsTestTarget({ ...env, DATABASE_URL: "production-secret" });
  } catch (error) {
    expect(String(error)).not.toMatch(/fixture-secret|production-secret/);
  }
});
