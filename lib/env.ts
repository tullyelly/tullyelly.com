import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  TEST_DATABASE_URL: z.string().url().optional(),
  VERCEL_ENV: z.string().optional(),
  VERCEL_URL: z.string().optional(),
  NODE_ENV: z.string(),
  SITE_URL: z.string().optional(),
  NEXT_PUBLIC_ANNOUNCEMENT: z.string().optional(),
  VERCEL_GIT_COMMIT_SHA: z.string().optional(),
  NEXT_PUBLIC_DEBUG_DB_META: z.string().optional(),
  PLAYWRIGHT_USE_SYSTEM_CHROME: z.string().optional(),
  PLAYWRIGHT_CHROME_PATH: z.string().optional(),
  CI: z.string().optional(),
  NEON_DATABASE_URL: z.string().url().optional(),
  PGDATABASE_URL: z.string().url().optional(),
  POSTGRES_URL: z.string().url().optional(),
  POSTGRES_PRISMA_URL: z.string().url().optional(),
});

export const env = envSchema.parse(process.env);

export const {
  DATABASE_URL,
  TEST_DATABASE_URL,
  VERCEL_ENV,
  VERCEL_URL,
  NODE_ENV,
  SITE_URL,
  NEXT_PUBLIC_ANNOUNCEMENT,
  VERCEL_GIT_COMMIT_SHA,
  NEXT_PUBLIC_DEBUG_DB_META,
  PLAYWRIGHT_USE_SYSTEM_CHROME,
  PLAYWRIGHT_CHROME_PATH,
  CI,
  NEON_DATABASE_URL,
  PGDATABASE_URL,
  POSTGRES_URL,
  POSTGRES_PRISMA_URL,
} = env;
