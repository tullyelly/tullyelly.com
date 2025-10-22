export function withinRatio(
  actual: number,
  viewport: number,
  min: number,
  max: number,
): boolean {
  const ratio = viewport === 0 ? 0 : actual / viewport;
  return ratio >= min && ratio <= max;
}
