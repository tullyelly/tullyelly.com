# Whole-subject collection motivations; WU-1265

`collected_because_of` means James collects a whole subject because of a person.
It means neither that person's card ownership nor a current favorite, and adds no
chronicles or memberships. The [typed contract](typed-tag-relationships.md) owns
endpoints, reason validation, cardinality and traversal. Existing migrations
100/101 supply validation and same-owner rename integration. No new migration or
manual SQL execution is required for this query/documentation story.

`listCollectionInspirations(subjectSlug)` returns inspiring people;
`listCollectionsInspiredBy(personSlug)` returns the inspired subjects. Both in
`lib/collection-motivations.ts` use the existing canonical alias resolver and
**direct** typed query. Results include canonical subject/person objects, stable
edge ID, unmodified reasons and unrelated edge metadata. Repeated identical edge
rows deduplicate; conflicting IDs, duplicate canonical pairs, invalid endpoints,
noncanonical stored endpoints or malformed reasons fail diagnostically. An absent
relationship returns an empty array. Page consumers own their error presentation.
Production builds skip reads. No transitive membership/team/motivation lookup is
introduced. Existing request-scoped freshness and server authorization remain.

Several people can inspire a subject; each person can inspire several subjects.
Several reasons for one pair live in its one `meta.reasons` array. Duplicate codes
are rejected, never merged or used to silently replace narrative. Additions to the
reason vocabulary require a coordinated application/database contract change.
Historical explanations are returned exactly; no favorite-player event updates
another edge or infers a preference timeline. 101 retargets proven same-owner
references on canonical homie slug changes; it never moves family identities.
Real examples/seeds belong to WU-1267 and remain absent here.

## Direct-edit maintenance examples

These are **parameterized engineering examples**, not files to execute now or a
new execution checklist. Cipher never executes them. James adapts reviewed changes
to the existing manual procedure, development first. Actual migration/seed work
uses a complete canonical migration followed by its separate ledger on success.
Use one READ COMMITTED transaction/connection and the existing shared identity
lock before row locks. Leave audit and validation triggers enabled.

Inspect a pair read-only and record the exact current `meta` for optimistic checks:

```sql
SELECT r.id, s.slug AS subject, t.slug AS person, r.meta,
       r.created_at, r.created_by, r.updated_at, r.updated_by
FROM dojo.tag_relation r
JOIN dojo.tags s ON s.id=r.source_tag_id
JOIN dojo.tags t ON t.id=r.target_tag_id
WHERE r.relation_type='collected_because_of'
  AND s.slug=$1 AND t.slug=$2;
```

Add a reviewed canonical pair; `$3` is the complete reviewed object metadata.
For example it can contain both `favorite_player` and `shared_name` reasons,
each with a nonblank historical explanation. Use another target ID for a second
inspiring person, rather than inventing a second edge for another reason.

```sql
INSERT INTO dojo.tag_relation(source_tag_id,target_tag_id,relation_type,meta)
VALUES ($1::integer,$2::integer,'collected_because_of',$3::jsonb)
RETURNING id,meta;
```

The unique edge constraint rejects an existing pair instead of overwriting it.
Validation rejects alias endpoints, invalid person targets, unknown/duplicate
reason codes, missing/blank explanations and self-links. Resolve/inspect the
canonical endpoints first; a validation error is a correction, not retry advice.

Add one reason to an existing pair without touching other metadata. `$3` is the
exact previously inspected `meta`; `$2` is the new reason object. A duplicate code
fails validation, preserving the prior narrative.

```sql
UPDATE dojo.tag_relation
SET meta=jsonb_set(meta,'{reasons}',(meta->'reasons')||jsonb_build_array($2::jsonb))
WHERE id=$1::bigint AND relation_type='collected_because_of'
  AND meta=$3::jsonb
RETURNING id,meta;
```

Deliberately edit or remove one reason by supplying the reviewed replacement
array as `$2`. Compare the complete previous metadata (`$3`) to avoid clobbering a
newer intentional reason/evidence edit. Only the reasons key is changed.

```sql
UPDATE dojo.tag_relation
SET meta=jsonb_set(meta,'{reasons}',$2::jsonb)
WHERE id=$1::bigint AND relation_type='collected_because_of' AND meta=$3::jsonb
RETURNING id,meta;
```

Removing the last reason requires deliberate edge removal, rather than a malformed
empty reason array:

```sql
DELETE FROM dojo.tag_relation
WHERE id=$1::bigint AND relation_type='collected_because_of' AND meta=$2::jsonb
RETURNING id,meta;
```

Expect exactly one returned row for an intended mutation. Zero rows means stale
metadata, missing edge or wrong type; stop and inspect read-only instead of
assuming success or retrying blindly. Roll back the transaction on any error.
Prior audit fields are maintained by the existing audit trigger; unrelated
metadata/evidence survive reason updates. Never replay successful migration SQL
because its separate ledger recording failed. No automatic re-seeding replaces
intentional edits; WU-1267's reviewed package supplies conflict guards.

## Verification and state

The database-disabled full `verify:agent` baseline passed locally in 133.1 seconds:
259 suites/2,084 tests passed; two suites/six tests skipped; coverage thresholds and
Next production build passed. Local Node 22.18.0 differs from CI pin 22.20.0;
no hosted CI result is claimed. The session log is `/tmp/wu1265-verify.log`.
Mocks cover both directions, many-to-many pairs, multiple reasons, historical
text/extra evidence, deduplication, malformed/conflicting endpoints/reasons and
build-time read suppression. Existing membership/feed checks still pass.

Read-only inspection confirms migration 101's matching ledger/checksum and both
installed function bodies in development and production, with its enabled
preparation trigger and passing current invariants. Live write/concurrency probes
remain unrun. This story adds no schema, seed, write API or production mutation.
No manual SQL execution required; the sequence continues to WU-1266.
