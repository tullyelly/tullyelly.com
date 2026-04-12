import "server-only";

import { sql } from "@/lib/db";
import { isNextBuild } from "@/lib/env";
import { normalizeLegoId, type BricksSubset } from "@/lib/bricks-types";

type BricksSummaryRow = {
  subset: BricksSubset;
  lego_id: string;
  set_name: string;
  tag: string | null;
  piece_count: number | string | null;
  review_score: number | string;
  first_build_date: string | null;
  latest_build_date: string | null;
  session_count: number | string;
};

type BricksDayRow = {
  build_date: string;
  bags: string;
};

export type BricksSummary = {
  subset: BricksSubset;
  legoId: string;
  setName: string;
  tag?: string;
  pieceCount?: number;
  reviewScore: number;
  firstBuildDate?: string;
  latestBuildDate?: string;
  sessionCount: number;
};

export type BricksDay = {
  buildDate: string;
  bags: string;
};

function toInteger(value: number | string): number {
  return typeof value === "number" ? value : Number.parseInt(value, 10);
}

function toMaybeNumber(value: number | string | null): number | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  const parsed =
    typeof value === "number" ? value : Number.parseFloat(String(value));

  return Number.isNaN(parsed) ? undefined : parsed;
}

function toOptionalString(value: string | null): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function shouldSkipBricksDb(): boolean {
  return (
    isNextBuild() ||
    process.env.SKIP_DB === "true" ||
    process.env.JEST_WORKER_ID !== undefined ||
    process.env.NODE_ENV === "test"
  );
}

async function withBricksDbFallback<T>(
  query: () => Promise<T>,
  fallback: T,
): Promise<T> {
  if (shouldSkipBricksDb()) {
    return fallback;
  }

  try {
    return await query();
  } catch {
    return fallback;
  }
}

function toBricksSummary(row: BricksSummaryRow): BricksSummary {
  const reviewScore = toMaybeNumber(row.review_score);

  if (reviewScore === undefined) {
    throw new Error("Bricks DB row is missing a valid review_score.");
  }

  return {
    subset: row.subset,
    legoId: row.lego_id,
    setName: row.set_name,
    reviewScore,
    sessionCount: toInteger(row.session_count),
    ...(toOptionalString(row.tag) ? { tag: toOptionalString(row.tag) } : {}),
    ...(toMaybeNumber(row.piece_count) !== undefined
      ? { pieceCount: toMaybeNumber(row.piece_count) }
      : {}),
    ...(toOptionalString(row.first_build_date)
      ? { firstBuildDate: toOptionalString(row.first_build_date) }
      : {}),
    ...(toOptionalString(row.latest_build_date)
      ? { latestBuildDate: toOptionalString(row.latest_build_date) }
      : {}),
  };
}

export async function listBricksSummariesFromDb(
  subset: BricksSubset,
): Promise<BricksSummary[]> {
  return withBricksDbFallback(async () => {
    const rows = await sql<BricksSummaryRow>`
      SELECT
        header.subset,
        header.lego_id,
        header.set_name,
        header.tag,
        header.piece_count,
        header.review_score,
        TO_CHAR(MIN(day.build_date), 'YYYY-MM-DD') AS first_build_date,
        TO_CHAR(MAX(day.build_date), 'YYYY-MM-DD') AS latest_build_date,
        COUNT(day.id) AS session_count
      FROM dojo.bricks_header AS header
      LEFT JOIN dojo.bricks_day AS day
        ON day.bricks_header_id = header.id
      WHERE header.subset = ${subset}
      GROUP BY
        header.id,
        header.subset,
        header.lego_id,
        header.set_name,
        header.tag,
        header.piece_count,
        header.review_score
      ORDER BY
        MAX(day.build_date) DESC NULLS LAST,
        header.lego_id DESC
    `;

    return rows.map(toBricksSummary);
  }, []);
}

export async function getBricksSummaryFromDb(
  subset: BricksSubset,
  legoId: string | number,
): Promise<BricksSummary | null> {
  const normalizedLegoId = normalizeLegoId(legoId);

  return withBricksDbFallback(async () => {
    const [row] = await sql<BricksSummaryRow>`
      SELECT
        header.subset,
        header.lego_id,
        header.set_name,
        header.tag,
        header.piece_count,
        header.review_score,
        TO_CHAR(MIN(day.build_date), 'YYYY-MM-DD') AS first_build_date,
        TO_CHAR(MAX(day.build_date), 'YYYY-MM-DD') AS latest_build_date,
        COUNT(day.id) AS session_count
      FROM dojo.bricks_header AS header
      LEFT JOIN dojo.bricks_day AS day
        ON day.bricks_header_id = header.id
      WHERE header.subset = ${subset}
        AND header.lego_id = ${normalizedLegoId}
      GROUP BY
        header.id,
        header.subset,
        header.lego_id,
        header.set_name,
        header.tag,
        header.piece_count,
        header.review_score
      LIMIT 1
    `;

    return row ? toBricksSummary(row) : null;
  }, null);
}

export async function listBricksDaysFromDb(
  subset: BricksSubset,
  legoId: string | number,
): Promise<BricksDay[]> {
  const normalizedLegoId = normalizeLegoId(legoId);

  return withBricksDbFallback(async () => {
    const rows = await sql<BricksDayRow>`
      SELECT
        TO_CHAR(day.build_date, 'YYYY-MM-DD') AS build_date,
        day.bags
      FROM dojo.bricks_header AS header
      JOIN dojo.bricks_day AS day
        ON day.bricks_header_id = header.id
      WHERE header.subset = ${subset}
        AND header.lego_id = ${normalizedLegoId}
      ORDER BY day.build_date ASC
    `;

    return rows.map((row) => ({
      buildDate: row.build_date,
      bags: row.bags,
    }));
  }, []);
}
