"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type HomieTagUsageDatum = {
  tag: string;
  name: string;
  count: number;
  chronicleCount: number;
  href: string;
};

type TooltipPayload = {
  payload?: HomieTagUsageDatum;
};

function UsageTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
}) {
  const row = payload?.[0]?.payload;
  if (!active || !row) return null;

  return (
    <div className="rounded-lg border border-[color:var(--trade-border)] bg-white px-3 py-2 shadow-sm">
      <p className="!m-0 text-sm font-bold text-ink">#{row.tag}</p>
      <p className="!m-0 mt-1 text-xs text-ink/70">
        {row.count} mention{row.count === 1 ? "" : "s"} across{" "}
        {row.chronicleCount} chronicle
        {row.chronicleCount === 1 ? "" : "s"}
      </p>
    </div>
  );
}

export default function HomieTagUsageChart({
  rows,
}: {
  rows: HomieTagUsageDatum[];
}) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No homie tags have been used in published Chronicles yet.
      </p>
    );
  }

  const chartHeight = Math.max(320, rows.length * 48);

  return (
    <div
      className="min-w-0"
      style={{ height: chartHeight }}
      role="img"
      aria-label="Top homie tags by Chronicle mentions"
      data-testid="homie-tag-usage-chart"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={rows}
          layout="vertical"
          margin={{ top: 8, right: 18, bottom: 8, left: 8 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis
            type="number"
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            type="category"
            dataKey="tag"
            width={112}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12 }}
          />
          <Tooltip content={<UsageTooltip />} />
          <Bar
            dataKey="count"
            name="Mentions"
            fill="var(--bucks-green)"
            radius={[0, 8, 8, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
