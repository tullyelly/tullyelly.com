"use client";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
export function TrafficChart({
  rows,
}: {
  rows: { day: string; views: string | null }[];
}) {
  if (!rows.length)
    return <p role="status">No archived daily values available.</p>;
  const data = rows.map((row) => ({
    day: row.day,
    views:
      row.views !== null && BigInt(row.views) <= BigInt(Number.MAX_SAFE_INTEGER)
        ? Number(row.views)
        : null,
  }));
  return (
    <div
      className="h-[300px] w-full"
      data-testid="archive-traffic-chart"
      role="img"
      aria-label="Daily archived public page views; gaps represent unverified days"
    >
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={data}
          margin={{ top: 12, right: 12, bottom: 16, left: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="day" tick={{ fontSize: 11 }} minTickGap={40} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
          <Tooltip />
          <Line
            dataKey="views"
            name="Archived views"
            stroke="var(--blue)"
            dot={false}
            connectNulls={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
