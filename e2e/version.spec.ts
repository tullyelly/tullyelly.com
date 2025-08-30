import { test, expect } from '@playwright/test';

test('GET /api/__version returns build info', async ({ request }) => {
  const res = await request.get('/api/__version');
  expect(res.ok()).toBeTruthy();
  const json = await res.json();
  expect(json.ok).toBe(true);
  expect(typeof json.commitSha).toBe('string');
});
