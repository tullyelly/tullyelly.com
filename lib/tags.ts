const TAG_DISPLAY_OVERRIDES: Record<string, string> = {
  doom: "DOOM",
};

const TAG_HREF_OVERRIDES: Record<string, string> = {
  bonnibel: "/unclejimmy/squad/bonnibel",
  cardattack: "/cardattack",
  eeeeeeeemma: "/unclejimmy/squad/eeeeeeeemma",
  "jeff-meff": "/unclejimmy/squad/jeff-meff",
  lulu: "/unclejimmy/squad/lulu",
  mark2: "/mark2",
  nikkigirl: "/unclejimmy/squad/nikkigirl",
  shaolin: "/shaolin",
  theabbott: "/theabbott",
  tullyelly: "/tullyelly",
  unclejimmy: "/unclejimmy",
};

export function normalizeTagSlug(tag: string): string {
  return tag.trim().toLowerCase().replace(/\s+/g, "-");
}

export function getDefaultTagHref(tag: string): string {
  const normalized = normalizeTagSlug(tag);
  return `/shaolin/tags/${encodeURIComponent(normalized)}`;
}

export function getKnownTagHref(tag: string): string {
  const normalized = normalizeTagSlug(tag);
  return TAG_HREF_OVERRIDES[normalized] ?? getDefaultTagHref(normalized);
}

export function getKnownTagDisplayName(tag: string): string {
  const normalized = normalizeTagSlug(tag);
  return TAG_DISPLAY_OVERRIDES[normalized] ?? normalized;
}

export function getTagDisplayName(tag: string): string {
  return getKnownTagDisplayName(tag);
}

export function getHashtagDisplayName(tag: string): string {
  return `#${getTagDisplayName(tag)}`;
}
