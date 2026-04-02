import "server-only";

import { isNextBuild } from "@/lib/env";
import { sql } from "@/lib/db";
import { normalizeReviewExternalId, type ReviewType } from "@/lib/review-types";

type ReviewSummaryRow = {
  external_id: string;
  name: string | null;
  url: string | null;
  average_rating: string | number | null;
  visit_count: string | number;
  latest_post_date: string | null;
};

type ReviewReferenceRow = {
  post_slug: string;
  post_url: string;
  post_date: string;
  post_title: string;
  section_ordinal: string | number;
  rating_raw: string | null;
  rating_numeric: string | number | null;
};

export type ReviewDbSummary = {
  externalId: string;
  name?: string;
  url?: string;
  averageRating?: number;
  visitCount: number;
  latestPostDate?: string;
};

export type ReviewDbReference = {
  postSlug: string;
  postUrl: string;
  postDate: string;
  postTitle: string;
  sectionOrdinal: number;
  ratingRaw?: string;
  ratingNumeric?: number;
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

function shouldSkipReviewDb(): boolean {
  return (
    isNextBuild() ||
    process.env.SKIP_DB === "true" ||
    process.env.JEST_WORKER_ID !== undefined ||
    process.env.NODE_ENV === "test"
  );
}

async function withReviewDbFallback<T>(
  query: () => Promise<T>,
  fallback: T,
): Promise<T> {
  if (shouldSkipReviewDb()) {
    return fallback;
  }

  try {
    return await query();
  } catch {
    return fallback;
  }
}

function toReviewDbSummary(row: ReviewSummaryRow): ReviewDbSummary {
  return {
    externalId: row.external_id,
    visitCount: toInteger(row.visit_count),
    ...(toOptionalString(row.name) ? { name: toOptionalString(row.name) } : {}),
    ...(toOptionalString(row.url) ? { url: toOptionalString(row.url) } : {}),
    ...(toMaybeNumber(row.average_rating) !== undefined
      ? { averageRating: toMaybeNumber(row.average_rating) }
      : {}),
    ...(toOptionalString(row.latest_post_date)
      ? { latestPostDate: toOptionalString(row.latest_post_date) }
      : {}),
  };
}

function toReviewDbReference(row: ReviewReferenceRow): ReviewDbReference {
  return {
    postSlug: row.post_slug,
    postUrl: row.post_url,
    postDate: row.post_date,
    postTitle: row.post_title,
    sectionOrdinal: toInteger(row.section_ordinal),
    ...(toOptionalString(row.rating_raw)
      ? { ratingRaw: toOptionalString(row.rating_raw) }
      : {}),
    ...(toMaybeNumber(row.rating_numeric) !== undefined
      ? { ratingNumeric: toMaybeNumber(row.rating_numeric) }
      : {}),
  };
}

export async function listReviewSummariesFromDb(
  reviewType: ReviewType,
): Promise<ReviewDbSummary[]> {
  return withReviewDbFallback(async () => {
    const rows = await sql<ReviewSummaryRow>`
      SELECT
        subject.external_id,
        subject.name,
        subject.url,
        ROUND(AVG(reference.rating_numeric)::numeric, 2) AS average_rating,
        COUNT(reference.id) AS visit_count,
        TO_CHAR(MAX(reference.post_date), 'YYYY-MM-DD') AS latest_post_date
      FROM dojo.review_subject AS subject
      JOIN dojo.review_type AS review_type
        ON review_type.id = subject.review_type_id
      LEFT JOIN dojo.review_reference AS reference
        ON reference.review_subject_id = subject.id
      WHERE review_type.slug = ${reviewType}
      GROUP BY subject.id, subject.external_id, subject.name, subject.url
      ORDER BY
        MAX(reference.post_date) DESC NULLS LAST,
        subject.external_id DESC
    `;

    return rows.map(toReviewDbSummary);
  }, []);
}

export async function getReviewSummaryFromDb(
  reviewType: ReviewType,
  externalId: string | number,
): Promise<ReviewDbSummary | null> {
  const normalizedExternalId = normalizeReviewExternalId(externalId);
  if (!normalizedExternalId) {
    return null;
  }

  return withReviewDbFallback(async () => {
    const [row] = await sql<ReviewSummaryRow>`
      SELECT
        subject.external_id,
        subject.name,
        subject.url,
        ROUND(AVG(reference.rating_numeric)::numeric, 2) AS average_rating,
        COUNT(reference.id) AS visit_count,
        TO_CHAR(MAX(reference.post_date), 'YYYY-MM-DD') AS latest_post_date
      FROM dojo.review_subject AS subject
      JOIN dojo.review_type AS review_type
        ON review_type.id = subject.review_type_id
      LEFT JOIN dojo.review_reference AS reference
        ON reference.review_subject_id = subject.id
      WHERE review_type.slug = ${reviewType}
        AND subject.external_id = ${normalizedExternalId}
      GROUP BY subject.id, subject.external_id, subject.name, subject.url
      LIMIT 1
    `;

    return row ? toReviewDbSummary(row) : null;
  }, null);
}

export async function listReviewReferencesFromDb(
  reviewType: ReviewType,
  externalId: string | number,
): Promise<ReviewDbReference[]> {
  const normalizedExternalId = normalizeReviewExternalId(externalId);
  if (!normalizedExternalId) {
    return [];
  }

  return withReviewDbFallback(async () => {
    const rows = await sql<ReviewReferenceRow>`
      SELECT
        reference.post_slug,
        reference.post_url,
        TO_CHAR(reference.post_date, 'YYYY-MM-DD') AS post_date,
        reference.post_title,
        reference.section_ordinal,
        reference.rating_raw,
        reference.rating_numeric
      FROM dojo.review_reference AS reference
      JOIN dojo.review_subject AS subject
        ON subject.id = reference.review_subject_id
      JOIN dojo.review_type AS review_type
        ON review_type.id = subject.review_type_id
      WHERE review_type.slug = ${reviewType}
        AND subject.external_id = ${normalizedExternalId}
      ORDER BY reference.post_date ASC, reference.section_ordinal ASC
    `;

    return rows.map(toReviewDbReference);
  }, []);
}
