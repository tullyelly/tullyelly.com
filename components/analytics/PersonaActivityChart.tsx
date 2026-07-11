import { Card } from "@ui";
import { PersonaActivityChartClient } from "@/components/analytics/PersonaActivityChartClient";
import { assemblePersonaActivity } from "@/lib/analytics/assemble";
import { PERSONA_ACTIVITY_CONFIG } from "@/lib/analytics/config";
import type { PersonaReleaseFeed } from "@/lib/persona-release-feeds";

export default async function PersonaActivityChart({ alterEgo }: { alterEgo: PersonaReleaseFeed }) {
  const data = await assemblePersonaActivity(alterEgo);
  return <Card as="section" accent="cream-city-cream" className="space-y-4 p-4 md:p-6" aria-labelledby={`${alterEgo}-activity-title`}><div className="space-y-1"><h1 id={`${alterEgo}-activity-title`} className="text-xl font-semibold md:text-2xl">{data.config.title}</h1><p className="text-sm leading-relaxed text-muted-foreground">{data.config.description}</p></div><PersonaActivityChartClient rows={data.rows} series={data.series} label={data.config.title} /></Card>;
}
