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
import { classifyCodeFailure } from "../../scripts/release/code-diagnostics";
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

test("source validation records the real outer stage and isolates fixture process reports", () => {
  const root = mkdtempSync(join(tmpdir(), "release-source-timing-"));
  try {
    const observed = join(root, "observed.json"),
      report = join(root, "report.jsonl");
    writeFileSync(
      join(root, "npm"),
      `#!${process.execPath}\nconst fs=require('node:fs'); fs.writeFileSync(process.env.OBSERVED, JSON.stringify({args:process.argv.slice(2),reportPath:process.env.RELEASE_REPORT_PATH}));\n`,
      { mode: 0o700 },
    );
    const result = spawnSync(
      process.execPath,
      [resolve("scripts/release/run-stage.mjs"), "source"],
      {
        cwd: root,
        encoding: "utf8",
        env: {
          ...process.env,
          PATH: `${root}:${process.env.PATH}`,
          RELEASE_REPORT_PATH: report,
          VERCEL_CLI_VERSION: "63.1.2",
          OBSERVED: observed,
        },
      },
    );
    expect(result.status).toBe(0);
    expect(JSON.parse(readFileSync(observed, "utf8"))).toEqual({
      args: ["run", "verify:source"],
      reportPath: "",
    });
    const rows = readFileSync(report, "utf8")
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line));
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      event: "stage",
      label: "Validating release source",
      outcome: "success",
    });
    expect(rows[0].durationMs).toEqual(expect.any(Number));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
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
        RELEASE_MANIFEST_PATH: manifest,
        RELEASE_SHA: "a".repeat(40),
        RELEASE_MANIFEST_SHA256: "f".repeat(64),
        VERCEL_TOKEN: sensitive,
      },
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('"invariant":"code.manifest-digest"');
    expect(result.stderr).not.toContain(sensitive);
    expect(result.stderr).not.toContain("MODULE_NOT_FOUND");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("workflow builds once, reuses saved artifact evidence and keeps installs outside credentials", () => {
  const workflow = readFileSync(
    ".github/workflows/production-release.yml",
    "utf8",
  );
  const prepare = workflow.split("  production:\n")[0];
  const production = workflow
    .split("  production:\n")[1]
    .split("  summary:\n")[0];
  const stages = readFileSync("scripts/release/run-stage.mjs", "utf8");
  expect(stages).toContain('"verify:source"');
  expect(workflow).not.toContain("verify:agent");
  expect(workflow.match(/run-stage\.mjs build\b/g)).toHaveLength(1);
  expect(production).not.toMatch(
    /npm ci|npm exec|npx tsx|run-stage\.mjs build/,
  );
  expect(prepare).not.toContain("${{ secrets.");
  expect(production.indexOf("run-stage.mjs install-cli")).toBeLessThan(
    production.indexOf("${{ secrets.VERCEL_RELEASE_TOKEN }}"),
  );
  expect(production).toContain(
    "EXECUTOR_SHA256: ${{ needs.prepare.outputs.executor_sha256 }}",
  );
  expect(production).toContain(
    "name: ${{ needs.prepare.outputs.build_artifact }}",
  );
  expect(production).toContain(
    "RELEASE_BUILD_ATTEMPT: ${{ needs.prepare.outputs.build_attempt }}",
  );
  expect(production).toContain("environment: production-release");
  expect(workflow).not.toMatch(/^  (push|pull_request):/m);
  expect(workflow).toContain("cancel-in-progress: false");
  expect(workflow).toContain("needs: [prepare, production]");
  expect(workflow.match(/name: Write one release summary/g)).toHaveLength(1);
  expect(workflow).not.toContain("GITHUB_STEP_SUMMARY");
});
