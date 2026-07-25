/** @jest-environment node */
import { GET } from "@/app/api/homies/route";
import { listHomieDirectory } from "@/lib/data/homies";

jest.mock("@/lib/data/homies", () => ({
  listHomieDirectory: jest.fn(),
}));

const mockListHomieDirectory = listHomieDirectory as jest.Mock;

describe("GET /api/homies", () => {
  beforeEach(() => {
    mockListHomieDirectory.mockReset();
  });

  it("returns homie rankings with cache tag", async () => {
    mockListHomieDirectory.mockResolvedValue([]);

    const res = await GET(
      new Request(
        "https://tullyelly.com/api/homies?page=2&pageSize=20&q=giannis&trend=up",
      ),
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      data: [],
      meta: { total: 0 },
    });
    expect(res.headers.get("Cache-Tag")).toBe("homies");
    expect(mockListHomieDirectory).toHaveBeenCalledWith();
  });
});
