import { jest } from '@jest/globals';

test('loads server env', async () => {
  process.env = {
    ...process.env,
    NODE_ENV: 'test',
    DATABASE_URL: 'postgres://user:pass@localhost:5432/db',
  } as NodeJS.ProcessEnv;
  jest.resetModules();
  const mod = await import('@/lib/env/server');
  expect(mod.serverEnv({ strict: true }).DATABASE_URL).toBe(
    'postgres://user:pass@localhost:5432/db'
  );
});

test('allows missing DATABASE_URL in e2e mode', async () => {
  process.env = {
    ...process.env,
    NODE_ENV: 'test',
    E2E_MODE: '1',
  } as NodeJS.ProcessEnv;
  delete process.env.DATABASE_URL;
  jest.resetModules();
  const mod = await import('@/lib/env/server');
  expect(mod.serverEnv({ strict: true }).DATABASE_URL).toBeUndefined();
});
