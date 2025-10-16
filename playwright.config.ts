import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: ["e2e/**/*.spec.ts", "tests/**/*.spec.ts"],
  reporter: [["html", { outputFolder: "playwright-report" }]],
  retries: 1,
  use: {
    baseURL: "http://localhost:3000",
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
    trace: "on-first-retry",
    // Prefer desktop viewport to avoid responsive header collapse in tables
    viewport: { width: 1366, height: 900 },
    // Treat data-testid as first-class for stable hooks
    testIdAttribute: "data-testid",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
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
    command: "NEXT_PUBLIC_E2E_MODE=1 npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    env: {
      NODE_ENV: "development",
      DISABLE_SENTRY: "1",
      NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
      NEXT_PUBLIC_ANALYTICS_ENABLED: "1",
      NEXT_PUBLIC_TEST_MODE: "1",
      NEXT_PUBLIC_E2E_MODE: "1",
      NEXT_PUBLIC_FEATURE_BREADCRUMBS_V1: "true",
      TEST_MODE: "1",
      AUTH_SECRET: "test-secret",
      DATABASE_URL:
        process.env.TEST_DATABASE_URL ||
        process.env.DATABASE_URL ||
        "postgresql://dummy:dummy@127.0.0.1:5432/dummy?sslmode=disable&options=-c%20search_path%3Dauth%2Cdojo%2Cpublic",
    },
  },
});
