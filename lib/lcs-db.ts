import "server-only";

import { sql } from "@/lib/db";
import { isNextBuild } from "@/lib/env";
import {
  normalizeLcsSlug,
  type LcsDay,
  type LcsSummary,
} from "@/lib/lcs-types";

type LcsSummaryRow = {
  lcs_slug: string;
  lcs_name: string;
  city: string | null;
  state: string | null;
  rating: number | string;
  url: string | null;
  first_visit_date: string | null;
  latest_visit_date: string | null;
  visit_count: number | string;
};

type LcsDayRow = {
  visit_date: string;
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

function toRating(value: number | string): number {
  const parsed = toMaybeNumber(value);

  if (parsed === undefined || parsed < 1 || parsed > 10) {
    throw new Error("LCS DB row is missing a valid rating.");
  }

  return parsed;
}

function shouldSkipLcsDb(): boolean {
  return (
    isNextBuild() ||
    process.env.SKIP_DB === "true" ||
    process.env.JEST_WORKER_ID !== undefined ||
    process.env.NODE_ENV === "test"
  );
}

async function withLcsDbFallback<T>(
  query: () => Promise<T>,
  fallback: T,
): Promise<T> {
  if (shouldSkipLcsDb()) {
    return fallback;
  }

  try {
    return await query();
  } catch {
    return fallback;
  }
}

function toLcsSummary(row: LcsSummaryRow): LcsSummary {
  const city = toOptionalString(row.city);
  const state = toOptionalString(row.state);
  const url = toOptionalString(row.url);
  const firstVisitDate = toOptionalString(row.first_visit_date);
  const latestVisitDate = toOptionalString(row.latest_visit_date);

  return {
    slug: row.lcs_slug,
    name: row.lcs_name,
    rating: toRating(row.rating),
    visitCount: toInteger(row.visit_count),
    ...(city ? { city } : {}),
    ...(state ? { state } : {}),
    ...(url ? { url } : {}),
    ...(firstVisitDate ? { firstVisitDate } : {}),
    ...(latestVisitDate ? { latestVisitDate } : {}),
  };
}

export async function listLcsSummariesFromDb(): Promise<LcsSummary[]> {
  return withLcsDbFallback(async () => {
    const rows = await sql<LcsSummaryRow>`
      SELECT
        header.lcs_slug,
        header.lcs_name,
        header.city,
        header.state,
        header.rating,
        header.url,
        TO_CHAR(MIN(day.visit_date), 'YYYY-MM-DD') AS first_visit_date,
        TO_CHAR(MAX(day.visit_date), 'YYYY-MM-DD') AS latest_visit_date,
        COUNT(day.id) AS visit_count
      FROM dojo.lcs_header AS header
      LEFT JOIN dojo.lcs_day AS day
        ON day.lcs_header_id = header.id
      GROUP BY
        header.id,
        header.lcs_slug,
        header.lcs_name,
        header.city,
        header.state,
        header.rating,
        header.url
      ORDER BY
        MAX(day.visit_date) DESC NULLS LAST,
        header.lcs_name ASC,
        header.lcs_slug ASC
    `;

    return rows.map(toLcsSummary);
  }, []);
}

export async function getLcsSummaryFromDb(
  slug: string | number,
): Promise<LcsSummary | null> {
  const normalizedSlug = normalizeLcsSlug(slug);

  return withLcsDbFallback(async () => {
    const [row] = await sql<LcsSummaryRow>`
      SELECT
        header.lcs_slug,
        header.lcs_name,
        header.city,
        header.state,
        header.rating,
        header.url,
        TO_CHAR(MIN(day.visit_date), 'YYYY-MM-DD') AS first_visit_date,
        TO_CHAR(MAX(day.visit_date), 'YYYY-MM-DD') AS latest_visit_date,
        COUNT(day.id) AS visit_count
      FROM dojo.lcs_header AS header
      LEFT JOIN dojo.lcs_day AS day
        ON day.lcs_header_id = header.id
      WHERE header.lcs_slug = ${normalizedSlug}
      GROUP BY
        header.id,
        header.lcs_slug,
        header.lcs_name,
        header.city,
        header.state,
        header.rating,
        header.url
      LIMIT 1
    `;

    return row ? toLcsSummary(row) : null;
  }, null);
}

export async function listLcsDaysFromDb(
  slug: string | number,
): Promise<LcsDay[]> {
  const normalizedSlug = normalizeLcsSlug(slug);

  return withLcsDbFallback(async () => {
    const rows = await sql<LcsDayRow>`
      SELECT
        TO_CHAR(day.visit_date, 'YYYY-MM-DD') AS visit_date
      FROM dojo.lcs_header AS header
      JOIN dojo.lcs_day AS day
        ON day.lcs_header_id = header.id
      WHERE header.lcs_slug = ${normalizedSlug}
      ORDER BY day.visit_date ASC
    `;

    return rows.map((row) => ({
      visitDate: row.visit_date,
    }));
  }, []);
}
