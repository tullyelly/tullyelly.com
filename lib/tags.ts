const TAG_DISPLAY_OVERRIDES: Record<string, string> = {
  doom: "DOOM",
};

export function normalizeTagSlug(tag: string): string {
  return tag.trim().toLowerCase().replace(/\s+/g, "-");
}

export function getDefaultTagHref(tag: string): string {
  const normalized = normalizeTagSlug(tag);
  return `/shaolin/tags/${encodeURIComponent(normalized)}`;
}

export function getKnownTagHref(tag: string): string {
  return getDefaultTagHref(tag);
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

/** Serializable routing metadata; an absent row differs from a disabled link. */
export type TagLinkMetadata = {
  href: string | null;
  hrefKind: string;
  isClickable: boolean;
};

export function resolveTagHref(
  tag: string,
  metadata?: TagLinkMetadata | null,
): string | null {
  if (metadata?.isClickable === false || metadata?.hrefKind === "none") {
    return null;
  }
  return metadata?.href?.trim() || getDefaultTagHref(tag);
}
