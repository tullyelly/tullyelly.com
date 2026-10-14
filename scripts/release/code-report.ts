import { appendFileSync } from "node:fs";
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
      operation: ["deploy", "rollback"].includes(String(event.operation))
        ? event.operation
        : undefined,
      manifestSha256: hex(event.manifestSha256, 64),
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
  else if (event.event === "failure" || event.event === "reconciliation")
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
