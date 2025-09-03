import { buildInfo } from '@/lib/build-info';

const FALLBACK_YEAR = String(new Date().getFullYear());

export function getCurrentYear(): string {
  return (buildInfo.buildTime ?? '').slice(0, 4) || FALLBACK_YEAR;
}
