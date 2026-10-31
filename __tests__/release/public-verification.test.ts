/** @jest-environment node */
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { verifyPublicRelease } from "../../scripts/release/public-verification";
import { settingsDigest, sha256 } from "../../scripts/release/manifest";
import {
  RELEASE_REPOSITORY,
  RELEASE_REPOSITORY_ID,
} from "../../scripts/release/app";
import type { NativeCodeEvidence } from "../../scripts/release/native-evidence";
import probe from "../../scripts/release/publication-probe.json";

const sha = "a".repeat(40);
const input = {
  run: "123",
  attempt: "2",
  deployment: "dpl_expected",
  sha,
  location: "cloud-agent-session",
};
const secret = "fixture-read-only-credential-never-report";
const asset = probe.assets[0];
function fixture(
  change: {
    run?: Record<string, unknown>;
    deployment?: Record<string, unknown>;
    meta?: Record<string, unknown>;
    alias?: string;
    aliasAfter?: string;
    homepage?: number;
    revision?: string;
    cron?: number;
    admin?: number;
    adminChallenge?: boolean;
    wrongAsset?: boolean;
    wrongPublication?: boolean;
    archive?:
      "empty" | "stale" | "wrong-title" | "outside" | "script" | "comment";
  } = {},
) {
  const settings = {
    framework: "nextjs" as const,
    nodeVersion: "22.x" as const,
    buildCommand: null,
    installCommand: null,
    outputDirectory: null,
    rootDirectory: null,
  };
  const evidence: NativeCodeEvidence = {
    version: 4,
    kind: "native-source",
    operation: "deploy",
    commit: sha,
    collectionEnabled: false,
    analyticsIntentSha256: "f".repeat(64),
    workflow: { sha, runId: "123", runAttempt: "2" },
    source: { sha256: "b".repeat(64) },
    ci: {
      runId: "122",
      runAttempt: "1",
      sha,
      workflowSha: sha,
      workflowPath: ".github/workflows/ci.yml",
      workflowId: "1",
      checkRunIds: ["1", "2"],
    },
    vercel: {
      projectId: "prj_lyZDCv46lEtMMZ4mCsuhjxxc0ACU",
      teamId: "team_pB5TcLa7apLtPAiVrRbcjBG3",
      productionDeploymentId: "dpl_previous",
      productionHost: "tullyelly.com",
      settings,
      settingsSha256: settingsDigest(settings),
    },
    baseline: { applicationSha: "c".repeat(40) },
    config: {
      protectionSha256: "d".repeat(64),
      environmentMetadataSha256: "e".repeat(64),
    },
    compatibility: { changedPaths: [], risks: [] },
    publication: {
      archive: { path: "/shaolin/target-newest", title: "Target newest" },
      chronicles: [
        {
          path: "/shaolin/changed",
          title: "changed",
          date: "2026-10-18",
          text: ["Bound changed text"],
        },
      ],
      assets: [{ path: asset, sha256: sha256(readFileSync(`public${asset}`)) }],
    },
  };
  const bytes = JSON.stringify(evidence);
  const digest = sha256(Buffer.from(bytes));
  const deployment = {
    id: input.deployment,
    url: "expected.vercel.app",
    projectId: evidence.vercel.projectId,
    target: "production",
    readyState: "READY",
    ...change.deployment,
    meta: {
      releaseSha: sha,
      githubCommitSha: sha,
      releaseEvidence: digest,
      releaseSourceSha256: evidence.source.sha256,
      releaseRunId: "123",
      releaseRunAttempt: "2",
      analyticsCollectionEnabled: "false",
      ...change.meta,
    },
  };
  const rendered = probe.assets.filter(
    (path) =>
      !probe.folders.some((folder) =>
        path.startsWith(`/images/optimus/${folder}/`),
      ) || path.endsWith("-0.webp"),
  );
  const article = `<h1>Oct 13, 2026: ${probe.title}</h1>${probe.text.join(" ")}${rendered.map((path) => `<img src="/_next/image?url=${encodeURIComponent(path)}&amp;w=640&amp;q=75" />`).join("")}${probe.folders.map(() => '<button data-testid="folder-carousel-thumbnail"></button>').join("")}<script>${JSON.stringify(probe.assets)}</script>`;
  const expectedLink = `<a href="${evidence.publication.archive.path}">${evidence.publication.archive.title}</a>`;
  const archiveRows = Array.from({ length: 10 }, (_, index) =>
    index === 0
      ? `<tr><td>${expectedLink}</td></tr>`
      : `<tr><td><a href="/shaolin/newer-${index}">Newer ${index}</a></td></tr>`,
  ).join("");
  const archive = `<table id="chronicles-table"><tbody>${
    change.archive === "empty" ||
    change.archive === "outside" ||
    change.archive === "script" ||
    change.archive === "comment"
      ? ""
      : change.archive === "stale"
        ? `<tr><td><a href="/shaolin/${probe.slug}">${probe.title}</a></td></tr>`
        : change.archive === "wrong-title"
          ? archiveRows.replace(
              expectedLink,
              `<a href="${evidence.publication.archive.path}">Wrong title</a>`,
            )
          : archiveRows
  }</tbody></table>${
    change.archive === "outside"
      ? `<nav>${expectedLink}</nav>`
      : change.archive === "script"
        ? `<script>${expectedLink}</script>`
        : change.archive === "comment"
          ? `<!-- ${expectedLink} -->`
          : ""
  }`;
  let aliasReads = 0;
  const fetcher = jest.fn(
    async (target: string | URL | Request, _init?: RequestInit) => {
      const url = new URL(String(target));
      if (url.hostname === "api.github.com")
        return Response.json({
          id: 123,
          run_attempt: 2,
          path: ".github/workflows/production-release.yml",
          event: "workflow_dispatch",
          head_branch: "main",
          head_sha: sha,
          status: "completed",
          repository: {
            id: RELEASE_REPOSITORY_ID,
            full_name: RELEASE_REPOSITORY,
          },
          ...change.run,
        });
      if (url.hostname === "api.vercel.com") {
        if (url.pathname.startsWith("/v9/projects/"))
          return Response.json({
            id: evidence.vercel.projectId,
            accountId: evidence.vercel.teamId,
            targets: { production: { id: input.deployment } },
          });
        if (url.pathname.startsWith("/v13/deployments/"))
          return Response.json(deployment);
        aliasReads++;
        return Response.json({
          alias: url.pathname.slice("/v4/aliases/".length),
          projectId: evidence.vercel.projectId,
          deploymentId:
            change.alias ??
            (aliasReads > 2 ? change.aliasAfter : undefined) ??
            input.deployment,
        });
      }
      if (url.origin === "https://tullyelly.com")
        return new Response(null, {
          status: 307,
          headers: {
            location: `https://www.tullyelly.com${url.pathname}${url.search}`,
          },
        });
      if (url.origin !== "https://www.tullyelly.com")
        throw Error("Unexpected public origin");
      if (url.pathname === "/" && change.homepage)
        return new Response("<!doctype html>" + secret, {
          status: change.homepage,
          headers: {
            "cf-ray": "a4c85ad72a9f6392-IAD",
            "cf-mitigated": "challenge",
            "set-cookie": secret,
          },
        });
      if (url.pathname === "/api/__version")
        return Response.json({ commitSha: change.revision ?? sha });
      if (url.pathname === "/api/health/analytics")
        return Response.json({
          version: 1,
          commitSha: sha,
          collectionEnabled: false,
          connection: "missing",
          configured: false,
          readinessChecked: false,
          schemaReady: false,
          ledgerReady: false,
          targetSha256: null,
        });
      if (url.pathname === "/api/health") return Response.json({ ok: true });
      if (url.pathname === "/api/cron/analytics")
        return new Response(null, { status: change.cron ?? 401 });
      if (url.pathname === "/mark2/admin/analytics")
        return new Response(null, {
          status: change.admin ?? 302,
          headers: {
            location: "/login",
            ...(change.adminChallenge ? { "cf-mitigated": "challenge" } : {}),
          },
        });
      if (
        url.pathname.startsWith("/images/") ||
        url.pathname === "/_next/image"
      ) {
        const path = url.searchParams.get("url") ?? url.pathname;
        return new Response(
          change.wrongAsset
            ? "wrong bytes"
            : (readFileSync(`public${path}`) as unknown as BodyInit),
          { headers: { "content-type": "image/webp" } },
        );
      }
      const html =
        url.pathname === "/shaolin/changed"
          ? `<h1>Oct 18, 2026: changed</h1>${change.wrongPublication ? "wrong text" : "Bound changed text"}<img src="${asset}" />`
          : url.pathname === "/shaolin"
            ? archive
            : url.pathname === `/shaolin/${probe.slug}`
              ? article
              : "public";
      return new Response("<!doctype html>" + html, {
        headers: { "content-type": "text/html" },
      });
    },
  );
  const verify = () =>
    verifyPublicRelease(input, bytes, {
      readToken: secret,
      githubToken: "github-read-only-fixture",
      fetcher,
    });
  return { evidence, bytes, fetcher, verify };
}

test("portable completion runs the complete shared acceptance and rechecks identities with GET-only metadata", async () => {
  const { verify, fetcher } = fixture();
  const result = await verify();
  expect(result).toMatchObject({
    ...input,
    state: "public verification passed",
    execution: {
      location: input.location,
      platform: process.platform,
      architecture: process.arch,
      node: process.version,
    },
  });
  const publicPaths: string[] = [];
  for (const [target, init] of fetcher.mock.calls) {
    const url = new URL(String(target));
    expect(init?.method).toBe("GET");
    if (url.hostname === "api.github.com") {
      expect(url.pathname).toBe(
        `/repos/${RELEASE_REPOSITORY}/actions/runs/123/attempts/2`,
      );
      expect(init?.headers).toMatchObject({
        Authorization: "Bearer github-read-only-fixture",
      });
    } else if (url.hostname === "api.vercel.com") {
      expect(url.searchParams.get("teamId")).toBe(
        "team_pB5TcLa7apLtPAiVrRbcjBG3",
      );
      expect(init?.headers).toMatchObject({
        Authorization: `Bearer ${secret}`,
      });
    } else {
      publicPaths.push(url.pathname);
      expect(init).toMatchObject({
        headers: {},
        credentials: "omit",
        redirect: "manual",
      });
    }
  }
  expect(publicPaths).toEqual(
    expect.arrayContaining([
      "/",
      "/stats",
      "/shaolin",
      "/api/__version",
      "/api/health",
      "/api/health/analytics",
      "/api/cron/analytics",
      "/mark2/admin/analytics",
      `/shaolin/${probe.slug}`,
      "/shaolin/changed",
      "/_next/image",
      ...probe.assets,
    ]),
  );
  expect(
    fetcher.mock.calls.filter(([u]) => String(u).includes("/v4/aliases/")),
  ).toHaveLength(4);
  expect(JSON.stringify(result)).not.toContain(secret);
});

test.each([
  "empty",
  "stale",
  "wrong-title",
  "outside",
  "script",
  "comment",
] as const)(
  "portable completion rejects a %s archive against the target evidence",
  async (archive) => {
    const { verify } = fixture({ archive });
    expect(await verify()).toMatchObject({
      state: "public verification pending",
      diagnostic: {
        guard: "health.public",
        invariant: "code.health-publication-listing",
        status: 200,
        publication: {
          path: "/shaolin",
          condition: "listing-mismatch",
        },
      },
    });
  },
);

test.each([
  { run: { id: 124 } },
  { run: { run_attempt: 1 } },
  { run: { head_sha: "f".repeat(40) } },
  { run: { path: ".github/workflows/public-health-diagnostic.yml" } },
  { run: { status: "in_progress" } },
  { deployment: { id: "dpl_other" } },
  { deployment: { readyState: "BUILDING" } },
  { meta: { releaseRunId: "124" } },
  { meta: { releaseRunAttempt: "1" } },
  { meta: { releaseSha: "f".repeat(40) } },
  { meta: { releaseEvidence: "f".repeat(64) } },
  { meta: { releaseSourceSha256: "f".repeat(64) } },
  { alias: "dpl_other" },
])(
  "mismatched run, attempt, deployment, SHA, evidence or alias never starts public probes %#",
  async (change) => {
    const { verify, fetcher } = fixture(change);
    expect((await verify()).state).toBe("public verification pending");
    expect(
      fetcher.mock.calls.every(([u]) =>
        new URL(String(u)).hostname.startsWith("api."),
      ),
    ).toBe(true);
  },
);

test.each([
  { revision: "unknown" },
  { cron: 200 },
  { admin: 200 },
  { admin: 403, adminChallenge: true },
  { homepage: 200 },
  { wrongAsset: true },
  { wrongPublication: true },
  { aliasAfter: "dpl_other" },
])(
  "revision, authorization, content, images and post-check alias drift remain incomplete %#",
  async (change) => {
    const { verify } = fixture(change);
    expect((await verify()).state).toBe("public verification pending");
  },
);

test.each(["local-agent", "cloud-agent", "another-execution-environment"])(
  "a Cloudflare challenge remains pending regardless of location %s",
  async (location) => {
    const { bytes, fetcher } = fixture({ homepage: 403 });
    const result = await verifyPublicRelease({ ...input, location }, bytes, {
      readToken: secret,
      fetcher,
    });
    expect(result).toMatchObject({
      state: "public verification pending",
      execution: { location },
      diagnostic: {
        guard: "health.public",
        status: 403,
        health: {
          path: "/",
          request: {
            effectiveOrigin: "https://www.tullyelly.com",
            responses: [
              { status: 307 },
              {
                status: 403,
                headers: {
                  "cf-mitigated": "challenge",
                  "cf-ray": "a4c85ad72a9f6392-IAD",
                },
              },
            ],
          },
        },
      },
    });
    expect(JSON.stringify(result)).not.toContain(secret);
    expect(
      fetcher.mock.calls.filter(
        ([u]) => !new URL(String(u)).hostname.startsWith("api."),
      ),
    ).toHaveLength(2);
  },
);

test("changed evidence and absent read-only credentials fail closed without network calls", async () => {
  const { evidence, bytes, fetcher } = fixture();
  expect((await verifyPublicRelease(input, bytes, { fetcher })).state).toBe(
    "public verification pending",
  );
  expect(fetcher).not.toHaveBeenCalled();
  evidence.workflow.runAttempt = "1";
  expect(
    (
      await verifyPublicRelease(input, JSON.stringify(evidence), {
        readToken: secret,
        fetcher,
      })
    ).state,
  ).toBe("public verification pending");
  expect(fetcher).not.toHaveBeenCalled();
});

test("execution labels cannot publish known credentials or arbitrary URLs", async () => {
  const { bytes, fetcher } = fixture();
  for (const location of [
    secret,
    "https://private.example",
    "/private/agent/path",
  ])
    await expect(
      verifyPublicRelease({ ...input, location }, bytes, {
        readToken: secret,
        fetcher,
      }),
    ).rejects.toThrow();
  expect(fetcher).not.toHaveBeenCalled();
});

test("a metadata permission error stays distinct from an anonymous public HTTP rejection", async () => {
  const { bytes } = fixture();
  const fetcher = jest.fn(async () => new Response(secret, { status: 403 }));
  const result = await verifyPublicRelease(input, bytes, {
    readToken: secret,
    fetcher,
  });
  expect(result).toMatchObject({
    state: "public verification pending",
    diagnostic: { guard: "api.request", category: "http", status: 403 },
  });
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(fetcher).toHaveBeenCalledWith(
    expect.stringContaining("api.github.com"),
    expect.objectContaining({
      method: "GET",
      credentials: "omit",
      headers: { Accept: "application/json" },
    }),
  );
  expect(JSON.stringify(result)).not.toContain(secret);
});

test("portable CLI rejects unsafe arguments and emits only bounded pending output", () => {
  const root = mkdtempSync(join(tmpdir(), "public-verification-cli-"));
  try {
    const path = join(root, secret + ".json");
    writeFileSync(path, "{}");
    for (const args of [
      [],
      ["--sha", secret],
      [
        "--run",
        "123",
        "--attempt",
        "2",
        "--sha",
        sha,
        "--deployment",
        "dpl_expected",
        "--location",
        "cloud-agent",
        "--evidence",
        path,
      ],
    ]) {
      const result = spawnSync(
        process.execPath,
        ["--import", "tsx", "scripts/verify-public-release.ts", ...args],
        {
          encoding: "utf8",
          timeout: 15000,
          env: {
            PATH: process.env.PATH,
            NODE_ENV: "test",
            VERCEL_TOKEN: secret,
            VERCEL_AUTOMATION_BYPASS_SECRET: secret,
          },
        },
      );
      expect(result.error).toBeUndefined();
      expect(result.status).toBe(1);
      expect(JSON.parse(result.stdout).state).toBe(
        "public verification pending",
      );
      expect(result.stdout + result.stderr).not.toContain(secret);
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("a completed failed run can pass only with the original evidence binding", async () => {
  const original = fixture({ run: { conclusion: "failure" } });
  expect(await original.verify()).toMatchObject({
    state: "public verification passed",
  });
  for (const [target, options] of original.fetcher.mock.calls) {
    expect(options?.method).toBe("GET");
    expect(String(target)).not.toContain("/promote");
  }
  const changed = fixture({
    run: { conclusion: "failure" },
    meta: { releaseEvidence: "0".repeat(64) },
  });
  expect(await changed.verify()).toMatchObject({
    state: "public verification pending",
  });
});
