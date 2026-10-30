/** @jest-environment node */
jest.mock("node:child_process", () => ({ execFileSync: jest.fn() }));
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import {
  analyticsIntentSchema,
  readAnalyticsIntent,
  verifyAnalyticsRuntime,
} from "../../scripts/release/analytics-intent";
import { analyticsMigrations } from "../../lib/analytics-archive/readiness-contract";
export const proof = {
  development: { checkedAt: "2026-10-01T09:00:00Z", reference: "WU-1212" },
  production: { checkedAt: "2026-10-02T09:00:00Z", reference: "WU-1213" },
  targetSha256: "c".repeat(64),
  migrations: analyticsMigrations.map((m) => ({ ...m })),
  stagedCollectionAcknowledged: true,
};
const state = {
  version: 1,
  commitSha: "a".repeat(40),
  collectionEnabled: true,
  configured: true,
  connection: "direct",
  readinessChecked: true,
  schemaReady: true,
  ledgerReady: true,
  targetSha256: "c".repeat(64),
};
test("off maintenance is explicit; activation requires actual reviewed manual readiness and staging acknowledgement", () => {
  expect(
    analyticsIntentSchema.parse({ version: 1, collectionEnabled: false })
      .collectionEnabled,
  ).toBe(false);
  expect(() =>
    analyticsIntentSchema.parse({ version: 1, collectionEnabled: true }),
  ).toThrow();
  expect(
    analyticsIntentSchema.parse({
      version: 1,
      collectionEnabled: true,
      manualReadiness: proof,
    }).manualReadiness,
  ).toEqual(proof);
  for (const invalid of [
    { ...proof, stagedCollectionAcknowledged: false },
    { ...proof, migrations: [] },
    {
      ...proof,
      production: { ...proof.production, checkedAt: "2100-01-01T00:00:00Z" },
    },
    {
      ...proof,
      development: { ...proof.development, checkedAt: "2026-10-03T09:00:00Z" },
    },
  ])
    expect(() =>
      analyticsIntentSchema.parse({
        version: 1,
        collectionEnabled: true,
        manualReadiness: invalid,
      }),
    ).toThrow();
});
test("immutable source intent and both original migration hashes are checked without database access", () => {
  jest
    .mocked(execFileSync)
    .mockImplementation((_cmd, args) =>
      Buffer.from(
        String(args?.[1]).endsWith("analytics-state.json")
          ? JSON.stringify({ version: 1, collectionEnabled: false })
          : readFileSync(
              "db/migrations/" + String(args?.[1]).split("/").at(-1),
              "utf8",
            ),
      ),
    );
  expect(readAnalyticsIntent("a".repeat(40)).intent.collectionEnabled).toBe(
    false,
  );
  expect(execFileSync).toHaveBeenCalledTimes(3);
  jest
    .mocked(execFileSync)
    .mockReturnValueOnce(Buffer.from('{"version":1,"collectionEnabled":false}'))
    .mockReturnValueOnce(Buffer.from("changed migration"));
  expect(() => readAnalyticsIntent("a".repeat(40))).toThrow(
    "code.analytics-migration-drift",
  );
});
test("off metadata cannot pretend the runtime is off; state must bind exact revision", () => {
  expect(() =>
    verifyAnalyticsRuntime(state, {
      commit: state.commitSha,
      collectionEnabled: false,
    }),
  ).toThrow("code.analytics-runtime-mismatch");
  expect(() =>
    verifyAnalyticsRuntime(
      { ...state, commitSha: "b".repeat(40) },
      {
        commit: state.commitSha,
        collectionEnabled: true,
        targetSha256: proof.targetSha256,
      },
    ),
  ).toThrow("code.analytics-runtime-mismatch");
  expect(
    verifyAnalyticsRuntime(
      {
        ...state,
        collectionEnabled: false,
        readinessChecked: false,
        schemaReady: false,
        ledgerReady: false,
      },
      { commit: state.commitSha, collectionEnabled: false },
    ).collectionEnabled,
  ).toBe(false);
});
test.each([
  "connection",
  "configured",
  "readinessChecked",
  "schemaReady",
  "ledgerReady",
  "targetSha256",
])("activation requires observed %s compatibility/readiness", (key) => {
  const invalid = {
    ...state,
    [key]:
      key === "connection"
        ? "pooled"
        : key === "targetSha256"
          ? "d".repeat(64)
          : false,
  };
  expect(() =>
    verifyAnalyticsRuntime(invalid, {
      commit: state.commitSha,
      collectionEnabled: true,
      targetSha256: proof.targetSha256,
    }),
  ).toThrow("code.analytics-readiness");
});
