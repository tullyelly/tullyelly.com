/** @jest-environment node */
import { GET } from "@/app/api/tcdb-rankings/[id]/route";
import { getTcdbRanking } from "@/lib/data/tcdb";

jest.mock("@/lib/data/tcdb", () => ({
  getTcdbRanking: jest.fn(),
}));

const mockGetTcdbRanking = getTcdbRanking as jest.Mock;

describe("GET /api/tcdb-rankings/:id", () => {
  beforeEach(() => {
    mockGetTcdbRanking.mockReset();
  });

  it("returns 400 for invalid id", async () => {
    const res = await GET({} as Request, {
      params: Promise.resolve({ id: "abc" }),
    });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "invalid id" });
  });

  it("returns 404 when ranking is missing", async () => {
    mockGetTcdbRanking.mockResolvedValue(null);
    const res = await GET({} as Request, {
      params: Promise.resolve({ id: "42" }),
    });
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "not found" });
  });

  it("returns ranking payload with cache tag", async () => {
    mockGetTcdbRanking.mockResolvedValue({
      homie_id: 7,
      name: "Test Homie",
      card_count: 12,
      ranking: 3,
      ranking_at: "2024-01-02",
      difference: 4,
      rank_delta: null,
      diff_delta: null,
      trend_rank: "up",
      trend_overall: "flat",
      diff_sign_changed: false,
    });
    const res = await GET({} as Request, {
      params: Promise.resolve({ id: "7" }),
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ name: "Test Homie" });
    expect(res.headers.get("Cache-Tag")).toBe("tcdb-rankings");
    expect(mockGetTcdbRanking).toHaveBeenCalledWith(7);
  });
});
