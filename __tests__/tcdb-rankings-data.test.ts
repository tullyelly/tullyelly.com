/** @jest-environment node */

const sqlQueryRowsMock = jest.fn();
const sqlQueryOneMock = jest.fn();

jest.mock("server-only", () => ({}));
jest.mock("@/lib/db/retry", () => ({
  withDbRetry: (fn: () => Promise<unknown>) => fn(),
}));
jest.mock("@/lib/db-sql-helpers", () => ({
  sqlQueryRows: (...args: unknown[]) => sqlQueryRowsMock(...args),
  sqlQueryOne: (...args: unknown[]) => sqlQueryOneMock(...args),
}));

import {
  getTcdbClanRanking,
  listNumberOneTcdbClanRankings,
  listRecentTcdbClanFallers,
  listRecentTcdbClanRisers,
  listTcdbClanRankings,
} from "@/lib/data/tcdb-clans";
import { listNumberOneTcdbHomieRankings } from "@/lib/data/tcdb";

const clanRow = {
  clan_id: 12,
  name: "Milwaukee Bucks",
  slug: "milwaukee-bucks",
  card_count: 400,
  ranking: 1,
  ranking_at: "2026-05-01",
  difference: 10,
  rank_delta: 2,
  diff_delta: 4,
  trend_rank: "up",
  trend_overall: "up",
  diff_sign_changed: false,
};

const homieRow = {
  homie_id: 34,
  name: "Giannis Antetokounmpo",
  card_count: 500,
  ranking: 1,
  ranking_at: "2026-05-01",
  difference: 5,
  rank_delta: 1,
  diff_delta: 2,
  trend_rank: "up",
  trend_overall: "up",
  diff_sign_changed: false,
};

describe("tcdb clan ranking data helpers", () => {
  beforeEach(() => {
    sqlQueryRowsMock.mockReset();
    sqlQueryOneMock.mockReset();
  });

  it("lists clan rankings with pagination, search, and trend filters", async () => {
    sqlQueryRowsMock
      .mockResolvedValueOnce([clanRow])
      .mockResolvedValueOnce([{ c: "1" }]);

    await expect(
      listTcdbClanRankings({
        page: 2,
        pageSize: 20,
        q: "bucks",
        trend: "up",
      }),
    ).resolves.toEqual({
      data: [{ ...clanRow, ranking_at: "2026-05-01" }],
      meta: {
        page: 2,
        pageSize: 20,
        total: 1,
        totalPages: 1,
        q: "bucks",
        trend: "up",
      },
    });

    const [query, values] = sqlQueryRowsMock.mock.calls[0] as [
      string,
      unknown[],
    ];
    expect(query).toContain("FROM dojo.clan_tcdb_ranking_rt");
    expect(query).toContain("name ILIKE $1");
    expect(query).toContain("trend_overall = $2");
    expect(query).toContain("ORDER BY card_count DESC, ranking ASC");
    expect(values).toEqual(["%bucks%", "up", 20, 20]);
  });

  it("gets a clan ranking by slug", async () => {
    sqlQueryOneMock.mockResolvedValue(clanRow);

    await expect(getTcdbClanRanking("Milwaukee-Bucks")).resolves.toEqual({
      ...clanRow,
      ranking_at: "2026-05-01",
    });

    const [query, values] = sqlQueryOneMock.mock.calls[0] as [
      string,
      unknown[],
    ];
    expect(query).toContain("WHERE slug = $1");
    expect(values).toEqual(["milwaukee-bucks"]);
  });

  it("returns null for missing or invalid clan slugs", async () => {
    sqlQueryOneMock.mockResolvedValue(null);

    await expect(getTcdbClanRanking("missing-clan")).resolves.toBeNull();
    await expect(getTcdbClanRanking("Missing Clan")).resolves.toBeNull();

    expect(sqlQueryOneMock).toHaveBeenCalledTimes(1);
  });

  it("returns #1 homie and clan summary rows", async () => {
    sqlQueryRowsMock.mockResolvedValueOnce([clanRow]);
    await expect(listNumberOneTcdbClanRankings()).resolves.toEqual([
      { ...clanRow, ranking_at: "2026-05-01" },
    ]);
    expect(sqlQueryRowsMock.mock.calls[0][0]).toContain("WHERE ranking = 1");

    sqlQueryRowsMock.mockResolvedValueOnce([homieRow]);
    await expect(listNumberOneTcdbHomieRankings()).resolves.toEqual([
      { ...homieRow, ranking_at: "2026-05-01" },
    ]);
    expect(sqlQueryRowsMock.mock.calls[1][0]).toContain("WHERE ranking = 1");
  });

  it("orders clan risers and fallers by recent movement", async () => {
    sqlQueryRowsMock.mockResolvedValueOnce([clanRow]);
    await expect(listRecentTcdbClanRisers(3)).resolves.toHaveLength(1);
    const [riserQuery, riserValues] = sqlQueryRowsMock.mock.calls[0] as [
      string,
      unknown[],
    ];
    expect(riserQuery).toContain("WHERE trend_overall = $1");
    expect(riserQuery).toContain("rank_delta DESC NULLS LAST");
    expect(riserValues).toEqual(["up", 3]);

    sqlQueryRowsMock.mockResolvedValueOnce([
      {
        ...clanRow,
        trend_overall: "down",
        trend_rank: "down",
        rank_delta: -4,
      },
    ]);
    await expect(listRecentTcdbClanFallers(2)).resolves.toHaveLength(1);
    const [fallerQuery, fallerValues] = sqlQueryRowsMock.mock.calls[1] as [
      string,
      unknown[],
    ];
    expect(fallerQuery).toContain("rank_delta ASC NULLS LAST");
    expect(fallerValues).toEqual(["down", 2]);
  });
});
