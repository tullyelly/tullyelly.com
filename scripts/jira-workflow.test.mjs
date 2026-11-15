import { test } from "@jest/globals";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { validate, chicagoDay, selectBranch } from "./jira-workflow.mjs";
const active = {
  epic: "WU-1260",
  branch: "epic/WU-1260-tags",
  day: "2026-11-15",
  timezone: "America/Chicago",
};
const context = {
  ...active,
  verifiedAt: "2026-11-15T18:00:00Z",
  items: [{ key: "WU-1271", parent: "WU-1260", kind: "work" }],
};
const base = {
  active,
  context,
  branch: active.branch,
  day: active.day,
  message: "[WU-1271] Workflow",
  paths: ["scripts/tool.mjs"],
};
test("child changes retain branch and require matching attribution", () => {
  assert.deepEqual(validate(base), ["WU-1271"]);
  const next = {
    ...context,
    items: [{ key: "WU-1270", parent: active.epic, kind: "work" }],
  };
  assert.deepEqual(
    validate({
      ...base,
      context: next,
      message: "[WU-1270] Migration workflow",
    }),
    ["WU-1270"],
  );
  assert.throws(() => validate({ ...base, context: next }), /keys/);
});
test("stale day, conflicting branch, invalid/missing key and unknown context fail", () => {
  for (const update of [
    { day: "2026-11-16" },
    { branch: "personal" },
    { message: "No issue" },
    { context: { ...context, verifiedAt: null } },
    { context: { ...context, branch: "other" } },
  ])
    assert.throws(() => validate({ ...base, ...update }));
  assert.equal(chicagoDay(new Date("2026-11-16T02:00:00Z")), "2026-11-15");
});
test("cross-epic content exception is limited to content; combined commits map each key", () => {
  const content = {
    ...context,
    items: [{ key: "WU-932", parent: "WU-900", kind: "content" }],
  };
  assert.deepEqual(
    validate({
      ...base,
      context: content,
      message: "[WU-932] Chronicle",
      paths: ["content/chronicles/example.mdx"],
    }),
    ["WU-932"],
  );
  assert.throws(
    () =>
      validate({ ...base, context: content, message: "[WU-932] Chronicle" }),
    /non-content/,
  );
  const multi = {
    ...context,
    items: [
      ...context.items,
      { key: "WU-1270", parent: active.epic, kind: "work" },
    ],
  };
  assert.throws(
    () =>
      validate({
        ...base,
        context: multi,
        message: "[WU-1271] [WU-1270] Both",
      }),
    /scope/,
  );
  validate({
    ...base,
    context: multi,
    message:
      "[WU-1271] [WU-1270] Both\n\nWU-1271: attribution\nWU-1270: handoff",
  });
});
test("temporary git fixture rejects index/head races and recovers session context without network", () => {
  const dir = mkdtempSync(join(tmpdir(), "jira-workflow-"));
  const script = join(process.cwd(), "scripts/jira-workflow.mjs");
  const git = (...a) =>
    execFileSync("git", a, { cwd: dir, encoding: "utf8" }).trim();
  try {
    git("init", "-b", active.branch);
    git("config", "user.name", "Fixture");
    git("config", "user.email", "fixture@example.invalid");
    writeFileSync(join(dir, "file"), "initial");
    git("add", "file");
    git("commit", "-m", "fixture only");
    mkdirSync(join(dir, ".jira"));
    const liveActive = { ...active, day: chicagoDay() };
    writeFileSync(
      join(dir, ".jira/active-epic.json"),
      JSON.stringify(liveActive),
    );
    const liveContext = { ...context, day: liveActive.day };
    const head = git("rev-parse", "HEAD");
    const tree = git("write-tree");
    writeFileSync(join(dir, "file"), "other stream");
    git("add", "file");
    assert.notEqual(git("write-tree"), tree);
    assert.equal(git("rev-parse", "HEAD"), head);
    // Two sessions retain independent child attribution on the same branch.
    writeFileSync(
      join(dir, ".git", "session-a.json"),
      JSON.stringify(liveContext),
    );
    writeFileSync(
      join(dir, ".git", "session-b.json"),
      JSON.stringify({
        ...liveContext,
        items: [{ key: "WU-1270", parent: active.epic, kind: "work" }],
      }),
    );
    assert.throws(() =>
      execFileSync("node", [script, "commit", head, tree, base.message], {
        cwd: dir,
        env: {
          ...process.env,
          JIRA_CONTEXT_FILE: join(dir, ".git/session-a.json"),
        },
        stdio: "pipe",
      }),
    );
    assert.equal(git("rev-parse", "HEAD"), head);
    const nextTree = git("write-tree");
    execFileSync("node", [script, "commit", head, nextTree, base.message], {
      cwd: dir,
      env: {
        ...process.env,
        JIRA_CONTEXT_FILE: join(dir, ".git/session-a.json"),
      },
      stdio: "pipe",
    });
    assert.equal(git("log", "-1", "--format=%s"), base.message);
    assert.notEqual(git("rev-parse", "HEAD"), head);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("branch discovery deduplicates local/remote refs, retains legacy names and stops on ambiguous or stale selection", () => {
  const c = {
    epic: active.epic,
    day: active.day,
    open: true,
    merged: false,
    branch: "existing-shared-name",
  };
  assert.equal(selectBranch([c, c], active), c.branch);
  assert.equal(selectBranch([], active), null);
  assert.throws(
    () => selectBranch([c, { ...c, branch: "another" }], active),
    /Multiple/,
  );
  for (const update of [
    { day: "2026-11-14" },
    { open: false },
    { merged: true },
  ])
    assert.throws(() => selectBranch([{ ...c, ...update }], active), /stale/);
});
