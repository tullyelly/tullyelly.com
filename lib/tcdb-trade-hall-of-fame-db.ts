import "server-only";

import { sql } from "@/lib/db";
import { isNextBuild } from "@/lib/env";

type TcdbTradeHallOfFameInductionRow = {
  set_slug: string;
  set_name: string;
  release_year: number | string;
  manufacturer: string;
  category_tag: string | null;
  trade_id: string;
  partner: string | null;
  inducted_date: string;
  cards_owned: number | string;
  total_cards: number | string;
};

type TcdbTradeHallOfFamerRow = {
  partner: string | null;
  category_tags: string[] | string | null;
  induction_count: number | string;
  latest_inducted_date: string;
};

export type TcdbTradeHallOfFameInduction = {
  setSlug: string;
  setName: string;
  releaseYear: number;
  manufacturer: string;
  categoryTag?: string;
  tradeId: string;
  partner?: string;
  inductedDate: string;
  cardsOwned: number;
  totalCards: number;
};

export type TcdbTradeHallOfFamer = {
  partner?: string;
  categoryTags: string[];
  inductionCount: number;
  latestInductedDate: string;
};

function toInteger(value: number | string): number {
  return typeof value === "number" ? value : Number.parseInt(value, 10);
}

function toOptionalString(value: string | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function toStringArray(value: string[] | string | null | undefined): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => item.trim()).filter(Boolean);
  }

  if (typeof value !== "string") {
    return [];
  }

  return value
    .replace(/^\{|\}$/g, "")
    .split(",")
    .map((item) => item.trim().replace(/^"|"$/g, ""))
    .filter(Boolean);
}

function shouldSkipTcdbTradeHallOfFameDb(): boolean {
  return (
    isNextBuild() ||
    process.env.SKIP_DB === "true" ||
    process.env.JEST_WORKER_ID !== undefined ||
    process.env.NODE_ENV === "test"
  );
}

async function withTcdbTradeHallOfFameDbFallback<T>(
  query: () => Promise<T>,
  fallback: T,
): Promise<T> {
  if (shouldSkipTcdbTradeHallOfFameDb()) {
    return fallback;
  }

  try {
    return await query();
  } catch {
    return fallback;
  }
}

function toTcdbTradeHallOfFameInduction(
  row: TcdbTradeHallOfFameInductionRow,
): TcdbTradeHallOfFameInduction {
  const partner = toOptionalString(row.partner);
  const categoryTag = toOptionalString(row.category_tag);

  return {
    setSlug: row.set_slug,
    setName: row.set_name,
    releaseYear: toInteger(row.release_year),
    manufacturer: row.manufacturer,
    tradeId: row.trade_id,
    inductedDate: row.inducted_date,
    cardsOwned: toInteger(row.cards_owned),
    totalCards: toInteger(row.total_cards),
    ...(categoryTag ? { categoryTag } : {}),
    ...(partner ? { partner } : {}),
  };
}

function toTcdbTradeHallOfFamer(
  row: TcdbTradeHallOfFamerRow,
): TcdbTradeHallOfFamer {
  const partner = toOptionalString(row.partner);

  return {
    categoryTags: toStringArray(row.category_tags),
    inductionCount: toInteger(row.induction_count),
    latestInductedDate: row.latest_inducted_date,
    ...(partner ? { partner } : {}),
  };
}

export async function listTcdbTradeHallOfFameInductionsFromDb(): Promise<
  TcdbTradeHallOfFameInduction[]
> {
  return withTcdbTradeHallOfFameDbFallback(async () => {
    const rows = await sql<TcdbTradeHallOfFameInductionRow>`
      SELECT
        set_slug,
        set_name,
        release_year,
        manufacturer,
        category_tag,
        trade_id,
        partner,
        TO_CHAR(inducted_date, 'YYYY-MM-DD') AS inducted_date,
        cards_owned,
        total_cards
      FROM dojo.v_tcdb_trade_hall_of_fame_induction
      ORDER BY inducted_date DESC, set_name ASC, trade_id DESC
    `;

    return rows.map(toTcdbTradeHallOfFameInduction);
  }, []);
}

export async function listTcdbTradeHallOfFamersFromDb(): Promise<
  TcdbTradeHallOfFamer[]
> {
  return withTcdbTradeHallOfFameDbFallback(async () => {
    const rows = await sql<TcdbTradeHallOfFamerRow>`
      SELECT
        partner,
        category_tags,
        induction_count,
        TO_CHAR(latest_inducted_date, 'YYYY-MM-DD') AS latest_inducted_date
      FROM dojo.v_tcdb_trade_hall_of_famer
      ORDER BY induction_count DESC, latest_inducted_date DESC, partner ASC
    `;

    return rows.map(toTcdbTradeHallOfFamer);
  }, []);
}
