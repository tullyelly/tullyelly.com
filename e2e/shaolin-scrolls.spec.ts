import { test, expect } from './fixtures';

// ensure no hydration warnings across table interactions
// relies on prod-like build when E2E_PROD=1

test('Shaolin Scrolls table hydrates without warnings', async ({ page }) => {
  const hydrationErrors: string[] = [];
  page.on('console', msg => {
    const type = msg.type();
    if ((type === 'warning' || type === 'error') && msg.text().includes('Hydration failed')) {
      hydrationErrors.push(msg.text());
    }
  });

  await page.goto('/shaolin-scrolls');
  await expect(page.locator('h1')).toHaveText('Shaolin Scrolls');
  await expect(page.locator('#scrolls-table')).toBeVisible();

  // sort ascending then descending
  const firstHeader = page.locator('thead th button').first();
  await firstHeader.click();
  await firstHeader.click();

  // paginate next then previous
  await page.locator('button[aria-label="Next page"]').click();
  await page.locator('button[aria-label="Previous page"]').click();

  // search and clear
  const search = page.locator('input[aria-label="Search releases"]');
  await search.fill('Release 1');
  await search.fill('');

  expect(hydrationErrors).toHaveLength(0);
});
