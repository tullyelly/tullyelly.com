/** @jest-environment node */
import { execFileSync } from "node:child_process";
import { sha256 } from "../../scripts/release/manifest";
import {
  readSchemaDeferral,
  schemaDeferralPath,
  validateSchemaDeferral,
} from "../../scripts/release/schema-deferral";

jest.mock("node:child_process", () => ({ execFileSync: jest.fn() }));

const baseline = "a".repeat(40);
const commit = "b".repeat(40);
const diff =
  "diff --git a/db/schema/tables/clan.sql b/db/schema/tables/clan.sql\n";
const review = {
  version: 1,
  scope: "application-only",
  baselineSha: baseline,
  schemaDiffSha256: sha256(diff),
  rationale: "Application uses existing columns; SQL execution is deferred.",
};

afterEach(() => jest.resetAllMocks());

test("application-only review requires the exact baseline and complete SQL diff", () => {
  expect(validateSchemaDeferral(review, baseline, diff)).toEqual(review);
  for (const [base, changed] of [
    [commit, diff],
    [baseline, `${diff}+unreviewed SQL`],
    [baseline, ""],
  ])
    expect(() => validateSchemaDeferral(review, base, changed)).toThrow(
      "code.sensitive-compatibility-review",
    );
  expect(() =>
    validateSchemaDeferral({ ...review, scope: "apply-sql" }, baseline, diff),
  ).toThrow();
});

test("missing review preserves the default schema block", () => {
  jest.mocked(execFileSync).mockReturnValue("");
  expect(readSchemaDeferral(baseline, commit)).toBeUndefined();
  expect(execFileSync).toHaveBeenCalledTimes(1);
});

test("review comes from the immutable commit and covers all schema directories", () => {
  jest
    .mocked(execFileSync)
    .mockReturnValueOnce(`${schemaDeferralPath}\n`)
    .mockReturnValueOnce(JSON.stringify(review))
    .mockReturnValueOnce(diff);
  expect(readSchemaDeferral(baseline, commit)).toEqual(review);
  expect(execFileSync).toHaveBeenNthCalledWith(
    2,
    "git",
    ["show", `${commit}:${schemaDeferralPath}`],
    expect.any(Object),
  );
  expect(execFileSync).toHaveBeenNthCalledWith(
    3,
    "git",
    [
      "diff",
      "--no-ext-diff",
      "--no-textconv",
      "--binary",
      "--full-index",
      "--no-color",
      "--unified=3",
      "--diff-algorithm=myers",
      "--no-indent-heuristic",
      "--src-prefix=a/",
      "--dst-prefix=b/",
      "--no-renames",
      baseline,
      commit,
      "--",
      "db/migrations",
      "db/schema",
      "prisma/schema*",
    ],
    expect.any(Object),
  );
});

test("a changed SQL diff fails closed even when the review file exists", () => {
  jest
    .mocked(execFileSync)
    .mockReturnValueOnce(`${schemaDeferralPath}\n`)
    .mockReturnValueOnce(JSON.stringify(review))
    .mockReturnValueOnce(`${diff}+additional migration`);
  expect(() => readSchemaDeferral(baseline, commit)).toThrow(
    "code.sensitive-compatibility-review",
  );
});
