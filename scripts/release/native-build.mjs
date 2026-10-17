/** Build flags exist only in the build subprocess; Vercel runtime configuration is untouched. */
import { spawnSync } from "node:child_process";

const environment = {
  ...process.env,
  SKIP_DB: "true",
  NEXT_PHASE: "phase-production-build",
  NEXT_TELEMETRY_DISABLED: "1",
};
// A native Vercel production build receives production env. No build step needs database credentials.
for (const key of [
  "DATABASE_URL",
  "TEST_DATABASE_URL",
  "DIRECT_URL",
  "POSTGRES_URL",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL_NON_POOLING",
])
  delete environment[key];
const result = spawnSync("npm", ["run", "build"], {
  env: environment,
  stdio: "inherit",
});
if (result.error || result.signal) process.exitCode = 1;
else process.exitCode = result.status ?? 1;
