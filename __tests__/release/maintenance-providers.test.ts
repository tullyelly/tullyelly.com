/** @jest-environment node */
import { createMaintenanceProviders } from "../../scripts/release/maintenance-providers";
import { maintenanceManifestSchema } from "../../scripts/release/maintenance";
import { settingsDigest } from "../../scripts/release/manifest";
const settings = {
  framework: "nextjs" as const,
  nodeVersion: "22.x" as const,
  buildCommand: null,
  installCommand: null,
  outputDirectory: null,
  rootDirectory: null,
};
const manifest = maintenanceManifestSchema.parse({
  version: 1,
  operationId: "fixture-maintenance",
  executorSha: "a".repeat(40),
  applicationSha: "b".repeat(40),
  neon: {
    projectId: "fixture-project",
    branchId: "br-fixture",
    host: "ep-fixture.us-east-2.aws.neon.tech",
    database: "fixture_db",
    role: "fixture_role",
  },
  vercel: {
    projectId: "prj_fixture",
    teamId: "team_fixture",
    deploymentId: "dpl_original",
    productionHost: "tullyelly.com",
    settings,
    settingsSha256: settingsDigest(settings),
  },
  evidence: {
    consumerMapConfirmed: true,
    isolationRehearsed: true,
    outageAccepted: true,
    backupVerifiedAt: new Date().toISOString(),
    backupEvidenceUrl: "https://example.com/fixture",
    expiresAt: new Date(Date.now() + 3600000).toISOString(),
  },
});
const fixtureUrl = new URL(
  `postgresql://${manifest.neon.host}/fixture_db?sslmode=require`,
);
fixtureUrl.username = "fixture_role";
fixtureUrl.password = "fixture-old";
const url = fixtureUrl.toString();
function setup(overrides: Record<string, unknown> = {}) {
  const envs = [
    { id: "db", key: "DATABASE_URL", target: ["production"], updatedAt: 1 },
    {
      id: "sync",
      key: "ANALYTICS_SYNC_ENABLED",
      target: ["production"],
      updatedAt: 1,
    },
  ];
  const values: Record<string, string> = { db: url, sync: "false" };
  const calls: { path: string; method: string; body?: unknown }[] = [];
  const responses: Record<string, unknown> = {
    "/v4/aliases/tullyelly.com": {
      alias: "tullyelly.com",
      projectId: "prj_fixture",
      deploymentId: "dpl_original",
    },
    "/v9/projects/prj_fixture": {
      id: "prj_fixture",
      accountId: "team_fixture",
      link: null,
      deployHooks: [],
      targets: { production: { id: "dpl_original" } },
      ...settings,
    },
    "/v13/deployments/dpl_original": {
      id: "dpl_original",
      projectId: "prj_fixture",
      target: "production",
      readyState: "READY",
      url: "fixture.vercel.app",
      meta: { githubCommitSha: manifest.applicationSha },
    },
    "/v9/projects/prj_fixture/domains": {
      domains: [{ name: "tullyelly.com", verified: true }],
    },
    "/v6/deployments": { deployments: [], pagination: { next: null } },
    "/projects/fixture-project/endpoints": {
      endpoints: [
        {
          branch_id: "br-fixture",
          host: manifest.neon.host,
          type: "read_write",
        },
      ],
    },
    "/projects/fixture-project/branches/br-fixture": {
      branch: { id: "br-fixture", project_id: "fixture-project" },
    },
    "/projects/fixture-project/branches/br-fixture/databases": {
      databases: [{ name: "fixture_db" }],
    },
    "/projects/fixture-project/branches/br-fixture/roles/fixture_role": {
      role: {
        name: "fixture_role",
        branch_id: "br-fixture",
        protected: false,
        authentication_method: "password",
        updated_at: "after",
      },
    },
    "/projects/fixture-project/branches/br-fixture/roles/fixture_role/reveal_password":
      { password: "fixture-new" },
    "/projects/fixture-project/branches/br-fixture/roles/fixture_role/reset_password":
      { operations: [{ id: "operation" }] },
    "/projects/fixture-project/operations/operation": {
      operation: { status: "finished" },
    },
    ...overrides,
  };
  const transport = jest.fn(
    async (raw: string | URL | Request, init?: RequestInit) => {
      const target = new URL(String(raw));
      let path = target.pathname;
      if (path.startsWith("/api/v2")) path = path.slice(7);
      const method = init?.method ?? "GET";
      const body = init?.body
        ? (JSON.parse(String(init.body)) as unknown)
        : undefined;
      calls.push({ path, method, body });
      if (
        ![
          "api.vercel.com",
          "console.neon.tech",
          "tullyelly.com",
          "www.tullyelly.com",
          "fixture.vercel.app",
        ].includes(target.hostname)
      )
        throw new Error("unexpected outbound origin");
      if (
        ["tullyelly.com", "www.tullyelly.com", "fixture.vercel.app"].includes(
          target.hostname,
        )
      )
        return new Response("fixture", { status: 200 });
      if (Object.hasOwn(overrides, path) && overrides[path] instanceof Response)
        return overrides[path] as Response;
      if (path === "/v9/projects/prj_fixture/env")
        return Response.json({ envs, pagination: { next: null } });
      if (path.startsWith("/v1/projects/prj_fixture/env/"))
        return Response.json({ value: values[path.split("/").at(-1)!] });
      if (
        method === "PATCH" ||
        (method === "POST" && path === "/v10/projects/prj_fixture/env")
      ) {
        const data = body as { key: string; value: string; target: string[] };
        const id = path.split("/").at(-1)!;
        if (method === "PATCH") values[id] = data.value;
        else {
          values[data.key] = data.value;
          envs.push({
            id: data.key,
            key: data.key,
            target: data.target,
            updatedAt: 2,
          });
        }
        return Response.json({});
      }
      if (path === "/v13/deployments/fixture.vercel.app")
        path = "/v13/deployments/dpl_original";
      if (!(path in responses)) throw new Error("unhandled fixture route");
      return Response.json(responses[path]);
    },
  );
  const connect = jest.fn(async (_raw: string, _rejection: boolean) => true);
  const cli = jest.fn(() => "https://fixture.vercel.app");
  const providers = createMaintenanceProviders(manifest, {
    neonToken: "fixture-neon-token",
    vercelToken: "fixture-vercel-token",
    directory: "/tmp/fixture",
    fetch: transport as typeof fetch,
    connect,
    cli,
  });
  return { providers, calls, transport, connect, cli, values, envs };
}
test("mocked adapters verify all targets without mutations then install only production credential and disabled switch", async () => {
  const f = setup();
  await expect(f.providers.guard(["dpl_original"])).resolves.toBe(
    "dpl_original",
  );
  expect(f.calls.every((c) => c.method === "GET")).toBe(true);
  await f.providers.reset();
  expect(f.calls.filter((c) => c.method === "POST")).toHaveLength(1);
  expect(await f.providers.role()).toEqual({
    revision: "after",
    password: "fixture-new",
  });
  const next = url.replace("fixture-old", "fixture-new");
  await f.providers.installRuntime(next);
  expect(await f.providers.runtime()).toEqual({
    url: next,
    id: "db",
    revision: 1,
  });
  expect(await f.providers.runtimeDisabled()).toBe(true);
  await f.providers.freshConnection(next);
  expect(f.connect).toHaveBeenCalledWith(next, false);
  expect(await f.providers.oldCredentialRejected(url)).toBe(true);
  // Read-back makes repeated runtime installation a no-op; no write-only success assumption.
  const writes = f.calls.filter((c) => c.method !== "GET").length;
  await f.providers.installRuntime(next);
  expect(f.calls.filter((c) => c.method !== "GET")).toHaveLength(writes);
});
test.each([401, 403, 429, 500])(
  "HTTP %i is classified without payload or retrying reset",
  async (status) => {
    const path =
      "/projects/fixture-project/branches/br-fixture/roles/fixture_role/reset_password";
    const f = setup({
      [path]: new Response("sensitive fixture payload", { status }),
    });
    await expect(f.providers.reset()).rejects.toMatchObject({
      category: "http",
      status,
      message: "Maintenance provider http; payload omitted",
    });
    expect(f.calls.filter((c) => c.method === "POST")).toHaveLength(1);
  },
);
test.each([
  [
    "/v9/projects/prj_fixture",
    {
      id: "prj_wrong",
      accountId: "team_fixture",
      link: null,
      deployHooks: [],
      targets: { production: { id: "dpl_original" } },
      ...settings,
    },
  ],
  [
    "/projects/fixture-project/endpoints",
    {
      endpoints: [
        { branch_id: "br_wrong", host: manifest.neon.host, type: "read_write" },
      ],
    },
  ],
  [
    "/projects/fixture-project/branches/br-fixture/databases",
    { databases: [{ name: "wrong" }] },
  ],
  [
    "/v6/deployments",
    { deployments: [{ readyState: "BUILDING" }], pagination: { next: null } },
  ],
  ["/v6/deployments", { deployments: [], pagination: { next: 42 } }],
])(
  "target drift or incomplete provider coverage at %s blocks writes",
  async (path, response) => {
    const f = setup({ [path as string]: response });
    await expect(f.providers.guard(["dpl_original"])).rejects.toThrow();
    expect(f.calls.every((c) => c.method === "GET")).toBe(true);
  },
);
test("runtime variables with shared scopes or branch overrides fail closed", async () => {
  const f = setup();
  f.envs[0].target.push("preview");
  await expect(f.providers.runtime()).rejects.toThrow();
  expect(f.calls.every((c) => c.method === "GET")).toBe(true);
});
test("failure after database update can recover remaining switch without repeating database write", async () => {
  const f = setup();
  f.values.sync = "true";
  const original = f.transport.getMockImplementation()!;
  let failed = false;
  f.transport.mockImplementation(async (raw, init) => {
    if (
      String(raw).includes("/env/sync") &&
      init?.method === "PATCH" &&
      !failed
    ) {
      failed = true;
      throw new Error("private payload");
    }
    return original(raw, init);
  });
  const next = url.replace("fixture-old", "fixture-new");
  await expect(f.providers.installRuntime(next)).rejects.toMatchObject({
    category: "transport",
  });
  expect(f.values.db).toBe(next);
  await f.providers.installRuntime(next);
  expect(
    f.calls.filter((c) => c.path.endsWith("/env/db") && c.method === "PATCH"),
  ).toHaveLength(1);
  expect(await f.providers.runtimeDisabled()).toBe(true);
});
test("deployment CLI cannot inherit database, Neon key or bypass credential", async () => {
  const f = setup();
  const journal = {
    version: 1 as const,
    binding: "c".repeat(64),
    manifestSha256: "d".repeat(64),
    buildSha256: "e".repeat(64),
    runId: "123",
    workflowSha: manifest.executorSha,
    phase: "stage-intent" as const,
    environmentId: "db",
    environmentRevision: 1,
    roleRevisionBefore: "before",
    oldRejected: true,
  };
  await f.providers.stage(journal);
  const [args, env] = f.cli.mock.calls[0] as unknown as [
    string[],
    NodeJS.ProcessEnv,
  ];
  expect(args).toContain("--skip-domain");
  expect(args).toContain("applicationSha=" + manifest.applicationSha);
  expect(Object.keys(env).sort()).toEqual(
    ["CI", "HOME", "NODE_ENV", "PATH", "VERCEL_TOKEN"].sort(),
  );
  expect(args.join(" ")).not.toMatch(
    /fixture-old|fixture-new|fixture-vercel-token|fixture-neon-token/,
  );
});
test("smoke follows only bounded HTTPS redirects; never sends bypass headers to an arbitrary host", async () => {
  const f = setup();
  const original = f.transport.getMockImplementation()!;
  f.transport.mockImplementation(async (raw, init) =>
    String(raw) === "https://tullyelly.com/"
      ? new Response(null, {
          status: 308,
          headers: { location: "https://www.tullyelly.com/" },
        })
      : original(raw, init),
  );
  await f.providers.smoke();
  expect(
    f.transport.mock.calls.some(
      ([raw]) => String(raw) === "https://www.tullyelly.com/",
    ),
  ).toBe(true);
  f.transport.mockImplementation(
    async () =>
      new Response(null, {
        status: 308,
        headers: { location: "https://attacker.invalid/" },
      }),
  );
  await expect(f.providers.smoke()).rejects.toMatchObject({
    category: "schema",
  });
});
test("separate preview database variables are preserved, while production-only target remains exact", async () => {
  const f = setup();
  f.envs.push({
    id: "preview",
    key: "DATABASE_URL",
    target: ["preview"],
    updatedAt: 1,
  });
  expect((await f.providers.runtime()).id).toBe("db");
  await f.providers.installRuntime(url.replace("fixture-old", "fixture-new"));
  expect(f.calls.some((c) => c.path.endsWith("/env/preview"))).toBe(false);
});
test("domain alias drift is authoritative even when the project's target metadata looks unchanged", async () => {
  const f = setup({
    "/v4/aliases/tullyelly.com": {
      alias: "tullyelly.com",
      projectId: "prj_fixture",
      deploymentId: "dpl_foreign",
    },
  });
  await expect(f.providers.guard(["dpl_original"])).rejects.toThrow();
  expect(f.calls.every((c) => c.method === "GET")).toBe(true);
});
test("wrong staged application identity or multiple matches cannot be promoted", async () => {
  const journal = {
    version: 1 as const,
    binding: "c".repeat(64),
    manifestSha256: "d".repeat(64),
    buildSha256: "e".repeat(64),
    runId: "123",
    workflowSha: manifest.executorSha,
    phase: "stage-intent" as const,
    environmentId: "db",
    environmentRevision: 1,
    roleRevisionBefore: "before",
    oldRejected: true,
  };
  const f = setup();
  await expect(
    f.providers.verifyDeployment("dpl_original", journal),
  ).rejects.toThrow();
  expect(f.cli).not.toHaveBeenCalled();
  const meta = {
    maintenanceOperation: manifest.operationId,
    maintenanceManifest: journal.manifestSha256,
  };
  const ambiguous = setup({
    "/v6/deployments": {
      deployments: [
        { uid: "dpl_a", meta },
        { uid: "dpl_b", meta },
      ],
      pagination: { next: null },
    },
  });
  await expect(ambiguous.providers.findDeployment(journal)).rejects.toThrow();
  expect(ambiguous.cli).not.toHaveBeenCalled();
});
test.each(["28P01", "08006", "42501"])(
  "old password rejection requires authentication status, not network/permission status %s",
  async (code) => {
    const { Client } = await import("pg");
    const connect = jest
      .spyOn(Client.prototype, "connect")
      .mockImplementation(async () => {
        throw Object.assign(new Error("private fixture failure"), { code });
      });
    const end = jest
      .spyOn(Client.prototype, "end")
      .mockImplementation(async () => undefined);
    try {
      const f = setup();
      const providers = createMaintenanceProviders(manifest, {
        neonToken: "fixture",
        vercelToken: "fixture",
        directory: "/tmp/fixture",
        fetch: f.transport as typeof fetch,
      });
      if (code === "28P01")
        await expect(providers.oldCredentialRejected(url)).resolves.toBe(true);
      else
        await expect(
          providers.oldCredentialRejected(url),
        ).rejects.toMatchObject({ category: "transport" });
      expect(end).toHaveBeenCalled();
    } finally {
      connect.mockRestore();
      end.mockRestore();
    }
  },
);
