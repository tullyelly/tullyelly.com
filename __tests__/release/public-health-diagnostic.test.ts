/** @jest-environment node */
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const script = resolve("scripts/diagnose-public-health.ts");
const apex = "https://tullyelly.com";
const www = "https://www.tullyelly.com";
const sensitive = "fixture-sensitive-value";

function fixture(fetchBody: string) {
  const result = spawnSync(
    process.execPath,
    [
      "--import",
      "tsx",
      "--input-type=module",
      "--eval",
      `
        import { diagnosePublicHealth } from ${JSON.stringify(pathToFileURL(script).href)};
        const requests = [], signals = [], deadlines = [];
        const timeout = AbortSignal.timeout;
        AbortSignal.timeout = (ms) => { deadlines.push(ms); return timeout(ms); };
        const reports = await diagnosePublicHealth(async (input, init) => {
          const url = String(input);
          if (!signals.includes(init.signal)) signals.push(init.signal);
          requests.push({url, init: {...init, signal: signals.indexOf(init.signal)}});
          ${fetchBody}
        });
        console.log(JSON.stringify({reports, requests, deadlines}));
      `,
    ],
    {
      encoding: "utf8",
      timeout: 15000,
      env: { PATH: process.env.PATH, NODE_ENV: "test" },
    },
  );
  expect(result.error).toBeUndefined();
  expect(result.status).toBe(0);
  expect(result.stderr).toBe("");
  return JSON.parse(result.stdout);
}

test("compares both fixed origins using the production request policy and one deadline across the allowed redirect", () => {
  const result = fixture(`
    if (url === "${apex}/")
      return new Response(null, {status: 307, headers: {location: "${www}/"}});
    return new Response("<!DOCTYPE html><html>public</html>");
  `);
  expect(result.deadlines).toEqual([30000, 30000]);
  expect(result.requests).toEqual([
    {
      url: `${apex}/`,
      init: {
        method: "GET",
        redirect: "manual",
        credentials: "omit",
        headers: {},
        signal: 0,
      },
    },
    {
      url: `${www}/`,
      init: {
        method: "GET",
        redirect: "manual",
        credentials: "omit",
        headers: {},
        signal: 0,
      },
    },
    {
      url: `${www}/`,
      init: {
        method: "GET",
        redirect: "manual",
        credentials: "omit",
        headers: {},
        signal: 1,
      },
    },
  ]);
  expect(result.reports).toEqual([
    {
      initialOrigin: apex,
      outcome: "success",
      status: 200,
      trace: {
        initialOrigin: apex,
        effectiveOrigin: www,
        responses: [
          {
            origin: apex,
            hop: 0,
            status: 307,
            timestamp: expect.any(String),
            headers: {},
          },
          {
            origin: www,
            hop: 1,
            status: 200,
            timestamp: expect.any(String),
            headers: {},
          },
        ],
      },
    },
    {
      initialOrigin: www,
      outcome: "success",
      status: 200,
      trace: {
        initialOrigin: www,
        effectiveOrigin: www,
        responses: [
          {
            origin: www,
            hop: 0,
            status: 200,
            timestamp: expect.any(String),
            headers: {},
          },
        ],
      },
    },
  ]);
});

test("rejects unsafe redirects, retains only the shared safe correlation trace and still probes the second origin", () => {
  const result = fixture(`
    if (url === "${apex}/") return new Response("${sensitive}", {
      status: 307,
      headers: {
        location: "https://unexpected.example/${sensitive}?token=${sensitive}",
        "set-cookie": "token=${sensitive}",
        authorization: "Bearer ${sensitive}",
        "x-vercel-error": "DEPLOYMENT_NOT_FOUND",
        "x-vercel-id": "iad1::iad1::abc12-1792315200000-abcdef012345",
        "x-unknown": "${sensitive}"
      }
    });
    return new Response("<!doctype html><html>public</html>");
  `);
  expect(result.requests.map((r: { url: string }) => r.url)).toEqual([
    `${apex}/`,
    `${www}/`,
  ]);
  expect(result.reports[0]).toMatchObject({
    outcome: "request-failed",
    status: 307,
    trace: {
      effectiveOrigin: apex,
      responses: [
        {
          headers: {
            "x-vercel-error": "DEPLOYMENT_NOT_FOUND",
            "x-vercel-id": "iad1::iad1::abc12-1792315200000-abcdef012345",
          },
        },
      ],
    },
  });
  expect(result.reports[1].outcome).toBe("success");
  expect(JSON.stringify(result.reports)).not.toContain(sensitive);
  expect(JSON.stringify(result.reports)).not.toContain("unexpected.example");
});

test("reports bounded network codes without exception text and continues after a transport failure", () => {
  const result = fixture(`
    if (url === "${apex}/") throw new TypeError("${sensitive}", {
      cause: {code: "ENOTFOUND", message: "${sensitive}", errors: [{code: "${sensitive}"}]}
    });
    return new Response("<!doctype html><html>public</html>");
  `);
  expect(result.reports[0]).toEqual({
    initialOrigin: apex,
    outcome: "request-failed",
    networkCauseCodes: ["ENOTFOUND"],
  });
  expect(result.reports[1].outcome).toBe("success");
  expect(JSON.stringify(result.reports)).not.toContain(sensitive);
});

test("keeps HTTP and missing-doctype failures separate while never publishing response bodies", () => {
  const result = fixture(`
    return new Response("${sensitive}", {status: url === "${apex}/" ? 403 : 200});
  `);
  expect(result.reports.map((r: { outcome: string }) => r.outcome)).toEqual([
    "http-status",
    "missing-doctype",
  ]);
  expect(result.reports.map((r: { status: number }) => r.status)).toEqual([
    403, 200,
  ]);
  expect(JSON.stringify(result.reports)).not.toContain(sensitive);
});

test.each([true, false])(
  "actual ESM entry point exits according to both homepage outcomes; success=%s",
  (success) => {
    const root = mkdtempSync(join(tmpdir(), "public-health-cli-"));
    const preload = join(root, "fetch-fixture.mjs");
    try {
      writeFileSync(
        preload,
        `globalThis.fetch = async (input) => new Response("${success ? "<!doctype html><html>public</html>" : sensitive}", {status: String(input).startsWith("${apex}/") && ${!success} ? 403 : 200});`,
      );
      const result = spawnSync(
        process.execPath,
        ["--import", "tsx", "--import", preload, script],
        {
          encoding: "utf8",
          timeout: 15000,
          env: { PATH: process.env.PATH, NODE_ENV: "test" },
        },
      );
      expect(result.error).toBeUndefined();
      expect(result.status).toBe(success ? 0 : 1);
      expect(result.stderr).toBe("");
      const reports = result.stdout
        .trim()
        .split("\n")
        .map((line) => JSON.parse(line));
      expect(reports).toHaveLength(2);
      expect(
        reports.map((r: { initialOrigin: string }) => r.initialOrigin),
      ).toEqual([apex, www]);
      expect(result.stdout).not.toContain(sensitive);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  },
);

test("manual diagnostic workflow keeps the production runner and Node pins with read-only access and no release environment", () => {
  const workflow = readFileSync(
    ".github/workflows/public-health-diagnostic.yml",
    "utf8",
  );
  expect(workflow).toContain("workflow_dispatch:");
  expect(workflow).toContain("permissions:\n  contents: read");
  expect(workflow).toContain("runs-on: ubuntu-24.04");
  expect(workflow).toContain('node-version-file: ".nvmrc"');
  expect(workflow).toContain("npm ci --ignore-scripts");
  expect(workflow).toContain(
    "node --import tsx scripts/diagnose-public-health.ts",
  );
  expect(workflow).toContain(
    "actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1",
  );
  expect(workflow).toContain(
    "actions/setup-node@949feb2413d6458794dcd2491c4babbbce0c15c1",
  );
  expect(workflow).not.toMatch(
    /secrets\.|environment:|inputs:|production-release|deploy|upload-artifact|npm run build|GH_TOKEN|VERCEL_TOKEN/,
  );
});
