import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const useSystemChrome = process.env.PLAYWRIGHT_USE_SYSTEM_CHROME === '1';

export default defineConfig({
  testDir: 'e2e',
  reporter: [['html', { outputFolder: 'playwright-report' }]],
  retries: 1,
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        ...(useSystemChrome
          ? {
              channel: undefined,
              executablePath: process.env.PLAYWRIGHT_CHROME_PATH || '/usr/bin/chromium-browser',
            }
          : {}),
      },
    },
  ],
  webServer: {
    command: 'npm run build && npm run start',
    url: baseURL,
    reuseExistingServer: process.env.CI !== 'true',
    timeout: 120 * 1000,
    env: {
      E2E_MODE: '1',
      DISABLE_SENTRY: '1',
      NODE_ENV: 'production',
      NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
    },
  },
});
