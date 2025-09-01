import { test, expect } from './fixtures';

test('release creation controls present when enabled', async ({ page }) => {
  test.skip(process.env.NEXT_PUBLIC_RELEASE_CREATION_ENABLED !== '1', 'creation disabled');
  await page.goto('/shaolin-scrolls');
  await expect(page.getByRole('button', { name: 'Create Patch' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Create Minor' })).toBeVisible();
});

test('no hydration warnings on scrolls page', async ({ page }) => {
  await page.goto('/shaolin-scrolls');
  // fixture will assert no console hydration errors on teardown
  await expect(page.locator('#scrolls-table')).toBeVisible();
});

