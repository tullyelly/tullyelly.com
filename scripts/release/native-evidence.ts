/** Automatically generated, non-secret evidence for ordinary native releases. */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { z } from "zod";
import {
  releaseManifestSchema,
  settingsSchema,
  settingsDigest,
  sha256,
} from "./manifest";
import { RELEASE_REPOSITORY, RELEASE_REPOSITORY_ID, type Api } from "./app";

const sha = z.string().regex(/^[a-f0-9]{40}$/);
const digest = z.string().regex(/^[a-f0-9]{64}$/);
const decimal = z.string().regex(/^[1-9][0-9]*$/);
const path = z
  .string()
  .min(1)
  .max(500)
  .regex(/^[A-Za-z0-9_./()@+ \[\]-]+$/);
export const compatibilityRiskSchema = z.enum([
  "database-schema",
  "database-query-contract",
  "authentication-policy",
  "runtime-configuration",
  "analytics-activation",
]);
export const nativeSettingsSchema = settingsSchema
  .extend({
    buildCommand: z.union([
      z.null(),
      z.literal("node scripts/release/native-build.mjs"),
    ]),
    installCommand: z.union([z.null(), z.literal("npm ci")]),
  })
  .strict();
export const nativeEvidenceSchema = z
  .object({
    version: z.literal(3),
    kind: z.literal("native-source"),
    operation: z.literal("deploy"),
    commit: sha,
    collectionEnabled: z.literal(false),
    workflow: z.object({ sha, runId: decimal, runAttempt: decimal }).strict(),
    source: z.object({ sha256: digest }).strict(),
    ci: z
      .object({
        runId: decimal,
        runAttempt: decimal,
        sha,
        workflowSha: sha,
        workflowPath: z.literal(".github/workflows/ci.yml"),
        workflowId: decimal,
        checkRunIds: z.array(decimal).length(2),
      })
      .strict(),
    vercel: releaseManifestSchema.shape.vercel
      .extend({
        projectId: z.literal("prj_lyZDCv46lEtMMZ4mCsuhjxxc0ACU"),
        teamId: z.literal("team_pB5TcLa7apLtPAiVrRbcjBG3"),
        settings: nativeSettingsSchema,
      })
      .strict(),
    baseline: z.object({ applicationSha: sha }).strict(),
    config: z
      .object({ protectionSha256: digest, environmentMetadataSha256: digest })
      .strict(),
    compatibility: z
      .object({
        changedPaths: z.array(path).max(5000),
        risks: z.array(compatibilityRiskSchema).max(5),
      })
      .strict(),
    publication: z
      .object({
        archive: z
          .object({
            path: z.string().regex(/^\/shaolin\/[a-z0-9]+(?:-[a-z0-9]+)*$/),
            title: z.string().min(1).max(300),
          })
          .strict(),
        chronicles: z
          .array(
            z
              .object({
                path: z.string().regex(/^\/shaolin\/[a-z0-9-]+$/),
                title: z.string().min(1).max(300),
                date: z.string().regex(/^\d{4}-\d{2}-\d{2}/),
                text: z.array(z.string().max(160)).max(4),
              })
              .strict(),
          )
          .max(100),
        assets: z
          .array(
            z
              .object({
                path: z.string().startsWith("/images/"),
                sha256: digest,
              })
              .strict(),
          )
          .max(500),
      })
      .strict(),
  })
  .strict();
export type NativeCodeEvidence = z.infer<typeof nativeEvidenceSchema>;

export function validateNativeEvidence(value: unknown): NativeCodeEvidence {
  const evidence = nativeEvidenceSchema.parse(value);
  if (
    evidence.workflow.sha !== evidence.commit ||
    evidence.ci.sha !== evidence.commit ||
    evidence.ci.workflowSha !== evidence.commit
  )
    throw new Error("code.evidence-revision");
  if (
    settingsDigest(evidence.vercel.settings) !== evidence.vercel.settingsSha256
  )
    throw new Error("code.settings-digest");
  if (blockingCompatibilityRisks(evidence.compatibility.risks).length)
    throw new Error("code.sensitive-compatibility-review");
  return evidence;
}
export function loadNativeEvidence(
  file: string,
  expectedDigest: string,
  commit: string,
  env: Readonly<Record<string, string | undefined>> = process.env,
) {
  digest.parse(expectedDigest);
  sha.parse(commit);
  const bytes = readFileSync(file);
  if (sha256(bytes) !== expectedDigest) throw new Error("code.evidence-digest");
  const evidence = validateNativeEvidence(JSON.parse(bytes.toString("utf8")));
  if (
    evidence.commit !== commit ||
    evidence.workflow.sha !== env.GITHUB_SHA ||
    evidence.workflow.runId !== env.GITHUB_RUN_ID ||
    evidence.workflow.runAttempt !== env.GITHUB_RUN_ATTEMPT
  )
    throw new Error("code.evidence-workflow-binding");
  return evidence;
}

/** Record only metadata digests, never provider values or decrypted secrets. */
export function configurationEvidence(project: unknown, environment: unknown) {
  const p = z.record(z.string(), z.unknown()).parse(project);
  const protection = Object.fromEntries(
    [
      "ssoProtection",
      "passwordProtection",
      "trustedIps",
      "optionsAllowlist",
      "protectionBypass",
      "skewProtectionMaxAge",
    ].map((key) => [key, p[key] ?? null]),
  );
  const env = z
    .object({
      envs: z.array(
        z.object({
          id: z.string(),
          key: z.string(),
          type: z.string().optional(),
          target: z.array(z.string()).optional(),
          gitBranch: z.string().nullable().optional(),
          updatedAt: z.union([z.string(), z.number()]).optional(),
        }),
      ),
      pagination: z.object({ next: z.number().nullable() }).optional(),
    })
    .parse(environment);
  if (env.pagination?.next)
    throw new Error("code.incomplete-environment-metadata");
  const records = env.envs
    .filter((e) => e.target?.includes("production"))
    .map((e) => ({
      id: e.id,
      key: e.key,
      type: e.type ?? null,
      target: [...(e.target ?? [])].sort(),
      gitBranch: e.gitBranch ?? null,
      updatedAt: e.updatedAt ?? null,
    }))
    .sort((a, b) => a.id.localeCompare(b.id));
  if (records.filter((e) => e.key === "DATABASE_URL").length !== 1)
    throw new Error("code.runtime-database-configuration");
  return {
    protectionSha256: sha256(JSON.stringify(protection)),
    environmentMetadataSha256: sha256(JSON.stringify(records)),
  };
}

/** Only operations with separate sensitive procedures block ordinary execution.
 * Query/auth/config code compatibility risks are presented at the existing gate. */
export function blockingCompatibilityRisks(
  risks: readonly z.infer<typeof compatibilityRiskSchema>[],
) {
  return risks.filter(
    (risk) => risk === "database-schema" || risk === "analytics-activation",
  );
}
export function compatibilityRisks(
  changedPaths: string[],
  changedText: (file: string) => string,
) {
  const risks = new Set<z.infer<typeof compatibilityRiskSchema>>();
  for (const file of changedPaths) {
    if (/^(db\/(migrations|schema)|prisma\/schema)/.test(file))
      risks.add("database-schema");
    if (
      /^(lib\/(auth|authz)\/|app\/(?:api\/auth|_auth)\/|auth\.|middleware\.)/.test(
        file,
      )
    ) {
      // The build-only guard changes when Prisma may be constructed during
      // next build, with no runtime session, callback or authorization changes.
      const changed = changedText(file)
        .split("\n")
        .filter((line) => /^[+-](?![+-])/.test(line));
      const buildOnly =
        changed.length > 0 &&
        changed.every(
          (line) =>
            /^\+import \{ isNextBuild \} from "@\/lib\/env";\s*$/.test(line) ||
            /^\+\s*(?:if \(isNextBuild\(\)\) \{|throw new Error\("Prisma access disabled during Next\.js production build\."\);|\})\s*$/.test(
              line,
            ),
        );
      if (!buildOnly) risks.add("authentication-policy");
    }
    if (
      /^(lib\/analytics-archive\/(collector|operations|authorization)|lib\/analytics\/config)/.test(
        file,
      )
    )
      risks.add("analytics-activation");
    if (/^(app|lib|db)\/.*\.(ts|tsx|sql)$/.test(file)) {
      const added = changedText(file)
        .split("\n")
        .filter((line) => /^[+-](?![+-])/.test(line))
        .join("\n");
      if (
        /\b(SELECT|INSERT INTO|UPDATE|DELETE FROM|CREATE TABLE|ALTER TABLE|DROP TABLE)\b/i.test(
          added,
        )
      )
        risks.add("database-query-contract");
      if (
        /process\.env\.(?:DATABASE_URL|NEXTAUTH_SECRET|AUTH_SECRET|GOOGLE_CLIENT|ANALYTICS_SYNC_ENABLED)/.test(
          added,
        )
      )
        risks.add("runtime-configuration");
    }
    if (file === "vercel.json") {
      const changed = changedText(file)
        .split("\n")
        .filter((line) => /^[+-](?![+-])/.test(line))
        .join("\n");
      if (
        /"(?:crons|env|regions|rewrites|redirects|headers|functions)"/.test(
          changed,
        )
      )
        risks.add("runtime-configuration");
    }
  }
  return [...risks].sort();
}
export function changedCompatibility(baselineSha: string, commit: string) {
  sha.parse(baselineSha);
  sha.parse(commit);
  execFileSync("git", ["merge-base", "--is-ancestor", baselineSha, commit]);
  const changedPaths = execFileSync(
    "git",
    ["diff", "--name-only", baselineSha, commit],
    { encoding: "utf8" },
  )
    .trim()
    .split("\n")
    .filter(Boolean);
  return {
    changedPaths,
    risks: compatibilityRisks(changedPaths, (file) =>
      execFileSync(
        "git",
        ["diff", "--unified=0", baselineSha, commit, "--", file],
        { encoding: "utf8" },
      ),
    ),
  };
}

/** Trust the repository CI push run and GitHub Actions check identities at this SHA. */
export async function trustedRequiredCi(
  commit: string,
  token: string,
  api: Api,
) {
  sha.parse(commit);
  const base = `/repos/${RELEASE_REPOSITORY}`;
  const workflow = z
    .object({
      id: z.number().int().positive(),
      path: z.literal(".github/workflows/ci.yml"),
      state: z.literal("active"),
    })
    .parse(await api(`${base}/actions/workflows/ci.yml`, token));
  const runs = z
    .object({
      workflow_runs: z.array(
        z.object({
          id: z.number().int().positive(),
          run_attempt: z.number().int().positive(),
          workflow_id: z.number(),
          head_sha: z.string(),
          head_branch: z.string(),
          event: z.string(),
          path: z.string(),
          status: z.string(),
          conclusion: z.string().nullable(),
          head_repository: z.object({ id: z.number(), full_name: z.string() }),
          check_suite_id: z.number().int().positive(),
        }),
      ),
    })
    .parse(
      await api(
        `${base}/actions/workflows/ci.yml/runs?head_sha=${commit}&branch=main&event=push&status=success&per_page=100`,
        token,
      ),
    );
  const run = runs.workflow_runs.find(
    (r) =>
      r.workflow_id === workflow.id &&
      r.head_sha === commit &&
      r.head_branch === "main" &&
      r.event === "push" &&
      r.path === workflow.path &&
      r.status === "completed" &&
      r.conclusion === "success" &&
      r.head_repository.id === RELEASE_REPOSITORY_ID &&
      r.head_repository.full_name === RELEASE_REPOSITORY,
  );
  if (!run) throw new Error("code.required-ci-unavailable");
  const checks = z
    .object({
      total_count: z.number(),
      check_runs: z.array(
        z.object({
          id: z.number().int().positive(),
          name: z.string(),
          head_sha: z.string(),
          status: z.string(),
          conclusion: z.string().nullable(),
          app: z.object({ id: z.number(), slug: z.string() }),
          check_suite: z.object({ id: z.number() }),
        }),
      ),
    })
    .parse(
      await api(
        `${base}/check-suites/${run.check_suite_id}/check-runs?per_page=100`,
        token,
      ),
    );
  if (checks.total_count > 100) throw new Error("code.required-ci-ambiguous");
  const ids = ["Lint, test, build", "coverage"].map((name) => {
    const matches = checks.check_runs.filter(
      (c) =>
        c.name === name &&
        c.head_sha === commit &&
        c.status === "completed" &&
        c.conclusion === "success" &&
        c.app.id === 15368 &&
        c.app.slug === "github-actions" &&
        c.check_suite.id === run.check_suite_id,
    );
    if (matches.length !== 1) throw new Error("code.required-ci-unavailable");
    return String(matches[0].id);
  });
  return {
    runId: String(run.id),
    runAttempt: String(run.run_attempt),
    sha: commit,
    workflowSha: commit,
    workflowPath: workflow.path,
    workflowId: String(workflow.id),
    checkRunIds: ids,
  };
}
