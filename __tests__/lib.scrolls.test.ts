/** @jest-environment node */
const rows = [
  {
    id: "1",
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

jest.mock("@/db/pool", () => ({
  getPool: () => ({
    query: (sql: string, params: unknown[] = []) => {
      if (sql.includes("SELECT 1")) {
        return Promise.resolve({ rows: [{ result: 1 }] });
      }
      if (sql.includes("COUNT")) {
        return Promise.resolve({ rows: [{ total: rows.length }] });
      }
      return Promise.resolve({ rows });
    },
  }),
}));

import { getScrollsPage } from "@/lib/scrolls";

describe("getScrollsPage", () => {
  it("returns ISO date strings", async () => {
    const res = await getScrollsPage({
      limit: 10,
      offset: 0,
      sort: "semver:desc",
    });
    expect(res.items[0].created_at).toBe("2024-01-01T05:06:07.000Z");
    expect(typeof res.items[0].created_at).toBe("string");
    expect(res.items[0].release_date).toBe("2024-01-05");
    expect(() => JSON.stringify(res)).not.toThrow();
  });
});
