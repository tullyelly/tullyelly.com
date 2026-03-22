/** @jest-environment node */

const mockSql = jest.fn();

jest.mock("@/lib/db", () => ({
  sql: (strings: TemplateStringsArray, ...values: unknown[]) =>
    mockSql(strings, values),
}));

import {
  getVolleyballTournamentDayByKeyAndDate,
  normalizeVolleyballTournamentDate,
  normalizeVolleyballTournamentKey,
} from "@/lib/volleyball-tournament-db";

describe("volleyball tournament db helper", () => {
  beforeEach(() => {
    mockSql.mockReset();
  });

  it("returns joined tournament-day metadata", async () => {
    mockSql.mockResolvedValue([
      {
        tournament_key: "1",
        tournament_name: "Midwest Boys Point Series",
        tournament_date: "2026-02-14",
        wins: 2,
        losses: 1,
      },
    ]);

    await expect(
      getVolleyballTournamentDayByKeyAndDate(" 1 ", "2026-02-14"),
    ).resolves.toEqual({
      tournamentKey: "1",
      tournamentName: "Midwest Boys Point Series",
      tournamentDate: "2026-02-14",
      wins: 2,
      losses: 1,
    });

    expect(mockSql).toHaveBeenCalledTimes(1);
    const [, values] = mockSql.mock.calls[0] as [TemplateStringsArray, unknown[]];
    expect(values).toEqual(["1", "2026-02-14"]);
  });

  it("returns null when no tournament day exists", async () => {
    mockSql.mockResolvedValue([]);

    await expect(
      getVolleyballTournamentDayByKeyAndDate("1", "2026-02-14"),
    ).resolves.toBeNull();
  });

  it("rejects blank tournament keys", () => {
    expect(() => normalizeVolleyballTournamentKey("   ")).toThrow(
      "Volleyball tournament lookup: tournamentKey must be a non-empty string.",
    );
  });

  it("rejects invalid ISO tournament dates", () => {
    expect(() => normalizeVolleyballTournamentDate("2026-02-30")).toThrow(
      "Volleyball tournament lookup: tournamentDate must be a valid ISO date string in YYYY-MM-DD form.",
    );
  });
});
