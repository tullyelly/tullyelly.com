// Offline generation for unapplied 098 only; never edit applied migration history.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { bundle } from "./manual-migration.mjs";
export function derived098(source) {
  const functions = source.match(
    /CREATE OR REPLACE FUNCTION[\s\S]*?\n\$fn\$;/g,
  );
  const effects = /DO \$effects\$[\s\S]*?\$effects\$;/.exec(source)?.[0];
  if (!functions?.length || !effects)
    throw new Error("098 definitions/effect assertions missing");
  const values = functions
    .map(
      (definition) =>
        `('${/FUNCTION dojo\.(\w+)/.exec(definition)[1]}','${createHash("md5").update(definition.split("$fn$")[1].replaceAll("\r", "")).digest("hex")}')`,
    )
    .join(",\n");
  const assertions = `DO $target$
BEGIN
  IF current_database()<>'tullyelly_db' THEN RAISE EXCEPTION '098: wrong database'; END IF;
  IF current_setting('transaction_isolation')<>'read committed' THEN RAISE EXCEPTION '098: use READ COMMITTED'; END IF;
END;
$target$;
SELECT pg_advisory_xact_lock(hashtextextended('cipher:homie-tag-identity',0));
${effects}
DO $definitions$
BEGIN
  IF EXISTS(SELECT 1 FROM (VALUES ${values},('infer_tag_identity_from_canonical_route','44172b71b333653f7fd9d398b7a4e05d')) expected(name,body_hash)
    LEFT JOIN pg_proc p ON p.pronamespace='dojo'::regnamespace AND p.proname=expected.name
    WHERE p.oid IS NULL OR md5(replace(p.prosrc,E'\\r',''))<>expected.body_hash) THEN
    RAISE EXCEPTION '098: installed function differs from reviewed migration';
  END IF;
END;
$definitions$;`;
  const result = bundle({
    filename: "098_protect_homie_tag_identity.sql",
    source,
    assertions,
  });
  const manifest = {
    canonicalPath: "db/migrations/098_protect_homie_tag_identity.sql",
    canonicalSha256: result.checksum,
    ledgerPath: "db/operations/098_record_applied.sql",
    ledgerSha256: result.ledgerChecksum,
    assertionsSha256: result.assertionsChecksum,
    mode: "record-after-success",
  };
  return {
    result,
    artifacts: {
      "db/operations/098_record_applied.sql": result.sql,
      "db/operations/098_record_applied.json":
        JSON.stringify(manifest, null, 2) + "\n",
      "db/schema/functions/homie_tag_identity.sql":
        "-- Current definitions prepared in migration 098; review-only schema reference.\n" +
        functions.join("\n\n") +
        "\n",
    },
  };
}
export function prepare098(check = false) {
  const { result, artifacts } = derived098(
    readFileSync("db/migrations/098_protect_homie_tag_identity.sql", "utf8"),
  );
  for (const [path, content] of Object.entries(artifacts)) {
    if (check) {
      if (readFileSync(path, "utf8") !== content)
        throw new Error(`Stale derived artifact: ${path}`);
    } else writeFileSync(path, content);
  }
  return result;
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  try {
    if (!["generate", "check"].includes(process.argv[2]))
      throw new Error("Use generate or check for unapplied 098.");
    const r = prepare098(process.argv[2] === "check");
    console.log(
      `canonical sha256 ${r.checksum}\nledger sha256 ${r.ledgerChecksum}`,
    );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
