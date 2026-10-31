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
const publicHealthRequest = {
  initialOrigin: "https://tullyelly.com",
  effectiveOrigin: "https://www.tullyelly.com",
  responses: [
    {
      origin: "https://tullyelly.com",
      hop: 0,
      status: 307,
      timestamp: "2026-10-18T04:12:09.600Z",
      headers: {
        "x-vercel-id": "cle1::abc123-1792296729600-abcdef1234567890",
      },
    },
    {
      origin: "https://www.tullyelly.com",
      hop: 1,
      status: 403,
      timestamp: "2026-10-18T04:12:09.676Z",
      headers: {
        "x-vercel-id": "cle1::iad1::abc123-1792296729676-abcdef1234567890",
        "x-vercel-error": "FORBIDDEN",
        "x-vercel-mitigated": "challenge",
        "cf-ray": "abcdef1234567890-ORD",
      },
    },
  ],
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
test("public response correlation survives storage and rendering with only fixed origins and selected headers", () => {
  const root = mkdtempSync(join(tmpdir(), "health-trace-report-"));
  const previous = process.env.RELEASE_REPORT_PATH;
  const sensitive = "PRIVATE_RESPONSE_COOKIE_BODY_DO_NOT_STORE";
  try {
    const path = join(root, "report.jsonl");
    process.env.RELEASE_REPORT_PATH = path;
    const request = {
      ...publicHealthRequest,
      url: "https://private.invalid/" + sensitive,
      body: sensitive,
      responses: publicHealthRequest.responses.map((response) => ({
        ...response,
        body: sensitive,
        headers: {
          ...response.headers,
          cookie: sensitive,
          authorization: sensitive,
          "x-unlisted": sensitive,
          "cf-mitigated": sensitive,
        },
      })),
    };
    const event = {
      event: "failure",
      diagnostic: {
        guard: "health.public",
        category: "invariant",
        invariant: "code.health-page",
        status: 403,
        health: { path: "/", condition: "http-status", request },
      },
    };
    reportCodeEvent(event);
    const stored = readFileSync(path, "utf8");
    expect(stored).not.toContain(sensitive);
    expect(stored).not.toContain("private.invalid");
    expect(JSON.parse(stored).diagnostic.health.request).toEqual(
      publicHealthRequest,
    );
    for (const candidate of [JSON.parse(stored), event]) {
      const rendered = summary([candidate], { production: "failure" });
      expect(rendered).toContain("initial-origin=https://tullyelly.com");
      expect(rendered).toContain("effective-origin=https://www.tullyelly.com");
      expect(rendered).toContain(
        "hop=0 origin=https://tullyelly.com status=307 at=2026-10-18T04:12:09.600Z",
      );
      expect(rendered).toContain(
        "hop=1 origin=https://www.tullyelly.com status=403 at=2026-10-18T04:12:09.676Z",
      );
      for (const [name, value] of Object.entries(
        publicHealthRequest.responses[1].headers,
      ))
        expect(rendered).toContain(`${name}=${value}`);
      expect(rendered).not.toContain(sensitive);
      expect(rendered).not.toContain("private.invalid");
      expect(rendered).not.toContain("cookie=");
      expect(rendered).not.toContain("authorization=");
      expect(rendered).not.toContain("x-unlisted=");
    }
  } finally {
    if (previous === undefined) delete process.env.RELEASE_REPORT_PATH;
    else process.env.RELEASE_REPORT_PATH = previous;
    rmSync(root, { recursive: true, force: true });
  }
});
test.each([
  [
    "external initial origin",
    { ...publicHealthRequest, initialOrigin: "https://PRIVATE_ORIGIN.invalid" },
  ],
  [
    "external effective origin",
    {
      ...publicHealthRequest,
      effectiveOrigin: "https://PRIVATE_ORIGIN.invalid",
    },
  ],
  [
    "userinfo origin",
    {
      ...publicHealthRequest,
      initialOrigin: "https://PRIVATE_ORIGIN@tullyelly.com",
    },
  ],
  [
    "too many hops",
    {
      ...publicHealthRequest,
      responses: [
        ...publicHealthRequest.responses,
        { ...publicHealthRequest.responses[1], hop: 2 },
      ],
    },
  ],
  [
    "external response origin",
    {
      ...publicHealthRequest,
      responses: [
        {
          ...publicHealthRequest.responses[0],
          origin: "https://PRIVATE_ORIGIN.invalid",
        },
        publicHealthRequest.responses[1],
      ],
    },
  ],
  [
    "invalid timestamp",
    {
      ...publicHealthRequest,
      responses: [
        { ...publicHealthRequest.responses[0], timestamp: "PRIVATE_ORIGIN" },
        publicHealthRequest.responses[1],
      ],
    },
  ],
])(
  "%s correlation is rejected before report storage and again at rendering",
  (_label, request) => {
    const root = mkdtempSync(join(tmpdir(), "invalid-health-trace-"));
    const previous = process.env.RELEASE_REPORT_PATH;
    try {
      const path = join(root, "report.jsonl");
      process.env.RELEASE_REPORT_PATH = path;
      const event = {
        event: "failure",
        diagnostic: {
          guard: "health.public",
          category: "invariant",
          invariant: "code.health-page",
          status: 403,
          health: { path: "/", condition: "http-status", request },
        },
      };
      reportCodeEvent(event);
      const stored = readFileSync(path, "utf8");
      expect(stored).not.toContain("PRIVATE_ORIGIN");
      expect(JSON.parse(stored).diagnostic.health).toEqual({
        path: "/",
        condition: "http-status",
      });
      for (const candidate of [JSON.parse(stored), event]) {
        const rendered = summary([candidate], { production: "failure" });
        expect(rendered).toContain("HTTP=403; path=/; condition=http-status");
        expect(rendered).not.toContain("PRIVATE_ORIGIN");
        expect(rendered).not.toContain("initial-origin=");
        expect(rendered).not.toContain("effective-origin=");
        expect(rendered).not.toContain("hop=");
      }
    } finally {
      if (previous === undefined) delete process.env.RELEASE_REPORT_PATH;
      else process.env.RELEASE_REPORT_PATH = previous;
      rmSync(root, { recursive: true, force: true });
    }
  },
);
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
test("summary prominently distinguishes successful promotion followed by failed public verification", () => {
  const rendered = summary(
    [
      { event: "phase", phase: "promotion", outcome: "started" },
      {
        event: "phase",
        phase: "promotion",
        outcome: "success",
        durationMs: 7227,
      },
      { event: "phase", phase: "public-verification", outcome: "started" },
      {
        event: "phase",
        phase: "public-verification",
        outcome: "failure",
        durationMs: 99,
      },
    ],
    { evidenceSha256: "b".repeat(64), production: "failure" },
  );
  const notice = "**Production promoted; public verification pending.**";
  expect(rendered).toContain(notice);
  expect(rendered.indexOf(notice)).toBeLessThan(rendered.indexOf("Revision:"));
  expect(rendered).toContain("Exact-deployment promotion | 7.2 s | success");
  expect(rendered).toContain("Public verification | 0.1 s | failure");
  expect(rendered).toContain("protected operation: failure");
});
test.each([
  {
    label: "promotion incomplete",
    pending: false,
    events: [
      { event: "phase", phase: "promotion", outcome: "started" },
      { event: "phase", phase: "public-verification", outcome: "failure" },
    ],
  },
  {
    label: "promotion failed",
    pending: false,
    events: [
      { event: "phase", phase: "promotion", outcome: "failure" },
      { event: "phase", phase: "public-verification", outcome: "failure" },
    ],
  },
  {
    label: "public verification interrupted",
    pending: true,
    events: [
      { event: "phase", phase: "promotion", outcome: "success" },
      { event: "phase", phase: "public-verification", outcome: "started" },
    ],
  },
  {
    label: "public verification not reached",
    pending: true,
    events: [{ event: "phase", phase: "promotion", outcome: "success" }],
  },
  {
    label: "public verification passed",
    pending: false,
    events: [
      { event: "phase", phase: "promotion", outcome: "success" },
      { event: "phase", phase: "public-verification", outcome: "success" },
    ],
  },
  {
    label: "new public phase incomplete",
    pending: true,
    events: [
      { event: "phase", phase: "promotion", outcome: "success" },
      { event: "phase", phase: "public-verification", outcome: "failure" },
      { event: "phase", phase: "public-verification", outcome: "started" },
    ],
  },
  {
    label: "new promotion incomplete",
    pending: false,
    events: [
      { event: "phase", phase: "promotion", outcome: "success" },
      { event: "phase", phase: "promotion", outcome: "started" },
      { event: "phase", phase: "public-verification", outcome: "failure" },
    ],
  },
  {
    label: "old public failure predates latest promotion",
    pending: true,
    events: [
      { event: "phase", phase: "public-verification", outcome: "failure" },
      { event: "phase", phase: "promotion", outcome: "success" },
    ],
  },
])(
  "$label preserves the separate public-verification state",
  ({ events, pending }) => {
    const rendered = summary(events, {
      evidenceSha256: "b".repeat(64),
      production: "cancelled",
    });
    expect(
      rendered.includes("Production promoted; public verification pending."),
    ).toBe(pending);
    expect(rendered).toContain("protected operation: cancelled");
  },
);
test.each(["failure", "started", "absent"])(
  "a promoted release names %s public verification pending and gives a bound portable command",
  (outcome) => {
    const events = [
      {
        ...context,
        evidenceSha256: "b".repeat(64),
        workflowRunId: "123",
        workflowRunAttempt: "2",
      },
      { event: "deployment", deploymentId: "dpl_expected" },
      { event: "phase", phase: "promotion", outcome: "success" },
      ...(outcome === "absent"
        ? []
        : [{ event: "phase", phase: "public-verification", outcome }]),
    ];
    const output = summary(events, { production: "failure" });
    expect(output).toContain(
      "Production promoted; public verification pending.",
    );
    expect(output).toContain(
      `npm run --silent release:verify-public -- --run 123 --attempt 2 --deployment dpl_expected --sha ${"a".repeat(40)} --evidence release-evidence.json --location EXECUTION_LABEL`,
    );
    expect(output).toContain("Public verification execution: GitHub Actions");
    expect(output).toContain("protected operation: failure");
    expect(output).toContain("keep Bot Fight Mode enabled");
    expect(
      summary(
        [
          ...events,
          { event: "phase", phase: "public-verification", outcome: "success" },
        ],
        { production: "success" },
      ),
    ).not.toContain("public verification pending");
  },
);
test("untrusted run/attempt/deployment fields cannot enter a follow-up command", () => {
  const sensitive = "PRIVATE_VALUE_DO_NOT_RENDER";
  const output = summary(
    [
      { ...context, workflowRunId: sensitive, workflowRunAttempt: sensitive },
      { event: "deployment", deploymentId: sensitive },
      { event: "phase", phase: "promotion", outcome: "success" },
    ],
    {},
  );
  expect(output).toContain("public verification pending");
  expect(output).not.toContain("npm run release:verify-public");
  expect(output).not.toContain(sensitive);
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
        changedPaths: [
          "db/migrations/100_example.sql",
          "app/cardattack/clans/[slug]/page.tsx",
          "app/cardattack/tcdb-trade-partners/[id]/page.tsx",
          "SENSITIVE$DO_NOT_LOG",
        ],
      },
    ],
    { prepare: "failure", production: "pending" },
  );
  expect(rendered).toContain("Native source production release");
  expect(rendered).toContain("Reused exact-revision CI run: 123");
  expect(rendered).toContain("Workflow run: 456");
  expect(rendered).toContain("database-schema; ordinary release blocked");
  expect(rendered).toContain("db/migrations/100_example.sql");
  expect(rendered).toContain("app/cardattack/clans/[slug]/page.tsx");
  expect(rendered).toContain(
    "app/cardattack/tcdb-trade-partners/[id]/page.tsx",
  );
  expect(rendered).not.toContain("Artifact SHA-256");
  expect(rendered).not.toContain("SENSITIVE");
});

test("schema deferral is explicit at the existing gate and never permits analytics activation", () => {
  const event = {
    ...context,
    evidenceSha256: "d".repeat(64),
    schemaDeferralSha256: "e".repeat(64),
    compatibilityRisks: ["database-schema"],
    changedPaths: ["db/migrations/079_remove_clan_tag_slug.sql"],
  };
  const rendered = summary([event], {
    prepare: "success",
    production: "pending",
  });
  expect(rendered).toContain("Application-only schema deferral");
  expect(rendered).toContain("SQL is not applied");
  expect(rendered).toContain(
    "review compatibility at the human production gate",
  );
  expect(rendered).not.toContain("ordinary release blocked");
  expect(
    summary(
      [
        {
          ...event,
          compatibilityRisks: ["database-schema", "analytics-activation"],
        },
      ],
      { prepare: "failure", production: "pending" },
    ),
  ).toContain("ordinary release blocked");
});

test("analytics approval separates reviewed intent from observed state without inventing disabled proof", () => {
  const event = {
    ...context,
    evidenceSha256: "d".repeat(64),
    analyticsIntendedEnabled: true,
    analyticsIntentSha256: "e".repeat(64),
    analyticsTargetSha256: "f".repeat(64),
    analyticsDevelopmentReference: "WU-1212",
    analyticsProductionReference: "WU-1213",
    compatibilityRisks: ["analytics-maintenance", "analytics-activation"],
    changedPaths: ["lib/analytics-archive/collector.ts"],
  };
  const rendered = summary([event], {
    prepare: "success",
    production: "pending",
  });
  expect(rendered).toContain("Analytics intended collection: on");
  expect(rendered).toContain("development WU-1212; production WU-1213");
  expect(rendered).toContain(
    "promotion does not change its immutable environment",
  );
  expect(rendered).not.toContain("ordinary release blocked");
  expect(rendered).not.toContain("analytics remains disabled");
  expect(
    summary([{ ...event, analyticsProductionReference: undefined }], {}),
  ).toContain("ordinary release blocked");
  expect(
    summary([{ ...context, evidenceSha256: "d".repeat(64) }], {}),
  ).toContain("no disabled-state proof is inferred");
});

test("green deployment retains serialized pending reason and never reports public success", () => {
  const root = mkdtempSync(join(tmpdir(), "pending-release-"));
  const previous = process.env.RELEASE_REPORT_PATH;
  try {
    const path = join(root, "report.jsonl");
    process.env.RELEASE_REPORT_PATH = path;
    const diagnostic = classifyCodeFailure(
      "health.public",
      new CodeHealthError("/", 403, "security-challenge", {
        initialOrigin: "https://tullyelly.com",
        effectiveOrigin: "https://tullyelly.com",
        responses: [
          {
            origin: "https://tullyelly.com",
            hop: 0,
            status: 403,
            timestamp: "2026-10-18T16:45:10.176Z",
            headers: {
              "cf-mitigated": "challenge",
              "cf-ray": "a4c9030a7b8f6b31-DFW",
            },
          },
        ],
      }),
    );
    reportCodeEvent({
      ...context,
      evidenceSha256: "b".repeat(64),
      workflowRunId: "39145981617",
      workflowRunAttempt: "1",
    });
    reportCodeEvent({ event: "deployment", deploymentId: "dpl_intended" });
    reportCodeEvent({ event: "phase", phase: "promotion", outcome: "success" });
    reportCodeEvent({
      event: "phase",
      phase: "public-verification",
      outcome: "pending",
      durationMs: 123,
    });
    reportCodeEvent({
      event: "release-result",
      deploymentId: "dpl_intended",
      deployment_succeeded: true,
      public_verified: false,
      reason: { ...diagnostic, body: "PRIVATE_BODY" },
    });
    const stored = readFileSync(path, "utf8");
    expect(stored).not.toContain("PRIVATE_BODY");
    const events = stored
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line));
    expect(events.at(-1)).toMatchObject({
      event: "release-result",
      public_verified: false,
      publicVerification: "public verification pending",
      reason: { status: 403 },
    });
    const output = summary(events, {
      prepare: "success",
      production: "success",
    });
    expect(output).toContain(
      "Production promoted; public verification pending.",
    );
    expect(output).toContain(
      "Deployment succeeded: true; public_verified=false",
    );
    expect(output).toContain("cf-mitigated=challenge");
    expect(output).toContain("a4c9030a7b8f6b31-DFW");
    expect(output).toContain("Public verification | 0.1 s | pending");
    expect(output).not.toContain("Verified native source");
    expect(output).toContain("--run 39145981617 --attempt 1");
    reportCodeEvent({
      event: "release-result",
      deploymentId: "dpl_intended",
      deployment_succeeded: true,
      public_verified: false,
      reason: {
        ...diagnostic,
        health: { path: "/", condition: "security-challenge" },
      },
    });
    expect(readFileSync(path, "utf8")).toBe(stored);
    reportCodeEvent({
      event: "phase",
      phase: "staged-verification",
      outcome: "pending",
    });
    expect(readFileSync(path, "utf8")).toBe(stored);
  } finally {
    if (previous === undefined) delete process.env.RELEASE_REPORT_PATH;
    else process.env.RELEASE_REPORT_PATH = previous;
    rmSync(root, { recursive: true, force: true });
  }
});

test("post-promotion metadata failure reports separate confirmed and unresolved checkpoints", () => {
  const events = [
    { event: "deployment", deploymentId: "dpl_fixture" },
    ...[
      "deployment-creation",
      "remote-build",
      "staged-verification",
      "promotion-attempt",
    ].map((phase) => ({ event: "phase", phase, outcome: "success" })),
    { event: "phase", phase: "domain-assignment", outcome: "failure" },
    { event: "phase", phase: "promotion", outcome: "failure" },
  ];
  const output = summary(events, { production: "failure" });
  expect(output).toContain("Deployment creation: success.");
  expect(output).toContain("Build readiness: success.");
  expect(output).toContain("Promotion call: success.");
  expect(output).toContain("Domain assignment: failure.");
  expect(output).toContain("Public verification: unobserved.");
  expect(output).not.toContain("Deployment succeeded: true");
  expect(output).not.toContain("Production promoted;");
});
