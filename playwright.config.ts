import { defineConfig, devices } from '@playwright/test';
import { PLAYWRIGHT_USE_SYSTEM_CHROME, PLAYWRIGHT_CHROME_PATH, CI } from './lib/env';

export default defineConfig({
  testDir: 'e2e',
  reporter: [['html', { outputFolder: 'playwright-report' }]],
  retries: 1,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        ...(PLAYWRIGHT_USE_SYSTEM_CHROME === '1'
          ? {
              channel: undefined,
              executablePath: PLAYWRIGHT_CHROME_PATH || '/usr/bin/chromium-browser',
            }
          : {}),
      },
    },
  ],
  webServer: {
    command: 'npm run dev -- -p 3000',
    port: 3000,
    reuseExistingServer: !CI,
    timeout: 120 * 1000,
    env: {
      DATABASE_URL: 'postgres://localhost:5432/placeholder',
      USE_FAKE_DATA: '1',
    },
  },
});
