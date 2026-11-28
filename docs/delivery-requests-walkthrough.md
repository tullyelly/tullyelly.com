# Delivery requests; WU-1314 dry walkthrough

These are dry walkthroughs of the [delivery skill](../.agents/skills/delivery-requests/SKILL.md)
against the existing classifier and fixtures. They do not dispatch or approve a
release. Content expectations assume a verified ancestor production baseline,
clean committed target, supported consumers and a reproducible image manifest.
An unavailable baseline instead selects application validation.

| Scenario                                                                                                                                                   | Expected selection and evidence                                                                                                                                                                                                                                                                | Requested endpoint                                                                                                                                                                     |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| “Commit this”: edit an already published Chronicle using supported components                                                                              | Content after commit with `supported-chronicle-content`; the existing component-rich Chronicle fixture covers selection. Before commit, any prediction is provisional.                                                                                                                         | Inspect intended staged/worktree changes, preserve unrelated work, validate and guarded-commit. Report the commit; do not push, open a PR or deploy.                                   |
| “Open a PR”: replace an image referenced by published Chronicles, with a reproducible manifest                                                             | Content with `supported-chronicle-content`; the shared-image fixture includes every consuming Chronicle. Focused validation must independently regenerate the manifest and check actual image bytes/dimensions. Fixture placeholder bytes alone do not prove that validation.                  | Commit as needed, push through the hook, inspect PR checks, report profile/reason and PR status. Stop at the PR; do not merge or deploy.                                               |
| Chronicle edit plus application code anywhere since live production, even in an earlier commit outside this PR                                             | Application with `application-change:<path>`; the existing earlier-application-commit fixture proves that the full baseline diff matters.                                                                                                                                                      | Continue the requested commit/PR/deploy scope using application checks. Do not infer content eligibility from the latest commit or PR file list.                                       |
| Kohler [PR #713](https://github.com/tullyelly/tullyelly.com/pull/713): `draft: true` to `false`, plus deletion of `public/images/optimus/kohler/lulu.webp` | Application. Against its first parent, the classifier rejects the existing draft baseline as `unsupported-mdx:content/chronicles/kohler.mdx`. The image deletion independently violates the allowed add/modify operations; fixing only the draft transition would not make this diff eligible. | An “open a PR” request still ends at the PR. A combined deploy request proceeds only through review, exact merged-main checks, the existing coordinator and human production approval. |

The first three cases map to
[existing content-profile fixtures](../__tests__/release/content-profile.test.ts).
For the historical fourth case, inspect merge `52e26f61` and classify its full
first-parent-to-merge diff with `classifyContent`; this is historical evidence,
not a claim about today's production baseline. Reproduction from the repository:

```sh
SKIP_DB=true npm run test:prepared -- --runInBand --runTestsByPath __tests__/release/content-profile.test.ts
node --import tsx --input-type=module -e 'import { execFileSync } from "node:child_process"; import { classifyContent } from "./scripts/release/content-profile.ts"; const sha = (ref) => execFileSync("git", ["rev-parse", ref], { encoding: "utf8" }).trim(); console.log(JSON.stringify(classifyContent(sha("52e26f61^1"), sha("52e26f61")), null, 2));'
```

For an authorized deployment, use the exact reviewed and merged main SHA with
`npm run chronicle:publish -- <full-merged-SHA>`. Reconnect with
`npm run chronicle:status -- <full-SHA>` and report its public receipt or actual
blocker. Release preparation rechecks the complete production-to-target diff;
none of these examples substitutes for that check.
