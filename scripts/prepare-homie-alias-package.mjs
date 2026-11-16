// Offline generation only. No environment loading or database access.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { bundle } from "./manual-migration.mjs";
export const canonicalPath =
  "db/migrations/101_retarget_homie_alias_references.sql";
export function derived101(source) {
  const functions = source.match(
    /CREATE OR REPLACE FUNCTION[\s\S]*?\n\$fn\$;/g,
  );
  const effects = /DO \$effects\$[\s\S]*?\$effects\$;/.exec(source)?.[0];
  if (functions?.length !== 2 || !effects)
    throw new Error("101 definitions/effects missing");
  const values = functions
    .map((definition) => {
      const name = /FUNCTION dojo\.(\w+)/.exec(definition)[1];
      const hash = createHash("md5")
        .update(definition.split("$fn$")[1].replaceAll("\r\n", "\n"))
        .digest("hex");
      return `('${name}','${hash}')`;
    })
    .join(",\n");
  const assertions = `SET LOCAL search_path=pg_catalog;
DO $target$
BEGIN
  IF current_database()<>'tullyelly_db' THEN RAISE EXCEPTION '101: wrong database'; END IF;
  IF current_setting('transaction_isolation')<>'read committed' THEN RAISE EXCEPTION '101: use READ COMMITTED'; END IF;
END;
$target$;
SELECT pg_advisory_xact_lock(hashtextextended('cipher:homie-tag-identity',0));
DO $definitions$
BEGIN
  IF EXISTS(SELECT 1 FROM (VALUES ${values}) e(name,hash)
    LEFT JOIN pg_proc p ON p.pronamespace='dojo'::regnamespace AND p.proname=e.name
    WHERE p.oid IS NULL OR md5(replace(p.prosrc,E'\\r\\n',E'\\n'))<>e.hash) THEN
    RAISE EXCEPTION '101: installed definitions differ; stop for review';
  END IF;
END;
$definitions$;
${effects}`;
  const result = bundle({
    filename: canonicalPath.split("/").at(-1),
    source,
    assertions,
  });
  return {
    result,
    artifacts: {
      "db/operations/101_record_applied.sql": result.sql,
      "db/operations/101_record_applied.json":
        JSON.stringify(
          {
            canonicalPath,
            canonicalSha256: result.checksum,
            ledgerPath: "db/operations/101_record_applied.sql",
            ledgerSha256: result.ledgerChecksum,
            assertionsSha256: result.assertionsChecksum,
            mode: "record-after-success",
          },
          null,
          2,
        ) + "\n",
      "db/schema/functions/homie_alias_retarget.sql":
        "-- WU-1264: reference definitions from migration 101; supersedes 098 row helper.\n" +
        functions.join("\n\n") +
        "\n",
    },
  };
}
export function prepare101(check = false) {
  const { result, artifacts } = derived101(readFileSync(canonicalPath, "utf8"));
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
  const result = prepare101(process.argv[2] === "check");
  console.log(
    `canonical sha256 ${result.checksum}\nledger sha256 ${result.ledgerChecksum}`,
  );
}
