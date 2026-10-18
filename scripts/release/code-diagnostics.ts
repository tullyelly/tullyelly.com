/** Fixed structure and bounded redacted provider errors; never serialize exceptions. */
import { z } from "zod";
import { codeInvariants, codeDiagnosticFields } from "./code-invariants.mjs";
import {
  safeHealthRequestTrace,
  type HealthRequestTrace,
} from "./health-observation.mjs";
import {
  providerDiagnostic,
  safeProviderDiagnostic,
} from "./provider-diagnostic.mjs";
import {
  GitHubApiError,
  ReleaseVerificationError,
  safeNetworkCauseCodes,
} from "./app";
export const guards = [
  "configuration",
  "manifest.validation",
  "api.request",
  "github.child-dispatch",
  "github.environment",
  "github.main-rules",
  "github.main-response",
  "github.main-binding",
  "github.application-binding",
  "human.approval",
  "vercel.project",
  "vercel.git-hooks",
  "vercel.aliases",
  "vercel.history",
  "vercel.environment",
  "vercel.deployment",
  "production.check",
  "vercel.auth-rest",
  "vercel.auth-cli",
  "vercel.stage",
  "vercel.promote",
  "vercel.rollback",
  "vercel.lookup",
  "vercel.identity",
  "health.staged",
  "health.public",
  "build.configuration",
  "build.production",
  "artifact.validation",
  "artifact.package",
  "artifact.executor",
] as const;
export type Guard = (typeof guards)[number];
export const operations = [
  "github.environment",
  "github.environment-policies",
  "github.main",
  "github.rules",
  "github.ci-workflow",
  "github.ci-runs",
  "github.ci-checks",
  "vercel.project",
  "vercel.alias",
  "vercel.history",
  "vercel.environment",
  "vercel.deployment",
  "vercel.auth-rest",
  "vercel.auth-cli",
  "vercel.user",
  "vercel.team",
  "vercel.stage",
  "vercel.promote",
  "vercel.rollback",
  "unknown",
] as const;
export type Operation = (typeof operations)[number];
const fields = new Set(codeDiagnosticFields);
const issueCodes = new Set([
  "missing",
  "invalid_type",
  "invalid_value",
  "unrecognized_keys",
  "too_big",
  "too_small",
  "invalid_format",
  "invalid_union",
  "invalid_key",
  "invalid_element",
  "custom",
  "not_multiple_of",
]);
const invariants = new Set(codeInvariants);
const knownMessages = new Map([
  [
    "Staged deployment identity, approved build, disabled collection or readiness mismatch",
    "code.deployment-identity",
  ],
  ["Vercel project/team mismatch", "code.project-identity"],
  ["Vercel project settings drift", "code.project-settings-drift"],
  [
    "Vercel Git integration is still connected; automatic deployments can bypass release approval",
    "code.project-git-linked",
  ],
]);
const healthPaths = ["/", "/shaolin", "/stats", "/api/health"] as const;
const healthConditions = [
  "http-status",
  "missing-doctype",
  "health-not-ok",
] as const;
type HealthObservation = {
  path: (typeof healthPaths)[number];
  condition: (typeof healthConditions)[number];
  request?: HealthRequestTrace;
};
export type Diagnostic = {
  guard: Guard;
  operation?: Operation;
  category:
    | "http"
    | "transport"
    | "json"
    | "validation"
    | "invariant"
    | "configuration"
    | "process"
    | "unknown";
  exitStatus?: number | null;
  signal?: string | null;
  spawnErrorCode?: string;
  processCategory?: "spawn" | "signal" | "exit";
  provider?: {
    reason?: string;
    code?: string;
    message?: string;
    classification?: string;
    httpStatus?: number;
  };
  originalFailure?: Diagnostic;
  reconciliation?: "not-found" | "failed";
  reconciliationFailure?: Diagnostic;
  status?: number;
  health?: HealthObservation;
  networkCauseCodes?: string[];
  invariant?: string;
  fields?: { path: string; code: string }[];
};
export class CodeDiagnosticError extends Error {
  constructor(readonly diagnostic: Diagnostic) {
    super("code.guard-failed");
  }
}
/** Fixed probe observations and allowlisted public correlation; no response content. */
export class CodeHealthError extends Error {
  readonly health: HealthObservation;
  constructor(
    path: HealthObservation["path"],
    readonly status: number,
    condition: HealthObservation["condition"],
    request?: HealthRequestTrace,
  ) {
    super("code.health-page");
    this.health = { path, condition, ...(request ? { request } : {}) };
  }
}
function classifyRaw(guard: Guard, error: unknown): Diagnostic {
  if (error instanceof CodeDiagnosticError) return error.diagnostic;
  if (error instanceof CodeHealthError)
    return {
      guard,
      category: "invariant",
      invariant: "code.health-page",
      status: error.status,
      health: error.health,
    };
  if (error instanceof SyntaxError) return { guard, category: "json" };
  if (error instanceof z.ZodError)
    return {
      guard,
      category: "validation",
      fields: error.issues.slice(0, 8).map((i) => ({
        path: i.path
          .slice(0, 8)
          .map((p) =>
            typeof p === "number"
              ? "[]"
              : typeof p === "string" && fields.has(p)
                ? p
                : "<field>",
          )
          .join("."),
        code: issueCodes.has(i.code) ? i.code : "validation",
      })),
    };
  const api =
    error instanceof ReleaseVerificationError ? error.apiFailure : error;
  if (api instanceof GitHubApiError)
    return {
      guard,
      category: api.classification === "transport" ? "transport" : "http",
      ...(api.status === undefined ? {} : { status: api.status }),
      networkCauseCodes: api.networkCauseCodes,
    };
  if (error instanceof Error) {
    const invariant = invariants.has(error.message)
      ? error.message
      : knownMessages.get(error.message);
    if (invariant) return { guard, category: "invariant", invariant };
  }
  return { guard, category: "unknown" };
}
export function classifyCodeFailure(guard: Guard, error: unknown): Diagnostic {
  return sanitizeDiagnostic(guard, error, 0);
}
function sanitizeDiagnostic(
  guard: Guard,
  error: unknown,
  depth: number,
): Diagnostic {
  try {
    const d = classifyRaw(guard, error);
    const safe: Diagnostic = {
      guard: guards.includes(d.guard) ? d.guard : "production.check",
      category: [
        "http",
        "transport",
        "json",
        "validation",
        "invariant",
        "configuration",
        "process",
        "unknown",
      ].includes(d.category)
        ? d.category
        : "unknown",
    };
    if (
      d.exitStatus === null ||
      (Number.isInteger(d.exitStatus) &&
        typeof d.exitStatus === "number" &&
        d.exitStatus >= 0 &&
        d.exitStatus <= 255)
    )
      safe.exitStatus = d.exitStatus;
    if (
      d.signal === null ||
      ["SIGTERM", "SIGKILL", "SIGINT", "SIGABRT", "SIGSEGV", "SIGBUS"].includes(
        d.signal ?? "",
      )
    )
      safe.signal = d.signal;
    if (
      [
        "ENOENT",
        "EACCES",
        "EPERM",
        "EINVAL",
        "ETIMEDOUT",
        "ENOBUFS",
        "E2BIG",
      ].includes(d.spawnErrorCode ?? "")
    )
      safe.spawnErrorCode = d.spawnErrorCode;
    if (
      d.processCategory &&
      ["spawn", "signal", "exit"].includes(d.processCategory)
    )
      safe.processCategory = d.processCategory;
    if (d.reconciliation === "not-found" || d.reconciliation === "failed")
      safe.reconciliation = d.reconciliation;
    const provider = safeProviderDiagnostic(d.provider);
    if (provider) safe.provider = provider;
    if (depth < 1) {
      for (const key of ["originalFailure", "reconciliationFailure"] as const) {
        if (d[key])
          safe[key] = sanitizeDiagnostic(
            guard,
            new CodeDiagnosticError(d[key]),
            depth + 1,
          );
      }
    }
    if (d.operation && operations.includes(d.operation))
      safe.operation = d.operation;
    if (
      typeof d.status === "number" &&
      Number.isInteger(d.status) &&
      d.status >= 100 &&
      d.status <= 599
    )
      safe.status = d.status;
    if (
      d.health &&
      healthPaths.includes(d.health.path) &&
      healthConditions.includes(d.health.condition)
    ) {
      const request = safeHealthRequestTrace(d.health.request);
      safe.health = {
        path: d.health.path,
        condition: d.health.condition,
        ...(request ? { request } : {}),
      };
    }
    if (
      d.invariant &&
      (invariants.has(d.invariant) ||
        [...knownMessages.values()].includes(d.invariant))
    )
      safe.invariant = d.invariant;
    if (d.networkCauseCodes)
      safe.networkCauseCodes = safeNetworkCauseCodes({
        errors: d.networkCauseCodes.slice(0, 16).map((code) => ({ code })),
      });
    if (d.fields)
      safe.fields = d.fields.slice(0, 8).map((f) => ({
        path: f.path
          .split(".")
          .slice(0, 8)
          .map((p) => (fields.has(p) || p === "[]" ? p : "<field>"))
          .join("."),
        code: issueCodes.has(f.code) ? f.code : "validation",
      }));
    return safe;
  } catch {
    return { guard, category: "unknown" };
  }
}
export function missingConfiguration(name: string): CodeDiagnosticError {
  return new CodeDiagnosticError({
    guard: "configuration",
    category: "configuration",
    fields: [{ path: fields.has(name) ? name : "<field>", code: "missing" }],
  });
}
export async function codeGuard<T>(
  guard: Guard,
  work: () => T | Promise<T>,
): Promise<T> {
  try {
    return await work();
  } catch (error) {
    throw new CodeDiagnosticError(classifyCodeFailure(guard, error));
  }
}
export function apiOperation(url: string): Operation {
  const u = new URL(url),
    p = u.pathname;
  if (u.hostname === "api.github.com") {
    if (p.endsWith("/deployment-branch-policies"))
      return "github.environment-policies";
    if (p.endsWith("/environments/production-release"))
      return "github.environment";
    if (p.endsWith("/rules/branches/main")) return "github.rules";
    if (p.endsWith("/branches/main")) return "github.main";
    if (p.endsWith("/actions/workflows/ci.yml")) return "github.ci-workflow";
    if (p.endsWith("/actions/workflows/ci.yml/runs")) return "github.ci-runs";
    if (/\/check-suites\/[0-9]+\/check-runs$/.test(p))
      return "github.ci-checks";
  }
  if (u.hostname === "api.vercel.com") {
    if (p === "/v2/user") return "vercel.user";
    if (/^\/teams\/[^/]+$/.test(p)) return "vercel.team";
    if (/^\/v9\/projects\/[^/]+$/.test(p)) return "vercel.project";
    if (/^\/v4\/aliases\/[^/]+$/.test(p)) return "vercel.alias";
    if (p === "/v6/deployments") return "vercel.history";
    if (/^\/v10\/projects\/[^/]+\/env$/.test(p)) return "vercel.environment";
    if (/^\/v13\/deployments\/[^/]+$/.test(p)) return "vercel.deployment";
  }
  return "unknown";
}
export async function codeMetadataRequest(
  url: string,
  token: string,
  fetcher: typeof fetch = fetch,
): Promise<unknown> {
  const operation = apiOperation(url);
  let response: Response;
  try {
    response = await fetcher(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      signal: AbortSignal.timeout(15000),
      redirect: "error",
    });
  } catch (error) {
    throw new CodeDiagnosticError({
      guard: "api.request",
      operation,
      category: "transport",
      networkCauseCodes: safeNetworkCauseCodes(error),
    });
  }
  if (!response.ok) {
    // Only Vercel error fields are useful here; never retain bodies, URLs or
    // headers. Bound the read as well as the published redacted message.
    let provider: Diagnostic["provider"];
    if (new URL(url).hostname === "api.vercel.com") {
      const reader = response.body?.getReader();
      if (reader) {
        try {
          const chunks: Uint8Array[] = [];
          let size = 0;
          while (size < 65536) {
            const { value, done } = await reader.read();
            if (done) break;
            const chunk = value.subarray(0, 65536 - size);
            chunks.push(chunk);
            size += chunk.byteLength;
          }
          provider = providerDiagnostic(
            Buffer.concat(chunks).toString("utf8"),
            "",
            { secrets: [token] },
          );
        } catch {
          // Preserve the authoritative HTTP failure even if its body is unreadable.
        } finally {
          await reader.cancel().catch(() => undefined);
        }
      }
    }
    throw new CodeDiagnosticError({
      guard: "api.request",
      operation,
      category: "http",
      status: response.status,
      ...(provider ? { provider } : {}),
    });
  }
  try {
    return await response.json();
  } catch {
    throw new CodeDiagnosticError({
      guard: "api.request",
      operation,
      category: "json",
    });
  }
}
