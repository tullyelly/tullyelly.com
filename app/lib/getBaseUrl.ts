import { env } from '@/lib/env/server';

export function getBaseUrl() {
  // 1) Client: use relative
  if (typeof window !== 'undefined') return '';

  // 2) Vercel: use VERCEL_URL (no protocol)
  if (env.VERCEL_URL) return `https://${env.VERCEL_URL}`;

  // 3) Fallback: use SITE_URL if provided
  if (env.SITE_URL) return env.SITE_URL;

  // 4) Dev/server fallback
  return 'http://localhost:3000';
}
