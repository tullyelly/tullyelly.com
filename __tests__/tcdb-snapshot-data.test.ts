/** @jest-environment node */

const sqlQueryOneMock = jest.fn();

jest.mock("server-only", () => ({}));
jest.mock("@/lib/db/retry", () => ({
  withDbRetry: (fn: () => Promise<unknown>) => fn(),
}));
jest.mock("@/lib/db-sql-helpers", () => ({
  sqlQueryOne: (...args: unknown[]) => sqlQueryOneMock(...args),
}));

import { getTcdbSnapshotForTagOnDate } from "@/lib/data/tcdb-snapshot";

describe("tcdb snapshot data helper", () => {
  beforeEach(() => {
    sqlQueryOneMock.mockReset();
  });

  it("resolves a dated homie snapshot from a chronicle tag", async () => {
    sqlQueryOneMock.mockResolvedValue({
      homie_id: "432",
      name: "Shaquille O'Neal",
      card_count: "178",
      ranking: "149",
      ranking_at: "2026-04-10T00:00:00.000Z",
      prev_card_count: "170",
      prev_ranking: "152",
      prev_difference: "-3",
      prev_ranking_at: "2026-04-03T00:00:00.000Z",
      card_count_delta: "8",
      rank_delta: "3",
      diff_delta: "2",
      trend_rank: "up",
      trend_overall: "up",
      diff_sign_changed: false,
    });

    await expect(
      getTcdbSnapshotForTagOnDate(" SHAQ ", "2026-04-10"),
    ).resolves.toEqual({
      homieId: "432",
      displayName: "shaquille o'neal",
      cardCount: 178,
      ranking: 149,
      rankingAt: "2026-04-10",
      prevCardCount: 170,
      prevRanking: 152,
      prevDifference: -3,
      prevRankingAt: "2026-04-03",
      cardCountDelta: 8,
      rankDelta: 3,
      diffDelta: 2,
      trend: "up",
      trendRank: "up",
      trendOverall: "up",
      diffSignChanged: false,
    });

    expect(sqlQueryOneMock).toHaveBeenCalledTimes(1);
    const [query, values] = sqlQueryOneMock.mock.calls[0] as [
      string,
      [string, string],
    ];

    expect(query).toContain("FROM dojo.homie AS h");
    expect(query).toContain("FROM dojo.homie_tcdb_snapshot_rt AS s");
    expect(query).toContain("WHERE h.tag_slug = $2");
    expect(values[0]).toBe("2026-04-10");
    expect(values[1]).toBe("shaq");
  });

  it("returns null for invalid snapshot dates without querying", async () => {
    await expect(
      getTcdbSnapshotForTagOnDate("shaq", "not-a-date"),
    ).resolves.toBeNull();

    expect(sqlQueryOneMock).not.toHaveBeenCalled();
  });

  it("uses rank trend for snapshot rendering semantics", async () => {
    sqlQueryOneMock.mockResolvedValue({
      homie_id: "432",
      name: "Shaquille O'Neal",
      card_count: "178",
      ranking: "149",
      ranking_at: "2026-04-10T00:00:00.000Z",
      prev_card_count: "178",
      prev_ranking: "149",
      prev_difference: "-1",
      prev_ranking_at: "2026-04-03T00:00:00.000Z",
      card_count_delta: "0",
      rank_delta: "0",
      diff_delta: "-2",
      trend_rank: "flat",
      trend_overall: "down",
      diff_sign_changed: false,
    });

    await expect(
      getTcdbSnapshotForTagOnDate("shaq", "2026-04-10"),
    ).resolves.toMatchObject({
      trend: "flat",
      trendRank: "flat",
      trendOverall: "down",
    });
  });
});
