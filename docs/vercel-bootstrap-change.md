# Reviewed Vercel Git disconnect and release bootstrap proposal

Status: prepared on 2026-10-11; not approved or executed. This document is a
separate production-settings change proposal, not a migration/deployment approval.
No commits, pushes, PRs, merges or workflow dispatches were performed during this audit.

## Exact proposed account change

| Property                      | Verified value                                                             |
| ----------------------------- | -------------------------------------------------------------------------- |
| Vercel team                   | `team_pB5TcLa7apLtPAiVrRbcjBG3`; `greek-freaks-projects`                   |
| Vercel project                | `prj_lyZDCv46lEtMMZ4mCsuhjxxc0ACU`; `tullyelly.com`                        |
| Current Git link              | GitHub `tullyelly/tullyelly.com`; repository ID `1038458067`               |
| Production branch             | `main`                                                                     |
| Git deployments               | `createDeployments=enabled`                                                |
| Current production deployment | `dpl_Ce7A2PmQodC9nsjuNpyD3YbH9hWd`                                         |
| Its Git SHA                   | `3fce11932f189d940d72d0a9e3c91a8fd9943faf`                                 |
| Deploy hooks                  | Empty list on the project Git link                                         |
| Requested resulting state     | Git link absent; protected Actions release is the intended deployment path |

The proposal disconnects this project's Git integration. It stops automatic
Git-triggered production **and preview** deployments, and disables any hooks
attached to that link. It does not pause the project, remove deployments/domains,
change database connections, or execute SQL. Current production is expected to
continue serving; verify that explicitly afterward. Until workflow bootstrap is
merged and tested, there is a deployment freeze. GitHub's Vercel deployment/check
integration will also stop; `Lint, test, build` is a separate GitHub Actions check
and remains required. Do not remove that check to get a PR merged.

The local production release guard requires the Git link to be absent. A
repository-only `git.deploymentEnabled.main=false` change would preserve preview
automation but would not satisfy that guard. Its older-ref/bootstrap behavior
would also need independent review. This proposal therefore uses the existing
null-link contract. No `vercel.json` change was made and existing cron remains intact.

## Coordinator procedure only after explicit approval

1. Re-read the exact project with the CLI's existing authentication. Check team,
   project, Git repository, production branch, current deployment/SHA and hooks.
   Inspect in-progress deployments; stop if any deployment is queued/building,
   if a hook appeared, or if any reviewed value changed. Ask for a revised plan
   rather than silently changing the target or canceling jobs.
2. Save the non-secret selected settings and production deployment identity in
   the review record. Do not export environment values or credential objects.
3. Execute only this approved settings operation in WSL Bash:

   ```bash
   vercel git disconnect --project prj_lyZDCv46lEtMMZ4mCsuhjxxc0ACU --scope greek-freaks-projects --yes --non-interactive
   ```

   CLI help confirms `--project`, `--scope`, `--yes` and `--non-interactive`.
   Successful exit alone is insufficient; verify the resulting metadata.

4. Use this read-only command before and after, displaying only selected fields:

   ```bash
   vercel api '/v9/projects/prj_lyZDCv46lEtMMZ4mCsuhjxxc0ACU?teamId=team_pB5TcLa7apLtPAiVrRbcjBG3' --method GET | python3 -c 'import json,sys; p=json.load(sys.stdin); t=p.get("targets",{}).get("production",{}); print(json.dumps({"id":p.get("id"),"team":p.get("accountId"),"gitLinkPresent":bool(p.get("link")),"productionDeployment":t.get("id"),"productionSha":t.get("meta",{}).get("githubCommitSha")}))'
   ```

   Expected: `gitLinkPresent` false; same team/project and production deployment.
   Check `https://tullyelly.com` read-only. Stop if it is unavailable, a deployment
   changed, or the Git link remains. Do not deploy, reconnect or roll back automatically.

5. A recovery request to reconnect the original Git repository requires a new
   explicit settings approval. Reconnecting reopens automatic deployment risk;
   do not do it as an automatic failure handler. No database recovery is involved.

## Audit and bootstrap blockers

- App ID `5276378`, installation `170339278`, slug `cipher-jimmy`, bot ID
  `341080820`: live local JWT/installation authentication passed. Registration
  grants Actions/Contents/Pull requests/Workflows write and Metadata read only.
  The minted Actions token was scoped to repository `1038458067`, its bot identity
  matched, and it was revoked. No user token was used for App authentication.
- Both environments were verified through read-only App API calls:
  `release-dispatch` has no reviewers, no admin bypass and main-only policy;
  `production-release` requires `tullyelly`, prevents self-review, denies admin
  bypass and permits main only. Actions variable values/private key secret were
  reported configured by the user; local metadata/key worked. Their availability
  to the real Actions dispatcher still needs the smoke test. No GitHub secret value was retrieved; the authorized local PEM was read only
  for JWT signing, never printed or copied.
- Ruleset `7502483`, `main-fundamentals`, is active with no bypass actors. Fresh
  owner review, last-push review, conversation resolution, deletion/force-push
  blocking and `Lint, test, build` check from GitHub Actions are configured.
  The subsequent read-only verification confirmed
  `strict_required_status_checks_policy` is **true**, with all other protections
  unchanged. This account blocker is resolved; re-read effective protections
  before future dispatches. The release guard still refuses false.
- Remote main is `3fce11932f189d940d72d0a9e3c91a8fd9943faf`. Current local branch
  is `cipher/analytics-archive`, committed HEAD
  originally `304b1e12e0577fc39c37ea7118fbda63ab09bedb`, before local integration.
  The user authorized fetching/integrating main and committing the validated
  bootstrap locally. Main integrated without conflicts; the tooling commit
  remains in history. The readiness report binds the resulting exact commit.
  Push/PR/remote merge/settings changes/dispatch/deployment remain unauthorized.
- Main's `CODEOWNERS` is at the repository root and assigns all files to
  `tullyelly`. New `.github/CODEOWNERS` takes precedence. The prepared local
  change adds the same all-files rule, preserving that ownership after bootstrap.
- No release dispatcher, production release or gate smoke workflow exists on
  main. The initial App-authored PR therefore cannot rely on `draft-pr` workflow
  mode. Prepared `scripts/release-app-draft.ts` invokes the same existing draft
  helper locally with an installation token; it never dispatches or merges.

## Exact bootstrap sequence, with separate approvals

1. Human enables the missing strict status-check option. Cipher re-verifies the
   effective rules; no other review/gate rule is relaxed.
2. With explicit local Git authorization, integrate current main into the
   feature branch, preserve the user's tooling commit, resolve conflicts, run
   required checks and commit the prepared edits. Record the resulting exact SHA.
   Ask the user for the PR title/real ticket if required; never invent a ticket ID.
3. Approve the narrowly described Git disconnect above. Cipher executes and
   verifies only that operation; no deployment or database operation is authorized.
4. Separately authorize App publication and initial draft PR creation. Cipher
   uses the secure local PEM and ignored `.env.release-dispatch.local`, without
   replacing SSH/Git credential configuration. Commands below are **future
   coordinator commands**, not instructions to run now. Substitute the reviewed
   SHA and user-approved title; tokens/private keys never enter commands:

   ```bash
   npx tsx scripts/release-app-publish.ts check --commit "$review_sha"
   npx tsx scripts/release-app-draft.ts check --commit "$review_sha" --title "$review_title"
   npx tsx scripts/release-app-publish.ts publish --commit "$review_sha"
   npx tsx scripts/release-app-draft.ts create --commit "$review_sha" --title "$review_title"
   ```

   Publisher token has Contents/Workflows write; draft token has Contents read
   and Pull requests write. Each is repository-scoped and revoked. Creation
   confirms actual draft author is `cipher-jimmy[bot]` with ID `341080820`.
   Stop on SHA/ancestry/identity mismatch or uncertain write result; inspect the
   existing remote branch/PR before any retry. App PR/push attribution is not
   yet verified live merely because local authentication passed.

5. Wait for `Lint, test, build` on the exact current PR commit. GitHub may ask
   for separate first-time-contributor Actions approval; that is not production
   deployment approval. Mark the draft ready only after review preparation.
   `tullyelly` reviews and approves the App-authored PR and the App's latest push;
   this satisfies the distinct author/last-pusher rules without self-review.
   Any new push invalidates stale approvals and needs fresh checks/review.
6. Merge only with explicit authorization after checks and human PR approval.
   Git is disconnected, so the merge must not cause a Vercel deployment. Verify
   main's new SHA, unchanged production deployment, and the three workflow files
   on main. If main moves during preparation, stop and bind the new exact SHA.
7. With explicit harmless-test dispatch authorization, start **Dispatch release
   as dedicated App** on main with mode `smoke` and `release_sha` equal to that
   current main SHA. The parent may be initiated by the human/coordinator; only
   its child uses App installation authentication. Parent waits for no approval.
   **Release approval gate smoke** must show actor and triggering actor
   `cipher-jimmy[bot]` and wait at `production-release`. The child validates the
   successful exact parent run, branch policies and protected main.
8. Human `tullyelly` opens the child run > Review deployments > selects
   `production-release` > Approve and deploy. That button's wording does not
   make this a deployment: the smoke references no production credentials and
   runs no database/migration/Vercel operation. Cipher verifies successful run
   and recorded human approval. Do not approve on the user's behalf; do not
   rerun the child as the human because its identity guard rejects that rerun.
   Dispatch a fresh smoke via the App dispatcher if a new test is authorized.
9. Actual schema reconciliation, production release, analytics activation and
   historical imports remain separate reviewed plans and approvals. Passing the
   harmless gate test authorizes none of them.

Official references:
[Git deployment configuration](https://vercel.com/docs/project-configuration/git-configuration),
[Vercel CLI git command](https://vercel.com/docs/cli/git),
[CODEOWNERS precedence](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners),
and [App tokens versus GITHUB_TOKEN workflow events](https://docs.github.com/en/actions/concepts/security/github_token).

Vercel MCP returned a team-scope 403 during this audit. The existing CLI
authentication successfully read the exact project as a fallback; no MCP
re-authentication or integration replacement was attempted.

## Local bootstrap validation refinement

Review reproduced a CI fixture failure with `CI=true SKIP_DB=true`: mocked
pool and policy tests inherited a flag that intentionally disables those
behaviors. The user authorized fixture isolation fixes. Five affected suites
now clear the inherited flag only around mocked tests and restore it afterward.
Explicit guard regression tests still reject pool construction, policy SQL and
listener connections. Runtime guards, global Jest setup and workflow safety
flags are unchanged. The focused CI-environment run passed 25 tests.

The local integration incorporates the four fetched main commits without
conflicts or content edits by Cipher. The commit includes the incoming Chronicle
and image changes as part of main integration, not new authored content.

## Publisher URL guard correction

Stage 4 stopped before creating a remote branch or PR: Git did not recognize
`cipher-app-check` when its URL was supplied only through command-line config.
The publisher now creates that check remote in an isolated temporary bare Git
directory, copies the effective URL rewrite rules, and resolves its push URL
there. Both `insteadOf` and `pushInsteadOf` remain fail-closed. A `finally` block
removes the directory on success, rewrite rejection, or Git failure. No persistent
repository remote, SSH setting or credential helper is changed. This guard uses
local Git commands only; it performs no network request or push.

Regression tests use real temporary Git repositories and verify successful URL
resolution, both rewrite rejection paths, unchanged persistent configuration,
and cleanup after success and failure. App identity, permissions, exact SHA,
main ancestry, token revocation and post-push SHA verification remain unchanged.
Publication requires renewed approval for the corrected commit. No publication,
PR creation, release dispatch or production operation accompanies this fix.

Local correction validation passed with `CI=true SKIP_DB=true npm run verify:agent`:
lint, TypeScript, Prisma generation, Jest smoke, full coverage and Next build.
The full run passed 200 suites and 1,046 tests; six opt-in database tests remained
skipped. Documentation and changed-file formatting checks passed. The corrected
URL guard also passed against the actual checkout using a non-secret fixture,
without a key read, network request or push. Evidence is in the ignored local
`.cache/publisher-fix-verify.log`. This proves local readiness, not live publication.
