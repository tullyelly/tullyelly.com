import { z } from "zod";
import { readFileSync } from "node:fs";
import { settingsSchema, settingsDigest, sha256 } from "./manifest";

const digest = z.string().regex(/^[a-f0-9]{64}$/);
const commit = z.string().regex(/^[a-f0-9]{40}$/);
export const maintenanceManifestSchema = z
  .object({
    version: z.literal(1),
    operationId: z.string().regex(/^[a-z0-9-]{8,60}$/),
    executorSha: commit,
    applicationSha: commit,
    neon: z
      .object({
        projectId: z.string().regex(/^[a-z0-9-]+$/),
        branchId: z.string().regex(/^br-[a-z0-9-]+$/),
        host: z.string().regex(/^ep-[a-z0-9-]+\.[a-z0-9.-]+\.neon\.tech$/),
        database: z.string().regex(/^[a-zA-Z0-9_]+$/),
        role: z.string().regex(/^[a-zA-Z0-9_]+$/),
      })
      .strict(),
    vercel: z
      .object({
        projectId: z.string().regex(/^prj_[a-zA-Z0-9]+$/),
        teamId: z.string().regex(/^team_[a-zA-Z0-9]+$/),
        deploymentId: z.string().regex(/^dpl_[a-zA-Z0-9]+$/),
        productionHost: z.literal("tullyelly.com"),
        settings: settingsSchema,
        settingsSha256: digest,
      })
      .strict(),
    evidence: z
      .object({
        consumerMapConfirmed: z.literal(true),
        isolationRehearsed: z.literal(true),
        outageAccepted: z.literal(true),
        backupVerifiedAt: z.string().datetime(),
        backupEvidenceUrl: z.string().url().startsWith("https://"),
        expiresAt: z.string().datetime(),
      })
      .strict(),
    recovery: z
      .object({
        originalManifestSha256: digest,
        originalRunId: z.string().regex(/^[1-9][0-9]*$/),
        buildSha256: digest,
      })
      .strict()
      .optional(),
  })
  .strict();
export type MaintenanceManifest = z.infer<typeof maintenanceManifestSchema>;
export function loadMaintenanceManifest(
  path: string,
  checksum: string,
  executor: string,
  now = Date.now(),
) {
  if (
    !/^maintenance\/[a-z0-9-]+\.json$/.test(path) ||
    !digest.safeParse(checksum).success
  )
    throw new Error("maintenance.manifest-reference");
  const bytes = readFileSync(path);
  if (sha256(bytes) !== checksum)
    throw new Error("maintenance.manifest-checksum");
  const manifest = maintenanceManifestSchema.parse(
    JSON.parse(bytes.toString("utf8")),
  );
  if (
    manifest.executorSha !== executor ||
    settingsDigest(manifest.vercel.settings) !== manifest.vercel.settingsSha256
  )
    throw new Error("maintenance.manifest-binding");
  const backup = Date.parse(manifest.evidence.backupVerifiedAt),
    expires = Date.parse(manifest.evidence.expiresAt);
  if (
    backup > now ||
    now - backup > 86400000 ||
    expires <= now ||
    expires - now > 86400000
  )
    throw new Error("maintenance.evidence-expired");
  return manifest;
}
export function maintenanceBinding(manifest: MaintenanceManifest) {
  return sha256(
    JSON.stringify({
      operationId: manifest.operationId,
      executorSha: manifest.executorSha,
      applicationSha: manifest.applicationSha,
      neon: manifest.neon,
      vercel: manifest.vercel,
    }),
  );
}
export function assertMaintenanceUrl(
  raw: string,
  manifest: MaintenanceManifest,
) {
  const url = new URL(raw);
  if (
    url.protocol !== "postgresql:" ||
    url.hostname !== manifest.neon.host ||
    url.hostname.includes("-pooler.") ||
    (url.port && url.port !== "5432") ||
    decodeURIComponent(url.pathname.slice(1)) !== manifest.neon.database ||
    decodeURIComponent(url.username) !== manifest.neon.role ||
    !url.password ||
    !["require", "verify-full"].includes(
      url.searchParams.get("sslmode") ?? "",
    ) ||
    url.hash ||
    [...url.searchParams.keys()].some(
      (k) => !["sslmode", "channel_binding"].includes(k),
    )
  )
    throw new Error("maintenance.database-target");
  return url;
}
const phase = z.enum([
  "reset-intent",
  "reset",
  "verified",
  "configured",
  "stage-intent",
  "staged",
  "promote-intent",
  "complete",
]);
export const maintenanceJournalSchema = z
  .object({
    version: z.literal(1),
    binding: digest,
    manifestSha256: digest,
    buildSha256: digest,
    runId: z.string().regex(/^[1-9][0-9]*$/),
    workflowSha: commit,
    phase,
    environmentId: z.string().min(1),
    environmentRevision: z.number().int().nonnegative(),
    roleRevisionBefore: z.string().min(1),
    roleRevisionAfter: z.string().min(1).optional(),
    oldRejected: z.boolean(),
    deploymentId: z
      .string()
      .regex(/^dpl_[a-zA-Z0-9]+$/)
      .optional(),
  })
  .strict()
  .refine(
    (j) => j.phase === "reset-intent" || Boolean(j.roleRevisionAfter),
    "replacement revision required",
  )
  .refine(
    (j) => ["reset-intent", "reset"].includes(j.phase) || j.oldRejected,
    "rejection proof required",
  )
  .refine(
    (j) =>
      !["staged", "promote-intent", "complete"].includes(j.phase) ||
      Boolean(j.deploymentId),
    "deployment binding required",
  );
export type MaintenanceJournal = z.infer<typeof maintenanceJournalSchema>;
export class MaintenanceFailure extends Error {
  constructor(readonly boundary: string) {
    super(
      `Maintenance stopped at ${boundary}; inspect journal and providers before any recovery`,
    );
    this.name = "MaintenanceFailure";
  }
}
export type MaintenanceProviders = {
  guard: (allowedDeployments: string[]) => Promise<string>;
  readJournal: () => Promise<unknown | undefined>;
  saveJournal: (journal: MaintenanceJournal) => Promise<void>;
  runtime: () => Promise<{ url: string; id: string; revision: number }>;
  role: () => Promise<{ revision: string; password: string }>;
  reset: () => Promise<void>;
  freshConnection: (url: string) => Promise<void>;
  oldCredentialRejected: (url: string) => Promise<boolean>;
  installRuntime: (url: string) => Promise<void>;
  runtimeDisabled: () => Promise<boolean>;
  findDeployment: (journal: MaintenanceJournal) => Promise<string | undefined>;
  stage: (journal: MaintenanceJournal) => Promise<string>;
  verifyDeployment: (id: string, journal: MaintenanceJournal) => Promise<void>;
  smoke: (id?: string) => Promise<void>;
  promote: (id: string) => Promise<void>;
};
export async function executeMaintenance(
  manifest: MaintenanceManifest,
  context: {
    manifestSha256: string;
    buildSha256: string;
    runId: string;
    workflowSha: string;
    action: "rotate" | "recover";
  },
  providers: MaintenanceProviders,
) {
  let boundary = "initial-guard";
  try {
    boundary = "journal-read";
    const raw = await providers.readJournal();
    let journal: MaintenanceJournal;
    if (raw !== undefined) {
      const saved = maintenanceJournalSchema.parse(raw);
      if (
        context.action !== "recover" ||
        !manifest.recovery ||
        saved.binding !== maintenanceBinding(manifest) ||
        saved.manifestSha256 !== manifest.recovery.originalManifestSha256 ||
        saved.runId !== manifest.recovery.originalRunId ||
        saved.buildSha256 !== context.buildSha256 ||
        saved.buildSha256 !== manifest.recovery.buildSha256
      )
        throw new Error("recovery binding mismatch");
      boundary = "recovery-drift";
      await providers.guard([
        manifest.vercel.deploymentId,
        ...(["promote-intent", "complete"].includes(saved.phase) &&
        saved.deploymentId
          ? [saved.deploymentId]
          : []),
      ]);
    } else {
      boundary = "initial-guard";
      await providers.guard([manifest.vercel.deploymentId]);
    }
    const runtime = await providers.runtime();
    const runtimeUrl = assertMaintenanceUrl(runtime.url, manifest);
    const role = await providers.role();
    if (raw === undefined) {
      if (context.action !== "rotate" || manifest.recovery)
        throw new Error("recovery has no journal");
      if (decodeURIComponent(runtimeUrl.password) !== role.password)
        throw new Error("role/runtime mismatch");
      if (!(await providers.runtimeDisabled()))
        throw new Error("collection must already be disabled");
      boundary = "original-connection";
      await providers.freshConnection(runtime.url);
      journal = maintenanceJournalSchema.parse({
        version: 1,
        binding: maintenanceBinding(manifest),
        manifestSha256: context.manifestSha256,
        buildSha256: context.buildSha256,
        runId: context.runId,
        workflowSha: context.workflowSha,
        phase: "reset-intent",
        environmentId: runtime.id,
        environmentRevision: runtime.revision,
        roleRevisionBefore: role.revision,
        oldRejected: false,
      });
      boundary = "reset-intent-checkpoint";
      await providers.saveJournal(journal);
      boundary = "pre-reset-drift";
      await providers.guard([manifest.vercel.deploymentId]);
      const currentRuntime = await providers.runtime(),
        currentRole = await providers.role();
      if (
        currentRuntime.id !== runtime.id ||
        currentRuntime.revision !== runtime.revision ||
        currentRuntime.url !== runtime.url ||
        currentRole.password !== role.password ||
        currentRole.revision !== role.revision
      )
        throw new Error("credential drift before reset");
      boundary = "password-reset";
      await providers.reset();
    } else {
      journal = maintenanceJournalSchema.parse(raw);
      if (
        context.action !== "recover" ||
        !manifest.recovery ||
        journal.binding !== maintenanceBinding(manifest) ||
        journal.manifestSha256 !== manifest.recovery.originalManifestSha256 ||
        journal.runId !== manifest.recovery.originalRunId ||
        journal.buildSha256 !== context.buildSha256 ||
        journal.buildSha256 !== manifest.recovery.buildSha256
      )
        throw new Error("recovery binding mismatch");
    }
    boundary = "replacement-reveal";
    const replacement = await providers.role();
    if (
      replacement.revision === journal.roleRevisionBefore ||
      (journal.roleRevisionAfter &&
        journal.roleRevisionAfter !== replacement.revision)
    )
      throw new Error("reset unresolved or role drift");
    const next = new URL(runtime.url);
    next.password = encodeURIComponent(replacement.password);
    const nextUrl = next.toString();
    assertMaintenanceUrl(nextUrl, manifest);
    if (journal.phase === "reset-intent") {
      journal = {
        ...journal,
        phase: "reset",
        roleRevisionAfter: replacement.revision,
      };
      boundary = "reset-checkpoint";
      await providers.saveJournal(journal);
    }
    boundary = "replacement-connection";
    await providers.freshConnection(nextUrl);
    if (!journal.oldRejected) {
      if (decodeURIComponent(runtimeUrl.password) === replacement.password)
        throw new Error("old credential unavailable");
      boundary = "old-credential-rejection";
      if (!(await providers.oldCredentialRejected(runtime.url)))
        throw new Error("old credential still accepted");
      journal = { ...journal, phase: "verified", oldRejected: true };
      boundary = "verified-checkpoint";
      await providers.saveJournal(journal);
    }
    if (journal.phase === "verified") {
      boundary = "pre-configuration-drift";
      await providers.guard([manifest.vercel.deploymentId]);
      const liveRuntime = await providers.runtime(),
        liveRole = await providers.role();
      if (
        liveRuntime.id !== journal.environmentId ||
        (liveRuntime.url !== nextUrl &&
          liveRuntime.revision !== journal.environmentRevision) ||
        liveRole.revision !== replacement.revision ||
        liveRole.password !== replacement.password
      )
        throw new Error("runtime configuration drift");
      boundary = "runtime-install";
      await providers.installRuntime(nextUrl);
      boundary = "runtime-readback";
      if (
        (await providers.runtime()).url !== nextUrl ||
        !(await providers.runtimeDisabled())
      )
        throw new Error("runtime configuration mismatch");
      journal = { ...journal, phase: "configured" };
      boundary = "configured-checkpoint";
      await providers.saveJournal(journal);
    }
    const verifyCredentialDrift = async () => {
      const liveRuntime = await providers.runtime(),
        liveRole = await providers.role();
      if (
        liveRuntime.id !== journal.environmentId ||
        liveRuntime.url !== nextUrl ||
        liveRole.revision !== replacement.revision ||
        liveRole.password !== replacement.password ||
        !(await providers.runtimeDisabled())
      )
        throw new Error("credential drift");
    };
    await verifyCredentialDrift();
    if (["configured", "stage-intent"].includes(journal.phase)) {
      boundary = "deployment-lookup";
      let id = await providers.findDeployment(journal);
      if (!id) {
        if (journal.phase === "stage-intent")
          throw new Error("deployment outcome unresolved; no retry");
        boundary = "pre-stage-drift";
        await providers.guard([manifest.vercel.deploymentId]);
        await verifyCredentialDrift();
        journal = { ...journal, phase: "stage-intent" };
        boundary = "stage-intent-checkpoint";
        await providers.saveJournal(journal);
        boundary = "deployment-create";
        id = await providers.stage(journal);
      }
      boundary = "deployment-identity";
      await providers.verifyDeployment(id, journal);
      journal = { ...journal, phase: "staged", deploymentId: id };
      boundary = "staged-checkpoint";
      await providers.saveJournal(journal);
    }
    if (!journal.deploymentId || !journal.oldRejected)
      throw new Error("missing verification");
    const stagedId = journal.deploymentId;
    boundary = "staged-identity";
    await providers.verifyDeployment(journal.deploymentId, journal);
    boundary = "staged-smoke";
    await providers.smoke(journal.deploymentId);
    boundary = "pre-promotion-drift";
    const current = await providers.guard([
      manifest.vercel.deploymentId,
      ...(["promote-intent", "complete"].includes(journal.phase)
        ? [journal.deploymentId]
        : []),
    ]);
    await verifyCredentialDrift();
    if (current !== journal.deploymentId) {
      if (journal.phase === "promote-intent" || journal.phase === "complete")
        throw new Error("promotion outcome unresolved; no retry");
      journal = { ...journal, phase: "promote-intent" };
      boundary = "promotion-intent-checkpoint";
      await providers.saveJournal(journal);
      boundary = "promotion";
      await providers.promote(stagedId);
    }
    boundary = "promotion-readback";
    if ((await providers.guard([stagedId])) !== journal.deploymentId)
      throw new Error("promotion not verified");
    boundary = "final-connection";
    await providers.freshConnection(nextUrl);
    boundary = "production-smoke";
    await providers.smoke();
    journal = { ...journal, phase: "complete" };
    boundary = "completion-checkpoint";
    await providers.saveJournal(journal);
    return journal;
  } catch {
    throw new MaintenanceFailure(boundary);
  }
}
