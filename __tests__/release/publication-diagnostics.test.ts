/** @jest-environment node */
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  CodeDiagnosticError,
  CodeHealthError,
  CodePublicationError,
  classifyCodeFailure,
  codeGuard,
} from "../../scripts/release/code-diagnostics";
import { checkChangedPublicationHealth } from "../../scripts/release/code-publication-health";
import { reportCodeEvent } from "../../scripts/release/code-report";
import { confirmedCloudflareChallenge } from "../../scripts/release/health-observation.mjs";

function summary(events: object[]) {
  const result = spawnSync(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      `
        import { readFileSync } from 'node:fs';
        const { renderReleaseSummary } = await import(process.env.SUMMARY_MODULE);
        console.log(renderReleaseSummary(JSON.parse(readFileSync(0, 'utf8'))));
      `,
    ],
    {
      input: JSON.stringify(events),
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

const sensitive = "PRIVATE_PAGE_CONTENT_COOKIE_AND_EXPECTED_TEXT";
const path = "/shaolin/under-pressure";
const plan = {
  chronicles: [
    {
      path,
      title: "under pressure",
      date: "2026-10-18",
      text: ["Visible first sample", sensitive],
    },
  ],
  assets: [],
};

let directory: string;
let reportPath: string;
let previousReportPath: string | undefined;
beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), "publication-diagnostics-"));
  reportPath = join(directory, "report.jsonl");
  previousReportPath = process.env.RELEASE_REPORT_PATH;
  process.env.RELEASE_REPORT_PATH = reportPath;
});
afterEach(() => {
  if (previousReportPath === undefined) delete process.env.RELEASE_REPORT_PATH;
  else process.env.RELEASE_REPORT_PATH = previousReportPath;
  rmSync(directory, { recursive: true, force: true });
});

test("a real publication failure survives guarding, report storage and readable summary", async () => {
  const error = await codeGuard("health.staged", () =>
    checkChangedPublicationHealth(
      async () =>
        new Response(
          "<h1>Oct 18, 2026: under pressure</h1><p>Visible first sample</p>",
          { headers: { "content-type": "text/html", cookie: sensitive } },
        ),
      plan,
    ),
  ).catch((error: unknown) => error);
  expect(error).toBeInstanceOf(CodeDiagnosticError);
  const diagnostic = classifyCodeFailure("health.staged", error);
  expect(diagnostic).toMatchObject({
    guard: "health.staged",
    category: "invariant",
    invariant: "code.health-publication",
    publication: { path, condition: "text-mismatch", textSampleIndex: 1 },
  });
  Object.assign(diagnostic.publication!, {
    body: sensitive,
    expected: sensitive,
    actual: sensitive,
    headers: { authorization: sensitive },
    url: `https://private.example/?token=${sensitive}`,
  });
  reportCodeEvent({ event: "failure", diagnostic });
  const stored = readFileSync(reportPath, "utf8");
  expect(JSON.parse(stored).diagnostic.publication).toEqual({
    path,
    condition: "text-mismatch",
    textSampleIndex: 1,
  });
  const rendered = summary([JSON.parse(stored)]);
  expect(rendered).toContain(
    "check=code.health-publication; HTTP=200; path=/shaolin/under-pressure; condition=text-mismatch; text-sample=1",
  );
  for (const output of [stored, rendered]) {
    expect(output).not.toContain(sensitive);
    expect(output).not.toContain("private.example");
    expect(output).not.toContain("Visible first sample");
    expect(output).not.toContain("Oct 18, 2026");
  }
});

test("an unavailable publication retains its status and route without response content", async () => {
  const error = await checkChangedPublicationHealth(
    async () =>
      new Response(sensitive, {
        status: 503,
        headers: { "content-type": "text/html" },
      }),
    plan,
  ).catch((error: unknown) => error);
  expect(error).toBeInstanceOf(CodePublicationError);
  const diagnostic = classifyCodeFailure("health.public", error);
  expect(diagnostic).toEqual({
    guard: "health.public",
    category: "invariant",
    invariant: "code.health-publication",
    status: 503,
    publication: { path, condition: "http-status" },
  });
  reportCodeEvent({ event: "failure", diagnostic });
  const stored = readFileSync(reportPath, "utf8");
  expect(summary([JSON.parse(stored)])).toContain(
    "HTTP=503; path=/shaolin/under-pressure; condition=http-status",
  );
  expect(stored).not.toContain(sensitive);
});

test("optimized image failures report the trusted asset without its rendered query", async () => {
  const asset = "/images/optimus/under-pressure/photo.webp";
  const bytes = "approved image bytes";
  const read = jest.fn(async (requestPath: string) => {
    if (requestPath === path)
      return new Response(
        `<h1>Oct 18, 2026: under pressure</h1><p>Visible first sample</p><img src="/_next/image?url=${encodeURIComponent(asset)}&amp;w=640&amp;q=75&amp;token=${sensitive}" />`,
        { headers: { "content-type": "text/html" } },
      );
    return new Response(requestPath === asset ? bytes : sensitive, {
      status: requestPath === asset ? 200 : 503,
      headers: { "content-type": "image/webp" },
    });
  });
  const error = await codeGuard("health.staged", () =>
    checkChangedPublicationHealth(read, {
      chronicles: [{ ...plan.chronicles[0], text: ["Visible first sample"] }],
      assets: [
        {
          path: asset,
          sha256: createHash("sha256").update(bytes).digest("hex"),
        },
      ],
    }),
  ).catch((error: unknown) => error);
  const diagnostic = classifyCodeFailure("health.staged", error);
  expect(diagnostic).toEqual({
    guard: "health.staged",
    category: "invariant",
    invariant: "code.health-publication-asset",
    status: 503,
    publication: { path: asset, condition: "http-status" },
  });
  reportCodeEvent({ event: "failure", diagnostic });
  const stored = readFileSync(reportPath, "utf8");
  const rendered = summary([JSON.parse(stored)]);
  expect(rendered).toContain(`HTTP=503; path=${asset}; condition=http-status`);
  for (const output of [stored, rendered]) {
    expect(output).not.toContain(sensitive);
    expect(output).not.toContain("/_next/image");
    expect(output).not.toContain("url=");
  }
});

test.each([
  { path: "/shaolin", condition: "listing-mismatch" },
  { path, condition: "text-mismatch", textSampleIndex: 0 },
  { path, condition: "text-mismatch", textSampleIndex: 3 },
  {
    path: "/images/optimus/under-pressure/photo.webp",
    condition: "asset-hash",
  },
])("revalidates bounded publication observations: %j", (publication) => {
  const error = new CodeDiagnosticError({
    guard: "health.staged",
    category: "invariant",
    invariant: "code.health-publication",
  });
  Object.assign(error.diagnostic, { publication });
  const diagnostic = classifyCodeFailure("health.staged", error);
  expect(diagnostic.publication).toEqual(publication);
  reportCodeEvent({ event: "failure", diagnostic });
  expect(
    JSON.parse(readFileSync(reportPath, "utf8")).diagnostic.publication,
  ).toEqual(publication);
});

test("forged paths and conditions are discarded at classification, storage and final rendering", () => {
  const forged = [
    {
      path: `https://private.example/${sensitive}`,
      condition: "text-mismatch",
    },
    {
      path: `/shaolin/under-pressure?token=${sensitive}`,
      condition: "text-mismatch",
    },
    { path: `/images/../${sensitive}`, condition: "asset-hash" },
    { path: `/images/./${sensitive}`, condition: "asset-hash" },
    { path: `/images/%2e%2e/${sensitive}`, condition: "asset-hash" },
    {
      path: "/_next/image?url=%2Fimages%2Fa.webp&w=640&q=75",
      condition: "asset-empty",
    },
    { path: `/shaolin/${"a".repeat(501)}`, condition: "heading-mismatch" },
    { path, condition: sensitive },
    { path: [path], condition: "text-mismatch" },
    null,
  ].map((publication) => ({
    event: "failure",
    diagnostic: {
      guard: "health.public" as const,
      category: "invariant" as const,
      invariant: "code.health-publication",
      publication,
    },
  }));
  for (const event of forged) {
    const error = new CodeDiagnosticError({
      guard: "health.public",
      category: "invariant",
      invariant: "code.health-publication",
    });
    Object.assign(error.diagnostic, {
      publication: event.diagnostic.publication,
    });
    expect(
      classifyCodeFailure("health.public", error).publication,
    ).toBeUndefined();
    reportCodeEvent(event);
  }
  const stored = readFileSync(reportPath, "utf8");
  for (const line of stored.trim().split("\n"))
    expect(JSON.parse(line).diagnostic.publication).toBeUndefined();
  const rendered = summary(forged);
  for (const output of [stored, rendered]) {
    expect(output).not.toContain(sensitive);
    expect(output).not.toContain("private.example");
    expect(output).not.toContain("/_next/image");
    expect(output).not.toContain("condition=");
  }
});

test.each([-1, 4, 1.5, Number.MAX_SAFE_INTEGER, "1", sensitive])(
  "invalid sample index %p is removed while keeping the safe observation",
  (textSampleIndex) => {
    const diagnostic = classifyCodeFailure(
      "health.staged",
      new CodePublicationError(
        "code.health-publication",
        path,
        "text-mismatch",
      ),
    );
    Object.assign(diagnostic.publication!, { textSampleIndex });
    reportCodeEvent({ event: "failure", diagnostic });
    expect(
      JSON.parse(readFileSync(reportPath, "utf8")).diagnostic.publication,
    ).toEqual({
      path,
      condition: "text-mismatch",
    });
    expect(summary([{ event: "failure", diagnostic }])).not.toContain(
      "text-sample=",
    );
  },
);

test.each([
  "code.health-publication",
  "code.health-publication-asset",
  "code.health-publication-listing",
] as const)(
  "%s never qualifies as a pending Cloudflare challenge",
  (invariant) => {
    const publicationError = new CodePublicationError(
      invariant,
      path,
      "http-status",
      403,
    );
    expect(publicationError.message).toBe(invariant);
    const diagnostic = classifyCodeFailure("health.public", publicationError);
    const cloudflare = classifyCodeFailure(
      "health.public",
      new CodeHealthError("/", 403, "security-challenge", {
        initialOrigin: "https://tullyelly.com",
        effectiveOrigin: "https://tullyelly.com",
        responses: [
          {
            origin: "https://tullyelly.com",
            hop: 0,
            status: 403,
            timestamp: "2026-10-19T12:00:00.000Z",
            headers: {
              "cf-mitigated": "challenge",
              "cf-ray": "abcdef1234567890-ORD",
            },
          },
        ],
      }),
    );
    expect(confirmedCloudflareChallenge(cloudflare)).toBeDefined();
    diagnostic.health = cloudflare.health;
    expect(confirmedCloudflareChallenge(diagnostic)).toBeUndefined();
    reportCodeEvent({ event: "failure", diagnostic });
    const stored = readFileSync(reportPath, "utf8");
    const result = {
      event: "release-result",
      deploymentId: "dpl_intended",
      deployment_succeeded: true,
      public_verified: false,
      reason: diagnostic,
    };
    reportCodeEvent(result);
    expect(readFileSync(reportPath, "utf8")).toBe(stored);
    expect(summary([result, JSON.parse(stored)])).not.toContain(
      "Deployment succeeded: true; public_verified=false",
    );
  },
);
