/** @jest-environment node */

jest.mock("server-only", () => ({}));

const mockSql = jest.fn();

jest.mock("@/lib/db", () => ({
  sql: (strings: TemplateStringsArray, ...values: unknown[]) =>
    mockSql(strings, values),
}));

import {
  getBricksSummaryFromDb,
  listBricksDaysFromDb,
  listBricksSummariesFromDb,
} from "@/lib/bricks-db";
import { normalizeLegoId } from "@/lib/bricks-types";

const mutableEnv = process.env as Record<string, string | undefined>;
const originalNodeEnv = process.env.NODE_ENV;
const originalJestWorkerId = process.env.JEST_WORKER_ID;
const originalSkipDb = process.env.SKIP_DB;
const originalNextPhase = process.env.NEXT_PHASE;

describe("bricks db helpers", () => {
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

  it("rejects blank lego ids", () => {
    expect(() => normalizeLegoId("   ")).toThrow(
      "Bricks lookup: id must be a non-empty string.",
    );
  });

  it("lists normalized bricks summaries from the DB", async () => {
    mockSql.mockResolvedValue([
      {
        subset: "lego",
        lego_id: "10330",
        set_name: "McLaren MP4/4 & Ayrton Senna",
        tag: "f1",
        piece_count: "693",
        review_score: "9.25",
        first_build_date: "2026-04-01",
        latest_build_date: "2026-04-05",
        session_count: "2",
      },
    ]);

    await expect(listBricksSummariesFromDb("lego")).resolves.toEqual([
      {
        subset: "lego",
        legoId: "10330",
        setName: "McLaren MP4/4 & Ayrton Senna",
        tag: "f1",
        pieceCount: 693,
        reviewScore: 9.25,
        firstBuildDate: "2026-04-01",
        latestBuildDate: "2026-04-05",
        sessionCount: 2,
      },
    ]);

    const [, values] = mockSql.mock.calls[0] as [
      TemplateStringsArray,
      unknown[],
    ];
    expect(values).toEqual(["lego"]);
  });

  it("returns a normalized bricks summary by subset and lego id", async () => {
    mockSql.mockResolvedValue([
      {
        subset: "lego",
        lego_id: "10330",
        set_name: "McLaren MP4/4 & Ayrton Senna",
        tag: null,
        piece_count: null,
        review_score: "9.00",
        first_build_date: "2026-04-01",
        latest_build_date: "2026-04-03",
        session_count: "2",
      },
    ]);

    await expect(getBricksSummaryFromDb("lego", " 10330 ")).resolves.toEqual({
      subset: "lego",
      legoId: "10330",
      setName: "McLaren MP4/4 & Ayrton Senna",
      reviewScore: 9,
      firstBuildDate: "2026-04-01",
      latestBuildDate: "2026-04-03",
      sessionCount: 2,
    });

    const [, values] = mockSql.mock.calls[0] as [
      TemplateStringsArray,
      unknown[],
    ];
    expect(values).toEqual(["lego", "10330"]);
  });

  it("returns ordered build-day rows for one lego set", async () => {
    mockSql.mockResolvedValue([
      {
        build_date: "2026-04-01",
        bags: "1-3",
      },
      {
        build_date: "2026-04-03",
        bags: "4-6",
      },
    ]);

    await expect(listBricksDaysFromDb("lego", 10330)).resolves.toEqual([
      {
        buildDate: "2026-04-01",
        bags: "1-3",
      },
      {
        buildDate: "2026-04-03",
        bags: "4-6",
      },
    ]);

    const [, values] = mockSql.mock.calls[0] as [
      TemplateStringsArray,
      unknown[],
    ];
    expect(values).toEqual(["lego", "10330"]);
  });

  it("returns defensive fallbacks when DB access is explicitly skipped", async () => {
    process.env.SKIP_DB = "true";
    mockSql.mockResolvedValue([
      {
        subset: "lego",
        lego_id: "10330",
        set_name: "Should Not Be Read",
        tag: null,
        piece_count: null,
        review_score: "9.0",
        first_build_date: null,
        latest_build_date: null,
        session_count: "0",
      },
    ]);

    await expect(listBricksSummariesFromDb("lego")).resolves.toEqual([]);
    await expect(getBricksSummaryFromDb("lego", "10330")).resolves.toBeNull();
    await expect(listBricksDaysFromDb("lego", "10330")).resolves.toEqual([]);
    expect(mockSql).not.toHaveBeenCalled();
  });
});
