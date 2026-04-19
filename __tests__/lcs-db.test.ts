/** @jest-environment node */

jest.mock("server-only", () => ({}));

const mockSql = jest.fn();

jest.mock("@/lib/db", () => ({
  sql: (strings: TemplateStringsArray, ...values: unknown[]) =>
    mockSql(strings, values),
}));

import {
  getLcsSummaryFromDb,
  listLcsDaysFromDb,
  listLcsSummariesFromDb,
} from "@/lib/lcs-db";
import { normalizeLcsSlug } from "@/lib/lcs-types";

const mutableEnv = process.env as Record<string, string | undefined>;
const originalNodeEnv = process.env.NODE_ENV;
const originalJestWorkerId = process.env.JEST_WORKER_ID;
const originalSkipDb = process.env.SKIP_DB;
const originalNextPhase = process.env.NEXT_PHASE;

describe("lcs db helpers", () => {
  beforeEach(() => {
    mockSql.mockReset();
    mutableEnv.NODE_ENV = "development";
    delete process.env.JEST_WORKER_ID;
    delete process.env.SKIP_DB;
    delete process.env.NEXT_PHASE;
  });

  afterAll(() => {
    if (originalNodeEnv === undefined) {
      delete mutableEnv.NODE_ENV;
    } else {
      mutableEnv.NODE_ENV = originalNodeEnv;
    }

    if (originalJestWorkerId === undefined) {
      delete process.env.JEST_WORKER_ID;
    } else {
      process.env.JEST_WORKER_ID = originalJestWorkerId;
    }

    if (originalSkipDb === undefined) {
      delete process.env.SKIP_DB;
    } else {
      process.env.SKIP_DB = originalSkipDb;
    }

    if (originalNextPhase === undefined) {
      delete process.env.NEXT_PHASE;
    } else {
      process.env.NEXT_PHASE = originalNextPhase;
    }
  });

  it("normalizes local card shop slugs into kebab-case", () => {
    expect(normalizeLcsSlug(" /Indy Card_Exchange/ ")).toBe(
      "indy-card-exchange",
    );
  });

  it("rejects blank local card shop slugs", () => {
    expect(() => normalizeLcsSlug("   ")).toThrow(
      "LCS lookup: slug must be a non-empty string.",
    );
  });

  it("lists normalized local card shop summaries from the DB", async () => {
    mockSql.mockResolvedValue([
      {
        lcs_slug: "indy-card-exchange",
        lcs_name: "Indy Card Exchange",
        city: "Indianapolis",
        state: "IN",
        rating: "8.70",
        url: "https://indycardexchange.com/",
        first_visit_date: "2026-02-14",
        latest_visit_date: "2026-04-01",
        visit_count: "2",
      },
    ]);

    await expect(listLcsSummariesFromDb()).resolves.toEqual([
      {
        slug: "indy-card-exchange",
        name: "Indy Card Exchange",
        city: "Indianapolis",
        state: "IN",
        rating: 8.7,
        url: "https://indycardexchange.com/",
        firstVisitDate: "2026-02-14",
        latestVisitDate: "2026-04-01",
        visitCount: 2,
      },
    ]);

    const [, values] = mockSql.mock.calls[0] as [
      TemplateStringsArray,
      unknown[],
    ];
    expect(values).toEqual([]);
  });

  it("returns a normalized summary by local card shop slug", async () => {
    mockSql.mockResolvedValue([
      {
        lcs_slug: "indy-card-exchange",
        lcs_name: "Indy Card Exchange",
        city: null,
        state: null,
        rating: "9.00",
        url: null,
        first_visit_date: "2026-02-14",
        latest_visit_date: "2026-03-01",
        visit_count: "2",
      },
    ]);

    await expect(getLcsSummaryFromDb(" /Indy Card Exchange/ ")).resolves.toEqual(
      {
        slug: "indy-card-exchange",
        name: "Indy Card Exchange",
        rating: 9,
        firstVisitDate: "2026-02-14",
        latestVisitDate: "2026-03-01",
        visitCount: 2,
      },
    );

    const [, values] = mockSql.mock.calls[0] as [
      TemplateStringsArray,
      unknown[],
    ];
    expect(values).toEqual(["indy-card-exchange"]);
  });

  it("returns ordered visit-day rows for one local card shop", async () => {
    mockSql.mockResolvedValue([
      {
        visit_date: "2026-02-14",
      },
      {
        visit_date: "2026-03-01",
      },
    ]);

    await expect(listLcsDaysFromDb("indy-card-exchange")).resolves.toEqual([
      {
        visitDate: "2026-02-14",
      },
      {
        visitDate: "2026-03-01",
      },
    ]);

    const [, values] = mockSql.mock.calls[0] as [
      TemplateStringsArray,
      unknown[],
    ];
    expect(values).toEqual(["indy-card-exchange"]);
  });

  it("returns defensive fallbacks when DB access is explicitly skipped", async () => {
    process.env.SKIP_DB = "true";
    mockSql.mockResolvedValue([
      {
        lcs_slug: "should-not-be-read",
        lcs_name: "Should Not Be Read",
        city: null,
        state: null,
        rating: "8.5",
        url: null,
        first_visit_date: null,
        latest_visit_date: null,
        visit_count: "0",
      },
    ]);

    await expect(listLcsSummariesFromDb()).resolves.toEqual([]);
    await expect(getLcsSummaryFromDb("indy-card-exchange")).resolves.toBeNull();
    await expect(listLcsDaysFromDb("indy-card-exchange")).resolves.toEqual([]);
    expect(mockSql).not.toHaveBeenCalled();
  });

  it("falls back cleanly when a DB row contains an out-of-range rating", async () => {
    mockSql.mockResolvedValue([
      {
        lcs_slug: "indy-card-exchange",
        lcs_name: "Indy Card Exchange",
        city: "Indianapolis",
        state: "IN",
        rating: "12.0",
        url: null,
        first_visit_date: "2026-02-14",
        latest_visit_date: "2026-04-01",
        visit_count: "2",
      },
    ]);

    await expect(getLcsSummaryFromDb("indy-card-exchange")).resolves.toBeNull();
  });
});
