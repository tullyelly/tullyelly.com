import "./lib/dns-polyfill.js";
import { defineConfig, devices } from "@playwright/test";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.test" });

const nonEmpty = (value: string | undefined | null): string | undefined => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const effectiveDatabaseUrl =
  nonEmpty(process.env.TEST_DATABASE_URL) ??
  nonEmpty(process.env.DATABASE_URL) ??
  undefined;

if (!effectiveDatabaseUrl) {
  console.warn("[⚠️] Missing TEST_DATABASE_URL — DB tests will fail.");
  throw new Error(
    "[playwright] Missing TEST_DATABASE_URL or DATABASE_URL for Playwright tests.",
  );
}

const sanitizedEnv = {
  ...process.env,
  PLAYWRIGHT: "true",
  DATABASE_URL: effectiveDatabaseUrl,
  TEST_DATABASE_URL: effectiveDatabaseUrl,
  NEON_HTTP_URL: "",
  NEON_WS_PROXY: "",
  NEON_PROXY: "",
  NEON_HOST: "",
  NEON_REGION: "",
};

process.env.PLAYWRIGHT = sanitizedEnv.PLAYWRIGHT;
process.env.DATABASE_URL = sanitizedEnv.DATABASE_URL;
process.env.TEST_DATABASE_URL = sanitizedEnv.TEST_DATABASE_URL;
process.env.NEON_HTTP_URL = sanitizedEnv.NEON_HTTP_URL;
process.env.NEON_WS_PROXY = sanitizedEnv.NEON_WS_PROXY;
process.env.NEON_PROXY = sanitizedEnv.NEON_PROXY;
process.env.NEON_HOST = sanitizedEnv.NEON_HOST;
process.env.NEON_REGION = sanitizedEnv.NEON_REGION;

const webServerEnv = {
  ...sanitizedEnv,
  NODE_ENV: "test",
  NEXT_E2E: "1",
  E2E: "1",
  SHOW_FLOWERS: "true",
  BREADCRUMBS: "true",
  NEXT_PUBLIC_E2E_MODE: "1",
  NEXT_PUBLIC_SITE_URL: "http://127.0.0.1:4317",
  NEXT_PUBLIC_ANALYTICS_ENABLED: "1",
  NEXT_PUBLIC_TEST_MODE: "1",
  NEXT_PUBLIC_FEATURE_BREADCRUMBS_V1: "true",
  TEST_MODE: "1",
  E2E_MODE: "1",
  NEXT_PUBLIC_E2E_STABLE: "true",
  AUTH_SECRET: "test-secret",
  DISABLE_SENTRY: "1",
  NEXTAUTH_URL: "http://127.0.0.1:4317",
  HOST: "127.0.0.1",
  HOSTNAME: "127.0.0.1",
  PORT: "4317",
};

export default defineConfig({
  testDir: ".",
  testMatch: ["e2e/**/*.spec.ts", "tests/**/*.spec.ts"],
  reporter: [["html", { open: "never" }], ["list"]],
  retries: 1,
  use: {
    baseURL: "http://127.0.0.1:4317",
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
    trace: "on-first-retry",
    deviceScaleFactor: 1,
    // Prefer desktop viewport to avoid responsive header collapse in tables
    viewport: { width: 1280, height: 900 },
    colorScheme: "light",
    locale: "en-US",
    timezoneId: "America/Chicago",
    // Treat data-testid as first-class for stable hooks
    testIdAttribute: "data-testid",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 900 },
        colorScheme: "light",
        locale: "en-US",
        timezoneId: "America/Chicago",
        ...(process.env.PLAYWRIGHT_USE_SYSTEM_CHROME === "1"
          ? {
              channel: undefined,
              executablePath:
                process.env.PLAYWRIGHT_CHROME_PATH ||
                "/usr/bin/chromium-browser",
            }
          : {}),
      },
    },
  ],
  webServer: {
    command:
      "E2E=1 NODE_ENV=test NEXT_E2E=1 PORT=4317 npm run start:e2e -- --hostname 127.0.0.1",
    url: "http://127.0.0.1:4317",
    reuseExistingServer: true,
    timeout: 120_000,
    env: webServerEnv,
  },
});
