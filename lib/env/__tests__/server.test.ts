import { jest } from '@jest/globals';

test('loads server env', async () => {
  process.env = {
    ...process.env,
    NODE_ENV: 'test',
    DATABASE_URL: 'postgres://user:pass@localhost:5432/db',
  } as NodeJS.ProcessEnv;
  jest.resetModules();
  const mod = await import('@/lib/env/server');
  expect(mod.env.DATABASE_URL).toBe('postgres://user:pass@localhost:5432/db');
});
