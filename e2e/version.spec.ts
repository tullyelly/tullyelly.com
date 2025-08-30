import { test, expect } from '@playwright/test';

test('GET /api/__version returns build info', async ({ request }) => {
  const res = await request.get('/api/__version');
  if (!res.ok()) {
    const text = await res.text().catch(() => '');
    throw new Error(`Expected 200, got ${res.status()} – body: ${text}`);
  }
  const json = await res.json();
  expect(json.ok).toBe(true);
  expect(typeof json.commitSha).toBe('string');
  expect(typeof json.buildTime).toBe('string');
});
