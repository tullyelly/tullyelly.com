import type { PersonaActivityConfig } from "@/lib/analytics/types";
import type { PersonaReleaseFeed } from "@/lib/persona-release-feeds";

const base = { periods: 10, grain: "week" } as const;
export const PERSONA_ACTIVITY_CONFIG = {
  mark2: { ...base, persona: "mark2", title: "mark2 activity", description: "Published mark2 chronicles over the last 10 weeks.", metricKeys: ["mark2-posts"] },
  cardattack: { ...base, persona: "cardattack", title: "cardattack activity", description: "Published cardattack chronicles over the last 10 weeks.", metricKeys: ["cardattack-posts"] },
  theabbott: { ...base, persona: "theabbott", title: "theabbott activity", description: "Published theabbott chronicles over the last 10 weeks.", metricKeys: ["theabbott-posts"] },
  unclejimmy: { ...base, persona: "unclejimmy", title: "unclejimmy activity", description: "Published unclejimmy chronicles over the last 10 weeks.", metricKeys: ["unclejimmy-posts"] },
  tullyelly: { ...base, persona: "tullyelly", title: "tullyelly activity", description: "Published tullyelly chronicles over the last 10 weeks.", metricKeys: ["tullyelly-posts"] },
} as const satisfies Record<PersonaReleaseFeed, PersonaActivityConfig>;
