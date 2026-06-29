"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TcdbCardTrafficDay } from "@/lib/tcdb-card-traffic";

type Props = {
  rows: TcdbCardTrafficDay[];
};

type ChartDatum = TcdbCardTrafficDay & {
  axisLabel: string;
  fullDateLabel: string;
};

type TooltipPayload = {
  payload?: ChartDatum;
  value?: number;
};

const MONTH_LABELS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

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

function formatAxisDate(value: string): string {
  const { monthIndex, day } = parseDateParts(value);
  const monthLabel = MONTH_LABELS_SHORT[monthIndex] ?? "";

  return `${monthLabel} ${day}`;
}

function formatFullDate(value: string): string {
  const { year, monthIndex, day } = parseDateParts(value);
  const monthLabel = MONTH_LABELS_LONG[monthIndex] ?? "";

  return `${monthLabel} ${day}, ${year}`;
}

function toChartDatum(row: TcdbCardTrafficDay): ChartDatum {
  return {
    ...row,
    axisLabel: formatAxisDate(row.date),
    fullDateLabel: formatFullDate(row.date),
  };
}

function pluralize(value: number, singular: string): string {
  return `${value} ${singular}${value === 1 ? "" : "s"}`;
}

function TrafficTooltip({
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
      <p className="text-sm font-semibold text-foreground">
        {row.fullDateLabel}
        {row.isChronicleDate ? " (chronicle)" : ""}
      </p>
      <p className="text-xs text-muted-foreground">
        {pluralize(row.cardTotal, "card")} across{" "}
        {pluralize(row.tradeCount, "trade")}
      </p>
    </div>
  );
}

function EmptyTrafficState({ rows }: Props) {
  return (
    <div
      className="rounded-lg border border-dashed border-[var(--cream)] bg-muted/30 p-4"
      role="status"
    >
      <p className="text-sm font-medium text-foreground">
        No TCDb card traffic in this 10-day window.
      </p>
      <ol
        className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground sm:grid-cols-5"
        aria-label="Zero traffic dates"
      >
        {rows.map((row) => (
          <li
            key={row.date}
            className="rounded-md border border-border bg-white px-2 py-1"
          >
            <time dateTime={row.date}>{formatAxisDate(row.date)}</time>: 0
          </li>
        ))}
      </ol>
    </div>
  );
}

export function TcdbCardTrafficChartClient({ rows }: Props) {
  const hasTraffic = rows.some((row) => row.cardTotal > 0);

  if (!hasTraffic) {
    return <EmptyTrafficState rows={rows} />;
  }

  const data = rows.map(toChartDatum);
  const chronicleDate = data.find((row) => row.isChronicleDate)?.date;

  return (
    <div
      className="w-full overflow-x-auto"
      role="img"
      aria-label="TCDb card traffic line chart showing 10 calendar days"
      data-testid="tcdb-card-traffic-chart"
    >
      <div className="h-[320px] min-w-[360px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 20, right: 16, left: 0, bottom: 24 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="date"
              interval={0}
              tickFormatter={formatAxisDate}
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
            <Tooltip content={<TrafficTooltip />} />
            {chronicleDate ? (
              <ReferenceLine
                x={chronicleDate}
                stroke="var(--blue)"
                strokeDasharray="4 4"
              />
            ) : null}
            <Line
              type="monotone"
              dataKey="cardTotal"
              name="Card total"
              stroke="var(--bucks-green)"
              strokeWidth={3}
              dot={{ r: 4, strokeWidth: 2 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
