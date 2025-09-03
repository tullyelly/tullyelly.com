import { test, expect } from './fixtures';

// Ensure desktop viewport so table headers are visible
test.use({ viewport: { width: 1366, height: 900 } });

test('Shaolin Scrolls page hydrates without errors across interactions', async ({ page }) => {
  await page.goto('/shaolin-scrolls');
  await expect(page.locator('h1')).toHaveText('Shaolin Scrolls');
  // Wait for the semantic table to be visible
  await expect(page.getByTestId('releases-table')).toBeVisible();

  // Headers are present
  await expect(page.getByRole('columnheader', { name: 'ID' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Release Name' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Status' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Type' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Release Date' })).toBeVisible();
  // Backstop via data-testid hooks
  await expect(page.getByTestId('col-id')).toBeVisible();

  // Click first ID to open dialog
  const tableWrap = page.locator('#scrolls-table');
  const firstTrigger = tableWrap.locator('tbody tr').first().locator('button').first();
  await firstTrigger.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText('SemVer')).toBeVisible();
  await dialog.getByRole('button', { name: 'Close' }).click();
  await expect(dialog).toBeHidden();
  await expect(firstTrigger).toBeFocused();
});
