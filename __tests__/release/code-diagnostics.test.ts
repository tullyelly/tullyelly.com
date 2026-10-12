/** @jest-environment node */
import { z } from "zod";
import {
  CodeDiagnosticError,
  classifyCodeFailure,
  codeGuard,
  codeMetadataRequest,
} from "../../scripts/release/code-diagnostics";
import { GitHubApiError } from "../../scripts/release/app";
const sensitive = "SENSITIVE_PASSWORD_TOKEN_DO_NOT_LOG";
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
          RELEASE_MANIFEST_PATH: file,
          RELEASE_SHA: "a".repeat(40),
          RELEASE_MANIFEST_SHA256: crypto
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
