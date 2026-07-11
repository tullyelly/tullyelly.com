jest.mock("server-only", () => ({}));
jest.mock("contentlayer/generated", () => ({ allPosts: [] }));

import { PERSONA_ACTIVITY_CONFIG } from "@/lib/analytics/config";
import { zeroFillMetric } from "@/lib/analytics/normalize";
import { buildWeeklyPeriods, mondayForDate } from "@/lib/analytics/periods";
import { loadAlterEgoPostMetric } from "@/lib/analytics/providers/posts";

const section = (alterEgo: string) => `<ReleaseSection alterEgo="${alterEgo}">body</ReleaseSection>`;
const post = (slug: string, date: string, raw: string, options: { draft?: boolean; tags?: string[] } = {}) => ({ body: { raw }, slug, url: `/shaolin/${slug}`, date, title: slug, tags: options.tags ?? [], draft: options.draft ?? false });

describe("persona activity analytics", () => {
  it("builds exactly ten chronological Monday weeks in Chicago across a year boundary", () => {
    const periods = buildWeeklyPeriods(new Date("2026-01-01T01:00:00Z"));
    expect(periods).toHaveLength(10);
    expect(periods.at(-1)?.periodStart).toBe("2025-12-29");
    expect(periods[0].periodStart < periods[9].periodStart).toBe(true);
    expect(mondayForDate("2026-01-04")).toBe("2025-12-29");
    expect(mondayForDate("2026-01-05")).toBe("2026-01-05");
  });

  it("uses the Chicago calendar date near a UTC day boundary", () => {
    expect(buildWeeklyPeriods(new Date("2026-07-06T03:00:00Z"), 1)[0].periodStart).toBe("2026-06-29");
  });

  it("zero fills missing periods in stable order", () => {
    const periods = buildWeeklyPeriods(new Date("2026-07-08T12:00:00Z"), 2);
    expect(zeroFillMetric(periods, "posts", [{ periodStart: periods[1].periodStart, metricKey: "posts", value: 2 }]).map((point) => point.value)).toEqual([0, 2]);
  });

  it("counts each matching chronicle once per alter ego and excludes drafts and out-of-window posts", async () => {
    const periods = buildWeeklyPeriods(new Date("2026-07-08T12:00:00Z"), 2);
    const posts = [
      post("multi", "2026-07-07", `${section("cardattack")}${section("cardattack")}${section("tullyelly")}`),
      post("draft", "2026-07-07", section("cardattack"), { draft: true }),
      post("old", "2020-01-01", section("cardattack")),
      post("tag-only", "2026-07-07", "No section", { tags: ["cardattack"] }),
    ];
    const cardattack = await loadAlterEgoPostMetric("cardattack", periods, posts);
    const tullyelly = await loadAlterEgoPostMetric("tullyelly", periods, posts);
    expect(cardattack).toEqual([{ periodStart: "2026-07-06", metricKey: "cardattack-posts", value: 1 }]);
    expect(tullyelly).toEqual([{ periodStart: "2026-07-06", metricKey: "tullyelly-posts", value: 1 }]);
  });

  it("configures only the intended metrics for all five personas", () => {
    expect(Object.keys(PERSONA_ACTIVITY_CONFIG)).toEqual(["mark2", "cardattack", "theabbott", "unclejimmy", "tullyelly"]);
    for (const config of Object.values(PERSONA_ACTIVITY_CONFIG)) expect(config.metricKeys).toHaveLength(1);
  });
});
