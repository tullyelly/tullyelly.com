import "server-only";
import { allPosts } from "contentlayer/generated";
import { getAlterEgoReleaseEntries, type ReleasePostSource } from "@/lib/alter-ego-release-content";
import { periodStartForActivityDate } from "@/lib/analytics/periods";
import type { AnalyticsPeriod, MetricPoint } from "@/lib/analytics/types";
import type { PersonaReleaseFeed } from "@/lib/persona-release-feeds";

export async function loadAlterEgoPostMetric(persona: PersonaReleaseFeed, periods: AnalyticsPeriod[], posts: readonly ReleasePostSource[] = allPosts): Promise<MetricPoint[]> {
  const metricKey = `${persona}-posts`;
  const allowed = new Set(periods.map((period) => period.periodStart));
  const uniquePosts = new Map(getAlterEgoReleaseEntries(persona, posts).map((entry) => [entry.postSlug, entry.postDate]));
  const counts = new Map<string, number>();
  for (const date of uniquePosts.values()) {
    const week = periodStartForActivityDate(date);
    if (allowed.has(week)) counts.set(week, (counts.get(week) ?? 0) + 1);
  }
  return [...counts].map(([periodStart, value]) => ({ periodStart, metricKey, value }));
}
