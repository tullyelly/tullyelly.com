import {
  fmtDate,
  fmtDateTime,
  fmtRelative,
  parseDateish,
} from "@/lib/datetime";

describe("datetime formatters", () => {
  it('returns "Not available" for null-ish inputs', () => {
    expect(fmtDate(null)).toBe("Not available");
    expect(fmtDate(undefined)).toBe("Not available");
    expect(fmtDate("")).toBe("Not available");
  });

  it("formats timestamps in America/Chicago by default", () => {
    expect(fmtDateTime("2025-09-17T12:00:00Z")).toBe("Sep 17, 2025, 07:00 AM");
  });

  it("formats DATE strings without shifting the calendar day", () => {
    expect(fmtDate("2025-09-19")).toBe("Sep 19, 2025");
    expect(fmtDate("2025-11-02")).toBe("Nov 02, 2025");
  });

  it("keeps ISO timestamps aligned with Central Time conversions", () => {
    expect(fmtDateTime("2025-09-19T00:00:00Z")).toMatch(
      /Sep 18, 2025, 0?7:00 PM/,
    );
  });

  it("returns relative time for recent timestamps", () => {
    const now = Date.now();
    const spy = jest.spyOn(Date, "now").mockReturnValue(now);
    try {
      expect(fmtRelative(now - 60_000)).toBe("1 min ago");
    } finally {
      spy.mockRestore();
    }
  });

  it("handles multiple relative branches", () => {
    const base = 1_700_000_000_000;
    const spy = jest.spyOn(Date, "now").mockReturnValue(base);
    try {
      expect(fmtRelative(base - 10_000)).toBe("just now");
      expect(fmtRelative(base + 30 * 60_000)).toBe("30 min from now");
      expect(fmtRelative(base - 2 * 60 * 60_000)).toBe("2 hrs ago");
      expect(fmtRelative(base + 3 * 24 * 60 * 60_000)).toBe("3 days from now");
    } finally {
      spy.mockRestore();
    }
  });
});

describe("parseDateish", () => {
  it("parses bare DATE strings to noon UTC for Central Time stability", () => {
    const parsed = parseDateish("2025-09-19");
    expect(parsed).not.toBeNull();
    expect(parsed?.getUTCFullYear()).toBe(2025);
    expect(parsed?.getUTCMonth()).toBe(8);
    expect(parsed?.getUTCDate()).toBe(19);
    expect(parsed?.getUTCHours()).toBe(12);
  });

  it("returns null for invalid inputs", () => {
    expect(parseDateish("   ")).toBeNull();
    expect(parseDateish(new Date("not-a-date"))).toBeNull();
  });

  it("coerces numbers and Date instances", () => {
    const now = Date.now();
    const fromNumber = parseDateish(now);
    expect(fromNumber?.getTime()).toBe(now);

    const date = new Date(now);
    const fromDate = parseDateish(date);
    expect(fromDate).toBe(date);
  });
});
