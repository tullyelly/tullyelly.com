import { test, expect } from './fixtures';

test('Shaolin Scrolls page hydrates without errors across interactions', async ({ page }) => {
  await page.goto('/shaolin-scrolls');
  await expect(page.locator('h1')).toHaveText('Shaolin Scrolls');
  const tableWrap = page.locator('#scrolls-table');
  await expect(tableWrap).toBeVisible();

  // Headers are present
  await expect(page.getByRole('columnheader', { name: 'ID' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Release Name' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Status' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Type' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Release Date' })).toBeVisible();

  // Click first ID to open dialog
  const firstTrigger = tableWrap.locator('tbody tr').first().locator('button').first();
  await firstTrigger.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText('SemVer')).toBeVisible();
  await dialog.getByRole('button', { name: 'Close' }).click();
  await expect(dialog).toBeHidden();
  await expect(firstTrigger).toBeFocused();
});
