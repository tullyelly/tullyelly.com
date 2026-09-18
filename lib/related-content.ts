export type RelatedContentSource = {
  id: string;
  title: string;
  summary: string;
  date: string;
  href: string;
  tags?: readonly string[];
  persona?: string | null;
  draft?: boolean;
};

export type RelatedContentReason =
  | { type: "tag"; value: string }
  | { type: "persona"; value: string };

export type RelatedContentResult = RelatedContentSource & {
  score: number;
  reasons: RelatedContentReason[];
};

export type RankRelatedContentOptions = {
  limit?: number;
  minimumScore?: number;
};

export const DEFAULT_RELATED_CONTENT_LIMIT = 3;
export const DEFAULT_RELATED_CONTENT_MINIMUM_SCORE = 2;

const TAG_SCORE = 4;
const PERSONA_SCORE = 2;

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase().replace(/\s+/g, " ");
}

function canonicalHref(href: string): string {
  const normalized = href.trim();
  if (normalized === "/") return normalized;
  return normalized.replace(/\/$/, "");
}

function normalizedValues(values: readonly string[] | undefined): Set<string> {
  return new Set((values ?? []).map(normalize).filter(Boolean));
}

function toTimestamp(value: string): number {
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

export function rankRelatedContent(
  current: RelatedContentSource,
  candidates: readonly RelatedContentSource[],
  options: RankRelatedContentOptions = {},
): RelatedContentResult[] {
  const limit = Math.max(
    0,
    Math.floor(options.limit ?? DEFAULT_RELATED_CONTENT_LIMIT),
  );
  const minimumScore =
    options.minimumScore ?? DEFAULT_RELATED_CONTENT_MINIMUM_SCORE;
  if (limit === 0) return [];

  const currentTags = normalizedValues(current.tags);
  const currentPersona = normalize(current.persona ?? "");
  const currentHref = canonicalHref(current.href);
  const byHref = new Map<string, RelatedContentResult>();

  for (const candidate of candidates) {
    const candidateHref = canonicalHref(candidate.href);
    if (
      candidate.draft ||
      candidate.id === current.id ||
      candidateHref === currentHref
    )
      continue;

    const reasons: RelatedContentReason[] = [];
    for (const tag of normalizedValues(candidate.tags)) {
      if (currentTags.has(tag)) reasons.push({ type: "tag", value: tag });
    }
    reasons.sort((a, b) => a.value.localeCompare(b.value));

    const candidatePersona = normalize(candidate.persona ?? "");
    if (currentPersona && candidatePersona === currentPersona) {
      reasons.push({ type: "persona", value: candidatePersona });
    }

    const score = reasons.reduce(
      (total, reason) =>
        total + (reason.type === "tag" ? TAG_SCORE : PERSONA_SCORE),
      0,
    );
    if (score < minimumScore) continue;

    const result = { ...candidate, score, reasons };
    const existing = byHref.get(candidateHref);
    if (!existing || result.score > existing.score)
      byHref.set(candidateHref, result);
  }

  return Array.from(byHref.values())
    .sort(
      (a, b) =>
        b.score - a.score ||
        toTimestamp(b.date) - toTimestamp(a.date) ||
        a.title.localeCompare(b.title) ||
        a.id.localeCompare(b.id),
    )
    .slice(0, limit);
}
