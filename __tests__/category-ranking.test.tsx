import { render, screen } from "@testing-library/react";
import CategoryRankSummary from "@/components/categories/CategoryRankSummary";
import {
  formatCategoryRanking,
  formatCategoryRankChange,
  type CategorySnapshot,
} from "@/lib/card-categories";
const base: CategorySnapshot = {
  category_id: "1",
  name: "Basketball",
  slug: "basketball",
  snapshot_id: "1",
  card_count: 0,
  measured_on: "2026-10-01",
  previous_count: null,
  previous_date: null,
  count_change: null,
  ranking: null,
  previous_ranking: null,
  rank_delta: null,
  trend_rank: null,
  difference: null,
  previous_difference: null,
  diff_delta: null,
  trend_overall: null,
  diff_sign_changed: null,
};
it.each([
  { rank_delta: 40, trend_rank: "up" as const, label: "Up 40 places" },
  { rank_delta: -40, trend_rank: "down" as const, label: "Down 40 places" },
  { rank_delta: 0, trend_rank: "flat" as const, label: "Rank unchanged" },
])(
  "describes chronological rank movement: $label",
  ({ rank_delta, trend_rank, label }) => {
    render(
      <dl>
        <CategoryRankSummary
          snapshot={{
            ...base,
            ranking: 1400,
            previous_ranking: 1400 + rank_delta,
            rank_delta,
            trend_rank,
          }}
        />
      </dl>,
    );
    expect(screen.getAllByText("#1,400").length).toBeGreaterThan(0);
    expect(screen.getByText(label, { exact: false })).toBeInTheDocument();
  },
);
it("distinguishes unrecorded rank and first recorded rank without a flat trend", () => {
  const { rerender } = render(
    <dl>
      <CategoryRankSummary snapshot={base} />
    </dl>,
  );
  expect(screen.getAllByText("Not recorded").length).toBeGreaterThan(0);
  expect(screen.getByText("No rank comparison")).toBeInTheDocument();
  rerender(
    <dl>
      <CategoryRankSummary snapshot={{ ...base, ranking: 1400 }} />
    </dl>,
  );
  expect(screen.getAllByText("#1,400").length).toBeGreaterThan(0);
  expect(screen.queryByText("flat")).not.toBeInTheDocument();
});
it("formats unknowns and a one-place change precisely", () => {
  expect(formatCategoryRanking(undefined)).toBe("Not recorded");
  expect(formatCategoryRankChange(1)).toBe("Up 1 place");
  expect(formatCategoryRankChange(-1)).toBe("Down 1 place");
});

it.each([
  {
    difference: 0,
    previous_difference: -10,
    diff_delta: 10,
    trend_rank: "flat" as const,
    trend_overall: "up" as const,
    diff_sign_changed: true,
    delta: "+10",
    changed: "Yes",
  },
  {
    difference: -10,
    previous_difference: 0,
    diff_delta: -10,
    trend_rank: "flat" as const,
    trend_overall: "down" as const,
    diff_sign_changed: true,
    delta: "-10",
    changed: "Yes",
  },
  {
    difference: 5,
    previous_difference: 5,
    diff_delta: 0,
    trend_rank: "flat" as const,
    trend_overall: "flat" as const,
    diff_sign_changed: false,
    delta: "+0",
    changed: "No",
  },
])(
  "shows the difference, sign crossing, rank and overall trends: %p",
  ({ delta, changed, ...fields }) => {
    const { container } = render(
      <dl>
        <CategoryRankSummary
          snapshot={{
            ...base,
            ranking: 1400,
            previous_ranking: 1400,
            rank_delta: 0,
            ...fields,
          }}
        />
      </dl>,
    );
    const entries = Object.fromEntries(
      [...container.querySelectorAll("dl > div")].map((item) => [
        item.querySelector("dt")?.textContent,
        item.querySelector("dd")?.textContent,
      ]),
    );
    expect(entries["Difference change"]).toBe(delta);
    expect(entries["Difference sign changed"]).toBe(changed);
    expect(entries["Rank trend"]).toContain("flat");
    expect(entries["Overall trend"]).toContain(fields.trend_overall);
  },
);
it("keeps missing difference and overall comparisons unknown", () => {
  const { container } = render(
    <dl>
      <CategoryRankSummary snapshot={base} />
    </dl>,
  );
  expect(container.textContent).not.toContain("flat");
  expect(screen.getAllByText("No difference comparison")).toHaveLength(2);
  expect(screen.getAllByText("No comparison")).toHaveLength(2);
});
