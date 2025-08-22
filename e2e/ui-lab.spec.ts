import { test, expect } from '@playwright/test';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

test('announcement banner demo can be dismissed', async ({ page }) => {
  await page.goto('/ui-lab');
  await expect(page.getByRole('heading', { name: 'Announcement Banner' })).toBeVisible();

  const axePath = require.resolve('axe-core/axe.min.js');
  await page.addScriptTag({ path: axePath });
  const results = await page.evaluate(async () => await (window as any).axe.run('#announcement-banner'));
  expect(results.violations).toEqual([]);

  await page.getByLabel('Dismissible').check();
  await page.getByRole('button', { name: 'Dismiss announcement' }).click();
  await expect(page.getByText('Custom announcement')).not.toBeVisible();
});
