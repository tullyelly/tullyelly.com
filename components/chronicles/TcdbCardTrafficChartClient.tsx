"use client";

import { useEffect, useId, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ReferenceDot,
  Tooltip,
  ResponsiveContainer,
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

function DayValues({ row }: { row: TcdbCardTrafficDay }) {
  return (
    <>
      <p>
        Sent: {pluralize(row.sent, "card")} across{" "}
        {pluralize(row.sentTradeCount, "trade")}
      </p>
      <p>
        Received: {pluralize(row.received, "card")} across{" "}
        {pluralize(row.receivedTradeCount, "trade")}
      </p>
    </>
  );
}

function DailyData({ rows }: Props) {
  return (
    <details className="mt-3 text-sm">
      <summary className="cursor-pointer py-2">
        Daily card and trade counts
      </summary>
      <ol className="space-y-3" aria-label="Daily traffic data">
        {rows.map((row) => (
          <li key={row.date}>
            <time className="font-semibold" dateTime={row.date}>
              {formatFullDate(row.date)}
              {row.isChronicleDate ? " (chronicle date)" : ""}
            </time>
            <DayValues row={row} />
          </li>
        ))}
      </ol>
    </details>
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
  const selectId = useId();
  const [height, setHeight] = useState(250);
  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const update = () => setHeight(media.matches ? 320 : 250);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  // Recharts owns measurement; only changes in label capacity update React state.
  const [capacity, setCapacity] = useState(3);
  const [selectedDate, setSelectedDate] = useState(
    rows.find((row) => row.isChronicleDate)?.date ?? rows[0]?.date,
  );
  const hasTraffic = rows.some((row) => row.sent > 0 || row.received > 0);
  const data = rows.map(toChartDatum);
  const chronicleDate = data.find((row) => row.isChronicleDate)?.date;
  const selected = data.find((row) => row.date === selectedDate) ?? data[0];
  const tickCount = Math.min(data.length, capacity);
  const ticks = Array.from(
    { length: tickCount },
    (_, index) =>
      data[Math.round((index * (data.length - 1)) / Math.max(1, tickCount - 1))]
        .date,
  );
  const yWidth = Math.max(
    32,
    String(Math.max(...rows.flatMap((row) => [row.sent, row.received])))
      .length *
      8 +
      16,
  );

  if (!hasTraffic)
    return (
      <>
        <EmptyTrafficState rows={rows} />
        <DailyData rows={rows} />
      </>
    );

  return (
    <div className="w-full min-w-0" data-testid="tcdb-card-traffic-chart">
      <div className="h-[250px] w-full min-w-0 md:h-[320px]">
        <ResponsiveContainer
          width="100%"
          height={height}
          minWidth={0}
          onResize={(width) =>
            setCapacity(
              Math.max(
                3,
                Math.min(10, Math.floor((width - yWidth - 40) / 72) + 1),
              ),
            )
          }
        >
          <LineChart
            data={data}
            margin={{ top: 12, right: 28, left: 4, bottom: 4 }}
            accessibilityLayer
            onTouchStart={(_, event) => {
              const touch = event.touches[0];
              if (!touch) return;
              const bounds = event.currentTarget.getBoundingClientRect();
              const plotWidth = bounds.width - yWidth - 4 - 28;
              if (plotWidth <= 0) return;
              const fraction =
                (touch.clientX - bounds.left - yWidth - 4) / plotWidth;
              const index = Math.max(
                0,
                Math.min(
                  data.length - 1,
                  Math.round(fraction * (data.length - 1)),
                ),
              );
              setSelectedDate(data[index].date);
            }}
            onClick={(state) => {
              const index = Number(state.activeTooltipIndex);
              if (state.activeTooltipIndex != null && data[index])
                setSelectedDate(data[index].date);
            }}
          >
            <Tooltip content={() => null} />
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="date"
              ticks={ticks}
              interval={0}
              tickFormatter={formatAxisDate}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12 }}
              height={30}
            />
            <YAxis
              width={yWidth}
              domain={[0, "auto"]}
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12 }}
            />
            {chronicleDate ? (
              <ReferenceLine
                x={chronicleDate}
                stroke="var(--blue)"
                strokeDasharray="4 4"
              />
            ) : null}
            <Line
              type="monotone"
              dataKey="sent"
              name="Sent"
              stroke="var(--bucks-green)"
              strokeWidth={3}
              dot={{ r: 2, strokeWidth: 1 }}
              activeDot={{ r: 5 }}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="received"
              name="Received"
              stroke="var(--blue)"
              strokeDasharray="6 3"
              strokeWidth={3}
              dot={{ r: 2, strokeWidth: 1 }}
              activeDot={{ r: 5 }}
              isAnimationActive={false}
            />
            {selected ? (
              <>
                <ReferenceDot
                  x={selected.date}
                  y={selected.sent}
                  r={5}
                  fill="white"
                  stroke="var(--bucks-green)"
                  strokeWidth={2}
                />
                <ReferenceDot
                  x={selected.date}
                  y={selected.received}
                  r={5}
                  fill="white"
                  stroke="var(--blue)"
                  strokeWidth={2}
                />
              </>
            ) : null}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div
        className="flex flex-wrap gap-x-4 gap-y-1 text-xs"
        aria-label="Chart legend"
      >
        <span>Cards</span>
        <span className="flex items-center gap-1">
          <span className="w-5 border-t-[3px] border-[var(--bucks-green)]" />
          Sent
        </span>
        <span className="flex items-center gap-1">
          <span className="w-5 border-t-[3px] border-dashed border-[var(--blue)]" />
          Received
        </span>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Dashed vertical line: chronicle date.
      </p>
      <label className="mt-3 block text-sm font-medium" htmlFor={selectId}>
        Select a day for exact values
      </label>
      <select
        id={selectId}
        className="mt-1 min-h-11 w-full min-w-0 rounded border border-border bg-white p-2 text-sm"
        value={selected?.date}
        onChange={(event) => setSelectedDate(event.target.value)}
      >
        {data.map((row) => (
          <option key={row.date} value={row.date}>
            {row.fullDateLabel}
          </option>
        ))}
      </select>
      {selected ? (
        <div className="mt-2 text-sm" aria-live="polite" aria-atomic="true">
          <p className="font-semibold">
            {selected.fullDateLabel}
            {selected.isChronicleDate ? " (chronicle date)" : ""}
          </p>
          <DayValues row={selected} />
        </div>
      ) : null}
      <DailyData rows={rows} />
    </div>
  );
}
