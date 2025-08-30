import { defineConfig, devices } from '@playwright/test';

const isProd = process.env.E2E_PROD === '1';
const port = isProd ? 4010 : 3000;
const command = isProd ? 'npm run start:prod' : 'npm run dev -- -p 3000';

export default defineConfig({
  testDir: 'e2e',
  reporter: [['html', { outputFolder: 'playwright-report' }]],
  retries: 1,
  use: {
    baseURL: `http://localhost:${port}`,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        ...(process.env.PLAYWRIGHT_USE_SYSTEM_CHROME === '1'
          ? {
              channel: undefined,
              executablePath:
                process.env.PLAYWRIGHT_CHROME_PATH || '/usr/bin/chromium-browser',
            }
          : {}),
      },
    },
  ],
  webServer: {
    command,
    port,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    env: {
      DATABASE_URL: 'postgres://localhost:5432/placeholder',
      USE_FAKE_DATA: '1',
    },
  },
});
