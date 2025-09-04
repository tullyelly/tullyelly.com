// Display-only date formatter for Shaolin Scrolls
// Central Time (America/Chicago), compact human form
import { formatDateTimeChicago } from '@/lib/dates';

export function formatReleaseDate(d: string | null): string {
  if (!d) return '';
  return formatDateTimeChicago(d);
}
