import type { AlterEgo } from "@/lib/alterEgo";

export const PERSONA_RELEASE_FEEDS = {
  mark2: {
    alterEgo: "mark2",
    displayName: "🧠mark2",
    baseRoute: "/mark2",
    label: "mark2 releases",
    description: "The complete release log for the 🧠mark2 persona.",
  },
  cardattack: {
    alterEgo: "cardattack",
    displayName: "🃏cardattack",
    baseRoute: "/cardattack",
    label: "cardattack releases",
    description: "The complete release log for the 🃏cardattack persona.",
  },
  theabbott: {
    alterEgo: "theabbott",
    displayName: "🪶theabbott",
    baseRoute: "/theabbott",
    label: "theabbott releases",
    description: "The complete release log for the 🪶theabbott persona.",
  },
  unclejimmy: {
    alterEgo: "unclejimmy",
    displayName: "🎙unclejimmy",
    baseRoute: "/unclejimmy",
    label: "unclejimmy releases",
    description: "The complete release log for the 🎙unclejimmy persona.",
  },
  tullyelly: {
    alterEgo: "tullyelly",
    displayName: "⚒️tullyelly",
    baseRoute: "/tullyelly",
    label: "tullyelly releases",
    description: "The complete release log for the ⚒️tullyelly persona.",
  },
} as const satisfies Record<
  string,
  {
    alterEgo: AlterEgo;
    displayName: string;
    baseRoute: `/${string}`;
    label: string;
    description: string;
  }
>;

export type PersonaReleaseFeed = keyof typeof PERSONA_RELEASE_FEEDS;
export type PersonaReleaseOrder = "newest" | "oldest";

export function isPersonaReleaseFeed(value: string): value is PersonaReleaseFeed {
  return Object.hasOwn(PERSONA_RELEASE_FEEDS, value);
}

export function getPersonaReleaseFeed(value: string) {
  return isPersonaReleaseFeed(value) ? PERSONA_RELEASE_FEEDS[value] : null;
}

export function getPersonaReleaseLogHref(
  persona: PersonaReleaseFeed,
  page = 1,
  order: PersonaReleaseOrder = "newest",
): string {
  const base = `${PERSONA_RELEASE_FEEDS[persona].baseRoute}/releases`;
  const query = new URLSearchParams();
  if (page > 1) query.set("page", String(page));
  if (order === "oldest") query.set("order", "oldest");
  const suffix = query.toString();
  return suffix ? `${base}?${suffix}` : base;
}
