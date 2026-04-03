/** @jest-environment node */

jest.mock("server-only", () => ({}));

const mockSql = jest.fn();

jest.mock("@/lib/db", () => ({
  sql: (strings: TemplateStringsArray, ...values: unknown[]) =>
    mockSql(strings, values),
}));

import {
  getReviewSummaryFromDb,
  listReviewReferencesFromDb,
  listReviewSummariesFromDb,
} from "@/lib/review-db";

const mutableEnv = process.env as Record<string, string | undefined>;
const originalNodeEnv = process.env.NODE_ENV;
const originalJestWorkerId = process.env.JEST_WORKER_ID;
const originalSkipDb = process.env.SKIP_DB;
const originalNextPhase = process.env.NEXT_PHASE;

describe("review db helpers", () => {
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

  it("lists normalized review summaries from the DB", async () => {
    mockSql.mockResolvedValue([
      {
        external_id: "little-red-barn",
        name: "Little Red Barn Antiques",
        url: null,
        average_rating: "8.80",
        visit_count: "1",
        latest_post_date: "2026-04-01",
      },
    ]);

    await expect(listReviewSummariesFromDb("golden-age")).resolves.toEqual([
      {
        externalId: "little-red-barn",
        name: "Little Red Barn Antiques",
        averageRating: 8.8,
        visitCount: 1,
        latestPostDate: "2026-04-01",
      },
    ]);

    const [, values] = mockSql.mock.calls[0] as [TemplateStringsArray, unknown[]];
    expect(values).toEqual(["golden-age"]);
  });

  it("returns a normalized subject summary by review type and external id", async () => {
    mockSql.mockResolvedValue([
      {
        external_id: "little-red-barn",
        name: "Little Red Barn Antiques",
        url: null,
        average_rating: "8.80",
        visit_count: "1",
        latest_post_date: "2026-04-01",
      },
    ]);

    await expect(
      getReviewSummaryFromDb("golden-age", " little-red-barn "),
    ).resolves.toEqual({
      externalId: "little-red-barn",
      name: "Little Red Barn Antiques",
      averageRating: 8.8,
      visitCount: 1,
      latestPostDate: "2026-04-01",
    });

    const [, values] = mockSql.mock.calls[0] as [TemplateStringsArray, unknown[]];
    expect(values).toEqual(["golden-age", "little-red-barn"]);
  });

  it("returns normalized review references keyed by post slug and section ordinal", async () => {
    mockSql.mockResolvedValue([
      {
        post_slug: "self-care",
        post_url: "/shaolin/self-care",
        post_date: "2026-04-01",
        post_title: "self care",
        section_ordinal: "1",
        rating_raw: "8.8/10",
        rating_numeric: "8.80",
      },
    ]);

    await expect(
      listReviewReferencesFromDb("golden-age", "little-red-barn"),
    ).resolves.toEqual([
      {
        postSlug: "self-care",
        postUrl: "/shaolin/self-care",
        postDate: "2026-04-01",
        postTitle: "self care",
        sectionOrdinal: 1,
        ratingRaw: "8.8/10",
        ratingNumeric: 8.8,
      },
    ]);

    const [, values] = mockSql.mock.calls[0] as [TemplateStringsArray, unknown[]];
    expect(values).toEqual(["golden-age", "little-red-barn"]);
  });
});
