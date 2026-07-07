export function formatVolleyballTournamentFinish(
  finish: number | null,
): string | null {
  if (finish === null) return null;

  const absoluteFinish = Math.abs(finish);
  const remainder = absoluteFinish % 100;
  const lastDigit = absoluteFinish % 10;
  const suffix =
    remainder >= 11 && remainder <= 13
      ? "th"
      : lastDigit === 1
        ? "st"
        : lastDigit === 2
          ? "nd"
          : lastDigit === 3
            ? "rd"
            : "th";

  return `${finish}${suffix} Place`;
}
