// Exercise the real pinned CLI with a simulated provider on loopback only.
// Nonempty source uploads and provider states are synthetic, not live acceptance.
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  rmSync,
} from "node:fs";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const root = mkdtempSync(join(tmpdir(), "release-cli-contract-"));
const teamId = "team_fixture";
const projectId = "prj_fixture";
const token = "fixture_environment_token";
const sensitive = "FIXTURE_PRIVATE_DETAIL_NEVER_REPORT";
const source = "export default 'nonempty reviewed source upload';\n";
const binding = {
  projectId,
  commit: "a".repeat(40),
  evidenceDigest: "b".repeat(64),
  sourceDigest: "c".repeat(64),
  workflowRunId: "1234",
  workflowRunAttempt: "1",
  collectionEnabled: false,
};
const receipt = JSON.stringify({
  commit: binding.commit,
  archiveSha256: binding.sourceDigest,
});
const project = {
  id: projectId,
  accountId: teamId,
  name: "fixture",
  framework: null,
  rootDirectory: null,
};
const deployment = {
  id: "dpl_fixture",
  url: "fixture.vercel.app",
  readyState: "READY",
  status: "READY",
  target: "production",
  alias: [],
  aliasAssigned: true,
  name: "fixture",
  createdAt: Date.now(),
  projectId,
  team: { id: teamId },
  ownerId: teamId,
  plan: "pro",
  regions: ["iad1"],
  builds: [],
};
let scenario = "rejection";
let requests = [];
let requestFailure;
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    assert.equal(req.headers.authorization, `Bearer ${token}`);
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const bytes = Buffer.concat(chunks);
    const body =
      bytes.length && url.pathname !== "/v2/files"
        ? JSON.parse(bytes.toString())
        : undefined;
    requests.push({ method: req.method, path: url.pathname, body, bytes });
    res.setHeader("content-type", "application/json");
    const reject = (code = "forbidden") => {
      res.statusCode = 403;
      res.end(
        JSON.stringify({
          error: {
            code,
            message: `Git author ${sensitive} must have access to team ${sensitive}; token=${token}; postgres://fixture:${sensitive}@localhost/database`,
          },
        }),
      );
    };
    if (req.method === "POST" && url.pathname === "/v2/files") {
      assert(bytes.length > 0, "Source upload must contain bytes");
      assert.equal(
        req.headers["x-vercel-digest"] ?? req.headers["x-now-digest"],
        createHash("sha1").update(bytes).digest("hex"),
      );
      if (scenario === "upload-rejection") reject();
      else res.end("{}");
    } else if (req.method === "POST" && url.pathname === "/v13/deployments") {
      assert(body.files.length > 0, "Source deployment must include files");
      if (scenario === "rejection") reject();
      else if (!requests.some((request) => request.path === "/v2/files")) {
        res.statusCode = 400;
        res.end(
          JSON.stringify({
            error: {
              code: "missing_files",
              missing: body.files.map((file) => file.sha),
            },
          }),
        );
      } else {
        const readyState = [
          "INITIALIZING",
          "QUEUED",
          "BUILDING",
          "ERROR",
        ].includes(scenario)
          ? scenario
          : "READY";
        res.end(
          JSON.stringify({
            ...deployment,
            readyState,
            status: readyState,
            ...(readyState === "ERROR"
              ? { errorCode: "BUILD_FAILED", errorMessage: sensitive }
              : {}),
          }),
        );
      }
    } else if (
      req.method === "POST" &&
      url.pathname === `/v10/projects/${projectId}/promote/${deployment.id}`
    )
      reject();
    else if (req.method !== "GET") throw Error("unexpected-method");
    else if (url.pathname === "/v2/user") {
      if (scenario === "auth-cli-rejection") {
        res.statusCode = 401;
        res.end(
          JSON.stringify({
            error: { code: "not_authorized", message: sensitive },
          }),
        );
      } else
        res.end(
          JSON.stringify({
            user: { uid: "user_fixture", username: "fixture" },
          }),
        );
    } else if (url.pathname === `/teams/${teamId}`)
      res.end(
        JSON.stringify({
          id: teamId,
          slug: "fixture",
          name: "fixture",
          membership: { role: "OWNER" },
        }),
      );
    else if (url.pathname === `/v9/projects/${projectId}`) {
      assert.equal(url.searchParams.get("teamId"), teamId);
      const mismatch =
        scenario === "auth-cli-target-mismatch" &&
        requests.filter((request) => request.path === url.pathname).length > 1;
      res.end(
        JSON.stringify(
          mismatch ? { ...project, accountId: "team_other" } : project,
        ),
      );
    } else if (url.pathname === `/v13/deployments/${deployment.id}`)
      res.end(JSON.stringify(deployment));
    else if (url.pathname === `/v3/now/deployments/${deployment.id}/events`)
      res.end("[]");
    else throw Error("unexpected-path");
  } catch {
    // Method/path are fixture-authored. Never retain request bodies or headers.
    requestFailure = `${req.method} ${new URL(req.url, "http://localhost").pathname}`;
    res.statusCode = 500;
    res.end('{"error":{"code":"unexpected_error"}}');
  }
});
const childCode = `
const cli = await import(process.argv[1]);
const diagnostics = await import(process.argv[2]);
const config = JSON.parse(process.argv[3]);
const operation = config.auth ? 'vercel.auth-cli' : config.promote ? 'vercel.promote' : 'vercel.stage';
try {
 if(config.auth) {
   const auth = await import(config.authModule);
   const result = await auth.checkCodeAuth({
     token: config.token, projectId: config.binding.projectId, teamId: config.teamId,
     fetcher: (url, init) => { const original = new URL(url); return fetch(config.api + original.pathname + original.search, init); },
     runCli: (operation, args, teamId, token) => cli.codeCli(operation, [...args, '--api', config.api], teamId, token),
   });
   console.log(JSON.stringify(result));
 } else {
 const args = config.promote ? ['promote', 'dpl_fixture', '--yes'] : cli.nativeSourceDeployArguments(config.binding);
 const output = cli.codeCli(operation, [...args, ...config.extra, '--api', config.api], config.teamId, config.token);
 console.log(JSON.stringify(config.promote ? { promoted: true } : { url: cli.stagedDeploymentUrl(output).origin, state: JSON.parse(output).deployment.readyState }));
 }
} catch (error) {
 console.log(JSON.stringify({ diagnostic: diagnostics.classifyCodeFailure(operation, error) }));
 process.exitCode = 1;
}`;
async function check({
  extra = [],
  credential = token,
  promote = false,
  auth = false,
} = {}) {
  requests = [];
  requestFailure = undefined;
  const child = spawn(
    process.execPath,
    [
      "--import",
      require.resolve("tsx"),
      "--input-type=module",
      "-e",
      childCode,
      pathToFileURL(resolve("scripts/release/code-cli.ts")).href,
      pathToFileURL(resolve("scripts/release/code-diagnostics.ts")).href,
      JSON.stringify({
        binding,
        teamId,
        token: credential,
        extra,
        promote,
        auth,
        authModule: pathToFileURL(resolve("scripts/release/code-auth.ts")).href,
        api: `http://127.0.0.1:${server.address().port}`,
      }),
    ],
    {
      cwd: root,
      timeout: 20000,
      env: {
        PATH: process.env.PATH,
        HOME: join(root, "home"),
        VERCEL_TOKEN: "wrong_inherited_token",
        VERCEL_TELEMETRY_DISABLED: "1",
        CI: "true",
      },
    },
  );
  let output = "";
  child.stdout.on("data", (bytes) => {
    output += bytes;
  });
  child.stderr.resume();
  const status = await new Promise((accept, reject) => {
    child.on("error", reject);
    child.on("close", accept);
  });
  assert.equal(
    requestFailure,
    undefined,
    `Unexpected simulated API request: ${requestFailure}`,
  );
  for (const secret of [
    sensitive,
    token,
    "wrong_inherited_token",
    "fixture_wrong_saved_owner_token",
    "postgres://",
    "localhost",
  ])
    assert(
      !output.includes(secret),
      "Sensitive fixture value escaped redaction",
    );
  return { status, result: JSON.parse(output) };
}
try {
  assert.equal(process.version, "v22.20.0", "Use the required Node version");
  mkdirSync(join(root, "home"), { recursive: true });
  const savedOwnerConfig = join(root, "home/.local/share/com.vercel.cli");
  mkdirSync(savedOwnerConfig, { recursive: true });
  writeFileSync(
    join(savedOwnerConfig, "auth.json"),
    JSON.stringify({ token: "fixture_wrong_saved_owner_token" }),
  );
  const version = spawnSync("vercel", ["--version"], {
    encoding: "utf8",
    timeout: 15000,
    env: {
      PATH: process.env.PATH,
      HOME: join(root, "home"),
      VERCEL_TELEMETRY_DISABLED: "1",
    },
  });
  assert.equal(version.status, 0);
  assert.equal(version.stdout.trim(), "63.1.2", "Use the pinned CLI");
  mkdirSync(join(root, ".vercel"), { recursive: true });
  writeFileSync(
    join(root, ".vercel/project.json"),
    JSON.stringify({ projectId, orgId: teamId }),
  );
  writeFileSync(join(root, "index.js"), source);
  writeFileSync(join(root, "release-source.json"), receipt);
  writeFileSync(
    join(root, "package.json"),
    '{"name":"fixture","private":true}',
  );
  writeFileSync(
    join(root, ".env.local"),
    `DATABASE_URL=postgres://fixture:${sensitive}@localhost/database`,
  );
  writeFileSync(
    join(root, ".vercelignore"),
    readFileSync(resolve(".vercelignore"), "utf8") + "\nhome\n",
  );
  await new Promise((accept, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", accept);
  });
  rmSync(join(root, ".vercel"), { recursive: true });
  scenario = "auth-cli-success";
  let authChecked = await check({ auth: true });
  assert.equal(authChecked.status, 0, JSON.stringify(authChecked.result));
  assert.deepEqual(authChecked.result, {
    token: { present: true, malformed: false },
    rest: { projectMatches: true, teamMatches: true },
    cli: { projectMatches: true, teamMatches: true },
  });
  assert(
    requests.every((request) => request.method === "GET"),
    "Auth preflight must perform reads only",
  );
  assert.equal(
    requests.filter((request) => request.path === `/v9/projects/${projectId}`)
      .length,
    2,
    "REST and installed CLI must each read the bound project",
  );
  scenario = "auth-cli-rejection";
  authChecked = await check({ auth: true });
  assert.equal(authChecked.status, 1);
  assert.equal(authChecked.result.diagnostic.guard, "vercel.auth-cli");
  assert(
    requests.some((request) => request.path === `/v9/projects/${projectId}`),
    "REST can succeed while CLI authentication fails",
  );
  assert(requests.every((request) => request.method === "GET"));
  scenario = "auth-cli-target-mismatch";
  authChecked = await check({ auth: true });
  assert.equal(authChecked.status, 1);
  assert.equal(
    authChecked.result.diagnostic.invariant,
    "code.auth-target-mismatch",
  );
  assert(requests.every((request) => request.method === "GET"));
  scenario = "rejection";
  mkdirSync(join(root, ".vercel"));
  writeFileSync(
    join(root, ".vercel/project.json"),
    JSON.stringify({ projectId, orgId: teamId }),
  );
  let checked = await check();
  assert.equal(checked.status, 1);
  assert.equal(checked.result.diagnostic.provider.reason, "deploy_failed");
  assert.equal(
    checked.result.diagnostic.provider.classification,
    "git-author-access-required",
  );
  assert(
    checked.result.diagnostic.provider.message.includes(
      "Git author [REDACTED]",
    ),
  );
  const posted = requests.find(
    (request) => request.path === "/v13/deployments",
  ).body;
  assert.equal(posted.project, projectId);
  assert.equal(posted.target, "production");
  assert.equal(posted.autoAssignCustomDomains, false);
  assert.deepEqual(posted.env, { ANALYTICS_SYNC_ENABLED: "false" });
  assert.deepEqual(posted.build?.env ?? {}, {});
  assert.equal(posted.meta.releaseSha, binding.commit);
  assert.equal(posted.meta.releaseEvidence, binding.evidenceDigest);
  assert.equal(posted.meta.releaseSourceSha256, binding.sourceDigest);
  assert(posted.files.some((file) => file.file === "index.js"));
  assert(posted.files.some((file) => file.file === "release-source.json"));
  assert(
    posted.files.every(
      (file) =>
        !file.file.startsWith(".env") &&
        !file.file.startsWith("home/") &&
        ![".next/", "node_modules/", ".cache/", "cipher/"].some((prefix) =>
          file.file.startsWith(prefix),
        ),
    ),
  );
  scenario = "upload-rejection";
  checked = await check();
  assert.equal(checked.status, 1);
  assert(requests.some((request) => request.path === "/v2/files"));
  assert.equal(
    requests.filter((request) => request.path === "/v13/deployments").length,
    1,
  );
  for (scenario of ["INITIALIZING", "READY", "QUEUED", "BUILDING"]) {
    checked = await check();
    assert.equal(
      checked.status,
      0,
      `Simulated ${scenario} source acceptance: ${JSON.stringify(checked.result)}`,
    );
    assert.deepEqual(checked.result, {
      url: "https://fixture.vercel.app",
      state: scenario,
    });
    assert(
      requests.some(
        (request) =>
          request.path === "/v2/files" && request.bytes.toString() === source,
      ),
      "Actual CLI must upload nonempty source bytes",
    );
    assert(
      requests.some(
        (request) =>
          request.path === "/v2/files" && request.bytes.toString() === receipt,
      ),
      "Actual CLI must upload the source revision receipt",
    );
  }
  scenario = "ERROR";
  checked = await check();
  // --no-wait acknowledges identity even for ERROR; executor API readiness
  // checks, not CLI exit status, decide whether this candidate can promote.
  assert.equal(checked.status, 0);
  assert.deepEqual(checked.result, {
    url: "https://fixture.vercel.app",
    state: "ERROR",
  });
  scenario = "promotion-rejection";
  checked = await check({ promote: true });
  assert.equal(checked.status, 1);
  assert.equal(checked.result.diagnostic.operation, "vercel.promote");
  assert(
    requests.some(
      (request) =>
        request.method === "POST" &&
        request.path === `/v10/projects/${projectId}/promote/${deployment.id}`,
    ),
  );
  assert(
    !requests.some(
      (request) =>
        request.method === "POST" && request.path === "/v13/deployments",
    ),
    "Promotion must not rebuild",
  );
  checked = await check({ credential: "fixture_invalid_token\n" });
  assert.equal(checked.status, 1);
  assert.equal(
    checked.result.diagnostic.provider?.classification,
    "authentication-required",
  );
  assert.equal(requests.length, 0);
  checked = await check({ extra: ["--fixture-unknown-option"] });
  assert.equal(checked.status, 1);
  assert(requests.every((request) => request.method === "GET"));
  console.log(
    "Pinned CLI simulated-provider contract passed: read-only same-credential REST/CLI auth and target checks, nonempty native source upload, upload/deploy rejection, accepted INITIALIZING/QUEUED/BUILDING/READY and ERROR states, JSON success, exact-ID promotion failure and credential redaction. Loopback only; real Vercel acceptance remains pending.",
  );
} finally {
  server.closeAllConnections();
  await new Promise((accept) => server.close(accept));
  rmSync(root, { recursive: true, force: true });
}
