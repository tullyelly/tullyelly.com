import { test, expect } from '@playwright/test';

test('Shaolin Scrolls page renders', async ({ page }) => {
  await page.goto('/shaolin-scrolls');
  await expect(page.locator('h1')).toHaveText('Shaolin Scrolls');
});
