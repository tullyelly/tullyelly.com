import { test, expect } from './fixtures';

test('Shaolin Scrolls page hydrates without errors across interactions', async ({ page }) => {
  await page.goto('/shaolin-scrolls');
  await expect(page.locator('h1')).toHaveText('Shaolin Scrolls');
  const tableWrap = page.locator('#scrolls-table');
  await expect(tableWrap).toBeVisible();

  // Headers are present
  await expect(page.getByRole('columnheader', { name: 'Release Name' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Status' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Type' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'SemVer' })).toBeVisible();

  // Use search input (server form submit)
  const search = page.getByLabel('Search releases');
  await search.fill('foo');
  await search.press('Enter');
  await expect(page).toHaveURL(/\/shaolin-scrolls\?q=foo/);
});
