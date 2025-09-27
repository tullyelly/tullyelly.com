/** @jest-environment node */
import { asDateString, isTimestampKey } from "@/lib/dates";

describe("lib/dates.asDateString", () => {
  it("returns YYYY-MM-DD when given an ISO string", () => {
    expect(asDateString("2024-05-18T12:34:56Z")).toBe("2024-05-18");
  });

  it("returns null for falsy inputs", () => {
    expect(asDateString(null)).toBeNull();
    expect(asDateString(undefined)).toBeNull();
  });

  it("returns null for non-string inputs", () => {
    expect(asDateString(123 as unknown as string)).toBeNull();
  });
});

describe("lib/dates.isTimestampKey", () => {
  it("detects timestamp-ish suffixes", () => {
    expect(isTimestampKey("created_at")).toBe(true);
    expect(isTimestampKey("last_update_time")).toBe(true);
    expect(isTimestampKey("release_date")).toBe(true);
  });

  it("ignores non-timestamp keys", () => {
    expect(isTimestampKey("title")).toBe(false);
    expect(isTimestampKey("timestamped")).toBe(false);
  });
});
