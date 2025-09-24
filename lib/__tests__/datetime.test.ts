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
});
