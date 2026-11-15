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
multiple candidates, stale/closed/merged context or a new day require selection.
This first version has no multi-day release strategy.

Commit `.jira/active-epic.json` containing epic, branch, day and timezone so another
session can recover branch selection. It does not select every session's child.
Store per-session context outside the index, at a path returned by
`git rev-parse --git-path jira-context-SESSION.json`. Session IDs must be distinct.
After live Jira verification write JSON with the same epic/branch/day/timezone,
`items` (key, parent, kind), and `verifiedAt`. `kind` is `work` or `content`.
Record only verified Jira facts; this local cache is not an offline Jira lookup.
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
epic selection, missing/invalid content key, ambiguous scope or stale-day context.
