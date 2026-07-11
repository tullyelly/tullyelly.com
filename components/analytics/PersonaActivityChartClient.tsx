"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { SerializableChartRow, SerializableSeries } from "@/lib/analytics/types";

type ChartDatum = Omit<SerializableChartRow, "values"> & Record<string, string | number>;
type Props = { rows: SerializableChartRow[]; series: SerializableSeries; label: string };

function ActivityTooltip({ active, payload }: { active?: boolean; payload?: Array<{ dataKey?: string; value?: number; payload?: ChartDatum; name?: string; unit?: string }> }) {
  if (!active || !payload?.[0]?.payload) return null;
  const row = payload[0].payload;
  return <div className="rounded-lg border border-border bg-white px-3 py-2 shadow-sm"><p className="text-sm font-semibold">{row.fullLabel}</p>{payload.map((item) => <p key={item.dataKey} className="text-xs text-muted-foreground">{item.name}: {item.value} {item.unit}</p>)}</div>;
}

export function PersonaActivityChartClient({ rows, series, label }: Props) {
  const data: ChartDatum[] = rows.map(({ values, ...row }) => ({ ...row, ...values }));
  const hasActivity = data.some((row) => Number(row[series.key] ?? 0) > 0);
  if (!hasActivity) return <div role="status" className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">No activity in this 10-week window.</div>;
  return <div className="w-full overflow-hidden" role="img" aria-label={`${label}; 10 weekly periods`} data-testid="persona-activity-chart"><div className="h-[300px] w-full"><ResponsiveContainer width="100%" height="100%"><LineChart data={data} margin={{ top: 12, right: 12, bottom: 16, left: -16 }}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="shortLabel" interval={1} tickLine={false} axisLine={false} tick={{ fontSize: 11 }} /><YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 11 }} /><Tooltip content={<ActivityTooltip />} /><Line type="monotone" dataKey={series.key} name={series.label} unit={series.unit} stroke={series.color} strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} /></LineChart></ResponsiveContainer></div></div>;
}
