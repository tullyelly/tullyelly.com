/** Fixed labels only: never serialize exceptions, request URLs or provider values. */
import { z } from "zod";
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
  "human.approval",
  "vercel.project",
  "vercel.git-hooks",
  "vercel.aliases",
  "vercel.history",
  "vercel.environment",
  "vercel.deployment",
  "production.check",
] as const;
export type Guard = (typeof guards)[number];
export const operations = [
  "github.environment",
  "github.environment-policies",
  "github.main",
  "github.rules",
  "vercel.project",
  "vercel.alias",
  "vercel.history",
  "vercel.environment",
  "vercel.deployment",
  "unknown",
] as const;
export type Operation = (typeof operations)[number];
const fields = new Set([
  "version",
  "kind",
  "operation",
  "collectionEnabled",
  "buildEnvironment",
  "schemaCompatibility",
  "checkedAt",
  "checkedBy",
  "evidenceUrl",
  "previousApplicationSha",
  "databaseHost",
  "database",
  "method",
  "requiredObjects",
  "missingObjects",
  "compatible",
  "rollbackCompatible",
  "vercel",
  "teamId",
  "productionDeploymentId",
  "productionHost",
  "settings",
  "settingsSha256",
  "rollback",
  "deploymentId",
  "applicationSha",
  "collectionDisabledVerified",
  "alias",
  "VERCEL_TOKEN",
  "GH_TOKEN",
  "GITHUB_SHA",
  "GITHUB_REPOSITORY",
  "RELEASE_BUILD_HOME",
  "RELEASE_MANIFEST_SHA256",
  "RELEASE_BUILD_SHA256",
  "id",
  "accountId",
  "link",
  "targets",
  "production",
  "framework",
  "nodeVersion",
  "buildCommand",
  "installCommand",
  "outputDirectory",
  "rootDirectory",
  "envs",
  "key",
  "target",
  "pagination",
  "next",
  "deployments",
  "uid",
  "readyState",
  "meta",
  "projectId",
  "url",
  "commit",
  "sha",
  "protected",
  "protection_rules",
  "can_admins_bypass",
  "deployment_branch_policy",
  "custom_branch_policies",
  "protected_branches",
  "branch_policies",
  "name",
  "type",
  "reviewers",
  "prevent_self_review",
  "environments",
  "user",
  "event",
  "head_branch",
  "head_sha",
  "actor",
  "triggering_actor",
]);
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
const invariants = new Set([
  "code.production-drift",
  "code.deploy-hooks-present",
  "code.concurrent-deployment",
  "code.incomplete-environment-metadata",
  "code.runtime-database-configuration",
  "code.deployment-pagination-loop",
  "code.incomplete-deployment-history",
  "code.previous-application-identity",
  "code.human-gate-required",
  "code.ambiguous-deployment-identity",
]);
const knownMessages = new Map([
  ["Vercel project/team mismatch", "code.project-identity"],
  ["Vercel project settings drift", "code.project-settings-drift"],
  [
    "Vercel Git integration is still connected; automatic deployments can bypass release approval",
    "code.project-git-linked",
  ],
]);
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
    | "unknown";
  status?: number;
  networkCauseCodes?: string[];
  invariant?: string;
  fields?: { path: string; code: string }[];
};
export class CodeDiagnosticError extends Error {
  constructor(readonly diagnostic: Diagnostic) {
    super("code.guard-failed");
  }
}
function classifyRaw(guard: Guard, error: unknown): Diagnostic {
  if (error instanceof CodeDiagnosticError) return error.diagnostic;
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
        "unknown",
      ].includes(d.category)
        ? d.category
        : "unknown",
    };
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
    if (p.endsWith("/branches/main")) return "github.main";
    if (p.endsWith("/rules/branches/main")) return "github.rules";
  }
  if (u.hostname === "api.vercel.com") {
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
  if (!response.ok)
    throw new CodeDiagnosticError({
      guard: "api.request",
      operation,
      category: "http",
      status: response.status,
    });
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
