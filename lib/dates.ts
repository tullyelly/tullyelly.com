// Minimal date-time formatter for America/Chicago without extra deps
// Returns a compact string like: Sep 3, 2025, 1:23 PM CDT
// For null/invalid inputs, returns ';' per house style.
export function formatDateTimeChicago(input: string | number | Date | null | undefined): string {
  if (input == null) return ';';
  const date = input instanceof Date ? input : new Date(input);
  if (isNaN(date.getTime())) return ';';
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Chicago',
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  } catch {
    // Fallback: ISO date only
    return date.toISOString();
  }
}

// Heuristic: does the key likely represent a timestamp?
export function isTimestampKey(key: string): boolean {
  return /(_at|_date|date|time)$/i.test(key);
}
