import { jest } from '@jest/globals';

test('loads client env', async () => {
  process.env = {
    ...process.env,
    NEXT_PUBLIC_SITE_URL: 'https://example.com',
  } as NodeJS.ProcessEnv;
  jest.resetModules();
  const mod = await import('@/lib/env/client');
  expect(mod.env.NEXT_PUBLIC_SITE_URL).toBe('https://example.com');
  expect((mod.env as any).DATABASE_URL).toBeUndefined();
});
