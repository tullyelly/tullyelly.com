/** @jest-environment node */
import { GET } from "@/app/api/homies/route";
import { listTcdbRankings } from "@/lib/data/tcdb";

jest.mock("@/lib/data/tcdb", () => ({
  isTrend: (value: string | null | undefined) =>
    value === "up" || value === "down" || value === "flat",
  listTcdbRankings: jest.fn(),
}));

const mockListTcdbRankings = listTcdbRankings as jest.Mock;

describe("GET /api/homies", () => {
  beforeEach(() => {
    mockListTcdbRankings.mockReset();
  });

  it("returns homie rankings with cache tag", async () => {
    mockListTcdbRankings.mockResolvedValue({
      data: [],
      meta: { page: 2, pageSize: 20, total: 0, totalPages: 1 },
    });

    const res = await GET(
      new Request(
        "https://tullyelly.com/api/homies?page=2&pageSize=20&q=giannis&trend=up",
      ),
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      data: [],
      meta: { page: 2, pageSize: 20, total: 0, totalPages: 1 },
    });
    expect(res.headers.get("Cache-Tag")).toBe("tcdb-rankings");
    expect(mockListTcdbRankings).toHaveBeenCalledWith({
      page: 2,
      pageSize: 20,
      q: "giannis",
      trend: "up",
    });
  });
});
