/** WU-1263: shared direct-edge contract; only membership is recursive. */
export const RELATIONSHIP_TYPES = [
  "member_of",
  "alias_of",
  "collected_because_of",
] as const;
export type RelationshipType = (typeof RELATIONSHIP_TYPES)[number];
export const COLLECTION_REASON_CODES = [
  "shared_name",
  "favorite_player",
] as const;
export type CollectionReasonCode = (typeof COLLECTION_REASON_CODES)[number];
export type CollectionReason = {
  code: CollectionReasonCode;
  explanation: string;
  [key: string]: unknown;
};
export const RELATIONSHIP_CONTRACT = {
  member_of: { recursive: true, outgoing: "member of", incoming: "members" },
  alias_of: {
    recursive: false,
    outgoing: "canonical person",
    incoming: "alternate names",
  },
  collected_because_of: {
    recursive: false,
    outgoing: "Why I collect this",
    incoming: "Collections inspired by",
  },
} as const;
export function isRelationshipType(value: string): value is RelationshipType {
  return RELATIONSHIP_TYPES.some((type) => type === value);
}
export function isCollectionReasonCode(
  value: unknown,
): value is CollectionReasonCode {
  return COLLECTION_REASON_CODES.some((code) => code === value);
}
/** Fail closed; never silently drop an invalid reason or unknown future code. */
export function readCollectionReasons(
  meta: Record<string, unknown>,
): CollectionReason[] {
  const reasons = meta.reasons;
  if (!Array.isArray(reasons) || reasons.length === 0) {
    throw new Error("collected_because_of requires nonempty meta.reasons");
  }
  const seen = new Set<string>();
  return reasons.map((value: unknown) => {
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
      throw new Error("Each collection reason must be an object");
    }
    const reason = value as Record<string, unknown>;
    if (
      !isCollectionReasonCode(reason.code) ||
      typeof reason.explanation !== "string" ||
      !reason.explanation.trim() ||
      seen.has(reason.code)
    ) {
      throw new Error(
        "Collection reasons need unique supported codes and nonblank explanations",
      );
    }
    seen.add(reason.code);
    return { ...reason, code: reason.code, explanation: reason.explanation };
  });
}
