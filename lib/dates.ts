export { fmtDate as formatDateOnly, fmtDateTime as formatDateTimeChicago } from '@/lib/datetime';

// Heuristic: does the key likely represent a timestamp?
export function isTimestampKey(key: string): boolean {
  return /(_at|_date|date|time)$/i.test(key);
}
