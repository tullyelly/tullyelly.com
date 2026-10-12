/** @jest-environment node */
import { readFileSync } from "node:fs";
import { creator } from "../../tools/secretlint-rules/pg-url";

const original = JSON.parse(
  readFileSync("releases/first-code-only.json", "utf8"),
);
function scan(content: string) {
  const reports: unknown[] = [];
  creator
    .create({ report: (value: unknown) => reports.push(value) })
    .file({ content });
  return reports;
}
function manifest() {
  const value = structuredClone(original);
  value.schemaCompatibility.checkedAt = new Date().toISOString();
  return value;
}
test("allows only the canonical host field in an actually valid release manifest", () => {
  expect(scan(JSON.stringify(manifest()))).toEqual([]);
});
test("standalone hosts elsewhere and invalid manifests still fail", () => {
  const m = manifest();
  expect(scan(m.schemaCompatibility.databaseHost).length).toBeGreaterThan(0);
  m.collectionEnabled = true;
  expect(scan(JSON.stringify(m)).length).toBeGreaterThan(0);
});
test.each([
  ["postgresql:", "//owner:fake-password@example.invalid/db"].join(""),
  "postgres://owner@example.invalid/db?password=fake",
  "https://owner:fake@example.invalid/",
  "https://example.invalid/?token=fake",
  "postgresql%3A%2F%2Fowner%3Afake%40example.invalid%2Fdb",
  "postgresql%253A%252F%252Fowner%253Afake%2540example.invalid%252Fdb",
])(
  "rejects concealed credential values without exempting the manifest: %s",
  (value) => {
    const m = manifest();
    m.buildEnvironment.NEXT_PUBLIC_TEST = value;
    expect(scan(JSON.stringify(m)).length).toBeGreaterThan(0);
  },
);
test("JSON escapes cannot conceal a credential URL", () => {
  const m = manifest();
  m.buildEnvironment.NEXT_PUBLIC_TEST = [
    "postgresql:",
    "//owner:fake@example.invalid/db",
  ].join("");
  expect(
    scan(JSON.stringify(m).replace("postgresql", "\\u0070ostgresql")).length,
  ).toBeGreaterThan(0);
});
test("duplicate host fields and credential-bearing host variations are rejected", () => {
  const m = manifest();
  const text = JSON.stringify(m);
  expect(
    scan(
      text.replace(
        '"databaseHost":',
        '"databaseHost":"' +
          ["ep-fake", "c-2.us-east-2.aws.neon.tech"].join(".") +
          '","databaseHost":',
      ),
    ).length,
  ).toBeGreaterThan(0);
  m.schemaCompatibility.databaseHost =
    "owner:fake@" + m.schemaCompatibility.databaseHost;
  expect(scan(JSON.stringify(m)).length).toBeGreaterThan(0);
});
