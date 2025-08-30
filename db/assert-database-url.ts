import { env } from '@/lib/env/server';

export function assertValidDatabaseUrl(url: string | null) {
  if (env.VERCEL_ENV === 'production' && url) {
    try {
      const parsed = new URL(url);
      const badUser = parsed.username === 'neondb_owner';
      const badDb = parsed.pathname.endsWith('/neondb');
      if (badUser || badDb) {
        throw new Error(
          'Invalid DATABASE_URL: neondb_owner/neondb detected. Update Production env to use tullyelly_admin and tullyelly_db.',
        );
      }
    } catch {
      // Ignore parse errors; other checks will handle missing or bad URLs.
    }
  }
}
