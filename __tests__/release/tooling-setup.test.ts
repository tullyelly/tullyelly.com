/** @jest-environment node */
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

test("minimal tooling pins match the reviewed application lock and omit application lifecycle work", () => {
  const lock = JSON.parse(readFileSync("package-lock.json", "utf8"));
  const tools = JSON.parse(readFileSync("tools/release/package.json", "utf8"));
  const toolLock = JSON.parse(
    readFileSync("tools/release/package-lock.json", "utf8"),
  );
  for (const [name, version] of Object.entries(tools.dependencies)) {
    expect(version).toBe(lock.packages[`node_modules/${name}`].version);
    expect(toolLock.packages[`node_modules/${name}`].version).toBe(version);
  }
  expect(tools.scripts).toBeUndefined();
  expect(tools.dependencies.next).toBeUndefined();
  expect(tools.dependencies.prisma).toBeUndefined();
  expect(Object.keys(toolLock.packages).length).toBeLessThan(
    Object.keys(lock.packages).length / 2,
  );
});
test.each([
  "RELEASE_APP_PRIVATE_KEY",
  "VERCEL_TOKEN",
  "VERCEL_RELEASE_READ_TOKEN",
])("installation refuses %s before spawning npm", (key) => {
  const child = spawnSync(
    process.execPath,
    ["scripts/release/install-tools.mjs"],
    {
      encoding: "utf8",
      env: { PATH: "", [key]: "fixture-secret" },
    },
  );
  expect(child.status).toBe(1);
  expect(child.stderr).toContain("must not receive credentials");
  expect(child.stderr).not.toContain("fixture-secret");
});
test("dispatcher bundles before credentials and summary avoids checking out media", () => {
  const dispatch = readFileSync(
    ".github/workflows/release-dispatch.yml",
    "utf8",
  );
  expect(dispatch).not.toMatch(/run: npm ci|npx tsx/);
  expect(dispatch.indexOf("bundle-dispatcher.mjs")).toBeLessThan(
    dispatch.indexOf("RELEASE_APP_PRIVATE_KEY:"),
  );
  const summary = readFileSync(
    ".github/workflows/production-release.yml",
    "utf8",
  ).split("  summary:")[1];
  expect(summary).toContain("sparse-checkout:");
  expect(summary).not.toContain("public/images");
});
