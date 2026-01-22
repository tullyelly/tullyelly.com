/** @jest-environment node */

import { POST } from "@/app/api/tcdb/snapshot/route";
import {
  AuthzForbiddenError,
  AuthzUnauthenticatedError,
} from "@/lib/authz/types";

const mockRevalidateTag = jest.fn();
const mockRequirePermission = jest.fn<Promise<boolean | void>, [string]>();
const mockGetPool = jest.fn();
const mockConnect = jest.fn();
const mockWriteAudit = jest.fn<Promise<void>, [unknown]>();
const mockGetCurrentUser = jest.fn();

jest.mock("next/cache", () => ({
  revalidateTag: (...args: unknown[]) => mockRevalidateTag(...args),
}));

jest.mock("@/lib/auth/permissions", () => ({
  requirePermission: (...args: Parameters<typeof mockRequirePermission>) =>
    mockRequirePermission(...args),
}));

jest.mock("@/db/pool", () => ({
  getPool: (...args: unknown[]) => mockGetPool(...args),
}));

jest.mock("@/lib/audit/log", () => ({
  writeAudit: (...args: Parameters<typeof mockWriteAudit>) =>
    mockWriteAudit(...args),
}));

jest.mock("@/lib/auth/session", () => ({
  getCurrentUser: (...args: Parameters<typeof mockGetCurrentUser>) =>
    mockGetCurrentUser(...args),
}));

describe("POST /api/tcdb/snapshot", () => {
  function makeRequest(body: unknown) {
    return new Request("http://example.local/api/tcdb/snapshot", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  const basePayload = {
    homie_id: "4c8bfe9a-b302-42c8-adf3-8ab954db8d19",
    card_count: 12,
    ranking: 3,
    difference: -1,
    ranking_at: "2024-01-15T00:00:00.000Z",
  } satisfies Record<string, unknown>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetPool.mockReset();
    mockConnect.mockReset();
    mockRequirePermission.mockReset();
    mockWriteAudit.mockReset();
    mockGetCurrentUser.mockReset();
    mockRevalidateTag.mockReset();

    mockGetPool.mockReturnValue({ connect: mockConnect });
    mockWriteAudit.mockResolvedValue();
    mockRequirePermission.mockResolvedValue(undefined);
    mockGetCurrentUser.mockResolvedValue(null);
  });

  describe("schema validation", () => {
    const invalidCases: Array<{
      name: string;
      body: Record<string, unknown>;
      invalidField: string;
    }> = [
      {
        name: "rejects unsupported homie_id type",
        body: { ...basePayload, homie_id: "not-a-uuid" },
        invalidField: "homie_id",
      },
      {
        name: "rejects negative card_count",
        body: { ...basePayload, card_count: -5 },
        invalidField: "card_count",
      },
      {
        name: "rejects non-integer ranking",
        body: { ...basePayload, ranking: 2.4 },
        invalidField: "ranking",
      },
      {
        name: "rejects invalid ranking_at value",
        body: { ...basePayload, ranking_at: "not-a-date" },
        invalidField: "ranking_at",
      },
    ];

    it.each(invalidCases)("$name", async ({ body, invalidField }) => {
      const res = await POST(makeRequest(body));

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("INVALID_INPUT");
      expect(json.fieldErrors?.[invalidField]).toBeDefined();
      expect(mockRequirePermission).not.toHaveBeenCalled();
      expect(mockConnect).not.toHaveBeenCalled();
    });
  });

  describe("authorization", () => {
    it("returns 401 when permission check throws unauthenticated", async () => {
      mockRequirePermission.mockRejectedValueOnce(
        new AuthzUnauthenticatedError(),
      );

      const res = await POST(makeRequest(basePayload));

      expect(res.status).toBe(401);
      await expect(res.json()).resolves.toEqual({ error: "UNAUTHENTICATED" });
      expect(mockConnect).not.toHaveBeenCalled();
    });

    it("returns 403 when permission check throws forbidden", async () => {
      mockRequirePermission.mockRejectedValueOnce(new AuthzForbiddenError());

      const res = await POST(makeRequest(basePayload));

      expect(res.status).toBe(403);
      await expect(res.json()).resolves.toEqual({ error: "FORBIDDEN" });
      expect(mockConnect).not.toHaveBeenCalled();
    });

    it("returns 403 when permission check resolves false", async () => {
      mockRequirePermission.mockResolvedValueOnce(false);

      const res = await POST(makeRequest(basePayload));

      expect(res.status).toBe(403);
      await expect(res.json()).resolves.toEqual({ error: "FORBIDDEN" });
      expect(mockConnect).not.toHaveBeenCalled();
    });
  });

  describe("success", () => {
    it("persists snapshot and emits side effects", async () => {
      const release = jest.fn();
      const query = jest.fn();
      const insertedId = "snapshot-id-123";

      mockConnect.mockResolvedValue({
        query,
        release,
      });
      mockGetCurrentUser.mockResolvedValue({ id: "user-789" });

      query.mockImplementation((sql: string, params?: unknown[]) => {
        if (sql === "BEGIN") return Promise.resolve({ rows: [] });
        if (sql.includes("INSERT INTO dojo.homie_tcdb_snapshot")) {
          expect(params).toEqual([
            basePayload.homie_id,
            basePayload.card_count,
            basePayload.ranking,
            basePayload.difference,
            "2024-01-15",
          ]);
          return Promise.resolve({ rows: [{ id: insertedId }] });
        }
        if (sql === "SELECT refresh_homie_tcdb_ranking_rt();") {
          return Promise.resolve({ rows: [] });
        }
        if (sql === "COMMIT") {
          return Promise.resolve({ rows: [] });
        }
        throw new Error(`Unexpected SQL: ${sql}`);
      });

      const res = await POST(makeRequest(basePayload));

      expect(res.status).toBe(201);
      await expect(res.json()).resolves.toEqual({
        id: insertedId,
        status: "ok",
      });
      expect(query).toHaveBeenCalledWith("BEGIN");
      expect(query).toHaveBeenCalledWith(
        "SELECT refresh_homie_tcdb_ranking_rt();",
      );
      expect(query).toHaveBeenCalledWith("COMMIT");
      expect(release).toHaveBeenCalled();
      expect(mockRevalidateTag).toHaveBeenCalledWith("tcdb-rankings", "max");
      expect(mockRevalidateTag).toHaveBeenCalledTimes(1);
      expect(mockWriteAudit).toHaveBeenCalledWith({
        action: "tcdb.snapshot.create",
        actorId: "user-789",
        targetTable: "dojo.homie_tcdb_snapshot",
        targetId: insertedId,
        metadata: {
          homie_id: basePayload.homie_id,
          card_count: basePayload.card_count,
          ranking: basePayload.ranking,
          difference: basePayload.difference,
          ranking_at: "2024-01-15",
        },
      });
    });
  });
});
