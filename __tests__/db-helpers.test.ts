/** @jest-environment node */

const mockQuery = jest.fn();

jest.mock("@/db/pool", () => ({
  getPool: () => ({
    query: (...args: unknown[]) => mockQuery(...args),
  }),
}));

import { queryOne, queryRows, sql } from "@/lib/db";

describe("lib/db helpers", () => {
  beforeEach(() => {
    mockQuery.mockReset();
  });

  it("parameterizes tagged template SQL through the shared pool", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 7 }] });

    await expect(sql<{ id: number }>`SELECT ${7}::int AS id`).resolves.toEqual([
      { id: 7 },
    ]);

    expect(mockQuery).toHaveBeenCalledWith("SELECT $1::int AS id", [7]);
  });

  it("runs dynamic text queries through the shared pool", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ name: "tcdb" }] });

    await expect(
      queryRows<{ name: string }>("SELECT name FROM dojo.example WHERE id = $1", [
        12,
      ]),
    ).resolves.toEqual([{ name: "tcdb" }]);

    expect(mockQuery).toHaveBeenCalledWith(
      "SELECT name FROM dojo.example WHERE id = $1",
      [12],
    );
  });

  it("returns the first row or null for one-row queries", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ count: "1" }] })
      .mockResolvedValueOnce({ rows: [] });

    await expect(
      queryOne<{ count: string }>("SELECT COUNT(*)::text AS count FROM dojo.x"),
    ).resolves.toEqual({ count: "1" });
    await expect(queryOne("SELECT * FROM dojo.x WHERE false")).resolves.toBeNull();
  });
});
