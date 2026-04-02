export const REVIEW_TYPES = [
  "lcs",
  "table-schema",
  "save-point",
  "golden-age",
] as const;

export type ReviewType = (typeof REVIEW_TYPES)[number];

export type ReviewTypeConfig = {
  slug: ReviewType;
  label: string;
  singularLabel: string;
  collectionPath: string;
  sortOrder: number;
};

export const REVIEW_TYPE_CONFIG: Record<ReviewType, ReviewTypeConfig> = {
  lcs: {
    slug: "lcs",
    label: "Local Card Shops",
    singularLabel: "Card Shop",
    collectionPath: "/cardattack/lcs",
    sortOrder: 10,
  },
  "table-schema": {
    slug: "table-schema",
    label: "Table Schema",
    singularLabel: "Table Schema",
    collectionPath: "/unclejimmy/table-schema",
    sortOrder: 20,
  },
  "save-point": {
    slug: "save-point",
    label: "Save Point",
    singularLabel: "Save Point",
    collectionPath: "/unclejimmy/call-a-save-point",
    sortOrder: 30,
  },
  "golden-age": {
    slug: "golden-age",
    label: "Golden Age",
    singularLabel: "Antique Shop",
    collectionPath: "/unclejimmy/golden-age",
    sortOrder: 40,
  },
};

export function isReviewType(value: string): value is ReviewType {
  return Object.hasOwn(REVIEW_TYPE_CONFIG, value);
}

export function normalizeReviewExternalId(value: string | number): string {
  return String(value).trim();
}

export function getReviewFallbackName(
  type: ReviewType,
  externalId: string,
): string {
  return `${REVIEW_TYPE_CONFIG[type].singularLabel} ${externalId}`;
}
