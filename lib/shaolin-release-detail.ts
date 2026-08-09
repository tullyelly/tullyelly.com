import "server-only";

import { allPosts } from "contentlayer/generated";
import { unstable_noStore as noStore } from "next/cache";

import { getPool } from "@/db/pool";
import { asDateString } from "@/lib/dates";

export type ShaolinActivityType =
  | "chronicle"
  | "chronicle_amendment"
  | "tcdb_trade"
  | "lcs_visit"
  | "usps_visit"
  | "review"
  | "bricks_build"
  | "set_collector";

export type ShaolinReleaseActivity = {
  date: string;
  type: ShaolinActivityType;
  subtype?: string;
  sourceId: string;
  title: string;
  value?: number;
  href?: string;
  metadata: Record<string, unknown>;
};

export type ShaolinReleaseDetail = {
  id: string;
  name: string;
  label: string;
  semver: string;
  status: string;
  releaseType: string;
  releaseDate: string | null;
  activityStartDate: string;
  activityEndDate: string;
  isInProgress: boolean;
  activity: ShaolinReleaseActivity[];
};

type DetailRow = {
  id: string | number;
  release_name: string;
  label: string;
  semver: string;
  status: string;
  release_type: string;
  release_date: string | Date | null;
  activity_start_date: string | Date;
  activity_end_date: string | Date;
  is_in_progress: boolean;
};

type ActivityRow = {
  activity_date: string | Date;
  activity_type: Exclude<
    ShaolinActivityType,
    "chronicle" | "chronicle_amendment"
  >;
  activity_subtype: string | null;
  source_id: string;
  title: string;
  activity_value: number | string | null;
  destination_path: string | null;
  metadata: Record<string, unknown> | null;
};

function toDateString(value: string | Date): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const normalized = asDateString(value);
  if (!normalized) throw new Error("Shaolin release activity has no date.");
  return normalized;
}

const amendmentPattern =
  /<ScrollAmendment\b[^>]*\bdate=(?:"([0-9]{4}-[0-9]{2}-[0-9]{2})"|'([0-9]{4}-[0-9]{2}-[0-9]{2})')[^>]*>/g;

export function listChronicleReleaseActivity(
  startDate: string,
  endDate: string,
): ShaolinReleaseActivity[] {
  const items: ShaolinReleaseActivity[] = [];

  for (const post of allPosts) {
    if (post.draft) continue;
    const postDate = asDateString(post.date);
    if (postDate && postDate >= startDate && postDate <= endDate) {
      items.push({
        date: postDate,
        type: "chronicle",
        sourceId: post.slug,
        title: post.title,
        href: post.url,
        metadata: { summary: post.summary },
      });
    }

    const source = post.body.raw;
    amendmentPattern.lastIndex = 0;
    for (const match of source.matchAll(amendmentPattern)) {
      const amendmentDate = match[1] ?? match[2];
      if (amendmentDate < startDate || amendmentDate > endDate) continue;
      items.push({
        date: amendmentDate,
        type: "chronicle_amendment",
        sourceId: `${post.slug}:${amendmentDate}`,
        title: post.title,
        href: post.url,
        metadata: {},
      });
    }
  }

  return items;
}

function toActivity(row: ActivityRow): ShaolinReleaseActivity {
  const parsedValue =
    row.activity_value == null ? undefined : Number(row.activity_value);
  return {
    date: toDateString(row.activity_date),
    type: row.activity_type,
    ...(row.activity_subtype ? { subtype: row.activity_subtype } : {}),
    sourceId: row.source_id,
    title: row.title,
    ...(parsedValue !== undefined && Number.isFinite(parsedValue)
      ? { value: parsedValue }
      : {}),
    ...(row.destination_path ? { href: row.destination_path } : {}),
    metadata: row.metadata ?? {},
  };
}

export async function getShaolinReleaseDetail(
  id: string | number,
): Promise<ShaolinReleaseDetail | null> {
  noStore();
  const db = getPool();
  const detailResult = await db.query<DetailRow>(
    `SELECT scroll.id, scroll.release_name, scroll.label, scroll.semver,
            scroll.status, scroll.release_type,
            TO_CHAR(scroll.release_date::date, 'YYYY-MM-DD') AS release_date,
            TO_CHAR(release_window.activity_start_date, 'YYYY-MM-DD') AS activity_start_date,
            TO_CHAR(release_window.activity_end_date, 'YYYY-MM-DD') AS activity_end_date,
            release_window.is_in_progress
       FROM dojo.v_shaolin_scrolls scroll
       JOIN dojo.v_shaolin_release_window release_window
         ON release_window.release_id = scroll.id
      WHERE scroll.id = $1
      LIMIT 1`,
    [id],
  );
  const row = detailResult.rows[0];
  if (!row) return null;

  const activityResult = await db.query<ActivityRow>(
    `SELECT TO_CHAR(activity_date, 'YYYY-MM-DD') AS activity_date,
            activity_type, activity_subtype, source_id, title,
            activity_value, destination_path, metadata
       FROM dojo.v_shaolin_release_activity
      WHERE release_id = $1
      ORDER BY activity_date ASC, activity_type ASC, source_id ASC`,
    [id],
  );
  const startDate = toDateString(row.activity_start_date);
  const endDate = toDateString(row.activity_end_date);
  const activity = [
    ...listChronicleReleaseActivity(startDate, endDate),
    ...activityResult.rows.map(toActivity),
  ].sort((left, right) =>
    left.date === right.date
      ? left.title.localeCompare(right.title)
      : left.date.localeCompare(right.date),
  );

  return {
    id: String(row.id),
    name: row.release_name,
    label: row.label,
    semver: row.semver,
    status: row.status,
    releaseType: row.release_type,
    releaseDate: row.release_date ? toDateString(row.release_date) : null,
    activityStartDate: startDate,
    activityEndDate: endDate,
    isInProgress: row.is_in_progress,
    activity,
  };
}
