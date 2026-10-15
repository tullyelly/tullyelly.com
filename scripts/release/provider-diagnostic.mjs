// Fixed vocabulary only. Provider messages, hints and suggested commands are data,
// never safe report text. Unknown codes/messages intentionally remain unavailable.
const codes = new Set([
  "api_error",
  "unexpected_error",
  "invalid_arguments",
  "login_required",
  "missing_scope",
  "scope_not_accessible",
  "permission_denied",
  "forbidden",
  "unauthorized",
  "invalid_token",
  "token_expired",
  "project_not_found",
  "not_found",
  "rate_limited",
  "too_many_requests",
  "payment_required",
  "confirmation_required",
  "link_required",
  "not_linked",
  "invalid_project_id",
  "deployment_failed",
  "deploy_failed",
  "build_failed",
  "git_author_not_member",
]);
const messages = new Map([
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

export function safeProviderDiagnostic(value) {
  if (!value || typeof value !== "object") return undefined;
  const safe = {};
  for (const key of ["reason", "code"])
    if (codes.has(value[key])) safe[key] = value[key];
  if (messages.has(value.message)) safe.message = value.message;
  if (
    Number.isInteger(value.httpStatus) &&
    value.httpStatus >= 100 &&
    value.httpStatus <= 599
  )
    safe.httpStatus = value.httpStatus;
  return Object.keys(safe).length ? safe : undefined;
}

export function providerDiagnostic(stdout, stderr) {
  const observed = {};
  for (const stream of [stdout, stderr]) {
    if (typeof stream !== "string") continue;
    const text = stream.slice(0, 16384).replace(/\x1b\[[0-9;]*m/g, "");
    try {
      const payload = JSON.parse(text);
      if (payload && typeof payload === "object") {
        const error =
          payload.error && typeof payload.error === "object"
            ? payload.error
            : payload;
        Object.assign(
          observed,
          safeProviderDiagnostic({
            reason: payload.reason,
            code: error.code,
            httpStatus: error.statusCode ?? error.status,
          }),
        );
      }
    } catch {
      /* Text-mode errors have no trusted structured fields. */
    }
    for (const [label, pattern] of messages)
      if (pattern.test(text)) {
        observed.message = label;
        break;
      }
  }
  return safeProviderDiagnostic(observed);
}
