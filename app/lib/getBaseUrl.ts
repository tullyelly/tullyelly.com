import { VERCEL_URL, SITE_URL } from '@/lib/env';

export function getBaseUrl() {
  // 1) Client: use relative
  if (typeof window !== 'undefined') return '';

  // 2) Vercel: use VERCEL_URL (no protocol)
  if (VERCEL_URL) return `https://${VERCEL_URL}`;

  // 3) Fallback: use SITE_URL if provided
  if (SITE_URL) return SITE_URL;

  // 4) Dev/server fallback
  return 'http://localhost:3000';
}
