import { Client } from "pg";
import { spawnSync } from "node:child_process";
import { z } from "zod";
import { settingsDigest, settingsSchema } from "./manifest";
import {
  assertMaintenanceUrl,
  maintenanceJournalSchema,
  type MaintenanceManifest,
  type MaintenanceProviders,
  type MaintenanceJournal,
} from "./maintenance";

const JOURNAL = "CREDENTIAL_MAINTENANCE_STATE";
const envSchema = z.object({
  id: z.string(),
  key: z.string(),
  target: z.array(z.string()),
  gitBranch: z.string().nullable().optional(),
  updatedAt: z.number().int().nonnegative(),
});
const deploymentSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  target: z.literal("production"),
  readyState: z.string(),
  url: z.string().regex(/^[a-z0-9.-]+\.vercel\.app$/),
  meta: z.record(z.string(), z.unknown()),
});
export class MaintenanceProviderError extends Error {
  constructor(
    readonly category: "http" | "transport" | "schema" | "process",
    readonly status?: number,
  ) {
    super(`Maintenance provider ${category}; payload omitted`);
    this.name = "MaintenanceProviderError";
  }
}
export function createMaintenanceProviders(
  manifest: MaintenanceManifest,
  configuration: {
    neonToken: string;
    vercelToken: string;
    bypassSecret?: string;
    directory: string;
    fetch?: typeof fetch;
    cli?: (args: string[], env: NodeJS.ProcessEnv) => string;
    connect?: (url: string, rejection: boolean) => Promise<boolean>;
  },
): MaintenanceProviders {
  const transport = configuration.fetch ?? fetch;
  const req = async (
    provider: "neon" | "vercel",
    path: string,
    method = "GET",
    body?: unknown,
  ): Promise<unknown> => {
    if (!path.startsWith("/") || path.startsWith("//"))
      throw new MaintenanceProviderError("schema");
    const origin =
      provider === "neon"
        ? "https://console.neon.tech/api/v2"
        : "https://api.vercel.com";
    const query =
      provider === "vercel"
        ? `${path.includes("?") ? "&" : "?"}teamId=${encodeURIComponent(manifest.vercel.teamId)}`
        : "";
    let response: Response;
    try {
      response = await transport(origin + path + query, {
        method,
        headers: {
          Authorization: `Bearer ${provider === "neon" ? configuration.neonToken : configuration.vercelToken}`,
          Accept: "application/json",
          ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        redirect: "error",
        signal: AbortSignal.timeout(15000),
      });
    } catch {
      throw new MaintenanceProviderError("transport");
    }
    if (!response.ok)
      throw new MaintenanceProviderError("http", response.status);
    try {
      return await response.json();
    } catch {
      throw new MaintenanceProviderError("schema");
    }
  };
  const project = `/v9/projects/${manifest.vercel.projectId}`;
  const role = `/projects/${manifest.neon.projectId}/branches/${manifest.neon.branchId}/roles/${encodeURIComponent(manifest.neon.role)}`;
  const variables = async () => {
    const result = z
      .object({
        envs: z.array(envSchema),
        pagination: z.object({ next: z.number().nullable() }).optional(),
      })
      .parse(await req("vercel", project + "/env"));
    if (result.pagination?.next != null)
      throw new MaintenanceProviderError("schema");
    return result.envs;
  };
  const selected = async (key: string) => {
    const all = (await variables()).filter(
      (e) => e.key === key && e.target.includes("production"),
    );
    // Refuse shared scopes/branch overrides for maintenance keys rather than altering other consumers.
    if (
      all.some(
        (e) =>
          e.gitBranch || e.target.length !== 1 || e.target[0] !== "production",
      ) ||
      all.length > 1
    )
      throw new MaintenanceProviderError("schema");
    return all[0];
  };
  const value = async (id: string) =>
    z
      .object({ value: z.string() })
      .parse(
        await req(
          "vercel",
          `/v1/projects/${manifest.vercel.projectId}/env/${encodeURIComponent(id)}`,
        ),
      ).value;
  const set = async (key: string, secret: string) => {
    const existing = await selected(key);
    if (existing && (await value(existing.id)) === secret) return;
    const payload = {
      key,
      value: secret,
      target: ["production"],
      type: key === "DATABASE_URL" ? "encrypted" : "plain",
    };
    await req(
      "vercel",
      existing
        ? project + "/env/" + encodeURIComponent(existing.id)
        : `/v10/projects/${manifest.vercel.projectId}/env`,
      existing ? "PATCH" : "POST",
      payload,
    );
  };
  const getDeployment = async (id: string) =>
    deploymentSchema.parse(
      await req("vercel", `/v13/deployments/${encodeURIComponent(id)}`),
    );
  const cli = (args: string[]) => {
    const environment: NodeJS.ProcessEnv = {
      PATH: process.env.PATH,
      HOME: process.env.HOME,
      CI: "true",
      NODE_ENV: "production",
      VERCEL_TOKEN: configuration.vercelToken,
    };
    if (configuration.cli) return configuration.cli(args, environment);
    const r = spawnSync(
      "vercel",
      [...args, "--non-interactive", "--scope", manifest.vercel.teamId],
      {
        cwd: configuration.directory,
        env: environment,
        encoding: "utf8",
        stdio: "pipe",
        timeout: 300000,
        maxBuffer: 8 * 1024 * 1024,
      },
    );
    if (r.error || r.status !== 0)
      throw new MaintenanceProviderError("process");
    return r.stdout.trim();
  };
  const connect =
    configuration.connect ??
    (async (url: string, rejection: boolean) => {
      const client = new Client({
        connectionString: url,
        connectionTimeoutMillis: 5000,
        statement_timeout: 5000,
        options: "-c default_transaction_read_only=on",
      });
      try {
        await client.connect();
        if (rejection) return false;
        const r = await client.query<{
          database: string;
          role: string;
          read_only: string;
        }>(
          "SELECT current_database() AS database, session_user AS role, current_setting('transaction_read_only') AS read_only",
        );
        if (
          r.rows[0]?.database !== manifest.neon.database ||
          r.rows[0]?.role !== manifest.neon.role ||
          r.rows[0]?.read_only !== "on"
        )
          throw new MaintenanceProviderError("schema");
        return true;
      } catch (error) {
        if (
          rejection &&
          typeof error === "object" &&
          error !== null &&
          "code" in error &&
          error.code === "28P01"
        )
          return true;
        throw new MaintenanceProviderError("transport");
      } finally {
        await client.end().catch(() => undefined);
      }
    });
  return {
    guard: async (allowed) => {
      const p = z
        .object({
          id: z.string(),
          accountId: z.string(),
          link: z.null(),
          deployHooks: z.array(z.unknown()).max(0),
          targets: z.object({ production: z.object({ id: z.string() }) }),
        })
        .passthrough()
        .parse(await req("vercel", project));
      if (
        p.id !== manifest.vercel.projectId ||
        p.accountId !== manifest.vercel.teamId ||
        settingsDigest(
          settingsSchema.parse(
            Object.fromEntries(
              Object.keys(manifest.vercel.settings).map((k) => [
                k,
                p[k] ?? null,
              ]),
            ),
          ),
        ) !== manifest.vercel.settingsSha256
      )
        throw new MaintenanceProviderError("schema");
      // Custom-domain assignment is authoritative; a staged --skip-domain deployment
      // must not be mistaken for the application currently serving production.
      const alias = z
        .object({
          alias: z.literal(manifest.vercel.productionHost),
          projectId: z.literal(manifest.vercel.projectId),
          deploymentId: z.string(),
        })
        .parse(
          await req("vercel", `/v4/aliases/${manifest.vercel.productionHost}`),
        );
      if (!allowed.includes(alias.deploymentId))
        throw new MaintenanceProviderError("schema");
      const previous = await getDeployment(manifest.vercel.deploymentId);
      if (
        previous.projectId !== manifest.vercel.projectId ||
        previous.meta.githubCommitSha !== manifest.applicationSha ||
        previous.readyState !== "READY"
      )
        throw new MaintenanceProviderError("schema");
      const domains = z
        .object({
          domains: z.array(
            z.object({ name: z.string(), verified: z.boolean() }),
          ),
          pagination: z.object({ next: z.number().nullable() }).optional(),
        })
        .parse(await req("vercel", project + "/domains"));
      if (
        domains.pagination?.next != null ||
        !domains.domains.some(
          (d) => d.name === manifest.vercel.productionHost && d.verified,
        )
      )
        throw new MaintenanceProviderError("schema");
      const active = z
        .object({
          deployments: z.array(z.object({ readyState: z.string() })),
          pagination: z.object({ next: z.number().nullable() }),
        })
        .parse(
          await req(
            "vercel",
            `/v6/deployments?projectId=${manifest.vercel.projectId}&target=production&limit=100`,
          ),
        );
      if (
        active.pagination.next !== null ||
        active.deployments.some(
          (d) => !["READY", "ERROR", "CANCELED"].includes(d.readyState),
        )
      )
        throw new MaintenanceProviderError("schema");
      const endpoints = z
        .object({
          endpoints: z.array(
            z.object({
              branch_id: z.string(),
              host: z.string(),
              type: z.string(),
            }),
          ),
        })
        .parse(
          await req("neon", `/projects/${manifest.neon.projectId}/endpoints`),
        );
      const branch = z
        .object({
          branch: z.object({ id: z.string(), project_id: z.string() }),
        })
        .parse(
          await req(
            "neon",
            `/projects/${manifest.neon.projectId}/branches/${manifest.neon.branchId}`,
          ),
        );
      const database = z
        .object({ databases: z.array(z.object({ name: z.string() })) })
        .parse(
          await req(
            "neon",
            `/projects/${manifest.neon.projectId}/branches/${manifest.neon.branchId}/databases`,
          ),
        );
      const roleMetadata = z
        .object({
          role: z.object({
            name: z.string(),
            branch_id: z.string(),
            protected: z.boolean(),
            authentication_method: z.literal("password"),
          }),
        })
        .parse(await req("neon", role));
      if (
        branch.branch.id !== manifest.neon.branchId ||
        branch.branch.project_id !== manifest.neon.projectId ||
        !endpoints.endpoints.some(
          (e) =>
            e.branch_id === manifest.neon.branchId &&
            e.host === manifest.neon.host &&
            e.type === "read_write",
        ) ||
        !database.databases.some((d) => d.name === manifest.neon.database) ||
        roleMetadata.role.name !== manifest.neon.role ||
        roleMetadata.role.branch_id !== manifest.neon.branchId ||
        roleMetadata.role.protected
      )
        throw new MaintenanceProviderError("schema");
      return alias.deploymentId;
    },
    readJournal: async () => {
      const e = await selected(JOURNAL);
      return e ? (JSON.parse(await value(e.id)) as unknown) : undefined;
    },
    saveJournal: async (journal) => {
      maintenanceJournalSchema.parse(journal);
      const raw = JSON.stringify(journal);
      await set(JOURNAL, raw);
      const e = await selected(JOURNAL);
      if (!e || (await value(e.id)) !== raw)
        throw new MaintenanceProviderError("schema");
    },
    runtime: async () => {
      const e = await selected("DATABASE_URL");
      if (!e) throw new MaintenanceProviderError("schema");
      const url = await value(e.id);
      assertMaintenanceUrl(url, manifest);
      return { url, id: e.id, revision: e.updatedAt };
    },
    role: async () => {
      const r = z
        .object({
          role: z.object({ name: z.string(), updated_at: z.string() }),
        })
        .parse(await req("neon", role));
      const p = z
        .object({ password: z.string().min(1) })
        .parse(await req("neon", role + "/reveal_password"));
      if (r.role.name !== manifest.neon.role)
        throw new MaintenanceProviderError("schema");
      return { revision: r.role.updated_at, password: p.password };
    },
    reset: async () => {
      const r = z
        .object({
          operations: z
            .array(z.object({ id: z.string() }))
            .min(1)
            .max(10),
        })
        .parse(await req("neon", role + "/reset_password", "POST"));
      let remaining = 24;
      for (const op of r.operations) {
        let finished = false;
        for (let attempt = 0; remaining > 0; attempt++, remaining--) {
          const status = z
            .object({ operation: z.object({ status: z.string() }) })
            .parse(
              await req(
                "neon",
                `/projects/${manifest.neon.projectId}/operations/${encodeURIComponent(op.id)}`,
              ),
            ).operation.status;
          if (status === "finished") {
            finished = true;
            break;
          }
          if (status === "failed") throw new MaintenanceProviderError("schema");
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }
        if (!finished) throw new MaintenanceProviderError("transport");
      }
    },
    freshConnection: async (url) => {
      assertMaintenanceUrl(url, manifest);
      if (!(await connect(url, false)))
        throw new MaintenanceProviderError("schema");
    },
    oldCredentialRejected: async (url) => {
      assertMaintenanceUrl(url, manifest);
      return connect(url, true);
    },
    installRuntime: async (url) => {
      assertMaintenanceUrl(url, manifest);
      await set("DATABASE_URL", url);
      await set("ANALYTICS_SYNC_ENABLED", "false");
    },
    runtimeDisabled: async () => {
      const e = await selected("ANALYTICS_SYNC_ENABLED");
      return Boolean(e && (await value(e.id)) === "false");
    },
    findDeployment: async (journal) => {
      const r = z
        .object({
          deployments: z.array(
            z.object({
              uid: z.string(),
              meta: z.record(z.string(), z.unknown()).optional(),
            }),
          ),
          pagination: z.object({ next: z.number().nullable() }),
        })
        .parse(
          await req(
            "vercel",
            `/v6/deployments?projectId=${manifest.vercel.projectId}&target=production&limit=100`,
          ),
        );
      const matches = r.deployments.filter(
        (d) =>
          d.meta?.maintenanceOperation === manifest.operationId &&
          d.meta?.maintenanceManifest === journal.manifestSha256,
      );
      if (r.pagination.next !== null || matches.length > 1)
        throw new MaintenanceProviderError("schema");
      return matches[0]?.uid;
    },
    stage: async (journal) => {
      const output = cli([
        "deploy",
        "--prebuilt",
        "--prod",
        "--skip-domain",
        "--yes",
        "--project",
        manifest.vercel.projectId,
        "--meta",
        `maintenanceOperation=${manifest.operationId}`,
        "--meta",
        `maintenanceManifest=${journal.manifestSha256}`,
        "--meta",
        `maintenanceBuild=${journal.buildSha256}`,
        "--meta",
        `applicationSha=${manifest.applicationSha}`,
        "--meta",
        `githubCommitSha=${manifest.applicationSha}`,
        "--meta",
        `executorSha=${manifest.executorSha}`,
        "--meta",
        "collectionDisabled=true",
        "--env",
        "ANALYTICS_SYNC_ENABLED=false",
      ]);
      const url = new URL(output);
      if (
        url.protocol !== "https:" ||
        url.origin !== output ||
        !url.hostname.endsWith(".vercel.app")
      )
        throw new MaintenanceProviderError("schema");
      return (await getDeployment(url.hostname)).id;
    },
    verifyDeployment: async (id, journal) => {
      let d = await getDeployment(id);
      for (let i = 0; d.readyState !== "READY" && i < 24; i++) {
        if (["ERROR", "CANCELED"].includes(d.readyState)) break;
        await new Promise((resolve) => setTimeout(resolve, 5000));
        d = await getDeployment(id);
      }
      if (
        d.projectId !== manifest.vercel.projectId ||
        d.readyState !== "READY" ||
        d.meta.maintenanceOperation !== manifest.operationId ||
        d.meta.maintenanceManifest !== journal.manifestSha256 ||
        d.meta.maintenanceBuild !== journal.buildSha256 ||
        d.meta.applicationSha !== manifest.applicationSha ||
        d.meta.githubCommitSha !== manifest.applicationSha ||
        d.meta.executorSha !== manifest.executorSha ||
        d.meta.collectionDisabled !== "true"
      )
        throw new MaintenanceProviderError("schema");
    },
    smoke: async (id) => {
      const host = id
        ? (await getDeployment(id)).url
        : manifest.vercel.productionHost;
      for (const path of ["/", "/shaolin", "/api/auth/session"]) {
        let url = new URL(`https://${host}${path}`);
        let available = false;
        for (let redirects = 0; redirects <= 2; redirects++) {
          const response = await transport(url.toString(), {
            headers: configuration.bypassSecret
              ? { "x-vercel-protection-bypass": configuration.bypassSecret }
              : {},
            redirect: "manual",
            signal: AbortSignal.timeout(15000),
          });
          if (response.status === 200) {
            available = true;
            break;
          }
          if (![307, 308].includes(response.status))
            throw new MaintenanceProviderError("http", response.status);
          const target = new URL(response.headers.get("location") ?? "", url);
          if (
            target.protocol !== "https:" ||
            target.username ||
            target.password ||
            ![host, `www.${manifest.vercel.productionHost}`].includes(
              target.host,
            ) ||
            target.pathname !== path ||
            target.search ||
            target.hash
          )
            throw new MaintenanceProviderError("schema");
          url = target;
        }
        if (!available) throw new MaintenanceProviderError("schema");
      }
    },
    promote: async (id) => {
      cli(["promote", id, "--yes"]);
    },
  };
}
