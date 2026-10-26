"use client";
import { Line, LineChart, Tooltip, XAxis, YAxis } from "recharts";
import {
  formatCategoryCount,
  type RecordedCategorySnapshot,
} from "@/lib/card-categories";

export default function CategoryHistoryChart({
  snapshots,
  metric = "card_count",
}: {
  snapshots: RecordedCategorySnapshot[];
  metric?: "card_count" | "ranking";
}) {
  if (!snapshots.length) return <p>No measurements to chart yet.</p>;
  const isRanking = metric === "ranking";
  if (isRanking && !snapshots.some((row) => typeof row.ranking === "number"))
    return <p>No TCDb rankings recorded yet.</p>;
  return (
    <div
      className="h-24 w-full min-w-0"
      role="img"
      aria-label={
        isRanking
          ? "TCDb ranking by measurement date; lower is better; gaps mean not recorded"
          : "Owned-card count by measurement date; exact values follow in history"
      }
      data-testid={
        isRanking ? "category-ranking-chart" : "category-card-count-chart"
      }
    >
      <LineChart
        responsive
        style={{ width: "100%", height: "100%" }}
        data={snapshots}
        margin={{ top: 8, right: 8, bottom: 6, left: 8 }}
      >
        <XAxis dataKey="measured_on" hide />
        <YAxis
          dataKey={metric}
          reversed={isRanking}
          hide
          domain={["dataMin", "dataMax"]}
        />
        <Tooltip
          formatter={(value) => [
            isRanking
              ? `#${formatCategoryCount(Number(value))}`
              : `${formatCategoryCount(Number(value))} cards`,
            isRanking ? "TCDb rank" : "Owned-card count",
          ]}
        />
        <Line
          type="linear"
          dataKey={metric}
          connectNulls={false}
          stroke="var(--trade-blue)"
          strokeWidth={2.5}
          isAnimationActive={false}
          dot={{ r: 2.75, strokeWidth: 1.5, fill: "var(--trade-off-white)" }}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </div>
  );
}
