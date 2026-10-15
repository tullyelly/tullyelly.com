// Exercise the installed pinned CLI and the production wrapper against loopback
// only. All credentials, project data and deployment responses are synthetic.
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
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
const binding = {
  projectId,
  commit: "a".repeat(40),
  manifestDigest: "b".repeat(64),
  buildDigest: "c".repeat(64),
};
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
  plan: "pro",
  regions: ["iad1"],
  builds: [],
};
let scenario = "rejection";
let requests = [];
let requestFailure = false;
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    assert.equal(req.headers.authorization, `Bearer ${token}`);
    assert.equal(url.hostname, "localhost");
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = chunks.length
      ? JSON.parse(Buffer.concat(chunks).toString())
      : undefined;
    requests.push({ method: req.method, path: url.pathname, body });
    res.setHeader("content-type", "application/json");
    if (req.method === "POST" && url.pathname === "/v13/deployments") {
      if (scenario === "rejection") {
        res.statusCode = 403;
        res.end(
          JSON.stringify({
            error: {
              code: "forbidden",
              message: `Git author ${sensitive} must have access to team ${sensitive}`,
            },
          }),
        );
      } else res.end(JSON.stringify(deployment));
    } else if (req.method !== "GET") throw Error("unexpected method");
    else if (url.pathname === "/v2/user")
      res.end(
        JSON.stringify({ user: { uid: "user_fixture", username: "fixture" } }),
      );
    else if (url.pathname === `/teams/${teamId}`)
      res.end(
        JSON.stringify({
          id: teamId,
          slug: "fixture",
          name: "fixture",
          membership: { role: "OWNER" },
        }),
      );
    else if (url.pathname === `/v9/projects/${projectId}`)
      res.end(JSON.stringify(project));
    else if (url.pathname === `/v3/now/deployments/${deployment.id}/events`)
      res.end("[]");
    else throw Error("unexpected path");
  } catch {
    requestFailure = true;
    res.statusCode = 500;
    res.end('{"error":{"code":"unexpected_error"}}');
  }
});
const childCode = `
const cli = await import(process.argv[1]);
const diagnostics = await import(process.argv[2]);
const config = JSON.parse(process.argv[3]);
try {
 const output = cli.codeCli('vercel.stage', [...cli.prebuiltDeployArguments(config.binding), ...config.extra, '--api', config.api], config.teamId, config.token);
 console.log(JSON.stringify({ url: cli.stagedDeploymentUrl(output).origin }));
} catch (error) {
 console.log(JSON.stringify({ diagnostic: diagnostics.classifyCodeFailure('vercel.stage', error) }));
 process.exitCode = 1;
}`;
async function check(extra = [], credential = token) {
  requests = [];
  requestFailure = false;
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
  // CLI output is captured by the wrapper. Never print child stderr on failure.
  child.stdout.on("data", (bytes) => {
    output += bytes;
  });
  child.stderr.resume();
  const status = await new Promise((accept, reject) => {
    child.on("error", reject);
    child.on("close", accept);
  });
  assert.equal(requestFailure, false, "Unexpected isolated API request");
  assert(!output.includes(sensitive), "Provider detail escaped redaction");
  return { status, result: JSON.parse(output) };
}
try {
  assert.equal(process.version, "v22.20.0", "Use the required Node version");
  mkdirSync(join(root, "home"), { recursive: true });
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
  mkdirSync(join(root, ".vercel/output"), { recursive: true });
  writeFileSync(
    join(root, ".vercel/project.json"),
    JSON.stringify({ projectId, orgId: teamId }),
  );
  writeFileSync(join(root, ".vercel/output/config.json"), '{"version":3}');
  writeFileSync(
    join(root, ".vercel/output/builds.json"),
    '{"target":"production","builds":[]}',
  );
  await new Promise((accept, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", accept);
  });
  let checked = await check();
  assert.equal(checked.status, 1);
  assert.deepEqual(checked.result.diagnostic.provider, {
    reason: "deploy_failed",
    message: "git-author-access-required",
  });
  assert.equal(requests.filter((r) => r.method === "POST").length, 1);
  const posted = requests.find((r) => r.method === "POST").body;
  assert.equal(posted.project, projectId);
  assert.equal(posted.target, "production");
  assert.equal(posted.autoAssignCustomDomains, false);
  assert.equal(posted.env.ANALYTICS_SYNC_ENABLED, "false");
  assert.equal(posted.meta.releaseSha, binding.commit);
  assert.equal(posted.meta.releaseManifest, binding.manifestDigest);
  assert.equal(posted.meta.releaseBuildSha256, binding.buildDigest);
  assert.equal(posted.meta.collectionDisabled, "true");
  scenario = "success";
  checked = await check();
  assert.equal(checked.status, 0);
  assert.deepEqual(checked.result, { url: "https://fixture.vercel.app" });
  assert.equal(requests.filter((r) => r.method === "POST").length, 1);
  checked = await check([], "fixture_invalid_token\n");
  assert.equal(checked.status, 1);
  assert.equal(
    checked.result.diagnostic.provider?.message,
    "authentication-required",
  );
  assert.equal(requests.length, 0);
  checked = await check(["--fixture-unknown-option"]);
  assert.equal(checked.status, 1);
  assert(requests.every((request) => request.method === "GET"));
  console.log(
    "Pinned CLI contract passed: prebuilt arguments, environment authentication, JSON success, provider rejection, invalid token and invalid option. Loopback only; no production requests.",
  );
} finally {
  server.closeAllConnections();
  await new Promise((accept) => server.close(accept));
  rmSync(root, { recursive: true, force: true });
}
