export const ISO_TZ = 'UTC';

export function formatDateISO(d: string | Date): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toISOString();
}

export function formatDateDisplay(d: string | Date): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
