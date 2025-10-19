import { formatReleaseDate } from "./formatReleaseDate";

describe("formatReleaseDate", () => {
  it("returns empty string for null", () => {
    expect(formatReleaseDate(null)).toBe("");
  });

  it("formats bare date strings to Chicago time without timezone label", () => {
    const out = formatReleaseDate("2024-01-02");
    expect(out).toContain("2024");
    expect(out).not.toMatch(/GMT|UTC|CST|CDT/);
  });
});
