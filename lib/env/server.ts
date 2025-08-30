import 'server-only';
import { z } from 'zod';

const serverSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  DATABASE_URL: z.string().url(),
  TEST_DATABASE_URL: z.string().url().optional(),
  VERCEL_ENV: z.string().optional(),
  VERCEL_URL: z.string().optional(),
  SITE_URL: z.string().optional(),
  VERCEL_GIT_COMMIT_SHA: z.string().optional(),
  PLAYWRIGHT_USE_SYSTEM_CHROME: z.string().optional(),
  PLAYWRIGHT_CHROME_PATH: z.string().optional(),
  CI: z.string().optional(),
  NEON_DATABASE_URL: z.string().url().optional(),
  PGDATABASE_URL: z.string().url().optional(),
  POSTGRES_URL: z.string().url().optional(),
  POSTGRES_PRISMA_URL: z.string().url().optional(),
  SENTRY_DSN: z.string().url().optional(),
});

const _server = serverSchema.safeParse(process.env);
if (!_server.success) {
  console.error('❌ Invalid server env', _server.error.flatten().fieldErrors);
  throw new Error('Invalid server environment variables');
}

export const env = _server.data;
