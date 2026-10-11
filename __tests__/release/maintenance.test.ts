/** @jest-environment node */
import { readFileSync } from "node:fs";
import {
  assertMaintenanceUrl,
  executeMaintenance,
  maintenanceBinding,
  maintenanceManifestSchema,
  type MaintenanceManifest,
  type MaintenanceJournal,
  type MaintenanceProviders,
} from "../../scripts/release/maintenance";
import { settingsDigest } from "../../scripts/release/manifest";
import {
  dispatchInputSchema,
  dispatchPayload,
} from "../../scripts/release-dispatch";
import { modePermissions } from "../../scripts/release/app";

export function fixtureManifest(): MaintenanceManifest {
  const settings = {
    framework: "nextjs" as const,
    nodeVersion: "22.x" as const,
    buildCommand: null,
    installCommand: null,
    outputDirectory: null,
    rootDirectory: null,
  };
  return maintenanceManifestSchema.parse({
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
}
const manifest = fixtureManifest();
const context = {
  manifestSha256: "c".repeat(64),
  buildSha256: "d".repeat(64),
  runId: "123",
  workflowSha: "e".repeat(40),
  action: "rotate" as const,
};
const fixtureUrl = new URL(
  `postgresql://${manifest.neon.host}/fixture_db?sslmode=require`,
);
fixtureUrl.username = "fixture_role";
fixtureUrl.password = "fixture-original";
const original = fixtureUrl.toString();
const replacement = original.replace("fixture-original", "fixture-replacement");
type Fault = { point: string; after: boolean };
function fixture(fault?: Fault) {
  let journal: MaintenanceJournal | undefined;
  let password = "fixture-original",
    revision = "before",
    runtime = original;
  let disabled = true,
    current = "dpl_original",
    staged: string | undefined;
  let failed = false;
  const calls: string[] = [];
  async function mutation<T>(point: string, effect: () => T): Promise<T> {
    calls.push(point);
    const fail = fault?.point === point && !failed;
    if (fail && !fault.after) {
      failed = true;
      throw new Error("private fixture error");
    }
    const result = effect();
    if (fail) {
      failed = true;
      throw new Error("private fixture error");
    }
    return result;
  }
  const providers: MaintenanceProviders = {
    guard: async (allowed) => {
      if (!allowed.includes(current)) throw new Error("drift");
      return current;
    },
    readJournal: async () => journal,
    saveJournal: async (j) =>
      mutation(`checkpoint:${j.phase}`, () => {
        journal = structuredClone(j);
      }),
    runtime: async () => ({
      url: runtime,
      id: "env-db",
      revision: runtime === original ? 1 : 2,
    }),
    role: async () => ({ password, revision }),
    reset: async () =>
      mutation("reset", () => {
        password = "fixture-replacement";
        revision = "after";
      }),
    freshConnection: async (url) => {
      if (decodeURIComponent(new URL(url).password) !== password)
        throw new Error("connection");
    },
    oldCredentialRejected: async (url) =>
      decodeURIComponent(new URL(url).password) !== password,
    installRuntime: async (url) =>
      mutation("install", () => {
        runtime = url;
        disabled = true;
      }),
    runtimeDisabled: async () => disabled,
    findDeployment: async () => staged,
    stage: async () =>
      mutation("stage", () => {
        staged = "dpl_staged";
        return staged;
      }),
    verifyDeployment: async (id) => {
      if (id !== staged) throw new Error("identity");
    },
    smoke: async () => {},
    promote: async (id) =>
      mutation("promote", () => {
        current = id;
      }),
  };
  return {
    providers,
    calls,
    journal: () => journal,
    runtime: () => runtime,
    current: () => current,
    drift: () => {
      current = "dpl_unrelated";
    },
    enable: () => {
      disabled = false;
    },
  };
}
function recover(f: ReturnType<typeof fixture>) {
  const recovery = {
    ...manifest,
    recovery: {
      originalManifestSha256: context.manifestSha256,
      originalRunId: context.runId,
      buildSha256: context.buildSha256,
    },
  };
  return executeMaintenance(
    recovery,
    { ...context, action: "recover", runId: "456" },
    f.providers,
  );
}
test("normal replacement verifies rejection, preserves application identity and stores no credentials", async () => {
  const f = fixture();
  const result = await executeMaintenance(manifest, context, f.providers);
  expect(result.phase).toBe("complete");
  expect(result.oldRejected).toBe(true);
  expect(f.runtime()).toBe(replacement);
  expect(f.current()).toBe("dpl_staged");
  expect(f.calls.filter((c) => c === "reset")).toHaveLength(1);
  expect(JSON.stringify(result)).not.toMatch(
    /fixture-original|fixture-replacement|postgresql/,
  );
  expect(result.binding).toBe(maintenanceBinding(manifest));
});
test("a repeated rotate refuses the durable journal and cannot reset twice", async () => {
  const f = fixture();
  await executeMaintenance(manifest, context, f.providers);
  await expect(
    executeMaintenance(manifest, context, f.providers),
  ).rejects.toMatchObject({ boundary: "journal-read" });
  expect(f.calls.filter((c) => c === "reset")).toHaveLength(1);
});
const mutations = [
  "checkpoint:reset-intent",
  "reset",
  "checkpoint:reset",
  "checkpoint:verified",
  "install",
  "checkpoint:configured",
  "checkpoint:stage-intent",
  "stage",
  "checkpoint:staged",
  "checkpoint:promote-intent",
  "promote",
  "checkpoint:complete",
];
test.each(
  mutations.flatMap((point) =>
    [false, true].map((after) => ({ point, after })),
  ),
)(
  "fails closed at mutation $point after=$after; recovery never repeats uncertain writes",
  async (fault) => {
    const f = fixture(fault);
    await expect(
      executeMaintenance(manifest, context, f.providers),
    ).rejects.toThrow("Maintenance stopped");
    const canRecover = !(
      fault.point === "checkpoint:reset-intent" ||
      (fault.point === "reset" && !fault.after) ||
      (fault.point === "checkpoint:stage-intent" && fault.after) ||
      (fault.point === "stage" && !fault.after) ||
      (fault.point === "checkpoint:promote-intent" && fault.after) ||
      (fault.point === "promote" && !fault.after)
    );
    if (canRecover) expect((await recover(f)).phase).toBe("complete");
    else await expect(recover(f)).rejects.toThrow("Maintenance stopped");
    for (const point of ["reset", "stage", "promote"])
      expect(f.calls.filter((c) => c === point).length).toBeLessThanOrEqual(1);
  },
);
test("recovery of a completed operation verifies rather than mutating passwords/deployments", async () => {
  const f = fixture();
  await executeMaintenance(manifest, context, f.providers);
  await recover(f);
  for (const point of ["reset", "stage", "promote"])
    expect(f.calls.filter((c) => c === point)).toHaveLength(1);
});
test("drift and enabled analytics fail before any mutation", async () => {
  for (const configure of [
    (f: ReturnType<typeof fixture>) => f.drift(),
    (f: ReturnType<typeof fixture>) => f.enable(),
  ]) {
    const f = fixture();
    configure(f);
    await expect(
      executeMaintenance(manifest, context, f.providers),
    ).rejects.toThrow();
    expect(f.calls).toEqual([]);
  }
});
test("failed connection or old credential still accepted prevents configuration/promotion", async () => {
  const f = fixture();
  f.providers.oldCredentialRejected = async () => false;
  await expect(
    executeMaintenance(manifest, context, f.providers),
  ).rejects.toMatchObject({ boundary: "old-credential-rejection" });
  expect(f.calls).not.toContain("install");
  expect(f.calls).not.toContain("stage");
});
test("foreign recovery manifest/artifact is rejected before mutation", async () => {
  const f = fixture({ point: "install", after: false });
  await expect(
    executeMaintenance(manifest, context, f.providers),
  ).rejects.toThrow();
  const bad = {
    ...manifest,
    recovery: {
      originalManifestSha256: context.manifestSha256,
      originalRunId: context.runId,
      buildSha256: "f".repeat(64),
    },
  };
  const before = [...f.calls];
  await expect(
    executeMaintenance(bad, { ...context, action: "recover" }, f.providers),
  ).rejects.toMatchObject({ boundary: "journal-read" });
  expect(f.calls).toEqual(before);
});
test("manifest rejects SQL, secrets, shared/pooler/wrong database connections", () => {
  expect(() =>
    maintenanceManifestSchema.parse({ ...manifest, migrations: ["076"] }),
  ).toThrow();
  expect(() =>
    maintenanceManifestSchema.parse({ ...manifest, password: "fixture" }),
  ).toThrow();
  for (const raw of [
    original.replace("ep-fixture.", "ep-fixture-pooler."),
    original.replace("fixture_db", "wrong_db"),
    original.replace("require", "disable"),
    original + "&options=anything",
  ])
    expect(() => assertMaintenanceUrl(raw, manifest)).toThrow();
});
test("App dispatcher binds maintenance mode with no new App permissions", () => {
  const input = dispatchInputSchema.parse({
    mode: "maintenance",
    sha: manifest.executorSha,
    manifestPath: "maintenance/fixture.json",
    manifestSha256: context.manifestSha256,
    action: "rotate",
  });
  const config = {
    appId: "1",
    installationId: "2",
    slug: "fixture",
    botUserId: "3",
  };
  expect(dispatchPayload(input, config, "123")).toMatchObject({
    workflow: "credential-maintenance.yml",
    body: {
      ref: "main",
      inputs: {
        release_sha: manifest.executorSha,
        maintenance_action: "rotate",
        dispatch_installation_id: "2",
      },
    },
  });
  expect(modePermissions("maintenance")).toEqual(modePermissions("smoke"));
});
test("workflow confines production secrets to approved job and never invokes SQL/migrations", () => {
  const yaml = readFileSync(
    ".github/workflows/credential-maintenance.yml",
    "utf8",
  );
  const preparation = yaml.split("  maintenance:\n")[0];
  expect(preparation).not.toContain("secrets.");
  expect(yaml).toContain("environment: production-release");
  expect(yaml).toContain("group: production-release-tullyelly");
  expect(yaml).toContain("ref: ${{ steps.manifest.outputs.application_sha }}");
  expect(yaml).not.toMatch(
    /db-migrate|schema_migration|076_|077_|release-db|secrets: write/,
  );
  const cli = readFileSync("scripts/credential-maintenance.ts", "utf8");
  expect(cli.indexOf("await verifyHumanApproval(process.env)")).toBeLessThan(
    cli.indexOf("neonToken: required"),
  );
  expect(cli).toContain("await verifyChildDispatch(process.env)");
});
test("new deployment assignment before a recorded promotion attempt is drift", async () => {
  const f = fixture({ point: "checkpoint:staged", after: true });
  await expect(
    executeMaintenance(manifest, context, f.providers),
  ).rejects.toThrow();
  await f.providers.promote("dpl_staged");
  await expect(recover(f)).rejects.toMatchObject({
    boundary: "recovery-drift",
  });
});
test("credential/role drift immediately before reset prevents the reset", async () => {
  const f = fixture();
  const guard = f.providers.guard;
  let calls = 0;
  f.providers.guard = async (allowed) => {
    if (++calls === 2)
      f.providers.runtime = async () => ({
        url: original,
        id: "env-db",
        revision: 999,
      });
    return guard(allowed);
  };
  await expect(
    executeMaintenance(manifest, context, f.providers),
  ).rejects.toMatchObject({ boundary: "pre-reset-drift" });
  expect(f.calls).not.toContain("reset");
});
test("replacement connection failure cannot configure or promote", async () => {
  const f = fixture();
  const connection = f.providers.freshConnection;
  f.providers.freshConnection = async (url) => {
    if (url === replacement) throw new Error("private error");
    await connection(url);
  };
  await expect(
    executeMaintenance(manifest, context, f.providers),
  ).rejects.toMatchObject({ boundary: "replacement-connection" });
  expect(f.calls).not.toContain("install");
  expect(f.calls).not.toContain("promote");
});
test("deployment identity failure prevents promotion and reports only safe boundary", async () => {
  const f = fixture();
  f.providers.verifyDeployment = async () => {
    throw new Error("private password payload");
  };
  await expect(
    executeMaintenance(manifest, context, f.providers),
  ).rejects.toMatchObject({ boundary: "deployment-identity" });
  expect(f.calls).not.toContain("promote");
});
test.each([
  [3, "pre-configuration-drift", "install"],
  [4, "pre-stage-drift", "stage"],
  [5, "pre-promotion-drift", "promote"],
] as const)(
  "fresh credential drift at guard %i prevents %s and %s",
  async (at, boundary, mutation) => {
    const f = fixture();
    const guard = f.providers.guard;
    const role = f.providers.role;
    let calls = 0;
    f.providers.guard = async (allowed) => {
      if (++calls === at)
        f.providers.role = async () => ({
          ...(await role()),
          revision: "unreviewed",
        });
      return guard(allowed);
    };
    await expect(
      executeMaintenance(manifest, context, f.providers),
    ).rejects.toMatchObject({ boundary });
    expect(f.calls).not.toContain(mutation);
  },
);
