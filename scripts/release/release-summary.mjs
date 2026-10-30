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
import { safeProviderDiagnostic } from "./provider-diagnostic.mjs";
import { safePublicationObservation } from "./publication-observation.mjs";
import {
  confirmedCloudflareChallenge,
  safeHealthRequestTrace,
} from "./health-observation.mjs";

const labels = new Set([
  "Installing source dependencies",
  "Generating automatic release evidence",
  "Installing release CLI",
  "Checking pinned CLI contract",
  "Checking published Chronicle",
  "Bundling release executor",
  "Verifying release executor",
  "Binding release plan",
  "Validating release source",
  "Building canonical production artifact",
  "Verifying downloaded artifact",
  "Rechecking release plan",
  "Checking approved production target",
  "Checking protected release credential",
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
  "vercel.auth-rest",
  "vercel.auth-cli",
  "vercel.user",
  "vercel.team",
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
  "github.ci-workflow",
  "github.ci-runs",
  "github.ci-checks",
  "vercel.project",
  "vercel.auth-rest",
  "vercel.auth-cli",
  "vercel.user",
  "vercel.team",
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
const phaseLabels = new Map([
  ["cli-invocation-upload", "CLI invocation/upload (opaque provider call)"],
  ["deployment-creation", "Deployment creation (API candidate observed)"],
  ["remote-build", "Remote build (READY required)"],
  ["staged-verification", "Staged verification"],
  ["promotion", "Exact-deployment promotion"],
  ["promotion-attempt", "Promotion call (one attempt)"],
  ["domain-assignment", "Domain assignment confirmation"],
  ["public-verification", "Public verification"],
]);
const phaseOutcomes = new Set(["started", "success", "failure", "pending"]);
// Provider messages are sanitized data, not Markdown or HTML instructions.
const markdownText = (value) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/[\\`*_{}\[\]()#+\-.!|~]/g, "\\$&")
    .replace(/[\r\n]/g, " ");

export function diagnosticSummary(d) {
  if (!d || typeof d !== "object") return "unknown";
  const parts = [
    guards.has(d.guard) ? d.guard : "production.check",
    categories.has(d.category) ? d.category : "unknown",
  ];
  if (operations.has(d.operation)) parts.push(`operation=${d.operation}`);
  if (
    d.operation === "vercel.alias" &&
    Number.isInteger(d.aliasReadAttempts) &&
    d.aliasReadAttempts >= 1 &&
    d.aliasReadAttempts <= 3
  )
    parts.push(`aliasReadAttempts=${d.aliasReadAttempts}`);
  const provider = safeProviderDiagnostic(d.provider);
  if (provider)
    for (const [key, value] of Object.entries(provider))
      parts.push(
        `provider.${key}=${key === "message" ? markdownText(value) : value}`,
      );
  if (["not-found", "failed"].includes(d.reconciliation))
    parts.push(`reconciliation=${d.reconciliation}`);
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
  const publication = safePublicationObservation(d.publication);
  if (publication) {
    parts.push(
      `path=${publication.path}`,
      `condition=${publication.condition}`,
    );
    if (publication.textSampleIndex !== undefined)
      parts.push(`text-sample=${publication.textSampleIndex}`);
  }
  if (
    d.health &&
    ["/", "/shaolin", "/stats", "/api/health"].includes(d.health.path) &&
    [
      "http-status",
      "missing-doctype",
      "health-not-ok",
      "security-challenge",
    ].includes(d.health.condition)
  ) {
    parts.push(`path=${d.health.path}`, `condition=${d.health.condition}`);
    const request = safeHealthRequestTrace(d.health.request);
    if (request) {
      parts.push(
        `initial-origin=${request.initialOrigin}`,
        `effective-origin=${request.effectiveOrigin}`,
      );
      for (const response of request.responses)
        parts.push(
          `hop=${response.hop} origin=${response.origin} status=${response.status} at=${response.timestamp}${Object.entries(
            response.headers,
          )
            .map(([name, value]) => ` ${name}=${value}`)
            .join("")}`,
        );
    }
  }
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
  const lastPhase = (phase) =>
    events.findLastIndex(
      (event) =>
        event.event === "phase" &&
        event.phase === phase &&
        phaseOutcomes.has(event.outcome),
    );
  const releaseResult = events
    .filter(
      (e) =>
        e.event === "release-result" &&
        identity(e.deploymentId) !== "unavailable" &&
        e.deployment_succeeded === true &&
        (e.public_verified === true ||
          (e.public_verified === false &&
            confirmedCloudflareChallenge(e.reason))),
    )
    .at(-1);
  const promotion = lastPhase("promotion");
  const publicVerification = lastPhase("public-verification");
  const publicVerificationPending =
    releaseResult?.public_verified === false ||
    (promotion >= 0 &&
      events[promotion].outcome === "success" &&
      !(
        publicVerification > promotion &&
        events[publicVerification].outcome === "success"
      ));
  const lines = [
    context.evidenceSha256 || results.evidenceSha256
      ? "## Native source production release"
      : "## Code-only production release",
    "",
    ...(publicVerificationPending
      ? ["**Production promoted; public verification pending.**", ""]
      : []),
    ...(releaseResult
      ? [
          `Deployment succeeded: true; public_verified=${releaseResult.public_verified === true ? "true" : "false"}.`,
          ...(releaseResult.analytics &&
          typeof releaseResult.analytics.intendedEnabled === "boolean" &&
          typeof releaseResult.analytics.stagedObserved === "boolean"
            ? [
                `Analytics intended: ${releaseResult.analytics.intendedEnabled ? "on" : "off"}; staged observed: ${releaseResult.analytics.stagedObserved ? "on" : "off"}; public observed: ${typeof releaseResult.analytics.publicObserved === "boolean" ? (releaseResult.analytics.publicObserved ? "on" : "off") : "unverified"}.`,
              ]
            : ["Analytics runtime state unverified."]),
          ...(releaseResult.public_verified === false
            ? [
                "Green protected operation means deployment succeeded; public verification pending is not full public acceptance.",
                `Pending reason: ${diagnosticSummary(releaseResult.reason)}`,
              ]
            : []),
          "",
        ]
      : []),
    `Revision: ${hex(context.revision ?? results.revision, 40)}`,
    `Target revision: ${hex(context.targetRevision, 40)}`,
    `Operation: ${["deploy", "rollback"].includes(context.operation) ? context.operation : "unavailable"}`,
    ...(context.evidenceSha256 || results.evidenceSha256
      ? [
          `Evidence SHA-256: ${hex(context.evidenceSha256 ?? results.evidenceSha256, 64)}`,
          `Source SHA-256: ${hex(context.sourceSha256, 64)}`,
          `Workflow revision: ${hex(context.workflowRevision, 40)}`,
          `Workflow run: ${typeof context.workflowRunId === "string" && /^[1-9][0-9]*$/.test(context.workflowRunId) ? context.workflowRunId : "unavailable"}`,
          `Workflow attempt: ${typeof context.workflowRunAttempt === "string" && /^[1-9][0-9]*$/.test(context.workflowRunAttempt) ? context.workflowRunAttempt : "unavailable"}`,
          `Reused exact-revision CI run: ${typeof context.ciRunId === "string" && /^[1-9][0-9]*$/.test(context.ciRunId) ? context.ciRunId : "unavailable"}`,
          "Canonical application build: Vercel native source build after human approval.",
        ]
      : [
          `Manifest SHA-256: ${hex(context.manifestSha256 ?? results.manifestSha256, 64)}`,
        ]),
    `Build settings SHA-256: ${hex(context.settingsSha256, 64)}`,
    ...(!(context.evidenceSha256 || results.evidenceSha256)
      ? [
          `Artifact SHA-256: ${hex(artifact.sha256, 64)}`,
          `Artifact size: ${integer(artifact.sizeBytes) ? `${artifact.sizeBytes} bytes` : "unavailable (no verified new artifact)"}`,
          `Build attempt: ${typeof artifact.buildAttempt === "string" && /^[1-9][0-9]*$/.test(artifact.buildAttempt) ? artifact.buildAttempt : "unavailable"}`,
        ]
      : []),
    `Previous deployment: ${identity(context.previousDeployment)}`,
    `Deployment identity: ${identity(deployment.deploymentId)}`,
    ...[
      ["deployment-creation", "Deployment creation"],
      ["remote-build", "Build readiness"],
      ["staged-verification", "Staged verification"],
      ["promotion-attempt", "Promotion call"],
      ["domain-assignment", "Domain assignment"],
      ["public-verification", "Public verification"],
    ].map(([phase, label]) => {
      const index = lastPhase(phase);
      const outcome = index >= 0 ? events[index].outcome : "unobserved";
      return `${label}: ${outcome}.`;
    }),
    ...(!(context.evidenceSha256 || results.evidenceSha256)
      ? [`Rollback target: ${identity(context.rollbackDeployment)}`]
      : []),
    `Preparation: ${state(results.prepare)}; protected operation: ${state(results.production)}`,
    "",
    "| Stage | Duration | Result |",
    "| --- | ---: | --- |",
  ];
  if (publicVerificationPending) {
    const bound =
      typeof context.workflowRunId === "string" &&
      /^[1-9][0-9]{0,14}$/.test(context.workflowRunId) &&
      typeof context.workflowRunAttempt === "string" &&
      /^[1-9][0-9]{0,14}$/.test(context.workflowRunAttempt) &&
      identity(deployment.deploymentId) !== "unavailable" &&
      hex(context.revision, 40) !== "unavailable";
    lines.splice(
      lines.indexOf("| Stage | Duration | Result |"),
      0,
      "Public verification execution: GitHub Actions; promotion alone does not establish public acceptance.",
      "The public check remains incomplete. A Cloudflare challenge is not a pass; keep Bot Fight Mode enabled.",
      ...(bound
        ? [
            "Read-only follow-up from any suitable execution environment, using the original release-evidence.json artifact:",
            "```bash",
            `npm run --silent release:verify-public -- --run ${context.workflowRunId} --attempt ${context.workflowRunAttempt} --deployment ${deployment.deploymentId} --sha ${context.revision} --evidence release-evidence.json --location EXECUTION_LABEL`,
            "```",
          ]
        : [
            "Recover the exact run, attempt, deployment and SHA before running the read-only follow-up.",
          ]),
      "",
    );
  }
  if (context.evidenceSha256 || results.evidenceSha256) {
    const allowedRisks = new Set([
      "database-schema",
      "database-query-contract",
      "authentication-policy",
      "runtime-configuration",
      "analytics-activation",
      "analytics-maintenance",
    ]);
    const risks = Array.isArray(context.compatibilityRisks)
      ? context.compatibilityRisks.filter((risk) => allowedRisks.has(risk))
      : [];
    const paths = Array.isArray(context.changedPaths)
      ? context.changedPaths
          .filter(
            (path) =>
              typeof path === "string" &&
              /^[A-Za-z0-9_./()@+ \[\]-]{1,500}$/.test(path),
          )
          .slice(0, 5000)
      : [];
    const schemaDeferred =
      typeof context.schemaDeferralSha256 === "string" &&
      /^[a-f0-9]{64}$/.test(context.schemaDeferralSha256);
    const analyticsReviewed =
      context.analyticsIntendedEnabled === true &&
      /^WU-[1-9][0-9]*$/.test(context.analyticsDevelopmentReference ?? "") &&
      /^WU-[1-9][0-9]*$/.test(context.analyticsProductionReference ?? "") &&
      /^[a-f0-9]{64}$/.test(context.analyticsTargetSha256 ?? "");
    const blocked = risks.some(
      (risk) =>
        (risk === "analytics-activation" && !analyticsReviewed) ||
        (risk === "database-schema" && !schemaDeferred),
    );
    lines.splice(
      lines.indexOf("| Stage | Duration | Result |"),
      0,
      `Compatibility risks: ${risks.length ? risks.join(", ") + (blocked ? "; ordinary release blocked; use the applicable sensitive review procedure." : "; review compatibility at the human production gate.") : "No database, authentication, runtime configuration or analytics activation contract change detected."}`,
      ...(schemaDeferred
        ? [
            "Application-only schema deferral: reviewed in releases/deferred-schema.json; SQL is not applied and migration approval remains separate.",
            `Schema deferral SHA-256: ${context.schemaDeferralSha256}`,
          ]
        : []),
      ...(typeof context.analyticsIntendedEnabled === "boolean"
        ? [
            `Analytics intended collection: ${context.analyticsIntendedEnabled ? "on" : "off"}.`,
            `Analytics intent SHA-256: ${hex(context.analyticsIntentSha256, 64)}`,
            context.analyticsIntendedEnabled
              ? `Manual DataGrip readiness: development ${/^WU-[1-9][0-9]*$/.test(context.analyticsDevelopmentReference ?? "") ? context.analyticsDevelopmentReference : "unavailable"}; production ${/^WU-[1-9][0-9]*$/.test(context.analyticsProductionReference ?? "") ? context.analyticsProductionReference : "unavailable"}; database target SHA-256 ${hex(context.analyticsTargetSha256, 64)}.`
              : "Disabled maintenance does not require or initialize analytics schema.",
            "Runtime collection intent applies to the staged production deployment too; promotion does not change its immutable environment. Metadata alone is not verification. Read-only runtime/catalog checks must match before promotion; no SQL or collect/import action is executed.",
          ]
        : [
            "Analytics intended/runtime state unavailable; no disabled-state proof is inferred.",
          ]),
      `Changed source paths: ${paths.length}`,
      ...(risks.length ? paths.map((path) => `- ${path}`) : []),
      "",
    );
  }
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
  if (
    context.evidenceSha256 ||
    results.evidenceSha256 ||
    events.some(
      (event) =>
        event.event === "phase" ||
        event.event === "auth" ||
        event.event === "auth-probe",
    )
  ) {
    const auth = events
      .filter(
        (event) =>
          event.event === "auth" &&
          [
            "tokenPresent",
            "tokenMalformed",
            "restVerified",
            "cliVerified",
          ].every((key) => typeof event[key] === "boolean"),
      )
      .at(-1);
    lines.push(
      "",
      auth
        ? `Protected credential: present=${auth.tokenPresent ? "yes" : "no"}; malformed=${auth.tokenMalformed ? "yes" : "no"}; REST target verified=${auth.restVerified ? "yes" : "no"}; CLI target verified=${auth.cliVerified ? "yes" : "no"}.`
        : "Protected credential: not observed.",
      "",
      "| Provider phase | Duration | Result |",
      "| --- | ---: | --- |",
    );
    for (const [phase, label] of phaseLabels) {
      const event = events
        .filter(
          (event) =>
            event.event === "phase" &&
            event.phase === phase &&
            phaseOutcomes.has(event.outcome),
        )
        .at(-1);
      lines.push(
        `| ${label} | ${event && integer(event.durationMs) ? `${(event.durationMs / 1000).toFixed(1)} s` : "unavailable"} | ${event ? (event.outcome === "started" ? "incomplete" : event.outcome) : "not reached"} |`,
      );
    }
    lines.push(
      "",
      "Phase durations can overlap; the CLI does not expose a separate upload/request boundary.",
    );
    for (const operation of ["vercel.user", "vercel.team"]) {
      const probe = events
        .filter(
          (event) =>
            event.event === "auth-probe" &&
            event.operation === operation &&
            typeof event.succeeded === "boolean",
        )
        .at(-1);
      if (probe)
        lines.push(
          `Failure-only credential read probe: ${operation}; succeeded=${probe.succeeded ? "yes" : "no"}${integer(probe.status) && probe.status >= 100 && probe.status <= 599 ? `; HTTP=${probe.status}` : ""}.`,
        );
    }
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
    "Only the checksum-bound analytics intent is approved through the existing human gate. No migration, manual collection/import, automatic retry, rollback, database restore or credential recovery is authorized.",
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
      evidenceSha256: process.env.RELEASE_EVIDENCE_SHA256,
      prepare: process.env.PREPARATION_RESULT,
      production: approval ? "pending" : process.env.PRODUCTION_RESULT,
    },
  );
  if (approval) {
    writeFileSync(".cache/release-approval.md", summary);
    if (process.env.GITHUB_STEP_SUMMARY)
      appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
  } else if (process.env.GITHUB_STEP_SUMMARY)
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
  else console.log(summary);
}
