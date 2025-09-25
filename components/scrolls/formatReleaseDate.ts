// Display-only date formatter for Shaolin Scrolls
// Central Time (America/Chicago), compact human form
import { fmtDate } from "@/lib/datetime";

export function formatReleaseDate(d: string | null): string {
  if (!d) return "";
  return fmtDate(d);
}
