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

type ServerEnv = z.infer<typeof serverSchema>;

/**
 * Returns validated server env. During `next build`/CI we avoid hard-failing,
 * because modules can be evaluated while collecting page data.
 * Pass `strict=true` at true runtime (request handling) to enforce.
 */
export function serverEnv(opts?: { strict?: boolean }): Partial<ServerEnv> {
  const strict = opts?.strict ?? false;

  const isBuildPhase =
    process.env.NEXT_PHASE === 'phase-production-build' ||
    process.env.CI === 'true';

  if (!strict || isBuildPhase) {
    const parsed = serverSchema.partial().safeParse(process.env);
    return parsed.success ? parsed.data : {};
  }

  return serverSchema.parse(process.env);
}

export const env = serverEnv();
