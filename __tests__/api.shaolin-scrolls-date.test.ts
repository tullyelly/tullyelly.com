/** @jest-environment node */
import type { NextRequest } from "next/server";
import { GET } from "@/app/api/shaolin-scrolls/[id]/route";

const mockQuery = jest.fn().mockResolvedValue({
  rows: [
    {
      id: 1,
      release_name: "Test Scroll",
      label: "Test Scroll",
      semver: "1.2.3",
      major: 1,
      minor: 2,
      patch: 3,
      year: 2024,
      month: 1,
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

jest.mock("@/db/pool", () => ({
  getPool: () => ({
    query: mockQuery,
  }),
}));

describe("GET /api/shaolin-scrolls/:id", () => {
  it("never returns ISO midnight timestamps for DATE columns", async () => {
    const res = await GET({} as NextRequest, {
      params: Promise.resolve({ id: "1" }),
    });
    expect(res.status).toBe(200);
    const json = (await res.json()) as Record<string, unknown>;
    const releaseDate = json.release_date as string;
    expect(releaseDate).toBe("2024-03-15");
    expect(releaseDate.includes("T00:00:00")).toBe(false);
  });
});
