export function formatClanSportLabel(sport: string): string {
  return sport
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
