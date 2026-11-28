# Jira-led shared epic work

Jira owns scope, hierarchy, acceptance criteria and dependencies. Git owns branch
and commit state. Read the selected issue and parent on start/resume. Priority is
explicit current instructions, your own persisted session context, then a clear
next ready item in the epic. Ask one focused question if several remain. Never
infer child ownership from an epic branch or completion from today's date.

## Select and recover context

Use America/Chicago and an explicit active day. Inspect status, HEAD, local and
live remote refs (including differently named epic branches), and work already
underway. Reuse a valid existing epic branch without renaming it. Convention for
new branches is `epic/WU-1260-tag-relationships`. Only when none exists, create one
from verified appropriate main with a clean tree. Recheck remote discovery before
creation; if another session creates it first, reuse it. Never carry uncommitted
work across a switch automatically. Never reset, force-push or create an escape
branch. When only one same-day open epic is eligible, reuse it automatically;
explicit requested work can also establish the epic unambiguously through its
live Jira ancestry. A stale day or prior merge requires fresh verification, not
user confirmation by itself. Ask only when selection remains ambiguous or a
concrete safety risk cannot be resolved autonomously.

### Automatically reuse a fully merged branch

When the requested work identifies one epic and its existing shared branch,
perform these checks without asking James to approve routine branch reuse:

1. Inspect the worktree and index (including untracked files), HEAD, local and
   live remote branch tips, current remote main, other worktrees and active
   session/lock ownership. Refresh remote refs and verify Jira scope/status and
   ancestry; for a subtask, retain its real parent and resolve the parent story's
   epic. Do not infer ownership from a branch name or stale session record.
2. Establish that both the local branch tip, if present, and remote branch tip
   are ancestors of verified current main, using `git merge-base --is-ancestor`.
   A merged PR label alone is insufficient: later local/remote commits may be
   unmerged. Squash/rebase merges that fail this ancestry proof require further
   inspection; never discard commits based on similar file contents.
3. If already on the selected branch at current main, keep it and preserve
   existing edits in place. Otherwise require a clean worktree/index and no
   conflicting active user of the branch before switching or advancing it.
   Do not stash, overwrite or carry unrelated edits across a switch automatically.
4. Serialize mutations using the existing `jira-mutation.lock` (exclusive
   creation at `git rev-parse --git-path jira-mutation.lock`). While holding the
   lock, recheck HEAD, index/worktree, local refs and live remote tips against the
   inspected state. If anything advanced, release your own lock and reassess;
   never delete another owner's lock. The lock coordinates local agents, not
   remote writers. Reconcile any later remote advancement before an ordinary
   push; never force-push.
5. Reuse the existing branch name without prompting. Switch to the existing
   local branch and fast-forward only to the verified main SHA with
   `git merge --ff-only <verified-main-SHA>`. If only the remote branch exists,
   create its local tracking branch first, then fast-forward. Do not reset,
   rename, delete or create a separate story/escape branch. Refresh the daily
   epic record and only this session's context from verified facts under the
   same serialized mutation boundary. Release only the lock you acquired.

Unmerged/divergent commits, dirty files requiring a switch, concurrent ownership
or ambiguous Jira scope fail the automatic-reuse conditions; preserve all work.
Resolve routine reversible issues and repeat checks where possible. Ask only
when a concrete unresolved risk or choice needs James, describing that blocker.
A new day or a previously merged branch alone never requires permission when
these checks succeed. This does not authorize merge, deployment or changing a
closed epic's status.

Commit `.jira/active-epic.json` containing epic, branch, day and timezone so another
session can recover branch selection. It does not select every session's child.
Store per-session context outside the index, at a path returned by
`git rev-parse --git-path jira-context-SESSION.json`. Session IDs must be distinct.
After live Jira verification write JSON with the same epic/branch/day/timezone,
`items` (key, parent, kind), and `verifiedAt`. `kind` is `work` or `content`.
Record only verified Jira facts; this local cache is not an offline Jira lookup.
When James explicitly authorizes outside-epic engineering work on this branch,
retain its real parent and record `branchException` on that session item with
`epic`, `branch`, `authorizedAt` and `reason` quoting his authorization. The guard
requires the exact selected epic/branch and same Chicago day. Never infer this
exception or use it to reparent Jira work; ordinary outside-epic work still fails.
On resume refresh scope/status and dependencies; if unavailable, explicitly report
cached verification and stop on unknown selection. Never overwrite another
session's context. Explicit instructions replace stale attribution after fresh
verification. Select the next authorized child by updating only your session file.

## Commit routine

Inspect the unstaged and staged diffs; stage only the selected item's changes.
Capture HEAD and the staged tree after staging. Commit with:

```sh
JIRA_CONTEXT_FILE="$(git rev-parse --git-path jira-context-SESSION.json)" \
  node scripts/jira-workflow.mjs commit EXPECTED_HEAD EXPECTED_TREE \
  '[WU-1271] Add shared epic workflow'
```

The command holds a shared Git mutation lock, checks branch/context/day, HEAD,
staged tree and issue references, and invokes ordinary Git commit with existing
hooks and author identity. All collaborating sessions must use this lock/routine
and serialize staging, context changes, branch changes and pushes; stop if someone
else's staged changes appear. Git's index lock alone does not serialize semantic
staging. Hooks also reject an absent or contradictory context. A lock conflict
means inspect the other stream, not delete its lock. A crashed lock requires
checking that its owner has stopped before manual removal.

Messages start `[WU-1271] Description`. Prefer one coherent commit per child.
Inseparable multi-item commits start `[WU-1271] [WU-1270] Description` and include
one `WU-KEY: scope` line per key in the body. All keys must be in your verified
session context. The epic alone is valid only for genuinely epic-owned work.
The helper enforces deterministic facts, not semantic staged-scope correctness.
The prepare-message hook inserts the sole selected key when James omits it;
it does not guess among several keys. Invalid or missing Jira context blocks.

For Chronicle/MDX work James supplies the exact valid Jira item. Keep that key
even if its parent is outside the active epic; `kind: content` allows only content
paths (Chronicles, static page.mdx, image assets and their generated manifest).
Do not reparent the item or sweep in another stream's changes. Existing content,
asset and publication checks still apply.

Before pushing, fetch and reconcile live remote advancement on this same branch;
never force-push. Inspect GitHub/Jira integration read-only when available. A key
in a commit is evidence of attribution only; Development-panel ingestion must be
observed separately. Do not install integrations or alter credentials.

Use `[WU-1260]` in the epic PR title and enumerate every child/content key and
commit. Preserve commits through merge where possible. If squashing, include all
keys and their scope mapping in the resulting commit and PR. Continue through
existing reviewed-main CI and protected release procedures only when authorized.
No automatic Done transitions, Smart Commit commands, worklogs or deployment.
Keep main stable throughout an active production run.

## Walkthrough

After WU-1271, keep the epic branch and switch your verified session item to
WU-1270. Its commit uses WU-1270 automatically. Repeat for WU-1261. James can say
“continue the next ready item” without repeating the branch or epic. For his
Chronicle, he supplies its key; the branch stays the same. Ask only for unresolved
epic selection, missing/invalid content key, ambiguous scope or a concrete safety
blocker; refresh stale-day context automatically when live facts resolve it.

### Safe-reuse walkthrough; WU-1315

| Observed state                                                                                                               | Action and expected result                                                                                                                                            |
| ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Prior local and remote epic tips are ancestors of current main; clean tree/index; no other owner; refs stable under the lock | Reuse the same branch and fast-forward to verified main, refresh the day/session facts, and continue without a prompt.                                                |
| Already on that branch at current main with WU-1314 edits                                                                    | Keep the branch and every edit in place; no switch, reset or new branch is needed. Attribute subsequent work to its verified item.                                    |
| Local or remote tip contains an unmerged commit or diverges from main                                                        | Ancestry check fails; retain both tips and investigate. Do not reset to main or treat a merged PR as proof that later commits are merged.                             |
| Staged, unstaged or untracked work would need to cross a branch switch                                                       | Preserve HEAD, index and files; do not switch or auto-stash. Continue independent work where possible and surface only the actual unresolved ownership/scope blocker. |
| Remote tip or local state changes between inspection and mutation                                                            | Recheck detects advancement; release the acquired lock, refresh and reassess. Preserve the new commit and do not force-push.                                          |
| Another session owns the mutation lock or is actively using the branch                                                       | Coordinate and retry after ownership is resolved; never remove the other session's lock or disrupt its work.                                                          |
