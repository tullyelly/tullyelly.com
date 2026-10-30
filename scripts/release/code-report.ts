import { appendFileSync } from "node:fs";
import { confirmedCloudflareChallenge } from "./health-observation.mjs";
import {
  classifyCodeFailure,
  CodeDiagnosticError,
  type Diagnostic,
  type Guard,
} from "./code-diagnostics";

/** Callers supply validated identities and fixed labels, never provider bodies. */
export function reportCodeEvent(event: Record<string, unknown>) {
  const hex = (value: unknown, length: number) =>
    typeof value === "string" && new RegExp(`^[a-f0-9]{${length}}$`).test(value)
      ? value
      : undefined;
  const id = (value: unknown) =>
    typeof value === "string" && /^dpl_[A-Za-z0-9]{1,80}$/.test(value)
      ? value
      : undefined;
  let safe: Record<string, unknown>;
  if (event.event === "context")
    safe = {
      event: "context",
      revision: hex(event.revision, 40),
      targetRevision: hex(event.targetRevision, 40),
      operation:
        typeof event.operation === "string" &&
        ["deploy", "rollback"].includes(event.operation)
          ? event.operation
          : undefined,
      manifestSha256: hex(event.manifestSha256, 64),
      evidenceSha256: hex(event.evidenceSha256, 64),
      schemaDeferralSha256: hex(event.schemaDeferralSha256, 64),
      sourceSha256: hex(event.sourceSha256, 64),
      workflowRevision: hex(event.workflowRevision, 40),
      ciRunId:
        typeof event.ciRunId === "string" && /^[1-9][0-9]*$/.test(event.ciRunId)
          ? event.ciRunId
          : undefined,
      workflowRunId:
        typeof event.workflowRunId === "string" &&
        /^[1-9][0-9]*$/.test(event.workflowRunId)
          ? event.workflowRunId
          : undefined,
      workflowRunAttempt:
        typeof event.workflowRunAttempt === "string" &&
        /^[1-9][0-9]*$/.test(event.workflowRunAttempt)
          ? event.workflowRunAttempt
          : undefined,
      analyticsIntendedEnabled:
        typeof event.analyticsIntendedEnabled === "boolean"
          ? event.analyticsIntendedEnabled
          : undefined,
      analyticsIntentSha256: hex(event.analyticsIntentSha256, 64),
      analyticsTargetSha256: hex(event.analyticsTargetSha256, 64),
      analyticsDevelopmentReference:
        typeof event.analyticsDevelopmentReference === "string" &&
        /^WU-[1-9][0-9]*$/.test(event.analyticsDevelopmentReference)
          ? event.analyticsDevelopmentReference
          : undefined,
      analyticsProductionReference:
        typeof event.analyticsProductionReference === "string" &&
        /^WU-[1-9][0-9]*$/.test(event.analyticsProductionReference)
          ? event.analyticsProductionReference
          : undefined,
      compatibilityRisks: Array.isArray(event.compatibilityRisks)
        ? event.compatibilityRisks.filter((risk) =>
            [
              "database-schema",
              "database-query-contract",
              "authentication-policy",
              "runtime-configuration",
              "analytics-activation",
              "analytics-maintenance",
            ].includes(String(risk)),
          )
        : undefined,
      changedPaths: Array.isArray(event.changedPaths)
        ? event.changedPaths
            .filter(
              (path) =>
                typeof path === "string" &&
                /^[A-Za-z0-9_./()@+ \[\]-]{1,500}$/.test(path) &&
                !/(?:^|\/)\.env/.test(path),
            )
            .slice(0, 5000)
        : undefined,
      settingsSha256: hex(event.settingsSha256, 64),
      previousDeployment: id(event.previousDeployment),
      rollbackDeployment: id(event.rollbackDeployment),
    };
  else if (event.event === "artifact")
    safe = {
      event: "artifact",
      sha256: hex(event.sha256, 64),
      sizeBytes:
        typeof event.sizeBytes === "number" &&
        Number.isSafeInteger(event.sizeBytes) &&
        event.sizeBytes >= 0
          ? event.sizeBytes
          : undefined,
      buildAttempt:
        typeof event.buildAttempt === "string" &&
        /^[1-9][0-9]*$/.test(event.buildAttempt)
          ? event.buildAttempt
          : undefined,
    };
  else if (event.event === "deployment")
    safe = { event: "deployment", deploymentId: id(event.deploymentId) };
  else if (event.event === "release-result") {
    if (
      !id(event.deploymentId) ||
      event.deployment_succeeded !== true ||
      typeof event.public_verified !== "boolean"
    )
      return;
    const reason = event.public_verified
      ? undefined
      : classifyCodeFailure(
          "health.public",
          new CodeDiagnosticError(event.reason as Diagnostic),
        );
    if (!event.public_verified && !confirmedCloudflareChallenge(reason)) return;
    safe = {
      event: "release-result",
      deploymentId: id(event.deploymentId),
      deployment_succeeded: true,
      public_verified: event.public_verified,
      publicVerification: event.public_verified
        ? "public verification passed"
        : "public verification pending",
      ...(reason ? { reason } : {}),
      ...(event.analytics &&
      typeof event.analytics === "object" &&
      "intendedEnabled" in event.analytics &&
      typeof event.analytics.intendedEnabled === "boolean" &&
      "stagedObserved" in event.analytics &&
      typeof event.analytics.stagedObserved === "boolean" &&
      "publicObserved" in event.analytics &&
      (typeof event.analytics.publicObserved === "boolean" ||
        event.analytics.publicObserved === null)
        ? {
            analytics: {
              intendedEnabled: event.analytics.intendedEnabled,
              stagedObserved: event.analytics.stagedObserved,
              publicObserved: event.analytics.publicObserved,
            },
          }
        : {}),
    };
  } else if (event.event === "auth") {
    const keys = [
      "tokenPresent",
      "tokenMalformed",
      "restVerified",
      "cliVerified",
    ];
    if (keys.some((key) => typeof event[key] !== "boolean")) return;
    safe = {
      event: "auth",
      ...Object.fromEntries(keys.map((key) => [key, event[key]])),
    };
  } else if (event.event === "auth-probe") {
    if (
      typeof event.operation !== "string" ||
      !["vercel.user", "vercel.team"].includes(event.operation) ||
      typeof event.succeeded !== "boolean"
    )
      return;
    safe = {
      event: "auth-probe",
      operation: event.operation,
      succeeded: event.succeeded,
      status:
        typeof event.status === "number" &&
        Number.isInteger(event.status) &&
        event.status >= 100 &&
        event.status <= 599
          ? event.status
          : undefined,
    };
  } else if (event.event === "phase") {
    if (
      typeof event.phase !== "string" ||
      typeof event.outcome !== "string" ||
      ![
        "cli-invocation-upload",
        "deployment-creation",
        "remote-build",
        "staged-verification",
        "promotion",
        "public-verification",
      ].includes(event.phase) ||
      !["started", "success", "failure", "pending"].includes(event.outcome) ||
      (event.outcome === "pending" && event.phase !== "public-verification")
    )
      return;
    safe = {
      event: "phase",
      phase: event.phase,
      outcome: event.outcome,
      durationMs:
        typeof event.durationMs === "number" &&
        Number.isSafeInteger(event.durationMs) &&
        event.durationMs >= 0
          ? event.durationMs
          : undefined,
    };
  } else if (event.event === "failure" || event.event === "reconciliation")
    safe = {
      event: event.event,
      diagnostic: classifyCodeFailure(
        "production.check",
        new CodeDiagnosticError(event.diagnostic as Diagnostic),
      ),
    };
  else return;
  if (process.env.RELEASE_REPORT_PATH)
    appendFileSync(
      process.env.RELEASE_REPORT_PATH,
      JSON.stringify(safe) + "\n",
    );
}

export function reportCodeFailure(guard: Guard, error: unknown) {
  const diagnostic = classifyCodeFailure(guard, error);
  reportCodeEvent({ event: "failure", diagnostic });
  return diagnostic;
}
