// One final, credential-free summary. Report files are data, never executable input.
import {
  appendFileSync,
  existsSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { pathToFileURL } from "node:url";
import { codeInvariants, codeDiagnosticFields } from "./code-invariants.mjs";

const labels = new Set([
  "Installing source dependencies",
  "Installing release CLI",
  "Bundling release executor",
  "Verifying release executor",
  "Binding release plan",
  "Validating release source",
  "Building canonical production artifact",
  "Verifying downloaded artifact",
  "Rechecking release plan",
  "Checking approved production target",
  "Executing approved production operation",
  "Validating GitHub Actions workflows",
  "Preparing generated content",
  "Generating build info",
  "Checking image manifest",
  "Building Contentlayer",
  "Linting",
  "Typechecking",
  "Generating Prisma client",
  "Running Jest validation",
]);
const guards = new Set([
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
]);
const categories = new Set([
  "http",
  "transport",
  "json",
  "validation",
  "invariant",
  "configuration",
  "process",
  "unknown",
]);
const operations = new Set([
  "github.environment",
  "github.environment-policies",
  "github.main",
  "github.rules",
  "vercel.project",
  "vercel.alias",
  "vercel.history",
  "vercel.environment",
  "vercel.deployment",
  "vercel.stage",
  "vercel.promote",
  "vercel.rollback",
  "unknown",
]);
const states = new Set([
  "success",
  "failure",
  "cancelled",
  "skipped",
  "pending",
]);
const invariants = new Set(codeInvariants);
const fields = new Set(codeDiagnosticFields);
const hex = (value, length) =>
  typeof value === "string" && new RegExp(`^[a-f0-9]{${length}}$`).test(value)
    ? value
    : "unavailable";
const identity = (value) =>
  typeof value === "string" && /^dpl_[A-Za-z0-9]{1,80}$/.test(value)
    ? value
    : "unavailable";
const integer = (value) => Number.isSafeInteger(value) && value >= 0;
const state = (value) => (states.has(value) ? value : "unavailable");

export function diagnosticSummary(d) {
  if (!d || typeof d !== "object") return "unknown";
  const parts = [
    guards.has(d.guard) ? d.guard : "production.check",
    categories.has(d.category) ? d.category : "unknown",
  ];
  if (operations.has(d.operation)) parts.push(`operation=${d.operation}`);
  if (invariants.has(d.invariant)) parts.push(`check=${d.invariant}`);
  if (Array.isArray(d.fields))
    parts.push(
      `fields=${d.fields
        .slice(0, 8)
        .map((f) =>
          typeof f?.path === "string"
            ? f.path
                .split(".")
                .slice(0, 8)
                .map((p) => (fields.has(p) || p === "[]" ? p : "redacted"))
                .join(".")
            : "redacted",
        )
        .join(",")}`,
    );
  if (integer(d.status) && d.status >= 100 && d.status <= 599)
    parts.push(`HTTP=${d.status}`);
  if (d.exitStatus === null || (integer(d.exitStatus) && d.exitStatus <= 255))
    parts.push(`exit=${d.exitStatus}`);
  if (
    ["SIGTERM", "SIGKILL", "SIGINT", "SIGABRT", "SIGSEGV", "SIGBUS"].includes(
      d.signal,
    )
  )
    parts.push(`signal=${d.signal}`);
  if (
    [
      "ENOENT",
      "EACCES",
      "EPERM",
      "EINVAL",
      "ETIMEDOUT",
      "ENOBUFS",
      "E2BIG",
    ].includes(d.spawnErrorCode)
  )
    parts.push(`spawn=${d.spawnErrorCode}`);
  return parts.join("; ");
}

export function renderReleaseSummary(events, results = {}) {
  const context = events.find((e) => e.event === "context") ?? {};
  const artifact = events.find((e) => e.event === "artifact") ?? {};
  const deployment =
    events.filter((e) => e.event === "deployment").at(-1) ?? {};
  const lines = [
    "## Code-only production release",
    "",
    `Revision: ${hex(context.revision ?? results.revision, 40)}`,
    `Target revision: ${hex(context.targetRevision, 40)}`,
    `Operation: ${["deploy", "rollback"].includes(context.operation) ? context.operation : "unavailable"}`,
    `Manifest SHA-256: ${hex(context.manifestSha256 ?? results.manifestSha256, 64)}`,
    `Build settings SHA-256: ${hex(context.settingsSha256, 64)}`,
    `Artifact SHA-256: ${hex(artifact.sha256, 64)}`,
    `Artifact size: ${integer(artifact.sizeBytes) ? `${artifact.sizeBytes} bytes` : "unavailable (no verified new artifact)"}`,
    `Build attempt: ${typeof artifact.buildAttempt === "string" && /^[1-9][0-9]*$/.test(artifact.buildAttempt) ? artifact.buildAttempt : "unavailable"}`,
    `Previous deployment: ${identity(context.previousDeployment)}`,
    `Deployment identity: ${identity(deployment.deploymentId)}`,
    `Rollback target: ${identity(context.rollbackDeployment)}`,
    `Preparation: ${state(results.prepare)}; protected operation: ${state(results.production)}`,
    "",
    "| Stage | Duration | Result |",
    "| --- | ---: | --- |",
  ];
  for (const event of events) {
    if (
      event.event === "stage" &&
      labels.has(event.label) &&
      integer(event.durationMs)
    )
      lines.push(
        `| ${event.label} | ${(event.durationMs / 1000).toFixed(1)} s | ${state(event.outcome)} |`,
      );
  }
  const failures = events.filter(
    (e) => e.event === "failure" || e.event === "reconciliation",
  );
  lines.push("", "Failure context:");
  for (const event of failures) {
    lines.push(
      `- ${event.event === "reconciliation" ? "Reconciled provider result" : "Failed check"}: ${diagnosticSummary(event.diagnostic)}`,
    );
    if (event.diagnostic?.originalFailure)
      lines.push(
        `- Original provider failure: ${diagnosticSummary(event.diagnostic.originalFailure)}`,
      );
    if (event.diagnostic?.reconciliationFailure)
      lines.push(
        `- Reconciliation failure: ${diagnosticSummary(event.diagnostic.reconciliationFailure)}`,
      );
  }
  if (!failures.length)
    lines.push(
      results.production === "pending"
        ? "- Awaiting human approval; no protected operation has run."
        : results.prepare === "success" && results.production === "success"
          ? "- None recorded."
          : "- Workflow or runner failure/cancellation; use the last recorded stage and failed workflow step. Detailed diagnostics unavailable.",
    );
  lines.push(
    "",
    "This release does not authorize collection activation. No automatic retry, rollback, database restore or credential recovery is authorized.",
    "",
  );
  return lines.join("\n");
}

export function readReleaseEvents(paths) {
  return paths.flatMap((path) => {
    if (!existsSync(path) || statSync(path).size > 1024 * 1024) return [];
    return readFileSync(path, "utf8")
      .split("\n")
      .slice(0, 2000)
      .flatMap((line) => {
        try {
          const value = JSON.parse(line);
          return value && typeof value === "object" && !Array.isArray(value)
            ? [value]
            : [];
        } catch {
          return [];
        }
      });
  });
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const approval = process.argv[2] === "--approval-report";
  const summary = renderReleaseSummary(
    readReleaseEvents(process.argv.slice(approval ? 3 : 2)),
    {
      revision: process.env.RELEASE_SHA,
      manifestSha256: process.env.RELEASE_MANIFEST_SHA256,
      prepare: process.env.PREPARATION_RESULT,
      production: approval ? "pending" : process.env.PRODUCTION_RESULT,
    },
  );
  if (approval) writeFileSync(".cache/release-approval.md", summary);
  else if (process.env.GITHUB_STEP_SUMMARY)
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
  else console.log(summary);
}
