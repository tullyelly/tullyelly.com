# Homie slug synchronization; WU-1261

Migration 098 is prepared, not applied. [The task handoff](wu-1260-handoff.md)
owns the two executable files and engineering evidence.

`dojo.homie.tag_slug` remains authoritative. No name-derived slug, alias resolver,
redirect, new relationship type, collection motivation or UI behavior is added.
The existing snapshot lookup still matches the current slug; null homie slugs
retain the application's ID-based route fallback. IDs and snapshot records are
not reassigned. Family `cal` (tag 33) and `the-lazer` (tag 274) remain distinct from
athletes 221/`eldrid` and 219/`lazer-face`.

## Managed fields and retirement

New homie tags get the current canonical CardAttack route, person/homie context
and generated label. Existing authored labels, clickability, non-homie routes,
unrelated JSON and other contexts survive. The `meta.homie_sync` namespace records
the owning homie ID and only fields whose generated values were established.
Matching legacy pure routes/contexts can establish field ownership; a mixed tag
is not made athlete-owned merely because a homie once referenced it. Unknown
identity kinds, a different recorded owner or contradictory CardAttack context
fail for review. A current custom route stays custom.

A name update changes a proven managed label, while a same-value update does not
rewrite tags. A slug change validates the destination, creates/synchronizes it,
then retires obsolete managed context/route state in the same statement. Retired
purely managed routes become null with `href_kind=tag`, so normal TagLink fallback
goes to that retained tag's Chronicle archive. Tag IDs and authored routes remain.
The minimal retired ownership marker supports later repeated/null transitions;
it is not consulted by application lookups as an alias.

Only outgoing `member_of` edges whose target is an actual clan and whose metadata
contains `membership_basis=played_for` plus an evidence URL move to the current
athlete tag. Missing evidence stops the statement. A duplicate current edge keeps
its existing metadata; the complete former edge (including its ID, metadata and
audit evidence) is appended to `homie_sync_merged_edges` before that duplicate
source edge is removed. A conflicting archive value stops for review. Other
relationships and incoming references remain on the old tag; no family membership
is transferred. No tag is deleted.

On transition to null, the old purely managed route/context retires, clan evidence
stays on that retained tag and the homie uses its numeric route. A later non-null
slug recovers verified clan edges from tags marked retired for that exact homie.
An ambiguous legacy mixed tag stops instead of guessing ownership.

Historical direct `/cardattack/homies/old-slug` URLs are not redirected. Authored
old tag references continue to identify their retained tag/archive; chronicles do
not automatically move to the new athlete feed. Older retained identities and
unrelated relationship meanings are outside this narrow repair. WU-1262 must
settle broader alias lookup, route, feed and count behavior before later stories.

## Collision and concurrent writes

Reservations use actual family/squad routes, UncleJimmy contexts, roster slugs
and route endpoints, and all reachable `member_of` ancestors. `href_kind` alone
is insufficient. Legitimate athlete-to-clan membership remains allowed.

Before-statement triggers on homie, tags, tag_relation and unclejimmy_squad_item
acquire one transaction advisory lock before row locks. After-statement triggers
check the complete current homie assignment invariant, catching reverse tag,
context, roster and indirect membership changes as well as homie changes. Existing
inference/audit triggers stay active. Missing current tags also fail.

These write paths require **READ COMMITTED**. Volatile PL/pgSQL queries after the
lock see the preceding holder's commit at that isolation level. Higher isolation
levels are explicitly rejected, preventing an older transaction snapshot from
passing a stale cross-table check. The lock lasts until transaction end. Expect
serialization of these relatively infrequent identity writes; end idle DataGrip
transactions promptly. Lock/deadlock/timeout errors require rollback and review,
not an automatic retry or disabled guard. Cooperative application roles must not
disable triggers or edit ownership metadata to bypass this contract.

The engineering tests cover expected insert, managed/legacy/authored name updates,
no-op writes, repeated/null renames, evidence-preserving deduplication, ambiguous
clan edges, forward/reverse/indirect collisions and concurrent writes. They remain
optional engineering tools and are not James's normal migration instructions.
Agent-run static checks do not prove live behavior or migration application.
