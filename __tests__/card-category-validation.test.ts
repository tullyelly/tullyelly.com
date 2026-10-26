import {
  chicagoToday,
  isCalendarDate,
  createCategorySnapshotSchema,
  correctCategorySnapshotSchema,
  formatCategoryChange,
  MAX_CARD_COUNT,
} from "@/lib/card-categories";

describe("category snapshot input", () => {
  const input = {
    category: "basketball",
    measured_on: "2024-10-01",
    card_count: 0,
  };
  it.each([0, 1, MAX_CARD_COUNT])("accepts integer %i", (card_count) =>
    expect(
      createCategorySnapshotSchema.safeParse({ ...input, card_count }).success,
    ).toBe(true),
  );
  it.each([-1, 0.5, MAX_CARD_COUNT + 1, "", "0", null, true])(
    "rejects count %p",
    (card_count) =>
      expect(
        createCategorySnapshotSchema.safeParse({ ...input, card_count })
          .success,
      ).toBe(false),
  );
  it.each([
    "2024-02-30",
    "2023-02-29",
    "2024-13-01",
    "2024-00-01",
    "2024-01-00",
    "2024-1-1",
    "2024-01-01T00:00:00Z",
    "0099-01-01",
    "nope",
  ])("rejects date %s", (measured_on) =>
    expect(
      createCategorySnapshotSchema.safeParse({ ...input, measured_on }).success,
    ).toBe(false),
  );
  it("accepts leap dates and rejects future measurements", () => {
    expect(isCalendarDate("2024-02-29")).toBe(true);
    expect(
      createCategorySnapshotSchema.safeParse({
        ...input,
        measured_on: "9999-01-01",
      }).success,
    ).toBe(false);
  });
  it("uses Chicago today through UTC date boundaries", () => {
    expect(chicagoToday(new Date("2026-10-25T02:00:00Z"))).toBe("2026-10-24");
    expect(chicagoToday(new Date("2026-01-01T04:00:00Z"))).toBe("2025-12-31");
  });
  it.each([null, 125, -125, 0])("formats comparison %p", (value) => {
    expect(formatCategoryChange(value)).toBe(
      value === null
        ? "No previous measurement"
        : value === 0
          ? "+0"
          : value > 0
            ? "+125"
            : "-125",
    );
  });
  it("keeps category and date fixed on correction; validates bigint ids without throwing", () => {
    expect(
      correctCategorySnapshotSchema.safeParse({
        snapshot_id: "42",
        card_count: 0,
      }).success,
    ).toBe(true);
    for (const snapshot_id of ["0", "-1", "abc", "9223372036854775808"])
      expect(
        correctCategorySnapshotSchema.safeParse({ snapshot_id, card_count: 0 })
          .success,
      ).toBe(false);
    expect(
      correctCategorySnapshotSchema.safeParse({
        snapshot_id: "42",
        card_count: 0,
        measured_on: "2024-01-01",
      }).success,
    ).toBe(false);
  });
});

it.each([undefined, null, 1, 1400, MAX_CARD_COUNT])(
  "accepts optional category rank %p",
  (ranking) => {
    expect(
      createCategorySnapshotSchema.safeParse({
        category: "basketball",
        measured_on: "2024-10-01",
        card_count: 0,
        ranking,
      }).success,
    ).toBe(true);
    expect(
      correctCategorySnapshotSchema.safeParse({
        snapshot_id: "42",
        card_count: 0,
        ranking,
      }).success,
    ).toBe(true);
  },
);
it.each([0, -1, 1.5, MAX_CARD_COUNT + 1, "", "1400", true])(
  "rejects invalid rank %p",
  (ranking) => {
    expect(
      createCategorySnapshotSchema.safeParse({
        category: "basketball",
        measured_on: "2024-10-01",
        card_count: 0,
        ranking,
      }).success,
    ).toBe(false);
    expect(
      correctCategorySnapshotSchema.safeParse({
        snapshot_id: "42",
        card_count: 0,
        ranking,
      }).success,
    ).toBe(false);
  },
);

it.each([undefined, null, -2147483648, -100, 0, 100, 2147483647])(
  "accepts signed optional difference %p",
  (difference) => {
    expect(
      createCategorySnapshotSchema.safeParse({
        category: "basketball",
        measured_on: "2024-10-01",
        card_count: 0,
        difference,
      }).success,
    ).toBe(true);
    expect(
      correctCategorySnapshotSchema.safeParse({
        snapshot_id: "42",
        card_count: 0,
        difference,
      }).success,
    ).toBe(true);
  },
);
it.each([-2147483649, 2147483648, -0.5, 0.5, "", "-10", false])(
  "rejects invalid difference %p",
  (difference) => {
    expect(
      createCategorySnapshotSchema.safeParse({
        category: "basketball",
        measured_on: "2024-10-01",
        card_count: 0,
        difference,
      }).success,
    ).toBe(false);
    expect(
      correctCategorySnapshotSchema.safeParse({
        snapshot_id: "42",
        card_count: 0,
        difference,
      }).success,
    ).toBe(false);
  },
);
