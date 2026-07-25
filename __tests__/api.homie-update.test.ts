/** @jest-environment node */

const mockRevalidateTag = jest.fn();
const mockConnect = jest.fn();
const mockRequireTcdbHomieUpdate = jest.fn();
const mockGetCurrentUser = jest.fn();

jest.mock("next/cache", () => ({
  revalidateTag: (...args: unknown[]) => mockRevalidateTag(...args),
}));
jest.mock("@/db/pool", () => ({
  getPool: () => ({ connect: mockConnect }),
}));
jest.mock("@/lib/auth/permissions", () => ({
  requireTcdbHomieUpdate: () => mockRequireTcdbHomieUpdate(),
}));
jest.mock("@/lib/auth/session", () => ({
  getCurrentUser: () => mockGetCurrentUser(),
}));

import { PATCH } from "@/app/api/homies/[id]/route";

describe("PATCH /api/homies/[id] cache consistency", () => {
  beforeEach(() => {
    mockRevalidateTag.mockReset();
    mockConnect.mockReset();
    mockRequireTcdbHomieUpdate.mockReset().mockResolvedValue(undefined);
    mockGetCurrentUser.mockReset().mockResolvedValue({ id: "actor-id" });
  });

  it("expires every homie read cache immediately after commit", async () => {
    const release = jest.fn();
    const query = jest.fn((sql: string) => {
      if (sql === "BEGIN" || sql === "COMMIT") {
        return Promise.resolve({ rows: [] });
      }
      if (sql.includes("SELECT id, name, tag_slug")) {
        return Promise.resolve({
          rows: [
            {
              id: 13,
              name: "Glenn Robinson",
              tag_slug: null,
              drafted: 1994,
              updated_at: null,
            },
          ],
        });
      }
      if (sql.includes("UPDATE dojo.homie")) {
        return Promise.resolve({
          rows: [
            {
              id: 13,
              name: "Glenn Big Dog Robinson",
              tag_slug: "big-dog",
              drafted: 1994,
              updated_at: "2026-07-25T12:00:00.000Z",
            },
          ],
        });
      }
      if (sql.includes("INSERT INTO dojo.audit_log")) {
        return Promise.resolve({ rows: [] });
      }
      throw new Error(`Unexpected SQL: ${sql}`);
    });
    mockConnect.mockResolvedValue({ query, release });

    const response = await PATCH(
      new Request("http://localhost/api/homies/13", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Glenn Big Dog Robinson",
          tag_slug: "big-dog",
          drafted: 1994,
          expected_updated_at: null,
        }),
      }),
      { params: Promise.resolve({ id: "13" }) },
    );

    expect(response.status).toBe(200);
    expect(query).toHaveBeenCalledWith("COMMIT");
    expect(mockRevalidateTag).toHaveBeenCalledWith("homies", { expire: 0 });
    expect(mockRevalidateTag).toHaveBeenCalledWith("homie-options", {
      expire: 0,
    });
    expect(mockRevalidateTag).toHaveBeenCalledTimes(2);
    expect(release).toHaveBeenCalled();
  });
});
