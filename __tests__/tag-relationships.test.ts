import {
  isRelationshipType,
  isCollectionReasonCode,
  readCollectionReasons,
  RELATIONSHIP_CONTRACT,
} from "@/lib/tag-relationships";

test("only membership participates in recursive inheritance", () => {
  expect(
    Object.entries(RELATIONSHIP_CONTRACT)
      .filter(([, rule]) => rule.recursive)
      .map(([type]) => type),
  ).toEqual(["member_of"]);
  expect(isRelationshipType("alias_of")).toBe(true);
  expect(isRelationshipType("unfamiliar_legacy_type")).toBe(false);
  expect(isCollectionReasonCode("shared_name")).toBe(true);
  expect(isCollectionReasonCode("future_reason")).toBe(false);
});

test("multiple reasons preserve historical wording and unrelated evidence without mutation", () => {
  const meta = {
    evidence: "reviewed",
    reasons: [
      {
        code: "favorite_player",
        explanation: "He was her favorite player.",
        evidence: "James",
      },
      { code: "shared_name", explanation: "They share a given name." },
    ],
  };
  const snapshot = JSON.stringify(meta);
  expect(readCollectionReasons(meta)).toEqual(meta.reasons);
  expect(JSON.stringify(meta)).toBe(snapshot);
});

test.each([
  {},
  { reasons: null },
  { reasons: {} },
  { reasons: [] },
  { reasons: [null] },
  { reasons: [[]] },
  { reasons: ["shared_name"] },
  { reasons: [{ code: "shared_name" }] },
  { reasons: [{ code: "shared_name", explanation: " \n\t" }] },
  { reasons: [{ code: "shared_name", explanation: "\u00a0\ufeff" }] },
  { reasons: [{ code: "shared_name", explanation: 3 }] },
  { reasons: [{ code: "unknown", explanation: "text" }] },
  { reasons: [{ explanation: "text" }] },
  {
    reasons: [
      { code: "shared_name", explanation: "a" },
      { code: "shared_name", explanation: "b" },
    ],
  },
])("rejects malformed/unsupported reasons: %j", (meta) => {
  expect(() => readCollectionReasons(meta)).toThrow();
});
