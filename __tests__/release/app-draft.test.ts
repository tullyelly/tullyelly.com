/** @jest-environment node */
import { bootstrapDraftInput } from "@/scripts/release-app-draft";
const sha = "a".repeat(40);
test("ready creation is explicit and the reviewed body file is passed separately", () => {
  const result = bootstrapDraftInput([
    "create",
    "--branch",
    "feature/independent-review",
    "--commit",
    sha,
    "--title",
    "Prepared review",
    "--body-file",
    "review.md",
    "--ready",
  ]);
  expect(result.bodyFile).toBe("review.md");
  expect(result.input).toMatchObject({
    branch: "feature/independent-review",
    sha,
    draft: false,
  });
});
test("bootstrap draft requires an explicit operation, exact SHA and safe supplied title", () => {
  expect(
    bootstrapDraftInput([
      "check",
      "--branch",
      "cipher/normal-release-repair",
      "--commit",
      sha,
      "--title",
      "Prepared release",
      "--body-file",
      "review.md",
    ]).mode,
  ).toBe("check");
  expect(() =>
    bootstrapDraftInput([
      "publish",
      "--branch",
      "cipher/normal-release-repair",
      "--commit",
      sha,
      "--title",
      "Prepared release",
      "--body-file",
      "review.md",
    ]),
  ).toThrow();
  expect(() =>
    bootstrapDraftInput([
      "create",
      "--branch",
      "cipher/normal-release-repair",
      "--commit",
      "main",
      "--title",
      "Prepared release",
      "--body-file",
      "review.md",
    ]),
  ).toThrow();
  expect(() =>
    bootstrapDraftInput([
      "create",
      "--branch",
      "cipher/normal-release-repair",
      "--commit",
      sha,
      "--title",
      "Unsafe\nworkflow",
      "--body-file",
      "review.md",
    ]),
  ).toThrow();
  expect(() =>
    bootstrapDraftInput([
      "create",
      "--branch",
      "cipher/normal-release-repair",
      "--commit",
      sha,
      "--title",
      "Prepared release",
      "--body-file",
      "review.md",
      "extra",
    ]),
  ).toThrow();
});
