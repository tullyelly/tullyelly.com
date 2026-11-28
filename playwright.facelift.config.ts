import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser",
  testMatch: "facelift.spec.ts",
  reporter: "list",
  workers: 1,
  use: {
    ...devices["Desktop Chrome"],
    launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROME_PATH },
  },
});
