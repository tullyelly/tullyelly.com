import { resolveMigrationDatabaseUrl } from "@/db/schema-migrations";

export function analyticsTestTarget(env: NodeJS.ProcessEnv = process.env) {
  if (env.ANALYTICS_TEST_CONFIRMED !== "true")
    throw new Error(
      "Confirm the Neon test branch in the dashboard before connecting.",
    );
  if (env.NODE_ENV === "production" || env.VERCEL_ENV === "production")
    throw new Error("Analytics test tooling refuses production environments.");
  const required = [
    "ANALYTICS_TEST_PROJECT_ID",
    "ANALYTICS_TEST_BRANCH_ID",
    "ANALYTICS_TEST_BRANCH_NAME",
    "ANALYTICS_TEST_HOST",
    "ANALYTICS_TEST_DATABASE",
    "ANALYTICS_TEST_ROLE",
    "ANALYTICS_PRODUCTION_BRANCH_ID",
    "ANALYTICS_PRODUCTION_HOST",
  ] as const;
  for (const key of required)
    if (!env[key]?.trim())
      throw new Error(`Missing non-secret target metadata: ${key}`);
  if (env.ANALYTICS_TEST_BRANCH_ID === env.ANALYTICS_PRODUCTION_BRANCH_ID)
    throw new Error("Test and production branch IDs must differ.");
  if (env.ANALYTICS_TEST_BRANCH_NAME !== "dev/analytics")
    throw new Error("Expected the manually created dev/analytics branch.");
  const raw = env.TEST_DATABASE_URL;
  if (!raw || raw !== env.DATABASE_URL)
    throw new Error(
      "Set DATABASE_URL and TEST_DATABASE_URL to the identical test connection.",
    );
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("Invalid test connection URL; details omitted.");
  }
  if (url.port && url.port !== "5432")
    throw new Error("Expected the direct Neon PostgreSQL port 5432.");
  if (
    url.hash ||
    [...url.searchParams.keys()].some(
      (key) => !["sslmode", "channel_binding"].includes(key),
    )
  )
    throw new Error(
      "Unexpected connection URL options; use unmodified direct Neon connection details.",
    );
  const endpoint = (host: string) =>
    host.toLowerCase().replace(/-pooler(?=\.)/, "");
  if (
    !["postgres:", "postgresql:"].includes(url.protocol) ||
    !url.hostname.endsWith(".neon.tech")
  )
    throw new Error("Expected a Neon PostgreSQL connection.");
  if (endpoint(url.hostname) === endpoint(env.ANALYTICS_PRODUCTION_HOST!))
    throw new Error("Test endpoint matches production; no connection allowed.");
  if (
    url.hostname !== env.ANALYTICS_TEST_HOST ||
    url.hostname.includes("-pooler.")
  )
    throw new Error(
      "Use the exact direct test host confirmed in the Neon dashboard.",
    );
  if (
    decodeURIComponent(url.pathname.slice(1)) !== env.ANALYTICS_TEST_DATABASE ||
    decodeURIComponent(url.username) !== env.ANALYTICS_TEST_ROLE
  )
    throw new Error(
      "Test database or role differs from the confirmed metadata.",
    );
  if (
    !["require", "verify-ca", "verify-full"].includes(
      url.searchParams.get("sslmode") ?? "",
    )
  )
    throw new Error("The test URL must require TLS.");
  // Reuse existing migration URL/build/SKIP_DB safety guards; do not bypass them.
  const connectionString = resolveMigrationDatabaseUrl(env);
  return {
    connectionString,
    metadata: {
      project: env.ANALYTICS_TEST_PROJECT_ID!,
      branch: env.ANALYTICS_TEST_BRANCH_ID!,
      branchName: env.ANALYTICS_TEST_BRANCH_NAME!,
      host: url.hostname,
      database: env.ANALYTICS_TEST_DATABASE!,
      role: env.ANALYTICS_TEST_ROLE!,
    },
  };
}
