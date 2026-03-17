const SPECIAL_TAG_DISPLAY: Record<string, string> = {
  doom: "DOOM",
};

export function normalizeTagSlug(tag: string): string {
  return tag.trim().toLowerCase().replace(/\s+/g, "-");
}

export function getTagDisplayName(tag: string): string {
  const normalized = normalizeTagSlug(tag);
  return SPECIAL_TAG_DISPLAY[normalized] ?? normalized;
}

export function getHashtagDisplayName(tag: string): string {
  return `#${getTagDisplayName(tag)}`;
}
