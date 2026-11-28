/** @jest-environment node */
import {
  publicationProgress,
  type PublicationRun,
} from "../../scripts/release/publication-progress";
import {
  receiptFromReport,
  reportFromZip,
} from "../../scripts/release/publication-receipt";
import {
  RELEASE_REPOSITORY,
  RELEASE_REPOSITORY_ID,
  type Api,
} from "../../scripts/release/app";
import { deflateRawSync } from "node:zlib";
import { reviewBranchSchema } from "../../scripts/release/review-branch";
const sha = "a".repeat(40);
test("shared epic publication preserves the branch without allowing protected refs", () => {
  expect(reviewBranchSchema.parse("epic/WU-1117-chronicle-publishing")).toBe(
    "epic/WU-1117-chronicle-publishing",
  );
  for (const ref of [
    "main",
    "epic/main",
    "epic/WU-1117-../main",
    "epic/WU-1117-name.lock",
  ])
    expect(() => reviewBranchSchema.parse(ref)).toThrow();
});
function run(path: string, id = 10): PublicationRun {
  return {
    id,
    run_attempt: 1,
    head_sha: sha,
    head_branch: "main",
    path: `.github/workflows/${path}`,
    event: "workflow_dispatch",
    status: "in_progress",
    conclusion: null,
    created_at: "2026-11-27T20:00:00Z",
    updated_at: "2026-11-27T20:01:00Z",
    head_repository: {
      id: RELEASE_REPOSITORY_ID,
      full_name: RELEASE_REPOSITORY,
    },
  };
}
function fixture() {
  let intent = false;
  const parents: PublicationRun[] = [],
    children: PublicationRun[] = [];
  let receipt: { deployment: string; publicVerified: boolean } | undefined;
  const api = jest.fn<ReturnType<Api>, Parameters<Api>>(
    async (path, _token, method) => {
      if (method === "POST") return undefined;
      if (path.includes("release-dispatch.yml/runs"))
        return { total_count: parents.length, workflow_runs: parents };
      if (path.includes("production-release.yml/runs"))
        return { total_count: children.length, workflow_runs: children };
      if (path.includes("/jobs?"))
        return {
          total_count: 1,
          jobs: [{ name: "prepare", status: "completed" }],
        };
      if (path.endsWith("/branches/main")) return { commit: { sha } };
      if (path.includes("ci.yml/runs"))
        return {
          workflow_runs: [
            {
              ...run("ci.yml"),
              event: "push",
              status: "completed",
              conclusion: "success",
            },
          ],
        };
      throw new Error("Unexpected fixture request");
    },
  );
  const progress = (mode: "publish" | "status" = "publish") =>
    publicationProgress({
      mode,
      sha,
      token: "fixture",
      api,
      hasIntent: () => intent,
      recordIntent: () => {
        intent = true;
      },
      receipt: async () => receipt,
    });
  return {
    api,
    parents,
    children,
    progress,
    setReceipt: (value: typeof receipt) => {
      receipt = value;
    },
  };
}
test("read-only status never dispatches; publish writes once and ambiguous reconnect never retries", async () => {
  const f = fixture();
  expect((await f.progress("status")).state).toBe("ready");
  expect(f.api.mock.calls.filter((c) => c[2] === "POST")).toHaveLength(0);
  expect((await f.progress()).state).toBe("dispatched");
  expect((await f.progress()).state).toBe("dispatch-unconfirmed");
  f.parents.push(run("release-dispatch.yml"));
  expect((await f.progress()).state).toBe("dispatched");
  expect(f.api.mock.calls.filter((c) => c[2] === "POST")).toHaveLength(1);
});
test("gate wait, failed operation and public pending are distinct from verified success", async () => {
  const f = fixture();
  const child = run("production-release.yml", 20);
  f.children.push(child);
  expect((await f.progress()).state).toBe("approval");
  child.status = "completed";
  child.conclusion = "failure";
  expect((await f.progress()).state).toBe("failed");
  child.conclusion = "success";
  expect((await f.progress()).state).toBe("receipt-unavailable");
  f.setReceipt({ deployment: "dpl_fixture", publicVerified: false });
  expect((await f.progress()).state).toBe("public-verification-pending");
  f.setReceipt({ deployment: "dpl_fixture", publicVerified: true });
  expect(await f.progress()).toMatchObject({
    state: "verified",
    deployment: "dpl_fixture",
    sha,
  });
  expect(f.api.mock.calls.filter((c) => c[2] === "POST")).toHaveLength(0);
});
test("receipt requires the exact workflow revision, run and attempt", () => {
  const r = run("production-release.yml");
  const context = {
    event: "context",
    revision: sha,
    workflowRevision: sha,
    workflowRunId: "10",
    workflowRunAttempt: "1",
  };
  const result = {
    event: "release-result",
    deploymentId: "dpl_fixture",
    deployment_succeeded: true,
    public_verified: true,
  };
  const report = (extra: object) =>
    JSON.stringify({ ...context, ...extra }) + "\n" + JSON.stringify(result);
  expect(receiptFromReport(report({}), r)).toMatchObject({
    publicVerified: true,
  });
  expect(
    receiptFromReport(report({ workflowRunAttempt: "2" }), r),
  ).toBeUndefined();
  expect(
    receiptFromReport(report({ revision: "b".repeat(40) }), r),
  ).toBeUndefined();
});
test.each([0, 8])(
  "small ZIP receipt parser reads only the expected report, method %s",
  (method) => {
    const name = Buffer.from("release-report.jsonl"),
      body = Buffer.from('{"event":"fixture"}\n');
    const payload = method === 8 ? deflateRawSync(body) : body;
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50);
    local.writeUInt16LE(method, 8);
    local.writeUInt16LE(name.length, 26);
    const directory = Buffer.alloc(46);
    directory.writeUInt32LE(0x02014b50);
    directory.writeUInt16LE(method, 10);
    directory.writeUInt32LE(payload.length, 20);
    directory.writeUInt32LE(body.length, 24);
    directory.writeUInt16LE(name.length, 28);
    const end = Buffer.alloc(22);
    end.writeUInt32LE(0x06054b50);
    end.writeUInt16LE(1, 10);
    end.writeUInt32LE(local.length + name.length + payload.length, 16);
    const archive = Buffer.concat([local, name, payload, directory, name, end]);
    expect(reportFromZip(archive)).toBe(body.toString());
    expect(() =>
      reportFromZip(archive.subarray(0, archive.length - 3)),
    ).toThrow();
    directory.writeUInt32LE(2 * 1024 * 1024, 24);
    expect(() =>
      reportFromZip(
        Buffer.concat([local, name, payload, directory, name, end]),
      ),
    ).toThrow();
  },
);
