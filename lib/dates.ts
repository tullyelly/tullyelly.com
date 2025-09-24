export {
  fmtDate as formatDateOnly,
  fmtDateTime as formatDateTimeChicago,
} from "@/lib/datetime";

export function asDateString(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string") return value.slice(0, 10);
  return null;
}

// Heuristic: does the key likely represent a timestamp?
export function isTimestampKey(key: string): boolean {
  return /(_at|_date|date|time)$/i.test(key);
}
