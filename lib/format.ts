import { fmtDate, fmtDateTime } from '@/lib/datetime';

export const ISO_TZ = 'UTC';

export function formatDateISO(d: string | Date): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toISOString();
}

export function formatDateDisplay(d: string | Date, style: 'short' | 'medium' | 'long' = 'medium'): string {
  return fmtDateTime(d, ISO_TZ, style);
}

export function formatDateOnly(d: string | Date, style: 'short' | 'medium' | 'long' = 'medium'): string {
  return fmtDate(d, ISO_TZ, style);
}

export function nowIso(): string {
  return new Date().toISOString();
}
