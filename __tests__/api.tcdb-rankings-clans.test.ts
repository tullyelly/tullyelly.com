/** @jest-environment node */

import { GET as GET_LIST } from "@/app/api/tcdb-rankings/clans/route";
import { GET as GET_DETAIL } from "@/app/api/tcdb-rankings/clans/[slug]/route";
import {
  getTcdbClanRanking,
  listTcdbClanRankings,
} from "@/lib/data/tcdb-clans";

jest.mock("@/lib/data/tcdb-clans", () => ({
  getTcdbClanRanking: jest.fn(),
  listTcdbClanRankings: jest.fn(),
}));

const mockGetTcdbClanRanking = getTcdbClanRanking as jest.Mock;
const mockListTcdbClanRankings = listTcdbClanRankings as jest.Mock;

const ranking = {
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

describe("GET /api/tcdb-rankings/clans", () => {
  beforeEach(() => {
    mockGetTcdbClanRanking.mockReset();
    mockListTcdbClanRankings.mockReset();
  });

  it("returns clan rankings and forwards query filters", async () => {
    mockListTcdbClanRankings.mockResolvedValue({
      data: [ranking],
      meta: {
        page: 2,
        pageSize: 20,
        total: 1,
        totalPages: 1,
        q: "bucks",
        trend: "up",
      },
    });

    const res = await GET_LIST(
      new Request(
        "https://tullyelly.com/api/tcdb-rankings/clans?page=2&pageSize=20&q=bucks&trend=up",
      ),
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      data: [{ slug: "milwaukee-bucks" }],
    });
    expect(res.headers.get("Cache-Tag")).toBe("tcdb-rankings");
    expect(mockListTcdbClanRankings).toHaveBeenCalledWith({
      page: 2,
      pageSize: 20,
      q: "bucks",
      trend: "up",
    });
  });

  it("ignores invalid trend filters", async () => {
    mockListTcdbClanRankings.mockResolvedValue({
      data: [],
      meta: { page: 1, pageSize: 50, total: 0, totalPages: 1 },
    });

    await GET_LIST(
      new Request(
        "https://tullyelly.com/api/tcdb-rankings/clans?trend=sideways",
      ),
    );

    expect(mockListTcdbClanRankings).toHaveBeenCalledWith({
      page: 1,
      pageSize: 50,
      q: undefined,
      trend: undefined,
    });
  });
});

describe("GET /api/tcdb-rankings/clans/:slug", () => {
  beforeEach(() => {
    mockGetTcdbClanRanking.mockReset();
    mockListTcdbClanRankings.mockReset();
  });

  it("returns a clan ranking payload with cache tag", async () => {
    mockGetTcdbClanRanking.mockResolvedValue(ranking);

    const res = await GET_DETAIL({} as Request, {
      params: Promise.resolve({ slug: "milwaukee-bucks" }),
    });

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ name: "Milwaukee Bucks" });
    expect(res.headers.get("Cache-Tag")).toBe("tcdb-rankings");
    expect(mockGetTcdbClanRanking).toHaveBeenCalledWith("milwaukee-bucks");
  });

  it("returns 404 for missing clan slugs", async () => {
    mockGetTcdbClanRanking.mockResolvedValue(null);

    const res = await GET_DETAIL({} as Request, {
      params: Promise.resolve({ slug: "missing-clan" }),
    });

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "not found" });
  });
});
