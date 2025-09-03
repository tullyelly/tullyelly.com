import { test, expect } from '@playwright/test';

test('credits page renders Flowers heading and aria-labeled element', async ({ page }) => {
  await page.goto('/credits');
  await expect(page.getByRole('heading', { level: 1, name: /Flowers/ })).toBeVisible();
  await expect(page.getByLabel('Acknowledgments')).toBeVisible();
});

test('shaolin scrolls shows Flowers inline notes at top and bottom', async ({ page }) => {
  await page.goto('/shaolin-scrolls');
  await expect(page.getByText('💐 Flowers: Chronicles wiki & Raistlin Majere')).toBeVisible();
  await expect(page.getByText('💐 Flowers: Postgres, Neon & DataGrip—rekindled my database crush.')).toBeVisible();
});
