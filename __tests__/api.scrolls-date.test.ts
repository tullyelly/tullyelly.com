/** @jest-environment node */
import type { NextRequest } from "next/server";
import { GET } from "@/app/api/scrolls/[id]/route";

const mockQuery = jest.fn().mockResolvedValue({
  rows: [
    {
      id: 1,
      label: "Test Scroll",
      major: 1,
      minor: 2,
      patch: 3,
      year: 2024,
      month: 1,
      status_name: "released",
      type_name: "minor",
      release_date: "2024-03-15T00:00:00Z",
    },
  ],
});

jest.mock("@/db/pool", () => ({
  getPool: () => ({
    query: mockQuery,
  }),
}));

describe("GET /api/scrolls/:id", () => {
  it("never returns ISO midnight timestamps for DATE columns", async () => {
    const res = await GET({} as NextRequest, {
      params: Promise.resolve({ id: "1" }),
    });
    expect(res.status).toBe(200);
    const json = (await res.json()) as Record<string, unknown>;
    expect(json.release_date).toBe("2024-03-15");
    const isoMidnightMarker = ["T00:00:00", ".000Z"].join("");
    expect(JSON.stringify(json)).not.toContain(isoMidnightMarker);
  });
});
