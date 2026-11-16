// Offline ledger preparation only; no SQL execution or environment loading.
import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { bundle, hash } from "./manual-migration.mjs";
export const canonicalPath =
  "db/migrations/102_seed_tag_relationship_examples.sql";
const reviewPath = "docs/evidence/wu-1267-reviewed-seeds.json";
const baselinePath = "docs/evidence/wu-1267-readonly-seed-baseline.json";
export function derived102(source) {
  const effects = /DO \$effects\$[\s\S]*?\$effects\$;/.exec(source)?.[0];
  if (!effects) throw new Error("102 effect assertions missing");
  const assertions = `SET LOCAL search_path=pg_catalog;
DO $target$
BEGIN
  IF current_database()<>'tullyelly_db' THEN RAISE EXCEPTION '102: wrong database'; END IF;
  IF current_setting('transaction_isolation')<>'read committed' THEN RAISE EXCEPTION '102: use READ COMMITTED'; END IF;
END;
$target$;
SELECT pg_advisory_xact_lock(hashtextextended('cipher:homie-tag-identity',0));
${effects}`;
  return bundle({
    filename: canonicalPath.split("/").at(-1),
    source,
    assertions,
  });
}
export function prepare102(check = false) {
  const result = derived102(readFileSync(canonicalPath, "utf8"));
  const manifest = {
    canonicalPath,
    canonicalSha256: result.checksum,
    ledgerPath: "db/operations/102_record_applied.sql",
    ledgerSha256: result.ledgerChecksum,
    assertionsSha256: result.assertionsChecksum,
    reviewPath,
    reviewSha256: hash(readFileSync(reviewPath, "utf8")),
    baselinePath,
    baselineSha256: hash(readFileSync(baselinePath, "utf8")),
    mode: "record-after-success",
  };
  const artifacts = {
    "db/operations/102_record_applied.sql": result.sql,
    "db/operations/102_record_applied.json":
      JSON.stringify(manifest, null, 2) + "\n",
  };
  for (const [path, content] of Object.entries(artifacts)) {
    if (check) {
      if (readFileSync(path, "utf8") !== content)
        throw new Error(`Stale artifact: ${path}`);
    } else writeFileSync(path, content);
  }
  return result;
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  if (!["generate", "check"].includes(process.argv[2]))
    throw new Error("Use generate or check");
  const r = prepare102(process.argv[2] === "check");
  console.log(
    `canonical sha256 ${r.checksum}\nledger sha256 ${r.ledgerChecksum}`,
  );
}
