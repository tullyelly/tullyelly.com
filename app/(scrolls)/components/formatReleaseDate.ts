// Display-only date formatter for Shaolin Scrolls
// Input: ISO string (e.g., 2025-08-24T00:00:00.000Z) or null
// Output: YYYY-MM-DD or em dash when missing
export function formatReleaseDate(d: string | null): string {
  return d ? d.slice(0, 10) : '—';
}

