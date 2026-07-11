import { PERSONA_ACTIVITY_CONFIG } from "@/lib/analytics/config";
import { ACTIVITY_METRICS } from "@/lib/analytics/metrics";
import { zeroFillMetric, toWideChartRows } from "@/lib/analytics/normalize";
import { buildWeeklyPeriods } from "@/lib/analytics/periods";
import type { SerializableSeries } from "@/lib/analytics/types";
import type { PersonaReleaseFeed } from "@/lib/persona-release-feeds";

export async function assemblePersonaActivity(persona: PersonaReleaseFeed, now = new Date()) {
  const config = PERSONA_ACTIVITY_CONFIG[persona];
  const periods = buildWeeklyPeriods(now, config.periods);
  const definitions = config.metricKeys.map((key) => ACTIVITY_METRICS[key]);
  const results = await Promise.all(definitions.map((definition) => definition.loader(periods)));
  const normalized = results.map((points, index) => zeroFillMetric(periods, definitions[index].key, points));
  const [{ loader: _loader, ...series }] = definitions;
  return { config, rows: toWideChartRows(periods, normalized), series: series as SerializableSeries };
}
