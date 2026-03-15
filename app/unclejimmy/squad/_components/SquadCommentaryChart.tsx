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

type CommentaryDatum = {
  tag_name: string;
  comment_count: number;
};

type Props = {
  rows: CommentaryDatum[];
};

type TooltipPayload = {
  payload?: CommentaryDatum;
  value?: number;
};

function CommentaryTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
}) {
  if (!active || !payload?.[0]?.payload) return null;

  const row = payload[0].payload;

  return (
    <div className="rounded-lg border border-[var(--cream)] bg-white px-3 py-2 shadow-sm">
      <p className="text-sm font-semibold text-foreground">{row.tag_name}</p>
      <p className="text-xs text-muted-foreground">
        {row.comment_count} comment{row.comment_count === 1 ? "" : "s"}
      </p>
    </div>
  );
}

export default function SquadCommentaryChart({ rows }: Props) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No commentary has been logged yet.
      </p>
    );
  }

  const minWidth = Math.max(320, rows.length * 72);

  return (
    <div className="w-full overflow-x-auto">
      <div
        className="h-[360px] min-w-full"
        style={{ minWidth }}
        data-testid="squad-commentary-chart"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={rows}
            margin={{ top: 12, right: 12, left: 0, bottom: 80 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="tag_name"
              angle={-35}
              textAnchor="end"
              interval={0}
              tickMargin={16}
              height={80}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<CommentaryTooltip />} />
            <Bar
              dataKey="comment_count"
              fill="var(--bucks-green)"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
