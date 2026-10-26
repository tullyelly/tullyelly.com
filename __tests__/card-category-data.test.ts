/** @jest-environment node */
jest.mock("server-only", () => ({}));
const mockRows = jest.fn();
const mockSkip = jest.fn(() => false);
const mockBuild = jest.fn(() => false);
jest.mock("@/lib/db", () => ({
  queryRows: (...args: unknown[]) => mockRows(...args),
}));
jest.mock("@/lib/escape-hatches", () => ({
  isDbSkipEnabled: () => mockSkip(),
}));
jest.mock("@/lib/env", () => ({ isNextBuild: () => mockBuild() }));
jest.mock("next/cache", () => ({ unstable_cache: (fn: unknown) => fn }));
import {
  getCategorySnapshotOnDate,
  listCategoryHistory,
  listCardCategories,
  getCardCategory,
} from "@/lib/data/card-categories";
beforeEach(() => {
  jest.clearAllMocks();
  mockSkip.mockReturnValue(false);
  mockBuild.mockReturnValue(false);
});
it("preserves SQL date strings, exact-date lookup and missing-date null", async () => {
  mockRows.mockResolvedValue([
    { snapshot_id: "1", measured_on: "2026-10-01", card_count: 0 },
    { snapshot_id: "2", measured_on: "2026-10-20", card_count: 12125 },
  ]);
  expect(
    await getCategorySnapshotOnDate("basketball", "2026-10-01T00:00:00.000Z"),
  ).toMatchObject({ card_count: 0, measured_on: "2026-10-01" });
  expect(
    await getCategorySnapshotOnDate("basketball", "2026-10-10"),
  ).toBeNull();
  expect(
    await getCategorySnapshotOnDate("basketball", "2026-02-30"),
  ).toBeNull();
  expect(mockRows).toHaveBeenCalledWith(
    expect.stringContaining("ORDER BY measured_on"),
    ["basketball"],
  );
});
it("preserves untracked rows rather than inventing zero", async () => {
  mockRows.mockResolvedValue([
    { slug: "basketball", card_count: null, snapshot_id: null },
  ]);
  expect(await getCardCategory("basketball")).toMatchObject({
    card_count: null,
  });
  expect(await getCardCategory("football")).toBeNull();
});
it("fails honestly on missing schema rather than returning an empty list", async () => {
  mockRows.mockRejectedValue(
    Object.assign(new Error("missing relation"), { code: "42P01" }),
  );
  await expect(listCardCategories()).rejects.toThrow("missing relation");
});
it("never reads during build or DB-disabled validation", async () => {
  mockBuild.mockReturnValue(true);
  await expect(listCardCategories()).rejects.toThrow("disabled");
  mockBuild.mockReturnValue(false);
  mockSkip.mockReturnValue(true);
  await expect(listCategoryHistory("basketball")).rejects.toThrow("disabled");
  expect(mockRows).not.toHaveBeenCalled();
});
it("rejects malformed slugs before SQL", async () => {
  expect(await getCardCategory("../bad")).toBeNull();
  expect(await listCategoryHistory("../bad")).toEqual([]);
  expect(mockRows).not.toHaveBeenCalled();
});
