import { defineConfig, devices } from "@playwright/test";

// at top of playwright.config.ts
import dotenv from "dotenv";
dotenv.config({ path: ".env.test" });

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
    command: "NODE_ENV=test NEXT_E2E=1 PORT=4317 npm run start:e2e",
    url: "http://127.0.0.1:4317",
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      NODE_ENV: "test",
      NEXT_E2E: "1",
      E2E: "true",
      SHOW_FLOWERS: "true",
      BREADCRUMBS: "true",
      NEXT_PUBLIC_E2E_MODE: "1",
      NEXT_PUBLIC_SITE_URL: "http://127.0.0.1:4317",
      NEXT_PUBLIC_ANALYTICS_ENABLED: "1",
      NEXT_PUBLIC_TEST_MODE: "1",
      NEXT_PUBLIC_FEATURE_BREADCRUMBS_V1: "true",
      TEST_MODE: "1",
      E2E_MODE: "1",
      AUTH_SECRET: "test-secret",
      DISABLE_SENTRY: "1",
      NEXTAUTH_URL: "http://127.0.0.1:4317",
      DATABASE_URL:
        process.env.TEST_DATABASE_URL ||
        process.env.DATABASE_URL ||
        "postgresql://dummy:dummy@127.0.0.1:5432/dummy?sslmode=disable&options=-c%20search_path%3Dauth%2Cdojo%2Cpublic",
      PORT: "4317",
    },
  },
});
