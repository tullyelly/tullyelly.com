import { z } from "zod";

const Env = z.object({
  DATABASE_URL: z.string().url(),
});

const isTestRuntime =
  process.env.NODE_ENV === "test" || process.env.JEST_WORKER_ID !== undefined;

const testFallbackUrl = isTestRuntime
  ? "postgres://user:pass@localhost:5432/tullyelly_test"
  : undefined;

const rawDatabaseUrl =
  process.env.DATABASE_URL ??
  process.env.TEST_DATABASE_URL ??
  testFallbackUrl ??
  undefined;

const parsed = rawDatabaseUrl
  ? Env.parse({ DATABASE_URL: rawDatabaseUrl })
  : null;

export const DATABASE_URL = parsed?.DATABASE_URL;

export function isNextBuild(): boolean {
  return process.env.NEXT_PHASE === "phase-production-build";
}
