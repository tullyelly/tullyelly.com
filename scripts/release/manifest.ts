import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { z } from "zod";

const sha = z.string().regex(/^[0-9a-f]{40}$/);
const digest = z.string().regex(/^[0-9a-f]{64}$/);
export const settingsSchema = z
  .object({
    framework: z.literal("nextjs"),
    nodeVersion: z.literal("22.x"),
    buildCommand: z.string().nullable(),
    installCommand: z.string().nullable(),
    outputDirectory: z.null(),
    rootDirectory: z.null(),
  })
  .strict();
export const releaseManifestSchema = z
  .object({
    version: z.literal(1),
    commit: sha,
    environment: z.literal("production"),
    neon: z
      .object({
        projectId: z.string().min(1),
        branchId: z.string().min(1),
        host: z.string().regex(/^ep-[a-z0-9-]+\.[a-z0-9.-]+\.neon\.tech$/),
        database: z.string().min(1),
        role: z.string().min(1),
      })
      .strict(),
    baselineLedgerSha256: digest,
    migrations: z
      .array(
        z
          .object({
            filename: z.string().regex(/^\d{3}_[a-z0-9_]+\.sql$/),
            sha256: digest,
          })
          .strict(),
      )
      .min(1),
    vercel: z
      .object({
        teamId: z.string().regex(/^team_/),
        projectId: z.string().regex(/^prj_/),
        productionDeploymentId: z.string().regex(/^dpl_/),
        productionHost: z.literal("tullyelly.com"),
        settings: settingsSchema,
        settingsSha256: digest,
      })
      .strict(),
    release: z
      .object({
        collectionEnabled: z.literal(false),
        automaticDeploymentsDisabled: z.literal(true),
        previewIsolationVerified: z.literal(true),
        backupVerifiedAt: z.string().datetime(),
        backupEvidenceUrl: z.string().url().startsWith("https://"),
      })
      .strict(),
  })
  .strict();
export type ReleaseManifest = z.infer<typeof releaseManifestSchema>;
export function sha256(value: string | Buffer) {
  return createHash("sha256").update(value).digest("hex");
}
export function settingsDigest(settings: z.infer<typeof settingsSchema>) {
  return sha256(JSON.stringify(settingsSchema.parse(settings)));
}
export function loadReleaseManifest(
  path: string,
  expectedSha: string,
  expectedCommit: string,
): ReleaseManifest {
  if (
    !/^[0-9a-f]{64}$/.test(expectedSha) ||
    !/^[0-9a-f]{40}$/.test(expectedCommit)
  )
    throw new Error("Exact release and manifest checksums are required");
  const bytes = readFileSync(path);
  if (sha256(bytes) !== expectedSha)
    throw new Error("Release manifest checksum mismatch");
  const manifest = releaseManifestSchema.parse(
    JSON.parse(bytes.toString("utf8")),
  );
  if (manifest.commit !== expectedCommit)
    throw new Error("Release commit mismatch");
  if (
    settingsDigest(manifest.vercel.settings) !== manifest.vercel.settingsSha256
  )
    throw new Error("Reviewed Vercel settings checksum mismatch");
  if (
    new Set(manifest.migrations.map((m) => m.filename)).size !==
    manifest.migrations.length
  )
    throw new Error("Duplicate migration filenames");
  for (const migration of manifest.migrations) {
    if (
      sha256(readFileSync(`db/migrations/${migration.filename}`)) !==
      migration.sha256
    )
      throw new Error(`Migration checksum mismatch: ${migration.filename}`);
  }
  if (
    manifest.migrations.map((m) => m.filename).join(",") !==
    "076_create_analytics_archive.sql,077_analytics_operations.sql"
  )
    throw new Error(
      "This workflow accepts only the reviewed analytics migration pair; reconciliation requires a separate release",
    );
  const age = Date.now() - Date.parse(manifest.release.backupVerifiedAt);
  if (age < 0 || age > 24 * 60 * 60 * 1000)
    throw new Error(
      "Backup/recovery evidence must be reconfirmed within 24 hours of release",
    );
  return manifest;
}
export function validateEnvironmentGate(
  environment: unknown,
  policies: unknown,
) {
  const env = z
    .object({
      can_admins_bypass: z.literal(false),
      deployment_branch_policy: z.object({
        custom_branch_policies: z.literal(true),
        protected_branches: z.literal(false),
      }),
      protection_rules: z.array(
        z.object({
          type: z.string(),
          prevent_self_review: z.boolean().optional(),
          reviewers: z.array(z.unknown()).optional(),
        }),
      ),
    })
    .parse(environment);
  if (
    !env.protection_rules.some(
      (rule) =>
        rule.type === "required_reviewers" &&
        rule.prevent_self_review === true &&
        (rule.reviewers?.length ?? 0) > 0,
    )
  )
    throw new Error(
      "Environment must require a human reviewer and prevent self approval",
    );
  const rules = z
    .object({
      branch_policies: z.array(
        z.object({ name: z.string(), type: z.string() }),
      ),
    })
    .parse(policies).branch_policies;
  if (
    rules.length !== 1 ||
    rules[0].name !== "main" ||
    rules[0].type !== "branch"
  )
    throw new Error(
      "Environment must restrict deployment to the main branch only",
    );
}
export function assertVercelProject(
  project: unknown,
  manifest: Pick<ReleaseManifest, "vercel">,
) {
  const value = z
    .object({
      id: z.string(),
      accountId: z.string(),
      link: z.unknown().nullable(),
      targets: z
        .object({ production: z.object({ id: z.string() }) })
        .optional(),
    })
    .passthrough()
    .parse(project);
  if (
    value.id !== manifest.vercel.projectId ||
    value.accountId !== manifest.vercel.teamId
  )
    throw new Error("Vercel project/team mismatch");
  if (value.link !== null)
    throw new Error(
      "Vercel Git integration is still connected; automatic deployments can bypass release approval",
    );
  const record = project as Record<string, unknown>;
  const liveSettings = settingsSchema.parse(
    Object.fromEntries(
      Object.keys(manifest.vercel.settings).map((key) => [
        key,
        record[key] ?? null,
      ]),
    ),
  );
  if (settingsDigest(liveSettings) !== manifest.vercel.settingsSha256)
    throw new Error("Vercel project settings drift");
  return value.targets?.production?.id;
}

export function validateReviewedMainRules(rules: unknown) {
  const values = z
    .array(
      z.object({
        type: z.string(),
        parameters: z.record(z.string(), z.unknown()).optional(),
      }),
    )
    .parse(rules);
  const reviews = values.find(
    (rule) => rule.type === "pull_request",
  )?.parameters;
  if (
    !reviews ||
    typeof reviews.required_approving_review_count !== "number" ||
    reviews.required_approving_review_count < 1 ||
    reviews.dismiss_stale_reviews_on_push !== true ||
    reviews.require_code_owner_review !== true ||
    reviews.require_last_push_approval !== true
  )
    throw new Error(
      "Protected main must enforce fresh independent code owner review of release code",
    );
  const checks = values.find(
    (rule) => rule.type === "required_status_checks",
  )?.parameters;
  if (
    !checks ||
    checks.strict_required_status_checks_policy !== true ||
    !Array.isArray(checks.required_status_checks) ||
    !checks.required_status_checks.some(
      (value) =>
        typeof value === "object" &&
        value !== null &&
        "context" in value &&
        value.context === "Lint, test, build",
    )
  )
    throw new Error(
      "Protected main must enforce the repository validation check on an up-to-date branch",
    );
}

export function verifyRuntimeDatabase(
  urlString: string,
  manifest: ReleaseManifest,
) {
  const url = new URL(urlString);
  if (
    url.protocol !== "postgresql:" ||
    url.hostname !== manifest.neon.host ||
    decodeURIComponent(url.pathname.slice(1)) !== manifest.neon.database ||
    decodeURIComponent(url.username) !== manifest.neon.role ||
    url.searchParams.get("sslmode") !== "require"
  )
    throw new Error(
      "Vercel production database target mismatch; a direct TLS connection is required",
    );
}
export function verifyPreviewDatabases(
  values: Array<{ value: string; gitBranch?: string | null }>,
  manifest: ReleaseManifest,
) {
  if (
    !values.some((value) => !value.gitBranch) ||
    values.some((value) => {
      const url = new URL(value.value);
      return (
        url.protocol !== "postgresql:" ||
        !url.hostname.endsWith(".neon.tech") ||
        url.hostname.includes("-pooler.") ||
        url.hostname === manifest.neon.host ||
        url.searchParams.get("sslmode") !== "require"
      );
    })
  )
    throw new Error(
      "Every preview DATABASE_URL scope must resolve to an isolated direct Neon endpoint; shared preview configuration is required",
    );
}

export function verifyReleaseDeploymentIdentity(
  value: unknown,
  manifest: Pick<ReleaseManifest, "vercel" | "commit">,
  manifestSha256: string,
  buildSha256: string,
) {
  const deployment = z
    .object({
      projectId: z.string(),
      target: z.string(),
      readyState: z.string(),
      meta: z.record(z.string(), z.unknown()),
    })
    .parse(value);
  if (
    deployment.projectId !== manifest.vercel.projectId ||
    deployment.target !== "production" ||
    deployment.readyState !== "READY" ||
    deployment.meta.releaseSha !== manifest.commit ||
    deployment.meta.releaseManifest !== manifestSha256 ||
    deployment.meta.releaseBuildSha256 !== buildSha256 ||
    deployment.meta.collectionDisabled !== "true"
  )
    throw new Error(
      "Staged deployment identity, approved build, disabled collection or readiness mismatch",
    );
}
