import { test, expect } from './fixtures';

test('Shaolin Scrolls page hydrates without errors', async ({ page }) => {
  await page.goto('/shaolin-scrolls');
  await expect(page.getByTestId('page-title')).toHaveText('Shaolin Scrolls');
  await expect(page.locator('#scrolls-table')).toBeVisible();
});
