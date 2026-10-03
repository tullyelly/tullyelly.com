import { defineConfig, devices } from "@playwright/test";

// Component layout checks use real Chromium, React, Recharts and site CSS.
// No app server, environment files or database setup is needed.
export default defineConfig({
  testDir: "./tests/browser",
  testMatch: "chart-sizing.spec.ts",
  reporter: "list",
  workers: 1,
  use: {
    ...devices["Desktop Chrome"],
    viewport: { width: 1280, height: 900 },
    launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROME_PATH },
  },
});
