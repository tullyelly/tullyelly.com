import { jest } from '@jest/globals';

test('loads env with database url', async () => {
  process.env = {
    ...process.env,
    NODE_ENV: 'test',
    DATABASE_URL: 'postgres://user:pass@localhost:5432/db',
  } as NodeJS.ProcessEnv;
  jest.resetModules();
  const mod = await import('@/lib/env');
  expect(mod.Env.DATABASE_URL).toBe('postgres://user:pass@localhost:5432/db');
});

test('allows missing DATABASE_URL in test', async () => {
  process.env = { ...process.env, NODE_ENV: 'test' } as NodeJS.ProcessEnv;
  delete process.env.DATABASE_URL;
  jest.resetModules();
  const mod = await import('@/lib/env');
  expect(mod.Env.DATABASE_URL).toBeUndefined();
});
