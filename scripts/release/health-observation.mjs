// Public response correlation only. Never retain URLs, bodies or header collections.
const origins = new Set(["https://tullyelly.com", "https://www.tullyelly.com"]);
const headerPatterns = {
  "x-vercel-id":
    /^[a-z]{3}[0-9](?:::[a-z]{3}[0-9])?::[a-z0-9]{1,16}-[0-9]{10,16}-[a-f0-9]{8,32}$/i,
  "x-vercel-error":
    /^(?:FORBIDDEN|NOT_FOUND|ANOMALY_SCORE_EXCEEDED|DEPLOYMENT_(?:BLOCKED|DELETED|DISABLED|NOT_FOUND|NOT_READY_REDIRECTING|PAUSED)|FUNCTION_INVOCATION_(?:FAILED|TIMEOUT)|TRUSTED_SOURCES_(?:ENVIRONMENT_MISMATCH|OIDC_DISCOVERY_FAILED))$/,
  "x-vercel-mitigated": /^challenge$/,
  "cf-ray": /^[a-f0-9]{16,32}-[A-Z]{3}$/i,
  "cf-mitigated": /^challenge$/,
};

/** @typedef {{origin: string, hop: number, status: number, timestamp: string, headers: Record<string, string>}} HealthResponseObservation */
/** @typedef {{initialOrigin: string, effectiveOrigin: string, responses: HealthResponseObservation[]}} HealthRequestTrace */

/** @param {unknown} value @returns {Record<string, unknown> | undefined} */
function record(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? /** @type {Record<string, unknown>} */ (value)
    : undefined;
}

/** Select individual headers; do not enumerate a Response's headers.
 * @param {{get(name: string): string | null}} headers
 * @param {string[]} [secrets]
 */
export function observeHealthHeaders(headers, secrets = []) {
  return safeHeaders(
    Object.fromEntries(
      Object.keys(headerPatterns).map((name) => [name, headers.get(name)]),
    ),
    secrets,
  );
}

/** @param {unknown} value @param {string[]} [secrets] */
function safeHeaders(value, secrets = []) {
  const input = record(value);
  /** @type {Record<string, string>} */
  const safe = {};
  for (const [name, pattern] of Object.entries(headerPatterns)) {
    const candidate = input?.[name];
    if (
      typeof candidate === "string" &&
      candidate.length <= 160 &&
      pattern.test(candidate) &&
      !secrets.some((secret) => secret && candidate.includes(secret))
    )
      safe[name] = candidate;
  }
  return safe;
}

/** Revalidate at collection, report storage and final rendering boundaries.
 * @param {unknown} value
 * @returns {HealthRequestTrace | undefined}
 */
export function safeHealthRequestTrace(value) {
  const input = record(value);
  if (
    !input ||
    typeof input.initialOrigin !== "string" ||
    !origins.has(input.initialOrigin) ||
    typeof input.effectiveOrigin !== "string" ||
    !origins.has(input.effectiveOrigin) ||
    !Array.isArray(input.responses) ||
    input.responses.length < 1 ||
    input.responses.length > 2
  )
    return undefined;
  /** @type {HealthResponseObservation[]} */
  const responses = [];
  for (const [hop, value] of input.responses.entries()) {
    const response = record(value);
    if (
      !response ||
      response.hop !== hop ||
      response.origin !==
        (hop === 0 ? input.initialOrigin : "https://www.tullyelly.com") ||
      typeof response.status !== "number" ||
      !Number.isInteger(response.status) ||
      response.status < 100 ||
      response.status > 599 ||
      typeof response.timestamp !== "string" ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(
        response.timestamp,
      ) ||
      !Number.isFinite(Date.parse(response.timestamp))
    )
      return undefined;
    responses.push({
      origin: String(response.origin),
      hop,
      status: response.status,
      timestamp: response.timestamp,
      headers: safeHeaders(response.headers),
    });
  }
  if (
    responses.at(-1)?.origin !== input.effectiveOrigin ||
    (responses.length === 2 &&
      ![301, 302, 303, 307, 308].includes(responses[0].status))
  )
    return undefined;
  return {
    initialOrigin: input.initialOrigin,
    effectiveOrigin: input.effectiveOrigin,
    responses,
  };
}
