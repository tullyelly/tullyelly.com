/** @jest-environment node */
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { PRODUCTION_DATABASE_HOST } from "../../scripts/release/code-manifest";
import { settingsDigest, sha256 } from "../../scripts/release/manifest";

test("separate reviewed rollback executor refuses an ordinary deployment manifest before provider access", () => {
  const directory = mkdtempSync(join(tmpdir(), "rollback-entry-"));
  try {
    const settings = {
      framework: "nextjs" as const,
      nodeVersion: "22.x" as const,
      buildCommand: null,
      installCommand: null,
      outputDirectory: null,
      rootDirectory: null,
    };
    const manifest = {
      version: 2,
      kind: "code-only",
      operation: "deploy",
      commit: "a".repeat(40),
      collectionEnabled: false,
      buildEnvironment: {},
      vercel: {
        projectId: "prj_lyZDCv46lEtMMZ4mCsuhjxxc0ACU",
        teamId: "team_pB5TcLa7apLtPAiVrRbcjBG3",
        productionDeploymentId: "dpl_fixture",
        productionHost: "tullyelly.com",
        settings,
        settingsSha256: settingsDigest(settings),
      },
      schemaCompatibility: {
        checkedAt: new Date().toISOString(),
        checkedBy: "tullyelly",
        evidenceUrl: "https://example.invalid/review",
        previousApplicationSha: "b".repeat(40),
        databaseHost: PRODUCTION_DATABASE_HOST,
        database: "tullyelly_db",
        method: "unchanged-database-contract",
        requiredObjects: [],
        missingObjects: [],
        compatible: true,
        rollbackCompatible: true,
      },
    };
    const bytes = JSON.stringify(manifest);
    const path = join(directory, "manifest.json");
    writeFileSync(path, bytes);
    const result = spawnSync(
      process.execPath,
      [
        "--import",
        require.resolve("tsx"),
        resolve("scripts/production-rollback.ts"),
        "prepare",
      ],
      {
        encoding: "utf8",
        timeout: 15000,
        env: {
          NODE_ENV: "test",
          PATH: process.env.PATH,
          RELEASE_MANIFEST_PATH: path,
          RELEASE_MANIFEST_SHA256: sha256(bytes),
          RELEASE_SHA: manifest.commit,
        },
      },
    );
    expect(result.error).toBeUndefined();
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("code.unsupported-operation");
    expect(result.stderr).not.toContain("GitHub API");
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("rollback entry retains manifest and gate contracts with no ordinary source or prebuilt deployer", () => {
  const source = readFileSync("scripts/production-rollback.ts", "utf8");
  expect(source).toContain('manifest.operation !== "rollback"');
  expect(source).toContain("verifyHumanApproval");
  expect(source).toContain("loadCodeManifest");
  expect(source).toContain('"code.concurrent-deployment"');
  expect(source).toContain('["rollback", id, "--yes"]');
  expect(source).not.toMatch(
    /prebuiltDeployArguments|nativeSourceDeployArguments|code-build-context|packageCodeArtifact/,
  );
});
