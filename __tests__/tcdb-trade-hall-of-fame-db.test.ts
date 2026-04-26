/** @jest-environment node */

import { readFileSync } from "fs";

jest.mock("server-only", () => ({}));

const mockSql = jest.fn();

jest.mock("@/lib/db", () => ({
  sql: (strings: TemplateStringsArray, ...values: unknown[]) =>
    mockSql(strings, values),
}));

import {
  listTcdbTradeHallOfFameInductionsFromDb,
  listTcdbTradeHallOfFamersFromDb,
} from "@/lib/tcdb-trade-hall-of-fame-db";

const mutableEnv = process.env as Record<string, string | undefined>;
const originalNodeEnv = process.env.NODE_ENV;
const originalJestWorkerId = process.env.JEST_WORKER_ID;
const originalSkipDb = process.env.SKIP_DB;
const originalNextPhase = process.env.NEXT_PHASE;

describe("tcdb trade hall of fame db helper", () => {
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

  it("lists normalized trade hall of fame inductions from latest completed snapshots", async () => {
    mockSql.mockResolvedValue([
      {
        set_slug: "1991-92-upper-deck",
        set_name: "1991-92 Upper Deck",
        release_year: "1991",
        manufacturer: "Upper Deck",
        category_tag: "basketball",
        trade_id: "960943",
        partner: " collect-a-set ",
        inducted_date: "2026-01-31",
        cards_owned: "500",
        total_cards: "500",
      },
    ]);

    await expect(listTcdbTradeHallOfFameInductionsFromDb()).resolves.toEqual([
      {
        setSlug: "1991-92-upper-deck",
        setName: "1991-92 Upper Deck",
        releaseYear: 1991,
        manufacturer: "Upper Deck",
        categoryTag: "basketball",
        tradeId: "960943",
        partner: "collect-a-set",
        inductedDate: "2026-01-31",
        cardsOwned: 500,
        totalCards: 500,
      },
    ]);

    const [strings] = mockSql.mock.calls[0] as [TemplateStringsArray, unknown[]];
    const queryText = strings.join("");
    expect(queryText).toContain(
      "FROM dojo.v_tcdb_trade_hall_of_fame_induction",
    );
    expect(queryText).toContain("TO_CHAR(inducted_date, 'YYYY-MM-DD')");
  });

  it("lists hall of famers grouped by partner and induction count", async () => {
    mockSql.mockResolvedValue([
      {
        partner: "collect-a-set",
        category_tags: ["basketball", "football"],
        induction_count: "2",
        latest_inducted_date: "2026-04-10",
      },
      {
        partner: "jamestagli",
        category_tags: ["baseball"],
        induction_count: "1",
        latest_inducted_date: "2026-03-26",
      },
    ]);

    await expect(listTcdbTradeHallOfFamersFromDb()).resolves.toEqual([
      {
        partner: "collect-a-set",
        categoryTags: ["basketball", "football"],
        inductionCount: 2,
        latestInductedDate: "2026-04-10",
      },
      {
        partner: "jamestagli",
        categoryTags: ["baseball"],
        inductionCount: 1,
        latestInductedDate: "2026-03-26",
      },
    ]);

    const [strings] = mockSql.mock.calls[0] as [TemplateStringsArray, unknown[]];
    const queryText = strings.join("");
    expect(queryText).toContain("FROM dojo.v_tcdb_trade_hall_of_famer");
    expect(queryText).toContain(
      "TO_CHAR(latest_inducted_date, 'YYYY-MM-DD')",
    );
    expect(queryText).toContain("ORDER BY induction_count DESC");
  });

  it("counts two completed set events for one partner as two inductions", async () => {
    mockSql.mockResolvedValue([
      {
        partner: "collect-a-set",
        category_tags: "{basketball,football}",
        induction_count: "2",
        latest_inducted_date: "2026-04-10",
      },
    ]);

    await expect(listTcdbTradeHallOfFamersFromDb()).resolves.toEqual([
      {
        partner: "collect-a-set",
        categoryTags: ["basketball", "football"],
        inductionCount: 2,
        latestInductedDate: "2026-04-10",
      },
    ]);
  });

  it("counts unique completed set events instead of trade-day rows", async () => {
    mockSql.mockResolvedValue([]);

    await listTcdbTradeHallOfFamersFromDb();

    const migration = readFileSync(
      "db/migrations/048_create_tcdb_trade_hall_of_fame_views.sql",
      "utf8",
    );
    expect(migration).toContain(
      "CREATE OR REPLACE VIEW dojo.v_tcdb_trade_hall_of_fame_induction",
    );
    expect(migration).toContain(
      "SELECT DISTINCT ON (snapshot.set_collector_header_id)",
    );
    expect(migration).toContain("latest_snapshot.cards_owned = header.total_cards");
    expect(migration).toContain("NULLIF(BTRIM(header.category_tag), '')");
    expect(migration).toContain("day.side IN ('received', 'archived')");
    expect(migration).toContain("GROUP BY\n    header.id");
    expect(migration).toContain(
      "CREATE OR REPLACE VIEW dojo.v_tcdb_trade_hall_of_famer",
    );
    expect(migration).toContain("COUNT(*) AS induction_count");
    expect(migration).toContain("ARRAY_AGG(DISTINCT induction.category_tag");
    expect(migration).toContain(
      "FROM dojo.v_tcdb_trade_hall_of_fame_induction AS induction",
    );
  });

  it("returns defensive fallbacks when DB access is explicitly skipped", async () => {
    process.env.SKIP_DB = "true";

    await expect(listTcdbTradeHallOfFameInductionsFromDb()).resolves.toEqual([]);
    await expect(listTcdbTradeHallOfFamersFromDb()).resolves.toEqual([]);
    expect(mockSql).not.toHaveBeenCalled();
  });

  it("preserves rows with unknown partners for the UI fallback", async () => {
    mockSql.mockResolvedValue([
      {
        set_slug: "1991-92-upper-deck",
        set_name: "1991-92 Upper Deck",
        release_year: "1991",
        manufacturer: "Upper Deck",
        category_tag: null,
        trade_id: "960943",
        partner: null,
        inducted_date: "2026-01-31",
        cards_owned: "500",
        total_cards: "500",
      },
    ]);

    await expect(listTcdbTradeHallOfFameInductionsFromDb()).resolves.toEqual([
      {
        setSlug: "1991-92-upper-deck",
        setName: "1991-92 Upper Deck",
        releaseYear: 1991,
        manufacturer: "Upper Deck",
        tradeId: "960943",
        inductedDate: "2026-01-31",
        cardsOwned: 500,
        totalCards: 500,
      },
    ]);
  });
});
