/** @jest-environment node */

const sqlQueryRowsMock = jest.fn();

jest.mock("server-only", () => ({}));
jest.mock("@/lib/db/retry", () => ({
  withDbRetry: (fn: () => Promise<unknown>) => fn(),
}));
jest.mock("@/lib/db-sql-helpers", () => ({
  sqlQueryRows: (...args: unknown[]) => sqlQueryRowsMock(...args),
}));

import { getClanSnapshotsForTagOnDate } from "@/lib/data/tcdb-clan-snapshot";

describe("clan snapshot data helper", () => {
  beforeEach(() => {
    sqlQueryRowsMock.mockReset();
  });

  it("resolves dated clan snapshots from a chronicle tag", async () => {
    sqlQueryRowsMock.mockResolvedValue([
      {
        clan_id: "12",
        name: "Florida State Seminoles",
        slug: "florida-state-seminoles",
        sport: "basketball",
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
      },
      {
        clan_id: "12",
        name: "Florida State Seminoles",
        slug: "florida-state-seminoles",
        sport: "football",
        card_count: "1",
        ranking: "1",
        ranking_at: "2026-04-10T00:00:00.000Z",
        prev_card_count: null,
        prev_ranking: null,
        prev_difference: null,
        prev_ranking_at: null,
        card_count_delta: null,
        rank_delta: null,
        diff_delta: null,
        trend_rank: "flat",
        trend_overall: "flat",
        diff_sign_changed: false,
      },
    ]);

    await expect(
      getClanSnapshotsForTagOnDate(" NOLES ", "2026-04-10"),
    ).resolves.toEqual([
      {
        clanId: "12",
        slug: "florida-state-seminoles",
        sport: "basketball",
        displayName: "Florida State Seminoles",
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
      },
      {
        clanId: "12",
        slug: "florida-state-seminoles",
        sport: "football",
        displayName: "Florida State Seminoles",
        cardCount: 1,
        ranking: 1,
        rankingAt: "2026-04-10",
        trend: "flat",
        trendRank: "flat",
        trendOverall: "flat",
        diffSignChanged: false,
      },
    ]);

    expect(sqlQueryRowsMock).toHaveBeenCalledTimes(1);
    const [query, values] = sqlQueryRowsMock.mock.calls[0] as [
      string,
      string[],
    ];

    expect(query).toContain("WITH matched_clans AS");
    expect(query).toContain("snapshot_history AS");
    expect(query).toContain("FROM dojo.clan AS c");
    expect(query).toContain("FROM dojo.clan_tcdb_snapshot AS snapshot");
    expect(query).toContain(
      "PARTITION BY snapshot.clan_id, snapshot.sport",
    );
    expect(query).toContain("WHERE to_jsonb(c) ->> 'tag_slug' = $2");
    expect(query).toContain("OR c.slug = $2");
    expect(query).not.toContain("LIMIT 1");
    expect(query).toContain("WHERE s.ranking_at = $1::date");
    expect(query).toContain(
      "ORDER BY s.match_rank ASC, s.sport ASC, s.ranking ASC, s.slug ASC",
    );
    expect(values).toEqual(["2026-04-10", "noles"]);
  });

  it("filters by sport when a sport is provided", async () => {
    sqlQueryRowsMock.mockResolvedValue([]);

    await expect(
      getClanSnapshotsForTagOnDate("noles", "2026-04-10", "Football"),
    ).resolves.toEqual([]);

    const [query, values] = sqlQueryRowsMock.mock.calls[0] as [
      string,
      string[],
    ];

    expect(query).toContain("AND s.sport = $3");
    expect(values).toEqual(["2026-04-10", "noles", "football"]);
  });

  it("returns an empty list for invalid snapshot dates without querying", async () => {
    await expect(
      getClanSnapshotsForTagOnDate("noles", "not-a-date"),
    ).resolves.toEqual([]);

    expect(sqlQueryRowsMock).not.toHaveBeenCalled();
  });

  it("returns an empty list for invalid sport filters without querying", async () => {
    await expect(
      getClanSnapshotsForTagOnDate("noles", "2026-04-10", " /bad/ "),
    ).resolves.toEqual([]);

    expect(sqlQueryRowsMock).not.toHaveBeenCalled();
  });

  it("uses rank trend for snapshot rendering semantics", async () => {
    sqlQueryRowsMock.mockResolvedValue([
      {
        clan_id: "12",
        name: "Florida State Seminoles",
        slug: "florida-state-seminoles",
        sport: "basketball",
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
      },
    ]);

    await expect(
      getClanSnapshotsForTagOnDate("noles", "2026-04-10"),
    ).resolves.toMatchObject([
      {
        trend: "flat",
        trendRank: "flat",
        trendOverall: "down",
      },
    ]);
  });
});
