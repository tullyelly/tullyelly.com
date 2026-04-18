import "server-only";

import { sql } from "@/lib/db";
import { isNextBuild } from "@/lib/env";

type UspsSummaryRow = {
  city_slug: string;
  city_name: string;
  state: string;
  rating: number | string;
  first_visit_date: string | null;
  latest_visit_date: string | null;
  visit_count: number | string;
};

type UspsDayRow = {
  visit_date: string;
};

export type UspsSummary = {
  citySlug: string;
  cityName: string;
  state: string;
  rating: number;
  firstVisitDate?: string;
  latestVisitDate?: string;
  visitCount: number;
};

export type UspsDay = {
  visitDate: string;
};

export function normalizeUspsCitySlug(citySlug: string): string {
  return citySlug
    .trim()
    .replace(/^\/+/g, "")
    .replace(/\/+$/g, "")
    .toLowerCase();
}

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
    throw new Error("USPS DB row is missing a valid rating.");
  }

  return parsed;
}

function shouldSkipUspsDb(): boolean {
  return (
    isNextBuild() ||
    process.env.SKIP_DB === "true" ||
    process.env.JEST_WORKER_ID !== undefined ||
    process.env.NODE_ENV === "test"
  );
}

async function withUspsDbFallback<T>(
  query: () => Promise<T>,
  fallback: T,
): Promise<T> {
  if (shouldSkipUspsDb()) {
    return fallback;
  }

  try {
    return await query();
  } catch {
    return fallback;
  }
}

function toUspsSummary(row: UspsSummaryRow): UspsSummary {
  const firstVisitDate = toOptionalString(row.first_visit_date);
  const latestVisitDate = toOptionalString(row.latest_visit_date);

  return {
    citySlug: row.city_slug,
    cityName: row.city_name,
    state: row.state,
    rating: toRating(row.rating),
    visitCount: toInteger(row.visit_count),
    ...(firstVisitDate ? { firstVisitDate } : {}),
    ...(latestVisitDate ? { latestVisitDate } : {}),
  };
}

export async function listUspsSummariesFromDb(): Promise<UspsSummary[]> {
  return withUspsDbFallback(async () => {
    const rows = await sql<UspsSummaryRow>`
      SELECT
        header.city_slug,
        header.city_name,
        header.state,
        header.rating,
        TO_CHAR(MIN(day.visit_date), 'YYYY-MM-DD') AS first_visit_date,
        TO_CHAR(MAX(day.visit_date), 'YYYY-MM-DD') AS latest_visit_date,
        COUNT(day.id) AS visit_count
      FROM dojo.usps_header AS header
      LEFT JOIN dojo.usps_day AS day
        ON day.usps_header_id = header.id
      GROUP BY
        header.id,
        header.city_slug,
        header.city_name,
        header.state,
        header.rating
      ORDER BY
        MAX(day.visit_date) DESC NULLS LAST,
        header.state ASC,
        header.city_name ASC,
        header.city_slug ASC
    `;

    return rows.map(toUspsSummary);
  }, []);
}

export async function getUspsSummaryFromDb(
  citySlug: string,
): Promise<UspsSummary | null> {
  const normalizedCitySlug = normalizeUspsCitySlug(citySlug);

  if (!normalizedCitySlug) {
    return null;
  }

  return withUspsDbFallback(async () => {
    const [row] = await sql<UspsSummaryRow>`
      SELECT
        header.city_slug,
        header.city_name,
        header.state,
        header.rating,
        TO_CHAR(MIN(day.visit_date), 'YYYY-MM-DD') AS first_visit_date,
        TO_CHAR(MAX(day.visit_date), 'YYYY-MM-DD') AS latest_visit_date,
        COUNT(day.id) AS visit_count
      FROM dojo.usps_header AS header
      LEFT JOIN dojo.usps_day AS day
        ON day.usps_header_id = header.id
      WHERE header.city_slug = ${normalizedCitySlug}
      GROUP BY
        header.id,
        header.city_slug,
        header.city_name,
        header.state,
        header.rating
      LIMIT 1
    `;

    return row ? toUspsSummary(row) : null;
  }, null);
}

export async function listUspsDaysFromDb(citySlug: string): Promise<UspsDay[]> {
  const normalizedCitySlug = normalizeUspsCitySlug(citySlug);

  if (!normalizedCitySlug) {
    return [];
  }

  return withUspsDbFallback(async () => {
    const rows = await sql<UspsDayRow>`
      SELECT
        TO_CHAR(day.visit_date, 'YYYY-MM-DD') AS visit_date
      FROM dojo.usps_header AS header
      JOIN dojo.usps_day AS day
        ON day.usps_header_id = header.id
      WHERE header.city_slug = ${normalizedCitySlug}
      ORDER BY day.visit_date ASC
    `;

    return rows.map((row) => ({
      visitDate: row.visit_date,
    }));
  }, []);
}
