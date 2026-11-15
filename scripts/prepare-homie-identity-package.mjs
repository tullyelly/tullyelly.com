// Offline regeneration for unapplied WU-1261 files. Never use to edit applied history.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { hash, prepare } from "./manual-migration.mjs";
export function derived098(source, preflight, postflight) {
  const checksum = hash(source);
  const functions = source.match(
    /CREATE OR REPLACE FUNCTION[\s\S]*?\n\$fn\$;/g,
  );
  if (!functions?.length) throw new Error("098 function definitions missing");
  const values = functions
    .map((definition) => {
      const name = /FUNCTION dojo\.(\w+)/.exec(definition)[1];
      const body = definition.split("$fn$")[1];
      return `('${name}','${createHash("md5").update(body.replaceAll("\r", "")).digest("hex")}')`;
    })
    .join(",\n");
  const known = /DO \$known\$([\s\S]*?)\$known\$;/
    .exec(source)?.[1]
    ?.trim()
    .replace(/^BEGIN/, "")
    .replace(/END;$/, "");
  if (!known) throw new Error("098 prerequisite guards missing");
  const prerequisiteBlock = `DO $preflight$
BEGIN
IF NOT EXISTS(SELECT 1 FROM dojo.schema_migration WHERE filename='098_protect_homie_tag_identity.sql') THEN
${known}
END IF;
END;
$preflight$;`;
  const checkedPreflight = preflight.replace(
    /DO \$preflight\$[\s\S]*?\$preflight\$;/,
    prerequisiteBlock,
  );
  const definitions = `-- BEGIN GENERATED DEFINITION CHECKS
DO $definitions$
BEGIN
  IF EXISTS(SELECT 1 FROM (VALUES ${values},('infer_tag_identity_from_canonical_route','44172b71b333653f7fd9d398b7a4e05d')) expected(name,body_hash)
    LEFT JOIN pg_proc p ON p.pronamespace='dojo'::regnamespace AND p.proname=expected.name
    WHERE p.oid IS NULL OR md5(replace(p.prosrc,E'\\r',''))<>expected.body_hash) THEN
    RAISE EXCEPTION '098: installed function body differs from reviewed source';
  END IF;
END;
$definitions$;
-- END GENERATED DEFINITION CHECKS`;
  const withoutDefinitions = postflight.replace(
    /-- BEGIN GENERATED DEFINITION CHECKS[\s\S]*?-- END GENERATED DEFINITION CHECKS\n?/,
    "",
  );
  const checkedPostflight = withoutDefinitions.replace(
    /COMMIT;\s*$/,
    definitions + "\nCOMMIT;\n",
  );
  return {
    "db/operations/098_identity_preflight.sql": checkedPreflight.replace(
      /checksum<>'[a-f0-9]{64}'/,
      `checksum<>'${checksum}'`,
    ),
    "db/operations/098_identity_postflight.sql": checkedPostflight.replace(
      /checksum='[a-f0-9]{64}'/,
      `checksum='${checksum}'`,
    ),
    "db/schema/functions/homie_tag_identity.sql":
      "-- Current definitions prepared in migration 098; review-only schema reference.\n" +
      functions.join("\n\n") +
      "\n",
  };
}
export function prepare098(check = false) {
  const canonical = "db/migrations/098_protect_homie_tag_identity.sql";
  const assertions = "db/operations/098_identity_assertions.sql";
  const source = readFileSync(canonical, "utf8");
  if (!source.includes(readFileSync(assertions, "utf8").trim()))
    throw new Error(
      "Update the canonical effect assertions to match the reviewed assertion file first.",
    );
  const artifacts = derived098(
    source,
    readFileSync("db/operations/098_identity_preflight.sql", "utf8"),
    readFileSync("db/operations/098_identity_postflight.sql", "utf8"),
  );
  for (const [path, content] of Object.entries(artifacts)) {
    if (check) {
      if (readFileSync(path, "utf8") !== content)
        throw new Error(`Stale derived artifact: ${path}`);
    } else writeFileSync(path, content);
  }
  return prepare(
    canonical,
    assertions,
    "db/operations/098_apply_with_ledger.sql",
    { check },
  );
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  try {
    if (!["generate", "check"].includes(process.argv[2]))
      throw new Error(
        "Use generate or check; only regenerate unapplied, reviewed files.",
      );
    const result = prepare098(process.argv[2] === "check");
    console.log(
      `canonical sha256 ${result.checksum}\noperation sha256 ${result.wrapperChecksum}`,
    );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
