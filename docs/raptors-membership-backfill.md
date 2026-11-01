# Raptors membership backfill; WU-1226

Migration [089](../db/migrations/089_add_raptors_player_memberships.sql) adds
professional playing-career memberships from existing Homie tags to the
Toronto Raptors clan, `raptors`. This is historical affiliation, not current-roster status.

Read-only inspection on October 31, 2026 confirmed the clan/tag and all 16 named
Homie/tag endpoints in existing development and production. None of the 16
relationships existed in either database. No database writes were performed.

The [official 2025-26 Raptors media guide](https://www.dropbox.com/scl/fi/f5eeunlh1qsc6u6gx84pj/Toronto-Raptors-2025-26-Media-Guide-PR-website-friendly.pdf?dl=0&rlkey=2tw8gfyjkcg9rue5aitqajnen),
linked from the [Raptors media hub](https://pr.raptors.com/), supplies former-player
statistics and Scottie Barnes's player profile. The reviewed mappings are:

| Homie            | Tag               |
| ---------------- | ----------------- |
| Alvin Robertson  | `alvin-robertson` |
| Chris Bosh       | `chris-bosh`      |
| D.J. Wilson      | `dj`              |
| Dell Curry       | `dell`            |
| Hakeem Olajuwon  | `the-dream`       |
| Jalen Rose       | `jalen-rose`      |
| Jordan Nwora     | `nwora`           |
| Kawhi Leonard    | `kwhhyyy`         |
| Lindsey Hunter   | `lindsey`         |
| P.J. Tucker      | `pops-junior`     |
| Scottie Barnes   | `barnes`          |
| Shawn Respert    | `shawn-respert`   |
| T.J. Ford        | `t-j-ford`        |
| Terence Davis II | `terence`         |
| Tracy McGrady    | `t-mac`           |
| Vince Carter     | `vince-carter`    |

Alonzo Mourning is excluded because he did not play for Toronto. Blue Edwards
played for Vancouver, not Toronto. No inferred roster, coaching or trade-only
affiliations are included.

The transaction resolves IDs from stable slugs, checks exact Homie names/tag
assignments, requires the existing canonical clan tag and inserts only missing
`member_of` relationships. Existing tags, relationships and their metadata are
preserved. Tags need no repair in the inspected databases; a missing endpoint
aborts the transaction for review rather than inventing an identity.

James reviews and executes the complete SQL in existing development through
DataGrip first. After development validation and fresh production preflight,
production requires the established human approval. Review ledger reconciliation
separately; do not use apply-all. Database-writing integration checks remain
unrun. The [postflight assertions](../db/tests/089_raptors_memberships_test.sql)
are read-only; they passed in both existing databases after James reported successful manual execution on October 31, 2026.

Local validation: migration static checks, Prettier, documentation checks, ESLint
and TypeScript passed. `SKIP_DB=true npm run verify:agent` stopped during Jest
configuration with `Could not parse output from TypeScript's --showConfig`.
Jest coverage and the Next production build remain incomplete. No migration or
database-writing fixture was executed.

## Applied execution and ledger reconciliation

James reports migration 089 ran successfully in development and production.
Cipher subsequently ran the complete assertion block from the read-only postflight
file against both existing Neon branches; both passed. The original migration is
unchanged, with SHA-256
`9c0456a0a3617320dd0ae583ebe8fadaa3ccd81aa01efc446d775285af99bdce`.

Both databases currently lack its `dojo.schema_migration` row. Documentation and
release compatibility evidence do not change the live ledger: a ledger check will
still report 089 as pending until James reconciles it. Review and run
[089_record_applied.sql](../db/operations/089_record_applied.sql) in existing
DataGrip development first, then production under the established approval
procedure. This file rechecks all memberships, rejects conflicting ledger history
and inserts only the exact 089 applied record. It does not replay the migration
or change unrelated ledger entries. Timestamps represent reconciliation time;
original execution time and duration were not supplied. Cipher has not run it.

Read-only ledger postflight after James runs the handoff:

```sql
SELECT filename, checksum, checksum_algorithm, status, applied_at
FROM dojo.schema_migration
WHERE filename = '089_add_raptors_player_memberships.sql';
```

Expect the exact hash above, algorithm `sha256`, status `applied` and a non-null
`applied_at`. Other historical ledger gaps and the local Jest configuration
failure are independent; no full database-suite pass is claimed.
