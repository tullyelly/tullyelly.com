/** @jest-environment node */
import type { NextRequest } from "next/server";
import { GET } from "@/app/api/shaolin-scrolls/[id]/route";

const mockQuery = jest.fn();

jest.mock("@/db/pool", () => ({
  getPool: () => ({
    query: mockQuery,
  }),
}));

describe("GET /api/shaolin-scrolls/:id", () => {
  beforeEach(() => {
    mockQuery.mockReset();
  });

  it("normalizes DATE columns to plain YYYY-MM-DD", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          release_name: "Test Scroll",
          semver: "1.2.3",
          major: 1,
          minor: 2,
          patch: 3,
          year: 2024,
          month: 1,
          label: "Test Scroll",
          status: "released",
          release_type: "minor",
          created_at: new Date("2024-03-10T00:00:00Z"),
          created_by: null,
          updated_at: null,
          updated_by: null,
          release_date: "2024-03-15T00:00:00Z",
        },
      ],
    });

    const res = await GET({} as NextRequest, {
      params: Promise.resolve({ id: "1" }),
    });

    expect(res.status).toBe(200);
    const json = (await res.json()) as Record<string, unknown>;
    expect(json.release_date).toBe("2024-03-15");
  });

  it("returns 400 for invalid id", async () => {
    const res = await GET({} as NextRequest, {
      params: Promise.resolve({ id: "not-a-number" }),
    });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "invalid id" });
  });

  it("returns 404 when the scroll is missing", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const res = await GET({} as NextRequest, {
      params: Promise.resolve({ id: "42" }),
    });

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "not found" });
  });
});
