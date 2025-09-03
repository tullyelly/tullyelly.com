import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  reporter: [["html", { outputFolder: "playwright-report" }]],
  retries: 1,
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    // Prefer desktop viewport to avoid responsive header collapse in tables
    viewport: { width: 1366, height: 900 },
    // Treat data-testid as first-class for stable hooks
    testIdAttribute: 'data-testid',
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
                process.env.PLAYWRIGHT_CHROME_PATH || "/usr/bin/chromium-browser",
            }
          : {}),
      },
    },
  ],
  webServer: {
    command: "npm run build && npm run start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    env: {
      NODE_ENV: "production",
      E2E_MODE: "1",
      DISABLE_SENTRY: "1",
      NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
      // Make all routes public for e2e to avoid auth flows
      AUTH_RULES_JSON:
        '{"ownerDomains":["tullyelly.com"],"publicPaths":["/","/login","/api/auth"],"protectedPaths":[],"ownerOnlyPaths":[],"toggles":{"allowAnyEmailOnPreview":true}}',
      AUTH_SECRET: "test-secret",
    },
  },
});
