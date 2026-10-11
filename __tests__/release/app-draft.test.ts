/** @jest-environment node */
import { bootstrapDraftInput } from "@/scripts/release-app-draft";
const sha = "a".repeat(40);
test("bootstrap draft requires an explicit operation, exact SHA and safe supplied title", () => {
  expect(
    bootstrapDraftInput([
      "check",
      "--commit",
      sha,
      "--title",
      "Prepared release",
    ]).mode,
  ).toBe("check");
  expect(() =>
    bootstrapDraftInput([
      "publish",
      "--commit",
      sha,
      "--title",
      "Prepared release",
    ]),
  ).toThrow();
  expect(() =>
    bootstrapDraftInput([
      "create",
      "--commit",
      "main",
      "--title",
      "Prepared release",
    ]),
  ).toThrow();
  expect(() =>
    bootstrapDraftInput([
      "create",
      "--commit",
      sha,
      "--title",
      "Unsafe\nworkflow",
    ]),
  ).toThrow();
  expect(() =>
    bootstrapDraftInput([
      "create",
      "--commit",
      sha,
      "--title",
      "Prepared release",
      "extra",
    ]),
  ).toThrow();
});
