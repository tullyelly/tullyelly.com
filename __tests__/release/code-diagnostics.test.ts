/** @jest-environment node */
import { z } from "zod";
import {
  CodeDiagnosticError,
  CodeHealthError,
  classifyCodeFailure,
  codeGuard,
  codeMetadataRequest,
} from "../../scripts/release/code-diagnostics";
import { GitHubApiError } from "../../scripts/release/app";
import {
  observeHealthHeaders,
  safeHealthRequestTrace,
  type HealthRequestTrace,
} from "../../scripts/release/health-observation.mjs";
const sensitive = "SENSITIVE_PASSWORD_TOKEN_DO_NOT_LOG";
const publicTrace: HealthRequestTrace = {
  initialOrigin: "https://tullyelly.com",
  effectiveOrigin: "https://www.tullyelly.com",
  responses: [
    {
      origin: "https://tullyelly.com",
      hop: 0,
      status: 307,
      timestamp: "2026-10-18T04:12:09.000Z",
      headers: {},
    },
    {
      origin: "https://www.tullyelly.com",
      hop: 1,
      status: 403,
      timestamp: "2026-10-18T04:12:09.099Z",
      headers: { "cf-ray": "a4c80e51c8b91891-ORD" },
    },
  ],
};
test("public correlation survives reclassification without unrelated fields", () => {
  const request = {
    ...publicTrace,
    body: sensitive,
    url: `https://private.example/?token=${sensitive}`,
    responses: publicTrace.responses.map((r) => ({
      ...r,
      headers: {
        ...r.headers,
        cookie: sensitive,
        "set-cookie": sensitive,
        authorization: sensitive,
        "x-vercel-error": sensitive,
      },
      body: sensitive,
    })),
  };
  const diagnostic = classifyCodeFailure(
    "health.public",
    new CodeHealthError("/", 403, "http-status", request),
  );
  expect(diagnostic.health?.request).toEqual(publicTrace);
  expect(JSON.stringify(diagnostic)).not.toContain(sensitive);
  expect(JSON.stringify(diagnostic)).not.toContain("private.example");
});
test.each([
  { ...publicTrace, initialOrigin: "https://private.example/" + sensitive },
  {
    ...publicTrace,
    effectiveOrigin: "https://www.tullyelly.com/?token=" + sensitive,
  },
  {
    ...publicTrace,
    responses: [...publicTrace.responses, publicTrace.responses[1]],
  },
  { ...publicTrace, responses: [] },
  { ...publicTrace, responses: [{ ...publicTrace.responses[0], hop: 9 }] },
  { ...publicTrace, responses: [{ ...publicTrace.responses[0], status: 999 }] },
  {
    ...publicTrace,
    responses: [{ ...publicTrace.responses[0], timestamp: sensitive }],
  },
  {
    ...publicTrace,
    responses: [
      { ...publicTrace.responses[0], origin: "https://private.example" },
    ],
  },
  {
    ...publicTrace,
    responses: [
      { ...publicTrace.responses[0], status: 200 },
      publicTrace.responses[1],
    ],
  },
])("forged correlation is discarded before reporting %#", (request) => {
  expect(safeHealthRequestTrace(request)).toBeUndefined();
  const diagnostic = classifyCodeFailure(
    "health.public",
    new CodeHealthError("/", 403, "http-status", request),
  );
  expect(diagnostic.health).toEqual({ path: "/", condition: "http-status" });
  expect(JSON.stringify(diagnostic)).not.toContain(sensitive);
});
test("header collection reads only bounded allowlisted correlation and drops known bypass values", () => {
  const id = "cle1::abc12-1792331886740-bd412d2176fe";
  const get = jest.fn(
    (name: string) =>
      ({
        "x-vercel-id": id,
        "cf-ray": "a4c80e51c8b91891-ORD" + sensitive.repeat(30),
        "cf-mitigated": "challenge " + sensitive,
        "x-vercel-mitigated": "challenge\n" + sensitive,
        "x-vercel-error": sensitive,
      })[name] ?? sensitive,
  );
  expect(observeHealthHeaders({ get }, [id])).toEqual({});
  expect(get.mock.calls.map(([name]) => name)).toEqual([
    "x-vercel-id",
    "x-vercel-error",
    "x-vercel-mitigated",
    "cf-ray",
    "cf-mitigated",
  ]);
});
test("typed page health errors retain the original error code", () => {
  expect(() => {
    throw new CodeHealthError("/stats", 503, "http-status");
  }).toThrow("code.health-page");
});
test.each([
  { path: sensitive, condition: "http-status" },
  { path: "/stats?token=" + sensitive, condition: "http-status" },
  { path: "/stats", condition: sensitive },
])(
  "forged health observations cannot publish arbitrary paths or conditions",
  (health) => {
    const error = new CodeDiagnosticError({
      guard: "health.public",
      category: "invariant",
      invariant: "code.health-page",
      status: 503,
    });
    Object.assign(error.diagnostic, { health });
    const diagnostic = classifyCodeFailure("health.public", error);
    expect(diagnostic.health).toBeUndefined();
    expect(diagnostic.status).toBe(503);
    expect(JSON.stringify(diagnostic)).not.toContain(sensitive);
  },
);
test("health observations retain only the path and condition fields", () => {
  const error = new CodeDiagnosticError({
    guard: "health.public",
    category: "invariant",
    invariant: "code.health-page",
    status: 200,
    health: { path: "/api/health", condition: "health-not-ok" },
  });
  Object.assign(error.diagnostic.health!, {
    body: sensitive,
    headers: { cookie: sensitive },
    url: "https://private.example/" + sensitive,
  });
  const diagnostic = classifyCodeFailure("health.public", error);
  expect(diagnostic.health).toEqual({
    path: "/api/health",
    condition: "health-not-ok",
  });
  expect(JSON.stringify(diagnostic)).not.toContain(sensitive);
});
function fetcher(response: Response): typeof fetch {
  return jest.fn(async () => response);
}
test.each([401, 403, 404, 429, 503])(
  "HTTP %i reports only operation and status",
  async (status) => {
    const response = new Response(JSON.stringify({ message: sensitive }), {
      status,
    });
    const read = jest.spyOn(response, "json");
    try {
      await codeMetadataRequest(
        "https://api.vercel.com/v9/projects/private-target?teamId=" + sensitive,
        sensitive,
        fetcher(response),
      );
      throw Error("unexpected success");
    } catch (error) {
      expect(classifyCodeFailure("vercel.project", error)).toEqual({
        guard: "api.request",
        category: "http",
        operation: "vercel.project",
        status,
      });
      expect(
        JSON.stringify(classifyCodeFailure("vercel.project", error)),
      ).not.toContain(sensitive);
    }
    expect(read).not.toHaveBeenCalled();
  },
);
test("network errors retain only fixed cause codes", async () => {
  const fetch: typeof globalThis.fetch = jest.fn(async () => {
    throw Object.assign(Error(sensitive), {
      cause: { code: "ECONNRESET", message: sensitive },
    });
  });
  await expect(
    codeMetadataRequest(
      "https://api.vercel.com/v6/deployments",
      sensitive,
      fetch,
    ),
  ).rejects.toMatchObject({
    diagnostic: {
      operation: "vercel.history",
      category: "transport",
      networkCauseCodes: ["ECONNRESET"],
    },
  });
});
test.each([
  ["/actions/workflows/ci.yml", "github.ci-workflow"],
  ["/actions/workflows/ci.yml/runs?head_sha=secret", "github.ci-runs"],
  ["/check-suites/123/check-runs", "github.ci-checks"],
  ["/rules/branches/main", "github.rules"],
])(
  "required validation API %s retains a safe operation label",
  async (path, operation) => {
    try {
      await codeMetadataRequest(
        `https://api.github.com/repos/tullyelly/tullyelly.com${path}`,
        sensitive,
        fetcher(new Response(sensitive, { status: 403 })),
      );
      throw new Error("unexpected success");
    } catch (error) {
      const diagnostic = classifyCodeFailure("production.check", error);
      expect(diagnostic).toEqual({
        guard: "api.request",
        category: "http",
        operation,
        status: 403,
      });
      expect(JSON.stringify(diagnostic)).not.toContain(sensitive);
    }
  },
);
test("invalid JSON never exposes the response body", async () => {
  try {
    await codeMetadataRequest(
      "https://api.vercel.com/v10/projects/p/env",
      sensitive,
      fetcher(new Response(sensitive)),
    );
  } catch (error) {
    expect(classifyCodeFailure("vercel.environment", error)).toEqual({
      guard: "api.request",
      operation: "vercel.environment",
      category: "json",
    });
  }
});
test("validation retains known field names but redacts attacker-controlled keys and messages", async () => {
  const schema = z.object({
    envs: z.array(z.object({ key: z.string() })),
    meta: z.record(z.string(), z.number()),
  });
  try {
    await codeGuard("vercel.environment", () =>
      schema.parse({ envs: [{ key: 123 }], meta: { [sensitive]: sensitive } }),
    );
  } catch (error) {
    const d = classifyCodeFailure("production.check", error);
    expect(d.category).toBe("validation");
    expect(d.fields).toEqual([
      { path: "envs.[].key", code: "invalid_type" },
      { path: "meta.<field>", code: "invalid_type" },
    ]);
    expect(JSON.stringify(d)).not.toContain(sensitive);
  }
});
test("ordinary exceptions and misleading code-prefixed credentials are never logged", () => {
  expect(
    classifyCodeFailure("human.approval", Error("code." + sensitive)),
  ).toEqual({ guard: "human.approval", category: "unknown" });
  expect(
    classifyCodeFailure(
      "vercel.project",
      Error("Vercel project settings drift"),
    ),
  ).toEqual({
    guard: "vercel.project",
    category: "invariant",
    invariant: "code.project-settings-drift",
  });
});
test("forged structured errors cannot inject values into diagnostic fields", () => {
  const error = new CodeDiagnosticError({
    guard: "vercel.environment",
    category: "http",
    status: 403,
    networkCauseCodes: [sensitive, "EPIPE"],
    fields: [{ path: sensitive, code: sensitive }],
    invariant: sensitive,
  });
  const d = classifyCodeFailure("production.check", error);
  expect(JSON.stringify(d)).not.toContain(sensitive);
  expect(d.networkCauseCodes).toEqual(["EPIPE"]);
});
test("GitHub permissions are distinguished from Vercel permissions", () => {
  const d = classifyCodeFailure(
    "human.approval",
    new GitHubApiError("forbidden", 403),
  );
  expect(d.guard).toBe("human.approval");
  expect(d.status).toBe(403);
});
test("successful metadata reads preserve GET, timeout, and no-redirect restrictions", async () => {
  const mock = fetcher(new Response(JSON.stringify({ id: "project" })));
  await expect(
    codeMetadataRequest(
      "https://api.vercel.com/v9/projects/p",
      sensitive,
      mock,
    ),
  ).resolves.toEqual({ id: "project" });
  expect(mock).toHaveBeenCalledWith(
    expect.any(String),
    expect.objectContaining({
      method: "GET",
      redirect: "error",
      signal: expect.any(AbortSignal),
    }),
  );
});

test("a denied Vercel read preserves the actual bounded error without credentials", async () => {
  const response = new Response(
    JSON.stringify({
      error: {
        code: "permission_denied",
        message: `Project metadata read denied for token=${sensitive}; contact the project administrator.`,
      },
      headers: { authorization: sensitive },
    }),
    { status: 403 },
  );
  try {
    await codeMetadataRequest(
      "https://api.vercel.com/v9/projects/prj_fixture?teamId=team_fixture",
      sensitive,
      fetcher(response),
    );
    throw new Error("unexpected success");
  } catch (error) {
    const diagnostic = classifyCodeFailure("vercel.auth-rest", error);
    expect(diagnostic).toMatchObject({
      status: 403,
      operation: "vercel.project",
      provider: { code: "permission_denied" },
    });
    expect(diagnostic.provider?.message).toContain("metadata read denied");
    expect(JSON.stringify(diagnostic)).not.toContain(sensitive);
    expect(JSON.stringify(diagnostic)).not.toContain("authorization");
  }
});

test("an unreadable Vercel error body cannot replace its HTTP status", async () => {
  const body = new ReadableStream({
    pull(controller) {
      controller.error(new Error(sensitive));
    },
  });
  await expect(
    codeMetadataRequest(
      "https://api.vercel.com/v9/projects/prj_fixture",
      sensitive,
      fetcher(new Response(body, { status: 503 })),
    ),
  ).rejects.toMatchObject({
    diagnostic: { status: 503, operation: "vercel.project", category: "http" },
  });
});

test("actual release startup emits no sensitive manifest or environment values", () => {
  const fs = require("node:fs") as typeof import("node:fs");
  const os = require("node:os") as typeof import("node:os");
  const path = require("node:path") as typeof import("node:path");
  const crypto = require("node:crypto") as typeof import("node:crypto");
  const child =
    require("node:child_process") as typeof import("node:child_process");
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "safe-release-startup-"));
  try {
    const file = path.join(root, sensitive);
    const bytes = JSON.stringify({ version: sensitive });
    fs.writeFileSync(file, bytes);
    const r = child.spawnSync(
      process.execPath,
      ["--import", "tsx", "scripts/production-release.ts", "check"],
      {
        env: {
          ...process.env,
          RELEASE_EVIDENCE_PATH: file,
          RELEASE_SHA: "a".repeat(40),
          RELEASE_EVIDENCE_SHA256: crypto
            .createHash("sha256")
            .update(bytes)
            .digest("hex"),
          VERCEL_TOKEN: sensitive,
          GH_TOKEN: sensitive,
        },
        encoding: "utf8",
      },
    );
    expect(r.status).toBe(1);
    expect(r.stderr).toContain('"guard":"manifest.validation"');
    expect(r.stderr).toContain('"category":"validation"');
    expect(r.stderr).not.toContain(sensitive);
    expect(r.stdout).not.toContain(sensitive);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("forged process and nested reconciliation diagnostics are bounded and redacted", () => {
  const diagnostic = {
    guard: "vercel.stage" as const,
    category: "process" as const,
    exitStatus: Number.NaN,
    signal: sensitive,
    spawnErrorCode: sensitive,
    originalFailure: {
      guard: "vercel.stage" as const,
      category: "process" as const,
      signal: sensitive,
    },
  };
  Object.assign(diagnostic.originalFailure, { originalFailure: diagnostic });
  const safe = classifyCodeFailure(
    "production.check",
    new CodeDiagnosticError(diagnostic),
  );
  expect(JSON.stringify(safe)).not.toContain(sensitive);
  expect(safe.exitStatus).toBeUndefined();
  expect(safe.originalFailure?.originalFailure).toBeUndefined();
});

describe("bounded alias GET retries", () => {
  const url = "https://api.vercel.com/v4/aliases/tullyelly.com";
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());
  test("timeout then success preserves GET and recovers once", async () => {
    const fetcher = jest
      .fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>()
      .mockRejectedValueOnce(new DOMException(sensitive, "TimeoutError"))
      .mockResolvedValue(Response.json({ alias: "tullyelly.com" }));
    const result = codeMetadataRequest(url, sensitive, fetcher);
    await jest.runAllTimersAsync();
    await expect(result).resolves.toEqual({ alias: "tullyelly.com" });
    expect(fetcher).toHaveBeenCalledTimes(2);
    for (const [, options] of fetcher.mock.calls)
      expect(options).toMatchObject({
        method: "GET",
        redirect: "error",
        credentials: "omit",
      });
  });
  test("persistent timeouts stop at three attempts and remain blocking", async () => {
    const fetcher = jest
      .fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>()
      .mockRejectedValue(new DOMException(sensitive, "TimeoutError"));
    const result = codeMetadataRequest(url, sensitive, fetcher).catch(
      (error) => error,
    );
    await jest.runAllTimersAsync();
    expect(classifyCodeFailure("api.request", await result)).toEqual({
      guard: "api.request",
      operation: "vercel.alias",
      category: "transport",
      networkCauseCodes: ["TimeoutError"],
      aliasReadAttempts: 3,
    });
    expect(fetcher).toHaveBeenCalledTimes(3);
  });
  test("real attempt deadlines share a 45 second total budget", async () => {
    const started = Date.now();
    const fetcher = jest
      .fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>()
      .mockImplementation(
        (_url, options) =>
          new Promise((_resolve, reject) => {
            // Fixture models fetch respecting the deadline; fake timers cannot drive native AbortSignal.timeout.
            const remaining = Math.min(15000, 45000 - (Date.now() - started));
            expect(options?.signal).toBeDefined();
            setTimeout(
              () => reject(new DOMException("fixture", "TimeoutError")),
              remaining,
            );
          }),
      );
    const result = codeMetadataRequest(url, undefined, fetcher).catch(
      (error) => error,
    );
    await jest.runAllTimersAsync();
    expect(await result).toBeInstanceOf(CodeDiagnosticError);
    expect(fetcher).toHaveBeenCalledTimes(3);
    expect(Date.now() - started).toBe(45000);
  });
  test.each([401, 403, 400, 404, 500])(
    "HTTP %s is never retried",
    async (status) => {
      const fetcher = jest
        .fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>()
        .mockResolvedValue(new Response(null, { status }));
      await expect(
        codeMetadataRequest(url, undefined, fetcher),
      ).rejects.toBeInstanceOf(CodeDiagnosticError);
      expect(fetcher).toHaveBeenCalledTimes(1);
    },
  );
  test("malformed JSON and unknown transport errors are not retried", async () => {
    jest.useRealTimers();
    for (const response of [new Response("bad json"), new Error(sensitive)]) {
      const fetcher = jest
        .fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>()
        .mockImplementation(async () => {
          if (response instanceof Error) throw response;
          return response;
        });
      await expect(
        codeMetadataRequest(url, undefined, fetcher),
      ).rejects.toBeInstanceOf(CodeDiagnosticError);
      expect(fetcher).toHaveBeenCalledTimes(1);
    }
  });
  test("other metadata operations retain a single attempt", async () => {
    const fetcher = jest
      .fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>()
      .mockRejectedValue(new DOMException("fixture", "TimeoutError"));
    await expect(
      codeMetadataRequest(
        "https://api.vercel.com/v9/projects/fixture",
        undefined,
        fetcher,
      ),
    ).rejects.toThrow();
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});

test.each([429, 502, 503, 504])(
  "transient alias HTTP %s recovers with bounded GET retry",
  async (status) => {
    jest.useFakeTimers();
    try {
      const fetcher = jest
        .fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>()
        .mockResolvedValueOnce(new Response(null, { status }))
        .mockResolvedValueOnce(Response.json({ alias: "tullyelly.com" }));
      const result = codeMetadataRequest(
        "https://api.vercel.com/v4/aliases/tullyelly.com",
        undefined,
        fetcher,
      );
      await jest.runAllTimersAsync();
      await expect(result).resolves.toEqual({ alias: "tullyelly.com" });
      expect(fetcher).toHaveBeenCalledTimes(2);
    } finally {
      jest.useRealTimers();
    }
  },
);
