export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function displayValue(
  value: string | null | undefined,
  fallback = "Not set",
): string {
  if (value === null || value === undefined) return fallback;
  if (String(value).trim().length === 0) return fallback;
  return String(value);
}
