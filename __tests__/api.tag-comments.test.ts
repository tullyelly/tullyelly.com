/** @jest-environment node */
import { GET } from "@/app/api/tag-comments/route";

const mockSql = jest.fn();

jest.mock("@/lib/db", () => ({
  sql: (strings: TemplateStringsArray, ...values: unknown[]) =>
    mockSql(strings, values),
}));

function makeReq(query = "") {
  return new Request(`http://localhost/api/tag-comments${query}`);
}

describe("/api/tag-comments", () => {
  beforeEach(() => {
    mockSql.mockReset();
  });

  it("requires tag", async () => {
    const res = await GET(makeReq());

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "tag is required" });
  });

  it("validates tag slug format", async () => {
    const res = await GET(makeReq("?tag=bad slug!"));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "invalid tag" });
  });

  it("validates limit", async () => {
    const res = await GET(makeReq("?tag=cardattack&limit=abc"));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "invalid limit" });
  });

  it("validates cursor", async () => {
    const res = await GET(makeReq("?tag=cardattack&cursor=nope"));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "invalid cursor" });
  });

  it("returns serialized comments and lowercases the tag", async () => {
    mockSql.mockResolvedValue([
      {
        id: "42",
        body: "secret plans",
        created_at: new Date("2026-03-14T18:22:00.000Z"),
        user_name: "cipher",
      },
    ]);

    const res = await GET(
      makeReq(`?tag=${encodeURIComponent("CARD-&-COIN")}&limit=5`),
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([
      {
        id: "42",
        body: "secret plans",
        created_at: "2026-03-14T18:22:00.000Z",
        user_name: "cipher",
      },
    ]);

    expect(mockSql).toHaveBeenCalledTimes(1);
    const [, values] = mockSql.mock.calls[0] as [TemplateStringsArray, unknown[]];
    expect(values).toEqual(["card-&-coin", 5]);
  });

  it("passes the cursor into the paged query", async () => {
    mockSql.mockResolvedValue([]);

    const res = await GET(
      makeReq("?tag=cardattack&cursor=2026-03-14T20:30:00.000Z"),
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);

    expect(mockSql).toHaveBeenCalledTimes(1);
    const [, values] = mockSql.mock.calls[0] as [TemplateStringsArray, unknown[]];
    expect(values[0]).toBe("cardattack");
    expect(values[1]).toBeInstanceOf(Date);
    expect((values[1] as Date).toISOString()).toBe("2026-03-14T20:30:00.000Z");
    expect(values[2]).toBe(10);
  });
});
