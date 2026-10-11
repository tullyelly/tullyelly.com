/** GitHub metadata and approval proof only. No database, Vercel or deployment operations. */
import { appendFileSync } from "node:fs";
import {
  verifyChildDispatch,
  verifyHumanApproval,
  ReleaseVerificationError,
} from "./release/app";
async function main() {
  await verifyChildDispatch(process.env);
  if (process.env.RELEASE_SHA !== process.env.GITHUB_SHA)
    throw new Error("Gate smoke commit mismatch");
  const mode = process.argv[2];
  if (mode !== "prepare" && mode !== "approved")
    throw new Error("Explicit gate smoke mode required");
  if (mode === "approved") await verifyHumanApproval(process.env);
  const message =
    mode === "prepare"
      ? `Harmless gate test at ${process.env.GITHUB_SHA}. The dedicated App dispatched this run. Human action: Actions > Release approval gate smoke > this run > Review deployments > production-release > Approve and deploy. This workflow has no production credential references and cannot migrate or deploy.`
      : "Verified explicit tullyelly approval of the App-dispatched production-release gate. No production credentials, database operations or deployment operations were used.";
  console.log(message);
  if (process.env.GITHUB_STEP_SUMMARY)
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${message}\n`);
}
main().catch((error: unknown) => {
  const invariant =
    error instanceof ReleaseVerificationError
      ? error.invariant
      : "smoke.context-or-human-approval";
  console.error(`Harmless approval gate test failed invariant: ${invariant}.`);
  console.error(
    "Harmless approval gate test stopped; check App identity, protected main, dispatcher provenance and human approval. No production operations were attempted.",
  );
  process.exitCode = 1;
});
