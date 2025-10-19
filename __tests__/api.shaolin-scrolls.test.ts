/** @jest-environment node */
import type { ReleaseListResponse } from "@/app/api/shaolin-scrolls/route";
import { GET } from "@/app/api/shaolin-scrolls/route";

const mockQuery = jest.fn();

jest.mock("@/db/pool", () => ({
  getPool: () => ({
    query: mockQuery,
  }),
}));

const rows = [
  {
    id: 1,
    release_name: "Alpha",
    label: "Alpha",
    status: "planned",
    release_type: "minor",
    semver: "0.1.0",
    sem_major: 0,
    sem_minor: 1,
    sem_patch: 0,
    sem_hotfix: 0,
    created_at: new Date("2024-01-01T05:06:07Z"),
    release_date: "2024-01-05",
  },
];

function setupList() {
  mockQuery.mockImplementation((sql: string, _params?: unknown[]) => {
    if (sql === "SELECT 1") {
      return Promise.resolve({ rows: [] });
    }
    if (sql.includes("COUNT(*)")) {
      return Promise.resolve({ rows: [{ total: rows.length }] });
    }
    if (sql.includes("FROM dojo.v_shaolin_scrolls") && sql.includes("LIMIT")) {
      return Promise.resolve({ rows });
    }
    throw new Error(`Unexpected SQL: ${sql}`);
  });
}

function makeReq(query = "") {
  return new Request(`http://localhost/api/shaolin-scrolls${query}`);
}

describe("/api/shaolin-scrolls", () => {
  beforeEach(() => {
    mockQuery.mockReset();
  });

  it("returns list payload", async () => {
    setupList();
    const res = await GET(makeReq("?limit=5"));
    expect(res.status).toBe(200);
    const json = (await res.json()) as ReleaseListResponse;
    expect(json.items[0].name).toBe("Alpha");
    expect(json.items[0].release_date).toBe("2024-01-05");
  });

  it("validates sort values", async () => {
    const res = await GET(makeReq("?sort=not-a-sort"));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "invalid sort" });
  });

  it("clamps invalid limits", async () => {
    setupList();
    const res = await GET(makeReq("?limit=abc"));
    expect(res.status).toBe(400);
  });
});
