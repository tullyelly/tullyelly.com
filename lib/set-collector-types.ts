export function normalizeSetCollectorId(value: string | number): number {
  const raw = String(value).trim();

  if (!/^\d+$/.test(raw)) {
    throw new Error("Set Collector lookup: id must be a positive integer.");
  }

  const normalized = Number.parseInt(raw, 10);

  if (!Number.isSafeInteger(normalized) || normalized <= 0) {
    throw new Error("Set Collector lookup: id must be a positive integer.");
  }

  return normalized;
}

export function formatSetCollectorRating(value: number): string {
  return `${value.toFixed(1)}/10`;
}

export function formatSetCollectorPercentComplete(value: number): string {
  return `${value}%`;
}
