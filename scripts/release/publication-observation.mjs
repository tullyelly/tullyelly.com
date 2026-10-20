// Publication evidence contains trusted relative paths and fixed labels only.
/** @typedef {"heading-mismatch" | "text-mismatch" | "invalid-date" | "http-status" | "content-type" | "body-too-large" | "carousel-mismatch" | "listing-mismatch" | "asset-missing" | "asset-origin" | "asset-url" | "asset-hash" | "asset-empty" | "asset-too-large"} PublicationCondition */
/** @typedef {{path: string, condition: PublicationCondition, textSampleIndex?: number}} PublicationObservation */
const conditions = new Set([
  "heading-mismatch",
  "text-mismatch",
  "invalid-date",
  "http-status",
  "content-type",
  "body-too-large",
  "carousel-mismatch",
  "listing-mismatch",
  "asset-missing",
  "asset-origin",
  "asset-url",
  "asset-hash",
  "asset-empty",
  "asset-too-large",
]);

/** Revalidate before classification, report storage and summary rendering.
 * Optimized image failures use the trusted underlying asset path, never a query.
 * @param {unknown} value
 * @returns {PublicationObservation | undefined}
 */
export function safePublicationObservation(value) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    return undefined;
  const input = /** @type {Record<string, unknown>} */ (value);
  if (
    typeof input.path !== "string" ||
    input.path.length > 500 ||
    !(
      /^\/shaolin(?:\/[a-z0-9-]+)?$/.test(input.path) ||
      (/^\/images\/[A-Za-z0-9_./-]+$/.test(input.path) &&
        input.path.split("/").every((part) => part !== "." && part !== ".."))
    ) ||
    typeof input.condition !== "string" ||
    !conditions.has(input.condition)
  )
    return undefined;
  return {
    path: input.path,
    condition: /** @type {PublicationCondition} */ (input.condition),
    ...(input.condition === "text-mismatch" &&
    typeof input.textSampleIndex === "number" &&
    Number.isInteger(input.textSampleIndex) &&
    input.textSampleIndex >= 0 &&
    input.textSampleIndex <= 3
      ? { textSampleIndex: input.textSampleIndex }
      : {}),
  };
}
