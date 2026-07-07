import { formatVolleyballTournamentFinish } from "@/lib/volleyball-finish";

describe("formatVolleyballTournamentFinish", () => {
  it("formats tournament placing labels beyond podium finishes", () => {
    expect(formatVolleyballTournamentFinish(1)).toBe("1st Place");
    expect(formatVolleyballTournamentFinish(2)).toBe("2nd Place");
    expect(formatVolleyballTournamentFinish(3)).toBe("3rd Place");
    expect(formatVolleyballTournamentFinish(4)).toBe("4th Place");
    expect(formatVolleyballTournamentFinish(11)).toBe("11th Place");
    expect(formatVolleyballTournamentFinish(12)).toBe("12th Place");
    expect(formatVolleyballTournamentFinish(13)).toBe("13th Place");
    expect(formatVolleyballTournamentFinish(21)).toBe("21st Place");
  });

  it("returns null when no placing is tracked", () => {
    expect(formatVolleyballTournamentFinish(null)).toBeNull();
  });
});
