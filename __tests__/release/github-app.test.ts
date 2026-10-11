/** @jest-environment node */
import { generateKeyPairSync, verify } from "node:crypto";
import { readFileSync } from "node:fs";
import {
  TokenCleanupError,
  GitHubApiError,
  githubApi,
  appConfiguration,
  createAppJwt,
  modePermissions,
  RELEASE_REPOSITORY,
  RELEASE_REPOSITORY_ID,
  validateDispatchEnvironment,
  verifyAppRun,
  verifyChildDispatch,
  verifyHumanApproval,
  withInstallationToken,
  withScopedInstallationToken,
  type Api,
} from "../../scripts/release/app";
import {
  dispatchInputSchema,
  dispatchPayload,
  prepareDraftPr,
} from "../../scripts/release-dispatch";
const config = {
  appId: "123",
  installationId: "456",
  slug: "cipher-release-fixture",
  botUserId: "789",
};
const sha = "a".repeat(40);
const bot = { id: 789, login: "cipher-release-fixture[bot]", type: "Bot" };
const env = {
  GITHUB_ACTIONS: "true",
  GITHUB_ACTOR: "cipher-release-fixture[bot]",
  GITHUB_TRIGGERING_ACTOR: "cipher-release-fixture[bot]",
  GITHUB_REPOSITORY: RELEASE_REPOSITORY,
  GITHUB_REF: "refs/heads/main",
  GITHUB_EVENT_NAME: "workflow_dispatch",
  GITHUB_SHA: sha,
  GITHUB_RUN_ID: "200",
  GH_TOKEN: "fixture-read-token",
  RELEASE_APP_ID: "123",
  RELEASE_APP_INSTALLATION_ID: "456",
  RELEASE_APP_SLUG: "cipher-release-fixture",
  RELEASE_APP_BOT_USER_ID: "789",
  RELEASE_DISPATCH_RUN_ID: "100",
  RELEASE_DISPATCH_INSTALLATION_ID: "456",
  RELEASE_CHILD_WORKFLOW: ".github/workflows/release-gate-smoke.yml",
};
const gate = {
  can_admins_bypass: false,
  deployment_branch_policy: {
    custom_branch_policies: true,
    protected_branches: false,
  },
  protection_rules: [
    {
      type: "required_reviewers",
      prevent_self_review: true,
      reviewers: [{ type: "User", reviewer: { login: "tullyelly" } }],
    },
  ],
};
const branches = { branch_policies: [{ name: "main", type: "branch" }] };
const rules = [
  {
    type: "pull_request",
    parameters: {
      required_approving_review_count: 1,
      dismiss_stale_reviews_on_push: true,
      require_code_owner_review: true,
      require_last_push_approval: true,
    },
  },
  {
    type: "required_status_checks",
    parameters: {
      strict_required_status_checks_policy: true,
      required_status_checks: [{ context: "Lint, test, build" }],
    },
  },
];
let pem: string;
let publicKey: ReturnType<typeof generateKeyPairSync>["publicKey"];
beforeAll(() => {
  const keys = generateKeyPairSync("rsa", { modulusLength: 2048 });
  pem = keys.privateKey.export({ type: "pkcs8", format: "pem" }).toString();
  publicKey = keys.publicKey;
});
function authenticationApi(overrides: Record<string, unknown> = {}) {
  return jest.fn<ReturnType<Api>, Parameters<Api>>(
    async (path, _token, method, body) => {
      if (path in overrides) return overrides[path];
      if (path === "/app") return { id: 123, slug: config.slug };
      if (path === "/app/installations/456")
        return {
          id: 456,
          app_id: 123,
          account: { login: "tullyelly" },
          repository_selection: "selected",
          suspended_at: null,
          permissions: {
            actions: "write",
            contents: "write",
            pull_requests: "write",
            workflows: "write",
          },
        };
      if (path === "/app/installations/456/access_tokens")
        return {
          token: "ephemeral-fixture-token",
          expires_at: new Date(Date.now() + 3600000).toISOString(),
          repository_selection: "selected",
          permissions: {
            ...(body as { permissions: Record<string, string> }).permissions,
            metadata: "read",
          },
        };
      if (path === `/users/${encodeURIComponent(`${config.slug}[bot]`)}`)
        return bot;
      if (path === "/installation/repositories")
        return {
          total_count: 1,
          repositories: [
            { id: RELEASE_REPOSITORY_ID, full_name: RELEASE_REPOSITORY },
          ],
        };
      if (path === "/installation/token" && method === "DELETE")
        return undefined;
      throw new Error(`Unexpected fixture path ${path}`);
    },
  );
}
function childApi(overrides: Record<string, unknown> = {}) {
  const base = `/repos/${RELEASE_REPOSITORY}`;
  return jest.fn<ReturnType<Api>, Parameters<Api>>(async (path) => {
    if (path in overrides) return overrides[path];
    if (path === `${base}/actions/runs/200`)
      return {
        event: "workflow_dispatch",
        head_branch: "main",
        head_sha: sha,
        actor: bot,
        triggering_actor: bot,
        path: env.RELEASE_CHILD_WORKFLOW,
      };
    if (path === `/users/${encodeURIComponent(`${config.slug}[bot]`)}`)
      return bot;
    if (path === `${base}/environments/production-release`) return gate;
    if (
      path ===
      `${base}/environments/production-release/deployment-branch-policies`
    )
      return branches;
    if (path === `${base}/branches/main`)
      return { protected: true, commit: { sha } };
    if (path === `${base}/rules/branches/main`) return rules;
    if (path === `${base}/actions/runs/100`)
      return {
        id: 100,
        event: "workflow_dispatch",
        head_branch: "main",
        head_sha: sha,
        path: ".github/workflows/release-dispatch.yml",
        status: "completed",
        conclusion: "success",
      };
    throw new Error(`Unexpected fixture path ${path}`);
  });
}
describe("dedicated release App", () => {
  it("signs bounded RS256 JWTs with clock skew rather than reusable tokens", () => {
    const now = 1770000000000,
      jwt = createAppJwt("123", pem, now),
      [header, payload, signature] = jwt.split(".");
    expect(JSON.parse(Buffer.from(header, "base64url").toString())).toEqual({
      alg: "RS256",
      typ: "JWT",
    });
    expect(JSON.parse(Buffer.from(payload, "base64url").toString())).toEqual({
      iat: 1770000000 - 60,
      exp: 1770000000 + 300,
      iss: "123",
    });
    expect(
      verify(
        "RSA-SHA256",
        Buffer.from(`${header}.${payload}`),
        publicKey,
        Buffer.from(signature, "base64url"),
      ),
    ).toBe(true);
    expect(
      verify(
        "RSA-SHA256",
        Buffer.from(`${header}.${payload}tampered`),
        publicKey,
        Buffer.from(signature, "base64url"),
      ),
    ).toBe(false);
  });
  it("rejects other repositories and incomplete identity configuration", () => {
    expect(appConfiguration(env)).toEqual(config);
    expect(() =>
      appConfiguration({ ...env, GITHUB_REPOSITORY: "other/repo" }),
    ).toThrow();
    expect(() =>
      appConfiguration({ ...env, RELEASE_APP_BOT_USER_ID: "" }),
    ).toThrow();
  });
  it.each(["smoke", "production", "draft-pr"] as const)(
    "mints only %s permissions for the one repository and revokes on completion",
    async (mode) => {
      const api = authenticationApi();
      await expect(
        withInstallationToken(config, pem, mode, async () => "done", api),
      ).resolves.toBe("done");
      expect(api).toHaveBeenCalledWith(
        "/app/installations/456/access_tokens",
        expect.any(String),
        "POST",
        {
          repository_ids: [RELEASE_REPOSITORY_ID],
          permissions: modePermissions(mode),
        },
      );
      expect(api).toHaveBeenLastCalledWith(
        "/installation/token",
        "ephemeral-fixture-token",
        "DELETE",
      );
    },
  );
  it("supports the separately authorized narrow publishing profile", async () => {
    const api = authenticationApi();
    await withScopedInstallationToken(
      config,
      pem,
      { contents: "write", workflows: "write" },
      async () => undefined,
      api,
    );
    expect(api).toHaveBeenCalledWith(
      "/app/installations/456/access_tokens",
      expect.any(String),
      "POST",
      {
        repository_ids: [RELEASE_REPOSITORY_ID],
        permissions: { contents: "write", workflows: "write" },
      },
    );
    await expect(
      withScopedInstallationToken(
        config,
        pem,
        { actions: "write", contents: "write" },
        async () => undefined,
        api,
      ),
    ).rejects.toThrow("profiles");
  });
  it("revokes a minted token after a failed operation or excessive permissions", async () => {
    const api = authenticationApi();
    await expect(
      withInstallationToken(
        config,
        pem,
        "smoke",
        async () => {
          throw new Error("interruption");
        },
        api,
      ),
    ).rejects.toThrow("interruption");
    expect(api).toHaveBeenLastCalledWith(
      "/installation/token",
      "ephemeral-fixture-token",
      "DELETE",
    );
    const escalated = authenticationApi({
      "/app/installations/456/access_tokens": {
        token: "ephemeral-fixture-token",
        expires_at: new Date(Date.now() + 3600000).toISOString(),
        repository_selection: "selected",
        permissions: { actions: "write", contents: "write" },
      },
    });
    await expect(
      withInstallationToken(
        config,
        pem,
        "smoke",
        async () => undefined,
        escalated,
      ),
    ).rejects.toThrow("downscoped");
    expect(escalated).toHaveBeenLastCalledWith(
      "/installation/token",
      "ephemeral-fixture-token",
      "DELETE",
    );
  });
  it("separates successful publication from token-revocation failure and preserves original failures", async () => {
    const observer = jest.fn();
    const underlying = authenticationApi();
    const api: Api = async (path, ...args) => {
      if (path === "/installation/token")
        throw new GitHubApiError("transient", 503);
      return underlying(path, ...args);
    };
    let published = false;
    await expect(
      withScopedInstallationToken(
        config,
        pem,
        { contents: "write", workflows: "write" },
        async () => {
          published = true;
          return "confirmed";
        },
        api,
        observer,
      ),
    ).rejects.toBeInstanceOf(TokenCleanupError);
    expect(published).toBe(true);
    expect(observer).toHaveBeenCalledWith(
      expect.objectContaining({
        outcome: "failed",
        apiCategory: "transient",
        httpStatus: 503,
      }),
    );
    const original = new Error("original operation failure");
    await expect(
      withScopedInstallationToken(
        config,
        pem,
        { actions: "write" },
        async () => {
          throw original;
        },
        api,
        observer,
      ),
    ).rejects.toBe(original);
    expect(observer).toHaveBeenCalledTimes(2);
    const success = jest.fn();
    await withScopedInstallationToken(
      config,
      pem,
      { actions: "write" },
      async () => undefined,
      authenticationApi(),
      success,
    );
    expect(success).toHaveBeenCalledWith(
      expect.objectContaining({ outcome: "revoked" }),
    );
  });
  it("rejects wrong App, installation owner and repository scope", async () => {
    const wrongApp = authenticationApi({
      "/app": { id: 999, slug: config.slug },
    });
    await expect(
      withInstallationToken(
        config,
        pem,
        "smoke",
        async () => undefined,
        wrongApp,
      ),
    ).rejects.toThrow();
    expect(wrongApp.mock.calls.some((call) => call[2] === "POST")).toBe(false);
    const wrongOwner = authenticationApi({
      "/app/installations/456": {
        id: 456,
        app_id: 123,
        account: { login: "other" },
        repository_selection: "selected",
        suspended_at: null,
        permissions: { actions: "write" },
      },
    });
    await expect(
      withInstallationToken(
        config,
        pem,
        "smoke",
        async () => undefined,
        wrongOwner,
      ),
    ).rejects.toThrow();
    const wrongRepo = authenticationApi({
      "/installation/repositories": {
        total_count: 1,
        repositories: [{ id: 99, full_name: "other/repo" }],
      },
    });
    await expect(
      withInstallationToken(
        config,
        pem,
        "smoke",
        async () => undefined,
        wrongRepo,
      ),
    ).rejects.toThrow();
    expect(wrongRepo).toHaveBeenLastCalledWith(
      "/installation/token",
      "ephemeral-fixture-token",
      "DELETE",
    );
  });
  it("rejects incorrect public bot metadata before repository operations and revokes", async () => {
    const api = authenticationApi({
        [`/users/${encodeURIComponent(`${config.slug}[bot]`)}`]: {
          ...bot,
          id: 999,
        },
      }),
      operation = jest.fn(async () => undefined);
    await expect(
      withInstallationToken(config, pem, "smoke", operation, api),
    ).rejects.toThrow("bot identity");
    expect(operation).not.toHaveBeenCalled();
    expect(api).toHaveBeenLastCalledWith(
      "/installation/token",
      "ephemeral-fixture-token",
      "DELETE",
    );
  });
  it("binds actor and triggering actor, rejecting human reruns and renamed/mismatched bots", () => {
    const run = {
      event: "workflow_dispatch",
      head_branch: "main",
      head_sha: sha,
      actor: bot,
      triggering_actor: bot,
    };
    expect(() => verifyAppRun(run, config, sha)).not.toThrow();
    for (const changed of [
      { actor: { ...bot, id: 999 } },
      { actor: { ...bot, login: "other[bot]" } },
      { triggering_actor: { id: 5, login: "tullyelly", type: "User" } },
      { head_sha: "b".repeat(40) },
      { head_branch: "cipher/analytics-archive" },
    ])
      expect(() => verifyAppRun({ ...run, ...changed }, config, sha)).toThrow();
  });
  it("requires main-only dispatch key scope without a circular reviewer gate", () => {
    expect(() =>
      validateDispatchEnvironment({ ...gate, protection_rules: [] }, branches),
    ).not.toThrow();
    expect(() => validateDispatchEnvironment(gate, branches)).toThrow();
    expect(() =>
      validateDispatchEnvironment(
        { ...gate, protection_rules: [] },
        { branch_policies: [{ name: "*", type: "branch" }] },
      ),
    ).toThrow();
  });
  it("checks successful dispatcher provenance and child installation identity", async () => {
    await expect(
      verifyChildDispatch(env, childApi(), async () => undefined),
    ).resolves.toBeUndefined();
    await expect(
      verifyChildDispatch(
        { ...env, RELEASE_DISPATCH_INSTALLATION_ID: "999" },
        childApi(),
      ),
    ).rejects.toThrow("installation");
    const wrongParent = childApi({
      [`/repos/${RELEASE_REPOSITORY}/actions/runs/100`]: {
        id: 100,
        event: "workflow_dispatch",
        head_branch: "main",
        head_sha: sha,
        path: ".github/workflows/other.yml",
        status: "completed",
        conclusion: "success",
      },
    });
    await expect(verifyChildDispatch(env, wrongParent)).rejects.toThrow();
  });
  it("reports failed invariants instead of the observed generic smoke error", async () => {
    await expect(
      verifyChildDispatch({ ...env, GITHUB_ACTOR: "tullyelly" }, childApi()),
    ).rejects.toThrow("child.actor-context");
    await expect(
      verifyChildDispatch({ ...env, GH_TOKEN: undefined }, childApi()),
    ).rejects.toThrow("child.required-context");
    const failingApi: Api = async (path, ...args) => {
      if (path.endsWith("/environments/production-release"))
        throw new Error("secret-token and sensitive API payload");
      return childApi()(path, ...args);
    };
    await expect(verifyChildDispatch(env, failingApi)).rejects.toThrow(
      "Release verification failed: child.gate-api",
    );
    try {
      await verifyChildDispatch(env, failingApi);
    } catch (error) {
      expect(String(error)).not.toMatch(/secret-token|sensitive API payload/);
    }
    await expect(
      verifyChildDispatch(
        env,
        childApi({
          [`/repos/${RELEASE_REPOSITORY}/environments/production-release`]: {},
        }),
      ),
    ).rejects.toThrow("child.human-gate");
    await expect(
      verifyChildDispatch(
        env,
        childApi({
          [`/repos/${RELEASE_REPOSITORY}/branches/main`]: {
            protected: true,
            commit: { sha: "b".repeat(40) },
          },
        }),
      ),
    ).rejects.toThrow("child.protected-main");
    await expect(
      verifyChildDispatch(env, childApi(), async () => undefined),
    ).resolves.toBeUndefined();
  });
  it("uses authoritative bot metadata and successful JWT-verified parent rather than private App lookup", async () => {
    const api = childApi();
    await verifyChildDispatch(env, api);
    expect(api).not.toHaveBeenCalledWith(
      `/apps/${config.slug}`,
      expect.anything(),
    );
    expect(api).toHaveBeenCalledWith(
      `/users/${encodeURIComponent(`${config.slug}[bot]`)}`,
      expect.anything(),
    );
    const path = `/users/${encodeURIComponent(`${config.slug}[bot]`)}`;
    for (const invalid of [
      { ...bot, id: 999 },
      { ...bot, login: "other[bot]" },
      { ...bot, type: "User" },
    ])
      await expect(
        verifyChildDispatch(env, childApi({ [path]: invalid })),
      ).rejects.toThrow("child.bot-registration");
    const denied: Api = async (request, ...args) => {
      if (request === path) throw new GitHubApiError("forbidden", 403);
      return childApi()(request, ...args);
    };
    await expect(verifyChildDispatch(env, denied)).rejects.toThrow(
      "child.bot-api; GitHub API forbidden (HTTP 403)",
    );
  });
  it("bounds interrupted dispatcher waiting and does not proceed after failure", async () => {
    const path = `/repos/${RELEASE_REPOSITORY}/actions/runs/100`;
    const parent = {
      id: 100,
      event: "workflow_dispatch",
      head_branch: "main",
      head_sha: sha,
      path: ".github/workflows/release-dispatch.yml",
      status: "in_progress",
      conclusion: null,
    };
    const api = childApi({ [path]: parent }),
      wait = jest.fn(async () => undefined);
    await expect(verifyChildDispatch(env, api, wait)).rejects.toThrow(
      "child.parent-completion-timeout",
    );
    expect(wait).toHaveBeenCalledTimes(11);
    await expect(
      verifyChildDispatch(
        env,
        childApi({
          [path]: { ...parent, status: "completed", conclusion: "failure" },
        }),
        wait,
      ),
    ).rejects.toThrow("child.parent-success");
  });
  it("accepts only one actual human owner approval, never App or ambiguous approvals", async () => {
    const review = {
      state: "approved",
      environments: [{ name: "production-release" }],
      user: { id: 5, login: "tullyelly", type: "User" },
    };
    const api = (reviews: unknown[]) =>
      jest.fn<ReturnType<Api>, Parameters<Api>>(async () => reviews);
    await expect(
      verifyHumanApproval(env, api([review])),
    ).resolves.toBeUndefined();
    for (const reviews of [
      [],
      [{ ...review, user: bot }],
      [{ ...review, state: "rejected" }],
      [review, review],
    ])
      await expect(verifyHumanApproval(env, api(reviews))).rejects.toThrow();
  });
  it("dispatches only fixed children on main with explicit production manifest binding", () => {
    expect(dispatchPayload({ mode: "smoke", sha }, config, "100")).toEqual({
      workflow: "release-gate-smoke.yml",
      body: {
        ref: "main",
        inputs: {
          release_sha: sha,
          dispatch_run_id: "100",
          dispatch_installation_id: "456",
        },
      },
    });
    expect(
      dispatchPayload(
        {
          mode: "production",
          sha,
          manifestPath: "releases/analytics.json",
          manifestSha256: "b".repeat(64),
        },
        config,
        "100",
      ).body.inputs,
    ).toMatchObject({
      release_sha: sha,
      manifest_path: "releases/analytics.json",
      manifest_sha256: "b".repeat(64),
    });
    expect(() =>
      dispatchInputSchema.parse({ mode: "production", sha }),
    ).toThrow();
    expect(() =>
      dispatchInputSchema.parse({
        mode: "production",
        sha,
        manifestPath: "../../secret",
        manifestSha256: "b".repeat(64),
      }),
    ).toThrow();
    expect(() =>
      dispatchPayload(
        { mode: "draft-pr", sha, title: "Review" },
        config,
        "100",
      ),
    ).toThrow();
  });
  it("keeps the harmless child free of production secrets and mutation executors", () => {
    const workflow = readFileSync(
        ".github/workflows/release-gate-smoke.yml",
        "utf8",
      ),
      script = readFileSync("scripts/release-gate-smoke.ts", "utf8");
    expect(workflow).not.toContain("${{ secrets.");
    for (const text of [workflow, script])
      expect(text).not.toMatch(
        /release-db|production-release\.ts|vercel (deploy|promote)|DATABASE_URL|NEON_API_KEY|PRIVATE_KEY/,
      );
    expect(workflow).toContain("environment: production-release");
    expect(
      readFileSync(".github/workflows/release-dispatch.yml", "utf8"),
    ).toContain("environment: release-dispatch");
  });
});
describe("App-authored draft review", () => {
  const pr = {
    number: 42,
    html_url: "https://github.com/tullyelly/tullyelly.com/pull/42",
    draft: true,
    user: bot,
    head: {
      sha,
      ref: "cipher/analytics-archive",
      repo: { id: RELEASE_REPOSITORY_ID },
    },
    base: { ref: "main", repo: { id: RELEASE_REPOSITORY_ID } },
  };
  function api(existing: unknown[], headSha = sha, response: unknown = pr) {
    return jest.fn<ReturnType<Api>, Parameters<Api>>(
      async (path, _token, method) => {
        if (path.includes("/git/ref/")) return { object: { sha: headSha } };
        if (method === "POST" || method === "PATCH") return response;
        return existing;
      },
    );
  }
  it("creates only an App-owned draft at the existing exact remote branch", async () => {
    const mock = api([]);
    await expect(
      prepareDraftPr(
        { mode: "draft-pr", sha, title: "Prepared review" },
        config,
        "fixture",
        mock,
      ),
    ).resolves.toBe(pr.html_url);
    expect(mock).toHaveBeenCalledWith(
      `/repos/${RELEASE_REPOSITORY}/pulls`,
      "fixture",
      "POST",
      expect.objectContaining({
        draft: true,
        head: "cipher/analytics-archive",
        base: "main",
        maintainer_can_modify: false,
      }),
    );
    expect(
      mock.mock.calls.some((call) => /approve|merge|git\/refs/.test(call[0])),
    ).toBe(false);
  });
  it("rejects a creation result with a different base, head or actor type", async () => {
    for (const response of [
      { ...pr, base: { ...pr.base, ref: "other" } },
      { ...pr, head: { ...pr.head, ref: "other" } },
      { ...pr, user: { ...pr.user, type: "User" } },
    ])
      await expect(
        prepareDraftPr(
          { mode: "draft-pr", sha, title: "Review" },
          config,
          "fixture",
          api([], sha, response),
        ),
      ).rejects.toThrow("identity");
  });
  it("updates its own draft but refuses human drafts, ready PRs and changed heads", async () => {
    const mock = api([pr]);
    await prepareDraftPr(
      { mode: "draft-pr", sha, title: "Updated review" },
      config,
      "fixture",
      mock,
    );
    expect(mock).toHaveBeenCalledWith(
      `/repos/${RELEASE_REPOSITORY}/pulls/42`,
      "fixture",
      "PATCH",
      expect.any(Object),
    );
    for (const existing of [
      { ...pr, user: { id: 5, login: "tullyelly", type: "User" } },
      { ...pr, draft: false },
    ])
      await expect(
        prepareDraftPr(
          { mode: "draft-pr", sha, title: "Review" },
          config,
          "fixture",
          api([existing]),
        ),
      ).rejects.toThrow("overwrite");
    await expect(
      prepareDraftPr(
        { mode: "draft-pr", sha, title: "Review" },
        config,
        "fixture",
        api([], "b".repeat(40)),
      ),
    ).rejects.toThrow("Published");
  });
});

describe("redacted GitHub transport diagnostics", () => {
  const originalFetch = global.fetch;
  afterEach(() => {
    global.fetch = originalFetch;
  });
  test.each([
    [401, "unauthenticated"],
    [403, "forbidden"],
    [404, "not-found-or-not-visible"],
    [429, "transient"],
    [503, "transient"],
  ])(
    "classifies HTTP %s without reading the body",
    async (status, classification) => {
      const json = jest.fn();
      global.fetch = jest.fn().mockResolvedValue({ status, json });
      await expect(
        githubApi("/apps/fixture", "secret-fixture-token"),
      ).rejects.toMatchObject({ status, classification });
      expect(json).not.toHaveBeenCalled();
    },
  );
  test("omits sensitive transport errors and allows validated successful responses", async () => {
    global.fetch = jest
      .fn()
      .mockRejectedValue(new Error("secret-fixture-token; sensitive-body"));
    await expect(
      githubApi("/apps/fixture", "secret-fixture-token"),
    ).rejects.toThrow("GitHub API transport; response omitted");
    global.fetch = jest
      .fn()
      .mockResolvedValue({ status: 200, json: async () => ({ id: 123 }) });
    await expect(
      githubApi("/apps/fixture", "secret-fixture-token"),
    ).resolves.toEqual({ id: 123 });
  });
});
