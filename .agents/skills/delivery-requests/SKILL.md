---
name: delivery-requests
description: Carry ordinary commit, PR, and deploy requests through their requested endpoints using existing Jira attribution and release profiles.
---

Use this for “commit this,” “open/update a PR,” “deploy this,” and combined
requests. Infer the requested endpoint from the conversation; no special prompt
or release-lane choice is needed. Follow the [Jira workflow](../../../docs/jira-workflow.md)
for live scope, the shared epic branch, session context and guarded commits.
Reuse a previously fully merged branch automatically when that workflow's live
safety checks pass; a prior merge or stale date alone needs no confirmation.

## Commit

Inspect status and both staged and unstaged diffs, including intended new files.
Preserve unrelated edits; stage only the selected item's work. Follow the
[validation requirements](../../../docs/validation.md), reusing valid results
already obtained for this step, then use the Jira guarded commit routine.
Classification operates on committed revisions; any assessment before the commit
is provisional. A commit-only request ends after the commit and its report.

## Open or update a PR

Before creating a PR, establish the intended human approver (`tullyelly` for this
repository) and the identity that will create it. These must be different.
Git commit author/email, push identity and PR author are independent; changing
commit attribution or adding a reviewer cannot fix a self-authored PR.

Use the existing [App-owned review procedure](../../../docs/release-app-setup.md#publish-an-ordinary-review-branch)
and `scripts/release-app-draft.ts` with the explicit shared branch, exact HEAD,
reviewed body file and `--ready`. Its creation path verifies repository, remote
SHA and configured App author. Prefer this helper over a generic connector or
`gh pr create`; do not assume a tool called by Cipher acts as Cipher. Inspect
existing PRs first; update only the matching App-owned PR. Follow the documented
publication check before authorized writes, without printing keys or tokens.

Never create a review PR through an identity matching the human approver, or
through an identity whose author cannot be verified. A personal GitHub connector
authenticated as `tullyelly` is not a fallback. If App configuration/access is
unavailable, retain the commits and report that exact blocker; do not create an
unapprovable PR, provision credentials, weaken review rules or approve for James.
After creation, verify the returned PR author is the expected App bot, differs
from the approver, and has the intended base, branch and exact SHA before
reporting it ready for approval.

If a human-owned PR was created by mistake, its author cannot be changed. Preserve
the branch/commits, record its URL and review/check context, and prepare a
replacement through the App helper. The helper rejects an existing human-owned
PR: once App access and the replacement inputs are verified, close the mistaken
PR without merging or deleting the branch, create the App-owned replacement,
and verify its author and fresh checks. Report the replacement link. Do not
close the only review PR while App access remains unavailable.

Carry out any authorized prerequisite commit, reconcile the live shared branch,
and push with the existing pre-push hook enabled. Use the existing PR checks and
review process. Reuse validation already performed for this step; do not manually
repeat successful hook or CI checks, bypass hooks, or weaken required checks.
A failed focused content check is a failure to fix, not permission to fall back
to application checks to hide it.

Report the actual tooling result in one line when available:
`Profile: <content|application>; reason: <classifier reason>.`
Use hook/CI output or the matching `.cache/content-profile.json`; do not reuse a
selection for another target or present an old cache as current evidence. If
needed, `node --import tsx scripts/chronicle-profile.ts select` selects for HEAD.
An open/update-PR-only request ends at the PR with check/review status; it does not
authorize merge or deployment.

## Deploy, including combined requests

Carry the authorized steps forward through normal PR review and merge. Resolve
the exact reviewed, merged full main SHA, not the PR head or a moving branch name.
Follow the [publishing runbook](../../../docs/chronicle-publishing.md) and existing
[production release procedure](../../../docs/production-releases.md):
`npm run chronicle:publish -- <full-merged-SHA>`.
The coordinator retains the existing human **production-release** approval;
present its link when needed and never approve on James's behalf. Only the owning
coordinator dispatches. Resume an existing release using
`npm run chronicle:status -- <full-SHA>` instead of starting another deployment.
Report the public receipt, or the concrete review/check/approval/verification
blocker. A successful dispatch or promotion alone is not public verification.

## Profile authority

Keep eligibility in the [existing classifier](../../../scripts/release/content-profile.ts)
and [selector](../../../scripts/chronicle-profile.ts). Let tooling evaluate the
whole live-production-to-target diff, including earlier unreleased commits.
Staged files, a PR file list and filename extensions cannot establish eligibility.
Local/PR selection remains provisional; release preparation rechecks the exact
target and authoritative baseline. If application is selected, state its concrete
reason and continue within the requested scope. Never force content eligibility
or ask James to select a lane.

See the [dry walkthrough](../../../docs/delivery-requests-walkthrough.md) for
profile examples and endpoint checks. It does not authorize a live release.
