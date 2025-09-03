import { getBuildInfoSync } from '@/lib/build-info';

const FALLBACK_YEAR = String(new Date().getFullYear());

export function getCurrentYear(): string {
  const info = getBuildInfoSync();
  return (info.builtAt ?? '').slice(0, 4) || FALLBACK_YEAR;
}
