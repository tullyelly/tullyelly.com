/** @jest-environment node */
import type { ReleaseListResponse } from "@/app/api/shaolin-scrolls/route";

const rows = [
  {
    id: "99",
    release_name: "Gamma",
    label: "Gamma",
    status: "planned",
    release_type: "minor",
    semver: "0.2.0",
    sem_major: 0,
    sem_minor: 2,
    sem_patch: 0,
    sem_hotfix: 0,
    created_at: new Date("2024-01-03T00:00:00Z"),
    release_date: "2024-01-07",
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
    end: () => Promise.resolve(),
  }),
}));

import { GET } from "@/app/api/shaolin-scrolls/route";

function makeReq(query = "") {
  return new Request(`http://localhost/api/shaolin-scrolls${query}`);
}

describe("/api/shaolin-scrolls", () => {
  it("returns list payload", async () => {
    const res = await GET(makeReq("?limit=5"));
    expect(res.status).toBe(200);
    const json = (await res.json()) as ReleaseListResponse;
    expect(json.items[0].name).toBe("Gamma");
    expect(json.items[0].release_date).toBe("2024-01-07");
  });
});
