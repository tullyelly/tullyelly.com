// Provider output is untrusted data. Select error fields only, redact before
// truncation, and re-sanitize at report/summary boundaries. Never publish streams,
// suggested commands, hints, header collections or arbitrary envelopes.
const messageLimit = 600;
const streamLimit = 1024 * 1024;
const classifications = new Map([
  [
    "git-author-access-required",
    /Git author .{1,512} must have access to (?:the )?team/i,
  ],
  [
    "authentication-required",
    /No existing credentials found|The specified token is not valid|Invalid token|Token is expired|You defined .{0,20}--token.{0,20}but its contents are invalid/i,
  ],
  [
    "scope-access-denied",
    /Not authorized: Trying to access resource under scope|You do not have access to (?:the )?(?:team|scope)/i,
  ],
  [
    "project-not-found",
    /Could not retrieve Project Settings|Project not found/i,
  ],
  [
    "prebuilt-target-mismatch",
    /prebuilt.{0,200}(?:target|environment).{0,200}(?:mismatch|does not match)/i,
  ],
  ["build-failed", /Build Failed|build exited with .{0,20}(?:code|status) 1/i],
]);
const errorLine =
  /\b(?:error|failed|failure|denied|forbidden|unauthorized|invalid|unable|cannot|could not|exceed(?:ed|s)?|limit|not authorized|not found|ENOTFOUND|ECONNRESET|ETIMEDOUT)\b/i;
const secretKey =
  "(?:authorization|proxy-authorization|cookie|set-cookie|[a-z0-9_.-]*(?:token|secret|password|passwd|credential|api[_-]?key|private[_-]?key|session)[a-z0-9_.-]*|database[_-]?url|connection[_-]?string)";

/**
 * No token prefixes/hashes are emitted, including for malformed tokens.
 * @param {string} value
 * @param {string[]} secrets
 */
function redactKnownValues(value, secrets) {
  let text = value;
  // Known values and transport encodings must disappear before truncation.
  for (const secret of secrets.filter(
    (s) => typeof s === "string" && s.length,
  )) {
    const variants = new Set([
      secret,
      secret.trim(),
      JSON.stringify(secret).slice(1, -1),
      Buffer.from(secret).toString("base64"),
      Buffer.from(secret).toString("base64url"),
    ]);
    try {
      variants.add(encodeURIComponent(secret));
    } catch {
      /* malformed UTF-16 */
    }
    for (const variant of [...variants]
      .filter(Boolean)
      .sort((a, b) => b.length - a.length)) {
      text = text.split(variant).join("[REDACTED]");
      // Wrapping and process cuts also apply to encoded representations.
      if (variant.length <= 4096) {
        const pattern = [...variant]
          .map((c) => c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
          .join("\\s*");
        text = text.replace(new RegExp(pattern, "g"), "[REDACTED]");
      }
      for (let size = Math.min(variant.length - 1, 4096); size >= 4; size--) {
        if (text.endsWith(variant.slice(0, size)))
          text = `${text.slice(0, -size)}[REDACTED]`;
        if (text.startsWith(variant.slice(-size)))
          text = `[REDACTED]${text.slice(size)}`;
      }
    }
  }
  return text;
}

/** @param {unknown} value @param {{ secrets?: string[] }} [options] */
export function redactProviderMessage(value, { secrets = [] } = {}) {
  if (typeof value !== "string") return undefined;
  let text = redactKnownValues(value, secrets);
  text = text
    .replace(/\x1b\[[0-?]*[ -/]*[@-~]/g, "")
    .replace(
      /-----BEGIN [^-\r\n]*PRIVATE KEY-----[\s\S]*?(?:-----END [^-\r\n]*PRIVATE KEY-----|$)/gi,
      "[REDACTED]",
    )
    .replace(
      /\b(?:proxy-authorization|authorization|set-cookie|cookie)\s*:\s*[^\r\n]*/gi,
      "[REDACTED]",
    )
    .replace(/\b(?:Bearer|Basic)\s+[A-Za-z0-9_~+/.=-]+/gi, "[REDACTED]")
    .replace(/\b[a-z][a-z0-9+.-]*:\/\/[^\s<>"'`]+/gi, "[REDACTED]")
    .replace(/\b[a-z][a-z0-9+.-]*%3a%2f%2f[^\s<>"'`]+/gi, "[REDACTED]")
    .replace(/\b[a-z][a-z0-9+.-]*:\\\/\\\/[^\s<>"'`]+/gi, "[REDACTED]")
    .replace(
      new RegExp(
        `(?:["']?${secretKey}["']?)\\s*[:=]\\s*(?:\\[REDACTED\\]|"(?:\\\\.|[^"\\\\])*"|'(?:\\\\.|[^'\\\\])*'|[^\\s,;\\]}]+)`,
        "gi",
      ),
      "[REDACTED]",
    )
    .replace(
      new RegExp(
        `--${secretKey}\\s+(?:"[^"\\r\\n]*"|'[^'\\r\\n]*'|[^\\s,;]+)`,
        "gi",
      ),
      "[REDACTED]",
    )
    .replace(
      /\b(?:user(?:name)?|uid|pwd|host|server|dbname|database)\s*=\s*(?:"[^"\r\n]*"|'[^'\r\n]*'|[^\s;]+)/gi,
      "[REDACTED]",
    )
    .replace(/\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g, "[REDACTED]")
    .replace(
      /\b(?:gh[pousr]_|github_pat_|vcp_|vercel_)[A-Za-z0-9_]+/gi,
      "[REDACTED]",
    )
    .replace(
      /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g,
      "[REDACTED]",
    )
    // Opaque unlabeled values are omitted, even when not a known credential.
    .replace(/\b[A-Za-z0-9+/-]{24,}={0,2}\b/g, "[REDACTED]")
    .replace(/\b[A-Z0-9]+(?:_[A-Z0-9]+){2,}\b/g, "[REDACTED]")
    .replace(/\b[^\s@]+@[^\s@]+\.[a-z]{2,}\b/gi, "[REDACTED]")
    .replace(/[\x00-\x1f\x7f-\x9f\u202a-\u202e\u2066-\u2069]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!text.replace(/\[REDACTED\]|[^a-z0-9]/gi, "")) return undefined;
  return text.length > messageLimit
    ? `${text.slice(0, messageLimit)} [truncated]`
    : text;
}
function identifier(value, options) {
  if (
    typeof value !== "string" ||
    !/^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/.test(value) ||
    value.length > 80
  )
    return undefined;
  return redactProviderMessage(value, options) === value ? value : undefined;
}
/** @param {{ secrets?: string[] }} [options] */
export function safeProviderDiagnostic(value, options = {}) {
  if (!value || typeof value !== "object") return undefined;
  const safe = {};
  for (const key of ["reason", "code"]) {
    const code = identifier(value[key], options);
    if (code) safe[key] = code;
  }
  const message = redactProviderMessage(value.message, options);
  if (message) safe.message = message;
  if (classifications.has(value.classification))
    safe.classification = value.classification;
  if (
    Number.isInteger(value.httpStatus) &&
    value.httpStatus >= 100 &&
    value.httpStatus <= 599
  )
    safe.httpStatus = value.httpStatus;
  return Object.keys(safe).length ? safe : undefined;
}
// Complete objects throughout bounded streams: pretty JSON after progress and
// JSON-lines both work. Keep only the last 64 envelopes; never publish envelopes.
function jsonObjects(text) {
  const objects = [];
  let start = -1,
    depth = 0,
    quoted = false,
    escaped = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (start < 0) {
      if (c === "{") {
        start = i;
        depth = 1;
        quoted = false;
      }
      continue;
    }
    if (quoted) {
      if (escaped) escaped = false;
      else if (c === "\\") escaped = true;
      else if (c === '"') quoted = false;
    } else if (c === '"') quoted = true;
    else if (c === "{") depth++;
    else if (c === "}" && --depth === 0) {
      if (i - start < 65536) {
        try {
          objects.push(JSON.parse(text.slice(start, i + 1)));
        } catch {
          /* untrusted text */
        }
        if (objects.length > 64) objects.shift();
      }
      start = -1;
    }
    if (start >= 0 && i - start >= 65536) {
      start = -1;
      depth = 0;
    }
  }
  return objects;
}
/** @param {{ secrets?: string[] }} [options] */
export function providerDiagnostic(stdout, stderr, options = {}) {
  const observed = {};
  for (const stream of [stdout, stderr]) {
    if (typeof stream !== "string") continue;
    const text = redactKnownValues(stream, options.secrets ?? [])
      .slice(-streamLimit)
      .replace(/\x1b\[[0-?]*[ -/]*[@-~]/g, "");
    let structuredMessage = false;
    for (const payload of jsonObjects(text)) {
      if (!payload || typeof payload !== "object") continue;
      const error =
        payload.error && typeof payload.error === "object"
          ? payload.error
          : payload;
      if (
        !(
          payload.error ||
          payload.status === "error" ||
          payload.level === "error" ||
          payload.type === "error" ||
          (error.code && error.message)
        )
      )
        continue;
      const message =
        typeof error.message === "string"
          ? error.message
          : typeof payload.error === "string"
            ? payload.error
            : undefined;
      Object.assign(
        observed,
        safeProviderDiagnostic(
          {
            reason: payload.reason,
            code: error.code,
            httpStatus: error.statusCode ?? error.status ?? payload.statusCode,
            message,
          },
          options,
        ),
      );
      if (redactProviderMessage(message, options)) structuredMessage = true;
    }
    // Structured messages win over their JSON spelling and suggested commands.
    if (!structuredMessage) {
      for (const line of text.split(/[\r\n]+/).reverse()) {
        if (
          !errorLine.test(line) ||
          /^\s*[{}\[\]"']/.test(line) ||
          /\b(?:hint|next|command)\s*[:=]/i.test(line)
        )
          continue;
        const message = redactProviderMessage(line, options);
        if (message) {
          observed.message = message;
          const status =
            /\b(?:HTTP(?:\/\d(?:\.\d)?)?\s+|status(?:\s+code)?\s*[:=]?\s*)([45]\d\d)\b/i.exec(
              line,
            );
          if (status) observed.httpStatus = Number(status[1]);
          break;
        }
      }
    }
    for (const [label, pattern] of classifications)
      if (pattern.test(text)) {
        observed.classification = label;
        break;
      }
  }
  return safeProviderDiagnostic(observed, options);
}
