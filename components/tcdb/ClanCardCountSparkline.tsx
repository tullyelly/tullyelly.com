"use client";

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ClanTcdbSnapshotRow } from "@/lib/data/tcdb-clans";

type Props = {
  snapshots: ClanTcdbSnapshotRow[];
};

type ChartDatum = ClanTcdbSnapshotRow & {
  fullDateLabel: string;
};

type TooltipPayload = {
  payload?: ChartDatum;
};

const MONTH_LABELS_LONG = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const integerFormatter = new Intl.NumberFormat("en-US");

function parseDateParts(value: string): {
  year: string;
  monthIndex: number;
  day: number;
} {
  const [year, month, day] = value.split("-");

  return {
    year: year ?? "",
    monthIndex: Number(month) - 1,
    day: Number(day),
  };
}

function formatFullDate(value: string): string {
  const { year, monthIndex, day } = parseDateParts(value);
  const monthLabel = MONTH_LABELS_LONG[monthIndex] ?? "";

  return `${monthLabel} ${day}, ${year}`;
}

function toChartDatum(row: ClanTcdbSnapshotRow): ChartDatum {
  return {
    ...row,
    fullDateLabel: formatFullDate(row.ranking_at),
  };
}

function CardCountTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
}) {
  if (!active || !payload?.[0]?.payload) return null;

  const row = payload[0].payload;

  return (
    <div className="rounded-lg border border-[color:var(--trade-border)] bg-white px-3 py-2 text-xs shadow-sm">
      <p className="font-semibold text-[color:var(--trade-charcoal)]">
        {row.fullDateLabel}
      </p>
      <p className="mt-1 text-[color:var(--trade-muted)]">
        {integerFormatter.format(row.card_count)} cards; rank {row.ranking}
      </p>
    </div>
  );
}

export default function ClanCardCountSparkline({ snapshots }: Props) {
  if (snapshots.length === 0) return null;

  const data = snapshots.map(toChartDatum);

  return (
    <div
      className="h-24 w-full min-w-0"
      role="img"
      aria-label="TCDb total card history across clan sport snapshots"
      data-testid="clan-card-count-sparkline"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 6, left: 8 }}>
          <XAxis dataKey="ranking_at" hide />
          <YAxis dataKey="card_count" hide domain={["dataMin", "dataMax"]} />
          <Tooltip content={<CardCountTooltip />} />
          <Line
            type="monotone"
            dataKey="card_count"
            isAnimationActive={false}
            stroke="var(--trade-blue)"
            strokeWidth={2.5}
            dot={{
              r: 2.75,
              strokeWidth: 1.5,
              fill: "var(--trade-off-white)",
            }}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
