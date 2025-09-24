import { fmtDate } from "@/lib/datetime";

describe("fmtDate", () => {
  it("formats midnight UTC releases as the previous calendar day in Central Time", () => {
    const isoMidnightUtc = "2024-01-01T00:00:00Z";
    expect(fmtDate(isoMidnightUtc)).toBe("Dec 31, 2023");
  });

  it("keeps DATE-only strings anchored to their stated calendar day", () => {
    const dateOnly = "2024-01-01";
    expect(fmtDate(dateOnly)).toBe("Jan 01, 2024");
  });
});
