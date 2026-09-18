export type VisitDirectorySort = "latest" | "rating" | "visits" | "name";

type VisitDirectoryRow = {
  state?: string;
  rating: number;
  visitCount: number;
  latestVisitDate?: string;
};

export function getVisitDirectoryStates<Row extends VisitDirectoryRow>(
  rows: Row[],
): string[] {
  return Array.from(
    new Set(rows.map((row) => row.state?.trim()).filter(Boolean) as string[]),
  ).sort((a, b) => a.localeCompare(b));
}

export function filterAndSortVisitDirectoryRows<Row extends VisitDirectoryRow>(
  rows: Row[],
  state: string,
  sort: VisitDirectorySort,
  getName: (row: Row) => string,
): Row[] {
  const filteredRows = state
    ? rows.filter((row) => row.state?.trim() === state)
    : rows;

  return [...filteredRows].sort((a, b) => {
    if (sort === "rating") return b.rating - a.rating;
    if (sort === "visits") return b.visitCount - a.visitCount;
    if (sort === "name") return getName(a).localeCompare(getName(b));

    const aLatest = Date.parse(a.latestVisitDate ?? "");
    const bLatest = Date.parse(b.latestVisitDate ?? "");
    const latestDifference =
      (Number.isNaN(bLatest) ? 0 : bLatest) -
      (Number.isNaN(aLatest) ? 0 : aLatest);

    return latestDifference === 0
      ? getName(a).localeCompare(getName(b))
      : latestDifference;
  });
}
