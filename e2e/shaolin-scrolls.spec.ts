import { test, expect } from '@playwright/test';

test('Shaolin Scrolls page hydrates without errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  await page.goto('/shaolin-scrolls');
  await expect(page.locator('h1')).toHaveText('Shaolin Scrolls');
  await expect(page.locator('#scrolls-table')).toBeVisible();

  expect(errors.find(e => e.includes('Hydration failed'))).toBeFalsy();
});
