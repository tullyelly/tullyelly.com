import { createPrivateKey, sign } from "node:crypto";
import { z } from "zod";
import { validateEnvironmentGate, validateReviewedMainRules } from "./manifest";

export const RELEASE_REPOSITORY = "tullyelly/tullyelly.com";
export const RELEASE_REPOSITORY_ID = 1038458067;
export const RELEASE_REVIEW_BRANCH = "cipher/analytics-archive";
const decimal = z.string().regex(/^[1-9][0-9]*$/);
const appSchema = z
  .object({
    appId: decimal,
    installationId: decimal,
    slug: z.string().regex(/^[a-z0-9][a-z0-9-]*$/),
    botUserId: decimal,
  })
  .strict();
export type AppConfiguration = z.infer<typeof appSchema>;
export function appConfiguration(
  env: Readonly<Record<string, string | undefined>>,
): AppConfiguration {
  if (env.GITHUB_REPOSITORY !== RELEASE_REPOSITORY)
    throw new Error("The release App is restricted to tullyelly/tullyelly.com");
  return appSchema.parse({
    appId: env.RELEASE_APP_ID,
    installationId: env.RELEASE_APP_INSTALLATION_ID,
    slug: env.RELEASE_APP_SLUG,
    botUserId: env.RELEASE_APP_BOT_USER_ID,
  });
}
export function createAppJwt(
  appId: string,
  privateKey: string,
  now = Date.now(),
) {
  decimal.parse(appId);
  const key = createPrivateKey(privateKey);
  if (
    key.asymmetricKeyType !== "rsa" ||
    (key.asymmetricKeyDetails?.modulusLength ?? 0) < 2048
  )
    throw new Error("A GitHub App RSA key of at least 2048 bits is required");
  const issued = Math.floor(now / 1000);
  const encode = (value: unknown) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");
  const unsigned = `${encode({ alg: "RS256", typ: "JWT" })}.${encode({ iat: issued - 60, exp: issued + 300, iss: appId })}`;
  return `${unsigned}.${sign("RSA-SHA256", Buffer.from(unsigned), key).toString("base64url")}`;
}
export type Api = (
  path: string,
  token: string,
  method?: "GET" | "POST" | "PATCH" | "DELETE",
  body?: unknown,
) => Promise<unknown>;
export class GitHubApiError extends Error {
  constructor(
    readonly classification:
      | "unauthenticated"
      | "forbidden"
      | "not-found-or-not-visible"
      | "transient"
      | "unexpected-status"
      | "transport",
    readonly status?: number,
  ) {
    super(
      `GitHub API ${classification}${status === undefined ? "" : ` (HTTP ${status})`}; response omitted`,
    );
    this.name = "GitHubApiError";
  }
}

export const githubApi: Api = async (path, token, method = "GET", body) => {
  if (!path.startsWith("/") || path.startsWith("//"))
    throw new Error("Invalid GitHub API path");
  let response: Response;
  try {
    response = await fetch(`https://api.github.com${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
      redirect: "error",
    });
  } catch {
    throw new GitHubApiError("transport");
  }
  const expectedStatus =
    method === "GET" || method === "PATCH"
      ? 200
      : method === "DELETE" || path.endsWith("/dispatches")
        ? 204
        : 201;
  if (response.status !== expectedStatus)
    throw new GitHubApiError(
      response.status === 401
        ? "unauthenticated"
        : response.status === 403
          ? "forbidden"
          : response.status === 404
            ? "not-found-or-not-visible"
            : response.status === 429 || response.status >= 500
              ? "transient"
              : "unexpected-status",
      response.status,
    );
  return response.status === 204 ? undefined : response.json();
};
export function modePermissions(
  mode: "smoke" | "production" | "draft-pr" | "maintenance" | "analytics",
) {
  return mode === "draft-pr"
    ? { contents: "read", pull_requests: "write" }
    : { actions: "write" };
}
export const appConfig = appConfiguration;
export type InstallationPermissions = {
  actions?: "write";
  contents?: "read" | "write";
  pull_requests?: "write";
  workflows?: "write";
};
export type TokenCleanupResult = {
  outcome: "revoked" | "failed";
  elapsedMs: number;
  apiCategory?: GitHubApiError["classification"];
  httpStatus?: number;
};
export class TokenCleanupError extends Error {
  constructor() {
    super("Installation token revocation failed; credentials omitted");
    this.name = "TokenCleanupError";
  }
}
export async function withScopedInstallationToken<T>(
  configuration: AppConfiguration,
  privateKey: string,
  permissions: InstallationPermissions,
  operation: (token: string) => Promise<T>,
  api: Api = githubApi,
  observeCleanup?: (result: TokenCleanupResult) => void,
): Promise<T> {
  const profile = JSON.stringify(
    Object.fromEntries(Object.entries(permissions).sort()),
  );
  const allowed = [
    { actions: "write" },
    { contents: "read", pull_requests: "write" },
    { contents: "write", workflows: "write" },
  ].map((value) =>
    JSON.stringify(Object.fromEntries(Object.entries(value).sort())),
  );
  if (!allowed.includes(profile))
    throw new Error(
      "Only approved narrow installation token profiles are supported",
    );
  const jwt = createAppJwt(configuration.appId, privateKey);
  const app = z
    .object({ id: z.number(), slug: z.string() })
    .parse(await api("/app", jwt));
  if (String(app.id) !== configuration.appId || app.slug !== configuration.slug)
    throw new Error("GitHub App identity mismatch");
  const installation = z
    .object({
      id: z.number(),
      app_id: z.number(),
      account: z.object({ login: z.string() }),
      repository_selection: z.literal("selected"),
      suspended_at: z.null(),
      permissions: z.record(z.string(), z.string()),
    })
    .parse(
      await api(`/app/installations/${configuration.installationId}`, jwt),
    );
  if (
    String(installation.id) !== configuration.installationId ||
    String(installation.app_id) !== configuration.appId ||
    installation.account.login.toLowerCase() !== "tullyelly"
  )
    throw new Error("GitHub App installation owner or identity mismatch");
  for (const [name, value] of Object.entries(permissions))
    if (
      installation.permissions[name] !== value &&
      !(value === "read" && installation.permissions[name] === "write")
    )
      throw new Error(
        "GitHub App installation lacks the minimum permission for this mode",
      );
  const raw = await api(
    `/app/installations/${configuration.installationId}/access_tokens`,
    jwt,
    "POST",
    { repository_ids: [RELEASE_REPOSITORY_ID], permissions },
  );
  // Capture the token before validating remaining response fields so every usable token is revoked on failure.
  const token = z.object({ token: z.string().min(1) }).parse(raw).token;
  let operationFailed = false;
  try {
    const minted = z
      .object({
        expires_at: z.string().datetime(),
        permissions: z.record(z.string(), z.string()),
        repository_selection: z.literal("selected"),
      })
      .parse(raw);
    if (
      Date.parse(minted.expires_at) <= Date.now() ||
      Date.parse(minted.expires_at) > Date.now() + 61 * 60 * 1000
    )
      throw new Error("Unexpected installation token expiry");
    if (
      Object.entries(minted.permissions).some(([name, value]) =>
        name !== "metadata"
          ? permissions[name as keyof InstallationPermissions] !== value
          : value !== "read",
      ) ||
      Object.entries(permissions).some(
        ([name, value]) => minted.permissions[name] !== value,
      )
    )
      throw new Error("Installation token permissions were not downscoped");
    const bot = z
      .object({ id: z.number(), login: z.string(), type: z.literal("Bot") })
      .parse(
        await api(
          `/users/${encodeURIComponent(`${configuration.slug}[bot]`)}`,
          token,
        ),
      );
    if (
      String(bot.id) !== configuration.botUserId ||
      bot.login !== `${configuration.slug}[bot]`
    )
      throw new Error("Configured GitHub App bot identity mismatch");
    const repositories = z
      .object({
        total_count: z.literal(1),
        repositories: z
          .array(z.object({ id: z.number(), full_name: z.string() }))
          .length(1),
      })
      .parse(await api("/installation/repositories", token));
    if (
      repositories.repositories[0].id !== RELEASE_REPOSITORY_ID ||
      repositories.repositories[0].full_name !== RELEASE_REPOSITORY
    )
      throw new Error("Installation token repository scope mismatch");
    return await operation(token);
  } catch (error) {
    operationFailed = true;
    throw error;
  } finally {
    const started = Date.now();
    try {
      await api("/installation/token", token, "DELETE");
      observeCleanup?.({ outcome: "revoked", elapsedMs: Date.now() - started });
    } catch (error) {
      observeCleanup?.({
        outcome: "failed",
        elapsedMs: Date.now() - started,
        ...(error instanceof GitHubApiError
          ? { apiCategory: error.classification, httpStatus: error.status }
          : {}),
      });
      // Cleanup must not replace the original failure. Success still fails closed if revocation fails.
      if (!operationFailed) throw new TokenCleanupError();
    }
  }
}
export async function withInstallationToken<T>(
  configuration: AppConfiguration,
  privateKey: string,
  mode: "smoke" | "production" | "draft-pr" | "maintenance" | "analytics",
  operation: (token: string) => Promise<T>,
  api: Api = githubApi,
): Promise<T> {
  return withScopedInstallationToken(
    configuration,
    privateKey,
    modePermissions(mode) as InstallationPermissions,
    operation,
    api,
  );
}
const actorSchema = z.object({
  id: z.number(),
  login: z.string(),
  type: z.string(),
});
export function verifyAppRun(
  value: unknown,
  configuration: AppConfiguration,
  headSha: string,
) {
  const run = z
    .object({
      event: z.literal("workflow_dispatch"),
      head_branch: z.literal("main"),
      head_sha: z.string(),
      actor: actorSchema,
      triggering_actor: actorSchema,
    })
    .parse(value);
  if (run.head_sha !== headSha)
    throw new Error("Child workflow commit mismatch");
  for (const actor of [run.actor, run.triggering_actor])
    if (
      String(actor.id) !== configuration.botUserId ||
      actor.login !== `${configuration.slug}[bot]` ||
      actor.type !== "Bot"
    )
      throw new Error(
        "A dedicated GitHub App must dispatch and rerun the release; use the dispatcher again",
      );
}
export function validateDispatchEnvironment(value: unknown, policies: unknown) {
  const env = z
    .object({
      can_admins_bypass: z.literal(false),
      deployment_branch_policy: z.object({
        custom_branch_policies: z.literal(true),
        protected_branches: z.literal(false),
      }),
      protection_rules: z.array(z.object({ type: z.string() })),
    })
    .parse(value);
  if (env.protection_rules.some((rule) => rule.type === "required_reviewers"))
    throw new Error(
      "release-dispatch must not create a circular human approval gate",
    );
  const branches = z
    .object({
      branch_policies: z
        .array(z.object({ name: z.string(), type: z.string() }))
        .length(1),
    })
    .parse(policies).branch_policies;
  if (branches[0].name !== "main" || branches[0].type !== "branch")
    throw new Error(
      "release-dispatch must restrict the private key to main only",
    );
}
export async function verifyProtectedMain(
  token: string,
  sha: string,
  api: Api = githubApi,
) {
  const base = `/repos/${RELEASE_REPOSITORY}`;
  const [branch, rules] = await Promise.all([
    api(`${base}/branches/main`, token),
    api(`${base}/rules/branches/main`, token),
  ]);
  const current = z
    .object({
      protected: z.literal(true),
      commit: z.object({ sha: z.string() }),
    })
    .parse(branch);
  if (current.commit.sha !== sha)
    throw new Error(
      "Protected main moved; restart preparation from the new exact commit",
    );
  validateReviewedMainRules(rules);
}
export class ReleaseVerificationError extends Error {
  constructor(
    readonly invariant: string,
    readonly apiFailure?: GitHubApiError,
  ) {
    super(
      `Release verification failed: ${invariant}${apiFailure ? `; ${apiFailure.message}` : ""}`,
    );
    this.name = "ReleaseVerificationError";
  }
}

export async function verifyChildDispatch(
  env: Readonly<Record<string, string | undefined>>,
  api: Api = githubApi,
  wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms)),
) {
  let invariant = "child.configuration";
  try {
    const configuration = appConfiguration(env);
    invariant = "child.actor-context";
    if (
      env.GITHUB_ACTOR !== `${configuration.slug}[bot]` ||
      env.GITHUB_TRIGGERING_ACTOR !== `${configuration.slug}[bot]`
    )
      throw new Error(
        "Release child actor context must be the dedicated App, including reruns",
      );
    invariant = "child.branch-event-context";
    if (
      env.GITHUB_REF !== "refs/heads/main" ||
      env.GITHUB_EVENT_NAME !== "workflow_dispatch"
    )
      throw new Error(
        "App release children run only on main via workflow dispatch",
      );
    invariant = "child.required-context";
    const token = z.string().min(1).parse(env.GH_TOKEN),
      sha = z
        .string()
        .regex(/^[a-f0-9]{40}$/)
        .parse(env.GITHUB_SHA),
      runId = decimal.parse(env.GITHUB_RUN_ID),
      parentId = decimal.parse(env.RELEASE_DISPATCH_RUN_ID);
    invariant = "child.installation-parent-context";
    if (
      env.RELEASE_DISPATCH_INSTALLATION_ID !== configuration.installationId ||
      runId === parentId
    )
      throw new Error("Dispatcher installation or parent identity mismatch");
    const base = `/repos/${RELEASE_REPOSITORY}`;
    invariant = "child.workflow-context";
    const expectedPath = z
      .enum([
        ".github/workflows/production-release.yml",
        ".github/workflows/analytics-release.yml",
        ".github/workflows/release-gate-smoke.yml",
        ".github/workflows/credential-maintenance.yml",
      ])
      .parse(env.RELEASE_CHILD_WORKFLOW);
    const read = async (code: string, path: string) => {
      try {
        return await api(path, token);
      } catch (error) {
        throw new ReleaseVerificationError(
          code,
          error instanceof GitHubApiError ? error : undefined,
        );
      }
    };
    const [run, bot, environment, policies] = await Promise.all([
      read("child.run-api", `${base}/actions/runs/${runId}`),
      read(
        "child.bot-api",
        `/users/${encodeURIComponent(`${configuration.slug}[bot]`)}`,
      ),
      read("child.gate-api", `${base}/environments/production-release`),
      read(
        "child.gate-policy-api",
        `${base}/environments/production-release/deployment-branch-policies`,
      ),
    ]);
    invariant = "child.run-identity";
    verifyAppRun(run, configuration, sha);
    invariant = "child.workflow-path";
    if (z.object({ path: z.string() }).parse(run).path !== expectedPath)
      throw new Error("Child workflow path mismatch");
    // GitHub's public bot record binds slug to bot ID. App registration and
    // repository-only installation are JWT-verified by the exact-SHA parent;
    // its successful completion below is required before either child proceeds.
    invariant = "child.bot-registration";
    const publicBot = actorSchema.parse(bot);
    if (
      String(publicBot.id) !== configuration.botUserId ||
      publicBot.login !== `${configuration.slug}[bot]` ||
      publicBot.type !== "Bot"
    )
      throw new Error("Public GitHub bot registration mismatch");
    invariant = "child.human-gate";
    validateEnvironmentGate(environment, policies);
    invariant = "child.protected-main";
    await verifyProtectedMain(token, sha, api);
    for (let attempt = 0; attempt < 12; attempt++) {
      invariant = "child.parent-response";
      const parent = z
        .object({
          id: z.number(),
          event: z.literal("workflow_dispatch"),
          head_branch: z.literal("main"),
          head_sha: z.string(),
          path: z.literal(".github/workflows/release-dispatch.yml"),
          status: z.string(),
          conclusion: z.string().nullable(),
        })
        .parse(
          await read("child.parent-api", `${base}/actions/runs/${parentId}`),
        );
      invariant = "child.parent-provenance";
      if (String(parent.id) !== parentId || parent.head_sha !== sha)
        throw new Error("Dispatcher workflow provenance mismatch");
      if (parent.status === "completed") {
        invariant = "child.parent-success";
        if (parent.conclusion !== "success")
          throw new Error("Dispatcher did not complete successfully");
        return;
      }
      if (attempt < 11) await wait(5000);
    }
    invariant = "child.parent-completion-timeout";
    throw new Error(
      "Dispatcher completion could not be verified within the bounded wait",
    );
  } catch (error) {
    if (error instanceof ReleaseVerificationError) throw error;
    throw new ReleaseVerificationError(
      invariant,
      error instanceof GitHubApiError ? error : undefined,
    );
  }
}

export async function verifyHumanApproval(
  env: Readonly<Record<string, string | undefined>>,
  api: Api = githubApi,
) {
  const token = z.string().min(1).parse(env.GH_TOKEN),
    runId = decimal.parse(env.GITHUB_RUN_ID);
  const reviews = z
    .array(
      z.object({
        state: z.string(),
        environments: z.array(z.object({ name: z.string() })),
        user: actorSchema,
      }),
    )
    .parse(
      await api(
        `/repos/${RELEASE_REPOSITORY}/actions/runs/${runId}/approvals`,
        token,
      ),
    );
  const relevant = reviews.filter((review) =>
    review.environments.some(
      (environment) => environment.name === "production-release",
    ),
  );
  if (relevant.length !== 1)
    throw new Error(
      "Exactly one explicit production-release human approval is required; ambiguous history needs a fresh App-dispatched run",
    );
  const latest = relevant[0];
  if (
    !latest ||
    latest.state !== "approved" ||
    latest.user.type !== "User" ||
    latest.user.login !== "tullyelly"
  )
    throw new Error(
      "The production-release gate must have an explicit human approval by tullyelly",
    );
}
