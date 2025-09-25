/** @jest-environment node */
import { getScrollsPage, getScrolls, getScroll } from "@/lib/scrolls";

const mockQuery = jest.fn();

jest.mock("@/db/pool", () => ({
  getPool: () => ({
    query: mockQuery,
  }),
}));

const baseRows = [
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

function setupListQueries(rows = baseRows, total = rows.length) {
  mockQuery.mockImplementation((sql: string, _params?: unknown[]) => {
    if (sql === "SELECT 1") {
      return Promise.resolve({ rows: [] });
    }
    if (sql.includes("COUNT(*)")) {
      return Promise.resolve({ rows: [{ total }] });
    }
    if (sql.includes("FROM dojo.v_shaolin_scrolls") && sql.includes("LIMIT")) {
      return Promise.resolve({ rows });
    }
    throw new Error(`Unexpected SQL in list queries: ${sql}`);
  });
}

describe("lib/scrolls", () => {
  beforeEach(() => {
    mockQuery.mockReset();
  });

  it("returns ISO strings from getScrollsPage", async () => {
    setupListQueries();

    const res = await getScrollsPage({
      limit: 10,
      offset: 0,
      sort: "semver:desc",
    });

    expect(res.items).toHaveLength(1);
    expect(res.items[0].created_at).toBe("2024-01-01T05:06:07.000Z");
    expect(res.items[0].release_date).toBe("2024-01-05");
    expect(res.page.total).toBe(1);
    expect(res.page.sort).toBe("semver:desc");
  });

  it("applies search filters when q is provided", async () => {
    setupListQueries();

    await getScrollsPage({
      limit: 5,
      offset: 0,
      sort: "semver:asc",
      q: "Alpha",
    });

    const itemCall = mockQuery.mock.calls.find(
      ([sql]) => typeof sql === "string" && sql.includes("LIMIT $"),
    );
    expect(itemCall).toBeDefined();
    const [, params] = itemCall!;
    expect(params).toEqual(["%Alpha%", 5, 0]);
    expect(itemCall![0] as string).toContain("WHERE release_name ILIKE");
  });

  it("getScrolls forwards pagination options", async () => {
    setupListQueries();

    await getScrolls({ limit: 1 });

    const itemCall = mockQuery.mock.calls.find(
      ([sql]) => typeof sql === "string" && sql.includes("LIMIT $"),
    );
    expect(itemCall?.[1]).toEqual([1, 0]);
  });

  it("returns scroll details with date normalization", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({
      rows: [
        {
          id: 7,
          release_name: "Gamma",
          release_type: "patch",
          status: "released",
          release_date: "2024-02-02T00:00:00Z",
          label: "Gamma Release",
        },
      ],
    });

    const detail = await getScroll(7);
    expect(detail).toEqual({
      id: "7",
      release_name: "Gamma",
      release_type: "patch",
      status: "released",
      release_date: "2024-02-02",
      label: "Gamma Release",
    });
  });

  it("returns null when scroll not found", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    const detail = await getScroll(999);
    expect(detail).toBeNull();
  });
});
