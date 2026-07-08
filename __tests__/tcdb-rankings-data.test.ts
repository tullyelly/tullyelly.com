/** @jest-environment node */

const queryRowsMock = jest.fn();
const queryOneMock = jest.fn();

jest.mock("server-only", () => ({}));
jest.mock("@/lib/db/retry", () => ({
  withDbRetry: (fn: () => Promise<unknown>) => fn(),
}));
jest.mock("@/lib/db", () => ({
  queryOne: (...args: unknown[]) => queryOneMock(...args),
  queryRows: (...args: unknown[]) => queryRowsMock(...args),
}));

import {
  getTcdbClanRankingsBySlug,
  listClanTcdbSnapshotHistory,
  listNumberOneTcdbClanRankings,
  listRecentTcdbClanFallers,
  listRecentTcdbClanRisers,
  listTcdbClanRankings,
} from "@/lib/data/tcdb-clans";
import {
  getHomieTcdbRankingByRouteKey,
  listHomieTcdbSnapshotHistory,
  listNumberOneTcdbHomieRankings,
} from "@/lib/data/tcdb";
import {
  getTcdbClanRankingHref,
  TCDB_CLAN_RANKINGS_PATH,
} from "@/lib/tcdb-clan-routes";

const clanRow = {
  clan_id: 12,
  tag_slug: "bucks-n-six",
  name: "Milwaukee Bucks",
  slug: "milwaukee-bucks",
  sport: "basketball",
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
  tag_slug: "freak",
  route_slug: "freak",
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
    queryRowsMock.mockReset();
    queryOneMock.mockReset();
  });

  it("lists clan rankings with pagination, search, and trend filters", async () => {
    queryRowsMock
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

    const [query, values] = queryRowsMock.mock.calls[0] as [
      string,
      unknown[],
    ];
    expect(query).toContain("FROM dojo.clan_tcdb_ranking_rt");
    expect(query).toContain("JOIN dojo.clan AS c");
    expect(query).toContain("NULLIF(btrim(c.tag_slug), '') AS tag_slug");
    expect(query).toContain("r.name ILIKE $1");
    expect(query).toContain("r.trend_overall = $2");
    expect(query).toContain("ORDER BY r.card_count DESC, r.ranking ASC");
    expect(values).toEqual(["%bucks%", "up", 20, 20]);
  });

  it("gets all current sport rankings for a clan slug", async () => {
    const footballRow = {
      ...clanRow,
      sport: "football",
      card_count: 250,
      ranking: 4,
    };
    queryRowsMock.mockResolvedValue([clanRow, footballRow]);

    await expect(getTcdbClanRankingsBySlug("Milwaukee-Bucks")).resolves.toEqual(
      [
        { ...clanRow, ranking_at: "2026-05-01" },
        { ...footballRow, ranking_at: "2026-05-01" },
      ],
    );

    const [query, values] = queryRowsMock.mock.calls[0] as [
      string,
      unknown[],
    ];
    expect(query).toContain("WHERE r.slug = $1");
    expect(query).toContain("ORDER BY r.sport ASC");
    expect(values).toEqual(["milwaukee-bucks"]);
  });

  it("lists clan snapshot history by sport and date", async () => {
    queryRowsMock.mockResolvedValueOnce([
      {
        clan_id: 12,
        sport: "basketball",
        card_count: 136,
        ranking: 1,
        ranking_at: "2026-04-01T00:00:00.000Z",
        difference: 8,
      },
      {
        clan_id: 12,
        sport: "football",
        card_count: 650,
        ranking: 1,
        ranking_at: "2026-05-01T00:00:00.000Z",
        difference: 75,
      },
    ]);

    await expect(listClanTcdbSnapshotHistory(12)).resolves.toEqual([
      {
        clan_id: 12,
        sport: "basketball",
        card_count: 136,
        ranking: 1,
        ranking_at: "2026-04-01",
        difference: 8,
      },
      {
        clan_id: 12,
        sport: "football",
        card_count: 650,
        ranking: 1,
        ranking_at: "2026-05-01",
        difference: 75,
      },
    ]);

    const [query, values] = queryRowsMock.mock.calls[0] as [
      string,
      unknown[],
    ];
    expect(query).toContain("FROM dojo.clan_tcdb_snapshot_rt");
    expect(query).toContain("WHERE clan_id = $1::bigint");
    expect(query).toContain("sport");
    expect(query).toContain("ranking");
    expect(query).toContain("difference");
    expect(query).toContain("ORDER BY sport ASC, ranking_at ASC");
    expect(values).toEqual(["12"]);
  });

  it("skips clan snapshot history for invalid ids", async () => {
    await expect(listClanTcdbSnapshotHistory("not-a-number")).resolves.toEqual(
      [],
    );

    expect(queryRowsMock).not.toHaveBeenCalled();
  });

  it("builds cleaned clan ranking public routes", () => {
    expect(TCDB_CLAN_RANKINGS_PATH).toBe("/cardattack/clans");
    expect(getTcdbClanRankingHref({ slug: "milwaukee-bucks" })).toBe(
      "/cardattack/clans/milwaukee-bucks",
    );
  });

  it("returns an empty list for missing or invalid clan slugs", async () => {
    queryRowsMock.mockResolvedValue([]);

    await expect(getTcdbClanRankingsBySlug("missing-clan")).resolves.toEqual(
      [],
    );
    await expect(getTcdbClanRankingsBySlug("Missing Clan")).resolves.toEqual(
      [],
    );

    expect(queryRowsMock).toHaveBeenCalledTimes(1);
  });

  it("returns #1 homie and clan summary rows", async () => {
    queryRowsMock.mockResolvedValueOnce([clanRow]);
    await expect(listNumberOneTcdbClanRankings()).resolves.toEqual([
      { ...clanRow, ranking_at: "2026-05-01" },
    ]);
    expect(queryRowsMock.mock.calls[0][0]).toContain(
      "WHERE r.ranking = 1",
    );

    queryRowsMock.mockResolvedValueOnce([homieRow]);
    await expect(listNumberOneTcdbHomieRankings()).resolves.toEqual([
      { ...homieRow, ranking_at: "2026-05-01" },
    ]);
    expect(queryRowsMock.mock.calls[1][0]).toContain("WHERE ranking = 1");
  });

  it("gets homie ranking detail by slug or numeric fallback", async () => {
    queryOneMock.mockResolvedValueOnce(homieRow);

    await expect(getHomieTcdbRankingByRouteKey(" Freak ")).resolves.toEqual({
      ...homieRow,
      ranking_at: "2026-05-01",
    });

    const [slugQuery, slugValues] = queryOneMock.mock.calls[0] as [
      string,
      unknown[],
    ];
    expect(slugQuery).toContain("FROM dojo.v_homie_tcdb_ranking_route");
    expect(slugQuery).toContain("WHERE tag_slug = $1");
    expect(slugValues).toEqual(["freak"]);

    const fallbackRow = {
      ...homieRow,
      tag_slug: null,
      route_slug: "34",
    };
    queryOneMock.mockResolvedValueOnce(fallbackRow);

    await expect(getHomieTcdbRankingByRouteKey("34")).resolves.toEqual({
      ...fallbackRow,
      ranking_at: "2026-05-01",
    });

    const [idQuery, idValues] = queryOneMock.mock.calls[1] as [
      string,
      unknown[],
    ];
    expect(idQuery).toContain("WHERE homie_id = $1::bigint");
    expect(idValues).toEqual(["34"]);
  });

  it("lists homie snapshot history in chronological order", async () => {
    queryRowsMock.mockResolvedValueOnce([
      {
        homie_id: 34,
        card_count: 450,
        ranking: 2,
        ranking_at: "2026-04-01T00:00:00.000Z",
        difference: 4,
      },
      {
        homie_id: 34,
        card_count: 500,
        ranking: 1,
        ranking_at: "2026-05-01T00:00:00.000Z",
        difference: 5,
      },
    ]);

    await expect(listHomieTcdbSnapshotHistory(34)).resolves.toEqual([
      {
        homie_id: 34,
        card_count: 450,
        ranking: 2,
        ranking_at: "2026-04-01",
        difference: 4,
      },
      {
        homie_id: 34,
        card_count: 500,
        ranking: 1,
        ranking_at: "2026-05-01",
        difference: 5,
      },
    ]);

    const [query, values] = queryRowsMock.mock.calls[0] as [
      string,
      unknown[],
    ];
    expect(query).toContain("FROM dojo.homie_tcdb_snapshot_rt");
    expect(query).toContain("WHERE homie_id = $1::bigint");
    expect(query).toContain("ORDER BY ranking_at ASC");
    expect(values).toEqual(["34"]);
  });

  it("skips homie snapshot history for invalid ids", async () => {
    await expect(listHomieTcdbSnapshotHistory("not-a-number")).resolves.toEqual(
      [],
    );

    expect(queryRowsMock).not.toHaveBeenCalled();
  });

  it("orders clan risers and fallers by recent movement", async () => {
    queryRowsMock.mockResolvedValueOnce([clanRow]);
    await expect(listRecentTcdbClanRisers(3)).resolves.toHaveLength(1);
    const [riserQuery, riserValues] = queryRowsMock.mock.calls[0] as [
      string,
      unknown[],
    ];
    expect(riserQuery).toContain("WHERE r.trend_overall = $1");
    expect(riserQuery).toContain("r.rank_delta DESC NULLS LAST");
    expect(riserValues).toEqual(["up", 3]);

    queryRowsMock.mockResolvedValueOnce([
      {
        ...clanRow,
        trend_overall: "down",
        trend_rank: "down",
        rank_delta: -4,
      },
    ]);
    await expect(listRecentTcdbClanFallers(2)).resolves.toHaveLength(1);
    const [fallerQuery, fallerValues] = queryRowsMock.mock.calls[1] as [
      string,
      unknown[],
    ];
    expect(fallerQuery).toContain("r.rank_delta ASC NULLS LAST");
    expect(fallerValues).toEqual(["down", 2]);
  });
});
