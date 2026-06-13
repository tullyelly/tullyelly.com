import "server-only";

import { asDateString } from "@/lib/dates";
import { sql } from "@/lib/db";
import { isNextBuild } from "@/lib/env";
import { normalizeSetCollectorSlug } from "@/lib/set-collector-types";

type SetCollectorSummaryRow = {
  id: number | string;
  set_slug: string;
  set_name: string;
  release_year: number | string;
  manufacturer: string;
  tcdb_set_url: string;
  completed_set_photo_path: string | null;
  category_tag: string | null;
  rating: number | string | null;
  total_cards: number | string;
  cards_owned: number | string | null;
  tcdb_trade_id: string | null;
  first_snapshot_date: string | null;
  latest_snapshot_date: string | null;
  snapshot_count: number | string;
};

type SetCollectorSnapshotRow = {
  id: number | string;
  set_collector_header_id: number | string;
  snapshot_date: string;
  cards_owned: number | string;
  total_cards: number | string;
  tcdb_trade_id: string | null;
};

export type SetCollectorSnapshotStats = {
  cardsMissing: number;
  percentComplete: number;
};

export type SetCollectorSummary = {
  id: number;
  setSlug: string;
  setName: string;
  releaseYear: number;
  manufacturer: string;
  tcdbSetUrl: string;
  totalCards: number;
  snapshotCount: number;
  completedSetPhotoPath?: string;
  categoryTag?: string;
  rating?: number;
  cardsOwned?: number;
  cardsMissing?: number;
  percentComplete?: number;
  tcdbTradeId?: string;
  firstSnapshotDate?: string;
  latestSnapshotDate?: string;
};

export type SetCollectorSnapshot = {
  id: number;
  setId: number;
  snapshotDate: string;
  cardsOwned: number;
  totalCards: number;
  cardsMissing: number;
  percentComplete: number;
  tcdbTradeId?: string;
};

function toInteger(value: number | string): number {
  return typeof value === "number" ? value : Number.parseInt(value, 10);
}

function toMaybeInteger(value: number | string | null): number | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  const parsed = typeof value === "number" ? value : Number.parseInt(value, 10);

  return Number.isNaN(parsed) ? undefined : parsed;
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

function toRating(value: number | string | null): number | undefined {
  const parsed = toMaybeNumber(value);

  if (parsed === undefined) {
    return undefined;
  }

  if (parsed < 1 || parsed > 10) {
    throw new Error("Set Collector DB row is missing a valid rating.");
  }

  return parsed;
}

function toSnapshotStats(
  cardsOwned: number,
  totalCards: number,
): SetCollectorSnapshotStats {
  if (cardsOwned < 0 || totalCards <= 0 || cardsOwned > totalCards) {
    throw new Error("Set Collector DB row is missing valid snapshot counts.");
  }

  return {
    cardsMissing: totalCards - cardsOwned,
    percentComplete: Number(((cardsOwned / totalCards) * 100).toFixed(1)),
  };
}

function toTotalCards(value: number | string): number {
  const parsed = toInteger(value);

  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(
      "Set Collector DB row is missing a valid total_cards value.",
    );
  }

  return parsed;
}

function shouldSkipSetCollectorDb(): boolean {
  return (
    isNextBuild() ||
    process.env.SKIP_DB === "true" ||
    process.env.JEST_WORKER_ID !== undefined ||
    process.env.NODE_ENV === "test"
  );
}

async function withSetCollectorDbFallback<T>(
  query: () => Promise<T>,
  fallback: T,
): Promise<T> {
  if (shouldSkipSetCollectorDb()) {
    return fallback;
  }

  try {
    return await query();
  } catch {
    return fallback;
  }
}

function toSetCollectorSummary(
  row: SetCollectorSummaryRow,
): SetCollectorSummary {
  const completedSetPhotoPath = toOptionalString(row.completed_set_photo_path);
  const categoryTag = toOptionalString(row.category_tag);
  const rating = toRating(row.rating);
  const tcdbTradeId = toOptionalString(row.tcdb_trade_id);
  const firstSnapshotDate = toOptionalString(row.first_snapshot_date);
  const latestSnapshotDate = toOptionalString(row.latest_snapshot_date);
  const cardsOwned = toMaybeInteger(row.cards_owned);
  const totalCards = toTotalCards(row.total_cards);
  const stats =
    cardsOwned !== undefined
      ? toSnapshotStats(cardsOwned, totalCards)
      : undefined;

  return {
    id: toInteger(row.id),
    setSlug: row.set_slug,
    setName: row.set_name,
    releaseYear: toInteger(row.release_year),
    manufacturer: row.manufacturer,
    tcdbSetUrl: row.tcdb_set_url,
    totalCards,
    snapshotCount: toInteger(row.snapshot_count),
    ...(completedSetPhotoPath ? { completedSetPhotoPath } : {}),
    ...(categoryTag ? { categoryTag } : {}),
    ...(rating !== undefined ? { rating } : {}),
    ...(cardsOwned !== undefined ? { cardsOwned } : {}),
    ...(stats ? stats : {}),
    ...(tcdbTradeId ? { tcdbTradeId } : {}),
    ...(firstSnapshotDate ? { firstSnapshotDate } : {}),
    ...(latestSnapshotDate ? { latestSnapshotDate } : {}),
  };
}

function toSetCollectorSnapshot(
  row: SetCollectorSnapshotRow,
): SetCollectorSnapshot {
  const tcdbTradeId = toOptionalString(row.tcdb_trade_id);
  const cardsOwned = toInteger(row.cards_owned);
  const totalCards = toTotalCards(row.total_cards);
  const stats = toSnapshotStats(cardsOwned, totalCards);

  return {
    id: toInteger(row.id),
    setId: toInteger(row.set_collector_header_id),
    snapshotDate: row.snapshot_date,
    cardsOwned,
    totalCards,
    ...stats,
    ...(tcdbTradeId ? { tcdbTradeId } : {}),
  };
}

export async function listSetCollectorSummariesFromDb(): Promise<
  SetCollectorSummary[]
> {
  return withSetCollectorDbFallback(async () => {
    const rows = await sql<SetCollectorSummaryRow>`
      WITH collector AS (
        SELECT *
        FROM dojo.v_set_collector_header_snapshot
      ),
      headers AS (
        SELECT DISTINCT ON (collector.set_collector_header_id)
          collector.set_collector_header_id AS id,
          collector.set_slug,
          collector.set_name,
          collector.release_year,
          collector.manufacturer,
          collector.tcdb_set_url,
          collector.completed_set_photo_path,
          collector.category_tag,
          collector.rating,
          collector.total_cards
        FROM collector
        ORDER BY collector.set_collector_header_id
      ),
      latest AS (
        SELECT DISTINCT ON (collector.set_collector_header_id)
          collector.set_collector_header_id,
          collector.cards_owned,
          collector.tcdb_trade_id
        FROM collector
        WHERE collector.set_collector_snapshot_id IS NOT NULL
        ORDER BY
          collector.set_collector_header_id,
          collector.snapshot_date DESC,
          collector.set_collector_snapshot_id DESC
      ),
      stats AS (
        SELECT
          collector.set_collector_header_id,
          MIN(collector.snapshot_date) AS first_snapshot_date,
          MAX(collector.snapshot_date) AS latest_snapshot_date,
          COUNT(collector.set_collector_snapshot_id) AS snapshot_count
        FROM collector
        GROUP BY collector.set_collector_header_id
      )
      SELECT
        headers.id,
        headers.set_slug,
        headers.set_name,
        headers.release_year,
        headers.manufacturer,
        headers.tcdb_set_url,
        headers.completed_set_photo_path,
        headers.category_tag,
        headers.rating,
        headers.total_cards,
        latest.cards_owned,
        latest.tcdb_trade_id,
        TO_CHAR(stats.first_snapshot_date, 'YYYY-MM-DD') AS first_snapshot_date,
        TO_CHAR(stats.latest_snapshot_date, 'YYYY-MM-DD') AS latest_snapshot_date,
        COALESCE(stats.snapshot_count, 0) AS snapshot_count
      FROM headers
      LEFT JOIN latest
        ON latest.set_collector_header_id = headers.id
      LEFT JOIN stats
        ON stats.set_collector_header_id = headers.id
      ORDER BY
        stats.latest_snapshot_date DESC NULLS LAST,
        headers.release_year DESC,
        headers.id DESC
    `;

    return rows.map(toSetCollectorSummary);
  }, []);
}

export async function getSetCollectorSummaryFromDb(
  slug: string | number,
): Promise<SetCollectorSummary | null> {
  const normalizedSlug = normalizeSetCollectorSlug(slug);

  return withSetCollectorDbFallback(async () => {
    const [row] = await sql<SetCollectorSummaryRow>`
      WITH collector AS (
        SELECT *
        FROM dojo.v_set_collector_header_snapshot
        WHERE set_slug = ${normalizedSlug}
      ),
      header AS (
        SELECT DISTINCT ON (collector.set_collector_header_id)
          collector.set_collector_header_id AS id,
          collector.set_slug,
          collector.set_name,
          collector.release_year,
          collector.manufacturer,
          collector.tcdb_set_url,
          collector.completed_set_photo_path,
          collector.category_tag,
          collector.rating,
          collector.total_cards
        FROM collector
        ORDER BY collector.set_collector_header_id
      ),
      latest AS (
        SELECT DISTINCT ON (collector.set_collector_header_id)
          collector.set_collector_header_id,
          collector.cards_owned,
          collector.tcdb_trade_id
        FROM collector
        WHERE collector.set_collector_snapshot_id IS NOT NULL
        ORDER BY
          collector.set_collector_header_id,
          collector.snapshot_date DESC,
          collector.set_collector_snapshot_id DESC
      ),
      stats AS (
        SELECT
          collector.set_collector_header_id,
          MIN(collector.snapshot_date) AS first_snapshot_date,
          MAX(collector.snapshot_date) AS latest_snapshot_date,
          COUNT(collector.set_collector_snapshot_id) AS snapshot_count
        FROM collector
        GROUP BY collector.set_collector_header_id
      )
      SELECT
        header.id,
        header.set_slug,
        header.set_name,
        header.release_year,
        header.manufacturer,
        header.tcdb_set_url,
        header.completed_set_photo_path,
        header.category_tag,
        header.rating,
        header.total_cards,
        latest.cards_owned,
        latest.tcdb_trade_id,
        TO_CHAR(stats.first_snapshot_date, 'YYYY-MM-DD') AS first_snapshot_date,
        TO_CHAR(stats.latest_snapshot_date, 'YYYY-MM-DD') AS latest_snapshot_date,
        COALESCE(stats.snapshot_count, 0) AS snapshot_count
      FROM header
      LEFT JOIN latest
        ON latest.set_collector_header_id = header.id
      LEFT JOIN stats
        ON stats.set_collector_header_id = header.id
      LIMIT 1
    `;

    return row ? toSetCollectorSummary(row) : null;
  }, null);
}

export async function getSetCollectorSummaryForDateFromDb(
  slug: string | number,
  snapshotDate: string,
): Promise<SetCollectorSummary | null> {
  const normalizedSlug = normalizeSetCollectorSlug(slug);
  const normalizedDate = asDateString(snapshotDate);

  if (!normalizedDate || !/^\d{4}-\d{2}-\d{2}$/.test(normalizedDate)) {
    return null;
  }

  return withSetCollectorDbFallback(async () => {
    const [row] = await sql<SetCollectorSummaryRow>`
      WITH collector AS (
        SELECT *
        FROM dojo.v_set_collector_header_snapshot
        WHERE set_slug = ${normalizedSlug}
      ),
      header AS (
        SELECT DISTINCT ON (collector.set_collector_header_id)
          collector.set_collector_header_id AS id,
          collector.set_slug,
          collector.set_name,
          collector.release_year,
          collector.manufacturer,
          collector.tcdb_set_url,
          collector.completed_set_photo_path,
          collector.category_tag,
          collector.rating,
          collector.total_cards
        FROM collector
        ORDER BY collector.set_collector_header_id
      ),
      stats AS (
        SELECT
          collector.set_collector_header_id,
          MIN(collector.snapshot_date) AS first_snapshot_date,
          MAX(collector.snapshot_date) AS latest_snapshot_date,
          COUNT(collector.set_collector_snapshot_id) AS snapshot_count
        FROM collector
        GROUP BY collector.set_collector_header_id
      )
      SELECT
        header.id,
        header.set_slug,
        header.set_name,
        header.release_year,
        header.manufacturer,
        header.tcdb_set_url,
        header.completed_set_photo_path,
        header.category_tag,
        header.rating,
        header.total_cards,
        snapshot.cards_owned,
        snapshot.tcdb_trade_id,
        TO_CHAR(stats.first_snapshot_date, 'YYYY-MM-DD') AS first_snapshot_date,
        TO_CHAR(stats.latest_snapshot_date, 'YYYY-MM-DD') AS latest_snapshot_date,
        COALESCE(stats.snapshot_count, 0) AS snapshot_count
      FROM header
      LEFT JOIN dojo.v_set_collector_header_snapshot AS snapshot
        ON snapshot.set_collector_header_id = header.id
       AND snapshot.snapshot_date = ${normalizedDate}::date
      LEFT JOIN stats
        ON stats.set_collector_header_id = header.id
      LIMIT 1
    `;

    return row ? toSetCollectorSummary(row) : null;
  }, null);
}

export async function listSetCollectorSnapshotsFromDb(
  slug: string | number,
): Promise<SetCollectorSnapshot[]> {
  const normalizedSlug = normalizeSetCollectorSlug(slug);

  return withSetCollectorDbFallback(async () => {
    const rows = await sql<SetCollectorSnapshotRow>`
      SELECT
        collector.set_collector_snapshot_id AS id,
        collector.set_collector_header_id,
        TO_CHAR(collector.snapshot_date, 'YYYY-MM-DD') AS snapshot_date,
        collector.cards_owned,
        collector.total_cards,
        collector.tcdb_trade_id
      FROM dojo.v_set_collector_header_snapshot AS collector
      WHERE collector.set_slug = ${normalizedSlug}
        AND collector.set_collector_snapshot_id IS NOT NULL
      ORDER BY collector.snapshot_date ASC, collector.set_collector_snapshot_id ASC
    `;

    return rows.map(toSetCollectorSnapshot);
  }, []);
}

export async function getLatestSetCollectorSnapshotFromDb(
  slug: string | number,
): Promise<SetCollectorSnapshot | null> {
  const normalizedSlug = normalizeSetCollectorSlug(slug);

  return withSetCollectorDbFallback(async () => {
    const [row] = await sql<SetCollectorSnapshotRow>`
      SELECT
        collector.set_collector_snapshot_id AS id,
        collector.set_collector_header_id,
        TO_CHAR(collector.snapshot_date, 'YYYY-MM-DD') AS snapshot_date,
        collector.cards_owned,
        collector.total_cards,
        collector.tcdb_trade_id
      FROM dojo.v_set_collector_header_snapshot AS collector
      WHERE collector.set_slug = ${normalizedSlug}
        AND collector.set_collector_snapshot_id IS NOT NULL
      ORDER BY collector.snapshot_date DESC, collector.set_collector_snapshot_id DESC
      LIMIT 1
    `;

    return row ? toSetCollectorSnapshot(row) : null;
  }, null);
}
