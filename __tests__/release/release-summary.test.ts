/** @jest-environment node */
import { spawnSync } from "node:child_process";
import {
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
  copyFileSync,
  mkdirSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  classifyCodeFailure,
  CodeHealthError,
} from "../../scripts/release/code-diagnostics";
import { reportCodeEvent } from "../../scripts/release/code-report";
import { createHash } from "node:crypto";

function summary(events: object[], results: object) {
  const result = spawnSync(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      `
    import { readFileSync } from 'node:fs';
    const { renderReleaseSummary } = await import(process.env.SUMMARY_MODULE);
    const { events, results } = JSON.parse(readFileSync(0, 'utf8'));
    console.log(renderReleaseSummary(events, results));
  `,
    ],
    {
      input: JSON.stringify({ events, results }),
      encoding: "utf8",
      timeout: 10000,
      env: {
        ...process.env,
        SUMMARY_MODULE: pathToFileURL(
          resolve("scripts/release/release-summary.mjs"),
        ).href,
      },
    },
  );
  expect(result.error).toBeUndefined();
  expect(result.status).toBe(0);
  return result.stdout;
}
const context = {
  event: "context",
  revision: "a".repeat(40),
  targetRevision: "a".repeat(40),
  operation: "deploy",
  manifestSha256: "b".repeat(64),
  settingsSha256: "c".repeat(64),
  previousDeployment: "dpl_previous",
};
test("page health observations survive report storage and final rendering without response contents", () => {
  const root = mkdtempSync(join(tmpdir(), "health-code-report-"));
  const previous = process.env.RELEASE_REPORT_PATH;
  const sensitive = "PRIVATE_HEALTH_BODY_AND_HEADERS";
  try {
    const path = join(root, "report.jsonl");
    process.env.RELEASE_REPORT_PATH = path;
    const diagnostic = classifyCodeFailure(
      "health.public",
      new CodeHealthError("/stats", 503, "http-status"),
    );
    Object.assign(diagnostic.health!, {
      body: sensitive,
      headers: { cookie: sensitive },
    });
    reportCodeEvent({ event: "failure", diagnostic });
    const stored = readFileSync(path, "utf8");
    expect(stored).not.toContain(sensitive);
    expect(JSON.parse(stored).diagnostic.health).toEqual({
      path: "/stats",
      condition: "http-status",
    });
    const rendered = summary([JSON.parse(stored)], {});
    expect(rendered).toContain("HTTP=503; path=/stats; condition=http-status");
    expect(rendered).not.toContain(sensitive);
    expect(
      summary(
        [
          {
            event: "failure",
            diagnostic: {
              guard: "health.public",
              category: "invariant",
              health: { path: sensitive, condition: sensitive },
            },
          },
        ],
        {},
      ),
    ).not.toContain(sensitive);
  } finally {
    if (previous === undefined) delete process.env.RELEASE_REPORT_PATH;
    else process.env.RELEASE_REPORT_PATH = previous;
    rmSync(root, { recursive: true, force: true });
  }
});
test.each(["github.ci-workflow", "github.ci-runs", "github.ci-checks"])(
  "summary retains the fixed %s API operation",
  (operation) => {
    const output = summary(
      [
        context,
        {
          event: "failure",
          diagnostic: {
            guard: "api.request",
            category: "http",
            status: 403,
            operation,
          },
        },
      ],
      { prepare: "success", production: "failure" },
    );
    expect(output).toContain(`operation=${operation}`);
  },
);
test("uploaded reports reject arbitrary values before storage, not only when rendering", () => {
  const root = mkdtempSync(join(tmpdir(), "safe-code-report-"));
  const previous = process.env.RELEASE_REPORT_PATH;
  try {
    const path = join(root, "report.jsonl");
    process.env.RELEASE_REPORT_PATH = path;
    const sensitive = "SENSITIVE_DO_NOT_UPLOAD";
    reportCodeEvent({
      event: "context",
      revision: sensitive,
      operation: sensitive,
      evidenceUrl: sensitive,
      previousDeployment: sensitive,
    });
    reportCodeEvent({
      event: "failure",
      diagnostic: {
        guard: "manifest.validation",
        category: "validation",
        message: sensitive,
        fields: [{ path: sensitive, code: sensitive }],
      },
    });
    const report = readFileSync(path, "utf8");
    expect(report).not.toContain(sensitive);
    expect(report).toContain('"guard":"manifest.validation"');
  } finally {
    if (previous === undefined) delete process.env.RELEASE_REPORT_PATH;
    else process.env.RELEASE_REPORT_PATH = previous;
    rmSync(root, { recursive: true, force: true });
  }
});
test("auth and phase report records retain only fixed boolean and phase evidence", () => {
  const root = mkdtempSync(join(tmpdir(), "auth-phase-report-"));
  const previous = process.env.RELEASE_REPORT_PATH;
  try {
    const path = join(root, "report.jsonl");
    process.env.RELEASE_REPORT_PATH = path;
    const planted = "PRIVATE_TOKEN_COOKIE_CONNECTION_DO_NOT_STORE";
    reportCodeEvent({
      event: "auth",
      tokenPresent: true,
      tokenMalformed: false,
      restVerified: true,
      cliVerified: false,
      token: planted,
      tokenHash: planted,
      headers: planted,
    });
    reportCodeEvent({
      event: "auth",
      tokenPresent: planted,
      tokenMalformed: false,
      restVerified: true,
      cliVerified: true,
    });
    reportCodeEvent({
      event: "auth-probe",
      operation: "vercel.user",
      succeeded: false,
      status: 403,
      body: planted,
    });
    reportCodeEvent({
      event: "auth-probe",
      operation: planted,
      succeeded: true,
      status: 200,
    });
    reportCodeEvent({
      event: "phase",
      phase: "cli-invocation-upload",
      outcome: "failure",
      durationMs: 2345,
      stderr: planted,
    });
    reportCodeEvent({
      event: "phase",
      phase: planted,
      outcome: "success",
      durationMs: 1,
    });
    reportCodeEvent({
      event: "phase",
      phase: "remote-build",
      outcome: planted,
      durationMs: 1,
    });
    const stored = readFileSync(path, "utf8");
    expect(stored).not.toContain(planted);
    const events = stored
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line));
    expect(events).toEqual([
      {
        event: "auth",
        tokenPresent: true,
        tokenMalformed: false,
        restVerified: true,
        cliVerified: false,
      },
      {
        event: "auth-probe",
        operation: "vercel.user",
        succeeded: false,
        status: 403,
      },
      {
        event: "phase",
        phase: "cli-invocation-upload",
        outcome: "failure",
        durationMs: 2345,
      },
    ]);
    const rendered = summary(events, {
      evidenceSha256: "b".repeat(64),
      prepare: "success",
      production: "failure",
    });
    expect(rendered).toContain(
      "present=yes; malformed=no; REST target verified=yes; CLI target verified=no",
    );
    expect(rendered).toContain("vercel.user; succeeded=no; HTTP=403");
    expect(rendered).toContain(
      "CLI invocation/upload (opaque provider call) | 2.3 s | failure",
    );
    expect(rendered).toContain(
      "Remote build (READY required) | unavailable | not reached",
    );
    expect(rendered).toContain(
      "Exact-deployment promotion | unavailable | not reached",
    );
    expect(rendered).not.toContain(planted);
  } finally {
    if (previous === undefined) delete process.env.RELEASE_REPORT_PATH;
    else process.env.RELEASE_REPORT_PATH = previous;
    rmSync(root, { recursive: true, force: true });
  }
});
test("phase summary marks an interrupted build incomplete and never assumes later phases passed", () => {
  const rendered = summary(
    [
      { event: "phase", phase: "remote-build", outcome: "started" },
      {
        event: "phase",
        phase: "SENSITIVE_PHASE_DO_NOT_LOG",
        outcome: "success",
        durationMs: 1,
      },
      {
        event: "auth-probe",
        operation: "vercel.team",
        succeeded: false,
        status: "SENSITIVE_STATUS_DO_NOT_LOG",
      },
    ],
    { evidenceSha256: "b".repeat(64) },
  );
  expect(rendered).toContain(
    "Remote build (READY required) | unavailable | incomplete",
  );
  expect(rendered).toContain("Public verification | unavailable | not reached");
  expect(rendered).toContain("Protected credential: not observed");
  expect(rendered).not.toContain("SENSITIVE_");
});
test("report labels reject coercible objects without serializing their hidden fields", () => {
  const root = mkdtempSync(join(tmpdir(), "coercible-report-label-"));
  const previous = process.env.RELEASE_REPORT_PATH;
  try {
    const path = join(root, "report.jsonl");
    process.env.RELEASE_REPORT_PATH = path;
    const planted = "PRIVATE_COERCIBLE_OBJECT_DO_NOT_STORE";
    const forged = (label: string) => ({
      toString: () => label,
      secret: planted,
    });
    reportCodeEvent({ event: "context", operation: forged("deploy") });
    reportCodeEvent({
      event: "auth-probe",
      operation: forged("vercel.user"),
      succeeded: true,
    });
    reportCodeEvent({
      event: "phase",
      phase: forged("remote-build"),
      outcome: "success",
    });
    reportCodeEvent({
      event: "phase",
      phase: "remote-build",
      outcome: forged("success"),
    });
    const stored = readFileSync(path, "utf8");
    expect(stored).not.toContain(planted);
    expect(
      stored
        .trim()
        .split("\n")
        .map((line) => JSON.parse(line)),
    ).toEqual([{ event: "context" }]);
  } finally {
    if (previous === undefined) delete process.env.RELEASE_REPORT_PATH;
    else process.env.RELEASE_REPORT_PATH = previous;
    rmSync(root, { recursive: true, force: true });
  }
});
test("readable provider messages survive nested storage while Markdown, HTML and planted credentials stay inert", () => {
  const root = mkdtempSync(join(tmpdir(), "provider-message-report-"));
  const previous = process.env.RELEASE_REPORT_PATH;
  try {
    const path = join(root, "report.jsonl");
    process.env.RELEASE_REPORT_PATH = path;
    reportCodeEvent({
      event: "failure",
      diagnostic: {
        guard: "vercel.stage",
        category: "invariant",
        reconciliation: "not-found",
        originalFailure: {
          guard: "vercel.stage",
          operation: "vercel.stage",
          category: "process",
          exitStatus: 1,
          provider: {
            code: "upload_limit_reached",
            message:
              "Upload refused: <b>limit</b> [inspect](https://private.invalid/?token=PRIVATE_LINK_CREDENTIAL).\nAuthorization: Bearer PRIVATE_HEADER_CREDENTIAL\nCookie: PRIVATE_COOKIE_CREDENTIAL\nconnection_string=postgres://fixture:PRIVATE_DB_CREDENTIAL@localhost/db",
            body: "PRIVATE_BODY_CREDENTIAL",
          },
        },
      },
    });
    const stored = readFileSync(path, "utf8");
    for (const secret of [
      "PRIVATE_LINK_CREDENTIAL",
      "PRIVATE_HEADER_CREDENTIAL",
      "PRIVATE_COOKIE_CREDENTIAL",
      "PRIVATE_DB_CREDENTIAL",
      "PRIVATE_BODY_CREDENTIAL",
      "private.invalid",
      "postgres://",
    ])
      expect(stored).not.toContain(secret);
    const rendered = summary([JSON.parse(stored)], { production: "failure" });
    expect(rendered).toContain("Original provider failure");
    expect(rendered).toContain("provider.code=upload_limit_reached");
    expect(rendered).toContain(
      "Upload refused: &lt;b&gt;limit&lt;/b&gt; \\[inspect\\]",
    );
    expect(rendered).not.toContain("<b>");
    expect(rendered).not.toContain("[inspect](");
    expect(rendered).not.toContain("PRIVATE_");
    expect(rendered).not.toContain("\nAuthorization:");
  } finally {
    if (previous === undefined) delete process.env.RELEASE_REPORT_PATH;
    else process.env.RELEASE_REPORT_PATH = previous;
    rmSync(root, { recursive: true, force: true });
  }
});

test("ordinary preparation reuses CI rather than invoking another full validation or local build", () => {
  const stages = readFileSync("scripts/release/run-stage.mjs", "utf8");
  expect(stages).not.toMatch(/verify:source|verify:agent|\bbuild:|\brestore:/);
  expect(stages).toContain("Generating automatic release evidence");
});

test.each(["matched", "tampered", "missing"])(
  "executor checksum %s is classified before any protected execution",
  (mode) => {
    const root = mkdtempSync(join(tmpdir(), "executor-checksum-"));
    try {
      const directory = join(root, ".cache/release-tools");
      mkdirSync(directory, { recursive: true });
      const original = "reviewed executor fixture";
      if (mode !== "missing")
        writeFileSync(
          join(directory, "production-release.cjs"),
          mode === "tampered" ? "SENSITIVE_TAMPERED_DO_NOT_LOG" : original,
        );
      const report = join(root, "report.jsonl");
      const result = spawnSync(
        process.execPath,
        [resolve("scripts/release/verify-executor.mjs")],
        {
          cwd: root,
          encoding: "utf8",
          env: {
            ...process.env,
            RELEASE_REPORT_PATH: report,
            EXECUTOR_SHA256: createHash("sha256")
              .update(original)
              .digest("hex"),
          },
        },
      );
      expect(result.status).toBe(mode === "matched" ? 0 : 1);
      expect(result.stderr).not.toContain("SENSITIVE_TAMPERED_DO_NOT_LOG");
      if (mode !== "matched")
        expect(readFileSync(report, "utf8")).toContain(
          mode === "missing"
            ? "code.executor-unavailable"
            : "code.executor-digest",
        );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  },
);

test("JSON parse diagnostics retain the category while dropping source bytes", () => {
  expect(
    classifyCodeFailure(
      "manifest.validation",
      new SyntaxError("SENSITIVE_JSON_DO_NOT_LOG"),
    ),
  ).toEqual({ guard: "manifest.validation", category: "json" });
});
test.each(["permission_denied", "deploy_failed"])(
  "provider label %s survives reconciliation, report storage and final rendering; forged fields do not",
  (reason) => {
    const root = mkdtempSync(join(tmpdir(), "provider-report-"));
    const previous = process.env.RELEASE_REPORT_PATH;
    try {
      const path = join(root, "report.jsonl");
      process.env.RELEASE_REPORT_PATH = path;
      reportCodeEvent({
        event: "failure",
        diagnostic: {
          guard: "vercel.stage",
          category: "invariant",
          reconciliation: "not-found",
          originalFailure: {
            guard: "vercel.stage",
            category: "process",
            exitStatus: 1,
            provider: {
              reason,
              code: "forbidden",
              httpStatus: 403,
              message: "SENSITIVE_DO_NOT_LOG",
              body: "SENSITIVE_DO_NOT_LOG",
            },
          },
        },
      });
      const stored = readFileSync(path, "utf8");
      expect(stored).not.toContain("SENSITIVE_DO_NOT_LOG");
      const rendered = summary([JSON.parse(stored)], {});
      expect(rendered).toContain("reconciliation=not-found");
      expect(rendered).toContain(`provider.reason=${reason}`);
      expect(rendered).toContain("provider.code=forbidden");
      expect(rendered).toContain("provider.httpStatus=403");
      expect(
        summary(
          [
            {
              event: "failure",
              diagnostic: {
                provider: {
                  reason: "SENSITIVE_DO_NOT_LOG",
                  code: "SENSITIVE_DO_NOT_LOG",
                  message: "SENSITIVE_DO_NOT_LOG",
                  httpStatus: 999,
                },
              },
            },
          ],
          {},
        ),
      ).not.toContain("SENSITIVE_DO_NOT_LOG");
    } finally {
      if (previous === undefined) delete process.env.RELEASE_REPORT_PATH;
      else process.env.RELEASE_REPORT_PATH = previous;
      rmSync(root, { recursive: true, force: true });
    }
  },
);
test("one release summary includes verified evidence, stage timings and available deployment identity", () => {
  const text = summary(
    [
      context,
      {
        event: "artifact",
        sha256: "d".repeat(64),
        sizeBytes: 1234,
        buildAttempt: "1",
      },
      {
        event: "stage",
        label: "Running Jest validation",
        durationMs: 1200,
        outcome: "success",
      },
      { event: "deployment", deploymentId: "dpl_new" },
    ],
    { prepare: "success", production: "success" },
  );
  for (const value of [
    context.revision,
    context.settingsSha256,
    "1234 bytes",
    "1.2 s",
    "dpl_new",
    "None recorded.",
  ])
    expect(text).toContain(value);
  expect(text.match(/## Code-only production release/g)).toHaveLength(1);
});
test.each(["failure", "cancelled", "skipped"])(
  "early %s has safe outcome context without invented artifact measurements",
  (outcome) => {
    const text = summary([], {
      prepare: outcome,
      production: "skipped",
      revision: "a".repeat(40),
      manifestSha256: "b".repeat(64),
    });
    expect(text).toContain(`Preparation: ${outcome}`);
    expect(text).toContain("no verified new artifact");
    expect(text).toContain("Detailed diagnostics unavailable");
  },
);
test("summary redacts forged values while keeping safe invariant, HTTP and process context", () => {
  const sensitive = "SENSITIVE_PASSWORD_DO_NOT_LOG";
  const text = summary(
    [
      {
        ...context,
        revision: sensitive,
        settingsSha256: sensitive,
        previousDeployment: sensitive,
        evidenceUrl: sensitive,
      },
      { event: "stage", label: sensitive, durationMs: 1, outcome: sensitive },
      {
        event: "artifact",
        sha256: sensitive,
        sizeBytes: sensitive,
        buildAttempt: sensitive,
      },
      { event: "deployment", deploymentId: sensitive },
      {
        event: "failure",
        diagnostic: {
          guard: "artifact.validation",
          category: "invariant",
          invariant: "code.artifact-binding",
          stdout: sensitive,
          stderr: sensitive,
          fields: [{ path: sensitive }],
          originalFailure: {
            guard: "api.request",
            operation: "vercel.project",
            category: "http",
            status: 403,
            message: sensitive,
          },
        },
      },
      {
        event: "failure",
        diagnostic: {
          guard: sensitive,
          category: sensitive,
          invariant: sensitive,
          signal: sensitive,
          spawnErrorCode: sensitive,
        },
      },
    ],
    { prepare: sensitive, production: sensitive },
  );
  expect(text).not.toContain(sensitive);
  expect(text).toContain("check=code.artifact-binding");
  expect(text).toContain("operation=vercel.project; HTTP=403");
});

test.each([
  ["manifest.validation", "code.manifest-digest"],
  ["manifest.validation", "code.schema-evidence-expired"],
  ["github.application-binding", "code.application-sha"],
  ["build.configuration", "code.build-configuration"],
  ["artifact.validation", "code.artifact-binding"],
  ["health.staged", "code.health-owner-authorization"],
] as const)(
  "%s classifies the fixed %s check without arbitrary messages",
  (guard, code) => {
    expect(classifyCodeFailure(guard, new Error(code))).toEqual({
      guard,
      category: "invariant",
      invariant: code,
    });
  },
);

test("credential-free bundled executor runs outside the checkout without application dependencies", () => {
  const root = mkdtempSync(join(tmpdir(), "release-executor-"));
  const sensitive = "SENSITIVE_BUILD_INPUT_DO_NOT_LOG";
  try {
    const output = join(root, "outputs");
    const bundled = spawnSync(
      process.execPath,
      ["scripts/release/bundle-executor.mjs"],
      {
        encoding: "utf8",
        timeout: 30000,
        env: { ...process.env, GITHUB_OUTPUT: output },
      },
    );
    expect(bundled.error).toBeUndefined();
    expect(bundled.status).toBe(0);
    expect(readFileSync(output, "utf8")).toMatch(
      /^executor_sha256=[a-f0-9]{64}\n$/,
    );
    const executor = join(root, "executor.cjs");
    copyFileSync(".cache/release-tools/production-release.cjs", executor);
    const manifest = join(root, "manifest.json");
    writeFileSync(manifest, "{}");
    const result = spawnSync(process.execPath, [executor, "check"], {
      cwd: root,
      encoding: "utf8",
      env: {
        NODE_ENV: "test",
        PATH: process.env.PATH,
        RELEASE_EVIDENCE_PATH: manifest,
        RELEASE_SHA: "a".repeat(40),
        RELEASE_EVIDENCE_SHA256: "f".repeat(64),
        VERCEL_TOKEN: sensitive,
      },
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('"invariant":"code.evidence-digest"');
    expect(result.stderr).not.toContain(sensitive);
    expect(result.stderr).not.toContain("MODULE_NOT_FOUND");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("workflow reuses exact CI and carries only evidence and executor across the human gate", () => {
  const workflow = readFileSync(
    ".github/workflows/production-release.yml",
    "utf8",
  );
  const prepare = workflow.split("  production:\n")[0];
  const production = workflow
    .split("  production:\n")[1]
    .split("  summary:\n")[0];
  expect(workflow).not.toMatch(
    /verify:agent|verify:source|approved-prebuilt|build_artifact|run-stage\.mjs (build|restore)/,
  );
  expect(production).not.toMatch(/npm ci|npm exec|npx tsx/);
  expect(prepare).not.toContain("${{ secrets.VERCEL_RELEASE_TOKEN }}");
  expect(prepare).toContain("run-stage.mjs evidence");
  expect(production.indexOf("run-stage.mjs install-cli")).toBeLessThan(
    production.indexOf("${{ secrets.VERCEL_RELEASE_TOKEN }}"),
  );
  expect(production).toContain(
    "EXECUTOR_SHA256: ${{ needs.prepare.outputs.executor_sha256 }}",
  );
  expect(production).toContain(
    "name: ${{ needs.prepare.outputs.evidence_artifact }}",
  );
  expect(production).toContain(
    "RELEASE_EVIDENCE_SHA256: ${{ needs.prepare.outputs.evidence_sha256 }}",
  );
  expect(production).toContain("environment: production-release");
  expect(workflow).toContain("needs: [prepare, production]");
  expect(workflow.match(/name: Write one release summary/g)).toHaveLength(1);
});

test("native approval summary presents exact source, reused CI, workflow and compatibility risks", () => {
  const rendered = summary(
    [
      {
        ...context,
        evidenceSha256: "d".repeat(64),
        sourceSha256: "e".repeat(64),
        ciRunId: "123",
        workflowRunId: "456",
        workflowRevision: "a".repeat(40),
        compatibilityRisks: ["database-schema", "SENSITIVE_DO_NOT_LOG"],
        changedPaths: ["db/migrations/100_example.sql", "SENSITIVE$DO_NOT_LOG"],
      },
    ],
    { prepare: "failure", production: "pending" },
  );
  expect(rendered).toContain("Native source production release");
  expect(rendered).toContain("Reused exact-revision CI run: 123");
  expect(rendered).toContain("Workflow run: 456");
  expect(rendered).toContain("database-schema; ordinary release blocked");
  expect(rendered).toContain("db/migrations/100_example.sql");
  expect(rendered).not.toContain("Artifact SHA-256");
  expect(rendered).not.toContain("SENSITIVE");
});
