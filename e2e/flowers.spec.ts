import { test, expect } from '@playwright/test';

test('credits page renders Flowers heading and aria-labeled element', async ({ page }) => {
  await page.goto('/credits');
  await expect(page.getByRole('heading', { level: 1, name: /Flowers/ })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Acknowledgments' })).toBeVisible();
});

test('shaolin scrolls shows Flowers inline notes at top and bottom', async ({ page }) => {
  await page.goto('/shaolin-scrolls');
  await expect(
    page.getByLabel('Acknowledgments').filter({ hasText: 'Chronicles wiki' })
  ).toBeVisible();
  await expect(
    page
      .getByLabel('Acknowledgments')
      .filter({ hasText: 'PostgreSQL, Neon & DataGrip—rekindled my database crush.' })
  ).toBeVisible();
});
