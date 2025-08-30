import { z } from 'zod';

const NodeEnv = z.enum(['development', 'test', 'production']);

const ServerSchema = z.object({
  NODE_ENV: NodeEnv.default('development'),
  DATABASE_URL: z.string().url().optional(),
  TEST_DATABASE_URL: z.string().url().optional(),
  VERCEL_ENV: z.string().optional(),
  VERCEL_URL: z.string().optional(),
  SITE_URL: z.string().optional(),
  GITHUB_SHA: z.string().optional(),
  VERCEL_GIT_COMMIT_SHA: z.string().optional(),
  PORT: z.string().regex(/^\d+$/).default('3000'),
  PLAYWRIGHT_USE_SYSTEM_CHROME: z.string().optional(),
  PLAYWRIGHT_CHROME_PATH: z.string().optional(),
  CI: z.string().optional(),
  NEON_DATABASE_URL: z.string().url().optional(),
  PGDATABASE_URL: z.string().url().optional(),
  POSTGRES_URL: z.string().url().optional(),
  POSTGRES_PRISMA_URL: z.string().url().optional(),
  SENTRY_DSN: z.string().url().optional(),
  E2E_MODE: z.string().optional(),
  DISABLE_SENTRY: z.string().optional(),
});

const PublicSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  NEXT_PUBLIC_ANNOUNCEMENT: z.string().optional(),
  NEXT_PUBLIC_DEBUG_DB_META: z.string().optional(),
  NEXT_PUBLIC_SITE_NAME: z.string().default('tullyelly'),
});

const _server = ServerSchema.parse(process.env);
const _public = PublicSchema.parse(process.env);

const COMMIT_SHA =
  _server.GITHUB_SHA ??
  _server.VERCEL_GIT_COMMIT_SHA ??
  process.env.npm_package_gitHead ??
  'unknown';

if (_server.NODE_ENV !== 'test' && _server.E2E_MODE !== '1') {
  if (!_server.DATABASE_URL) {
    throw new Error('[env] DATABASE_URL is required outside of test');
  }
}

export const Env = { ..._server, ..._public, COMMIT_SHA };
export type EnvType = typeof Env;
export const PublicEnv = _public;
