/** @jest-environment node */

const mockSql = jest.fn();

jest.mock("@/lib/db", () => ({
  sql: (strings: TemplateStringsArray, ...values: unknown[]) =>
    mockSql(strings, values),
}));

import {
  getVolleyballTournamentDayByKeyAndDate,
  getVolleyballTournamentSummaryByKey,
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
        finish: 1,
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
      finish: 1,
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

  it("returns DB-backed tournament summary metadata", async () => {
    mockSql.mockResolvedValue([
      {
        tournament_key: "2",
        tournament_name: "Dale Rohde Tournament",
        finish: 1,
        overall_wins: "6",
        overall_losses: "0",
      },
    ]);

    await expect(getVolleyballTournamentSummaryByKey(" 2 ")).resolves.toEqual({
      tournamentKey: "2",
      tournamentName: "Dale Rohde Tournament",
      finish: 1,
      overallWins: 6,
      overallLosses: 0,
      overallRecord: "6-0",
    });

    expect(mockSql).toHaveBeenCalledTimes(1);
    const [, values] = mockSql.mock.calls[0] as [TemplateStringsArray, unknown[]];
    expect(values).toEqual(["2"]);
  });
});
