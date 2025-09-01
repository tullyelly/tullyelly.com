import { test, expect } from './fixtures';

test('Shaolin Scrolls page hydrates without errors across interactions', async ({ page }) => {
  await page.goto('/shaolin-scrolls');
  await expect(page.locator('h1')).toHaveText('Shaolin Scrolls');
  const table = page.locator('#scrolls-table');
  await expect(table).toBeVisible();

  // Toggle sort on SemVer column twice (asc/desc)
  await page.getByRole('button', { name: /Sort by SemVer/i }).click();
  await page.getByRole('button', { name: /Sort by SemVer/i }).click();

  // Change page size
  await page.getByLabel('Rows per page:').selectOption('10');
  await page.getByLabel('Rows per page:').selectOption('20');

  // Use search input
  const search = page.getByLabel('Search releases');
  await search.fill('foo');
  await search.press('Enter');
  await search.fill('');
});
