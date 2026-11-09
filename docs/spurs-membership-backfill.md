# San Antonio Spurs membership backfill

Migration [097](../db/migrations/097_add_spurs_player_memberships.sql) adds
21 professional playing-career memberships to San Antonio Spurs clan
`the-monastery`, using existing Homies and their current aliases.

Read-only preflight on November 8, 2026 checked existing development
(`br-crimson-fog-ae22ws22`) and production (`br-withered-snow-aea0yck6`) in
project `rough-bush-94516855`. Both have all 21 exact name/tag pairs, unique
Homie aliases, person/homie source identities and the expected Spurs group/clan
identity. All 21 memberships were absent at preflight.

| Homie                 | Current tag       |
| --------------------- | ----------------- |
| Alvin Robertson       | alvin-robertson   |
| Bryn Forbes           | bryn-forbes       |
| Charlie Ward          | charlie-ward      |
| Chris Paul            | cp3               |
| Dale Ellis            | dale-ellis        |
| David Robinson        | the-admiral       |
| Dennis Rodman         | the-worm          |
| Devin Vassell         | devin             |
| Dominique Wilkins     | dominique-wilkins |
| Dāvis Bertāns         | davis-bertans     |
| George Hill           | blm               |
| Glenn Robinson        | big-dog           |
| Kawhi Leonard         | kwhhyyy           |
| Michael Finley        | fin-dawg          |
| Moses Malone          | moses             |
| Pau Gasol             | pau               |
| Sandro Mamukelashvili | mamu              |
| T.J. Ford             | t-j-ford          |
| Tim Duncan            | timmy             |
| Tracy McGrady         | t-mac             |
| Victor Wembanyama     | wemby             |

The [all-time playing roster](https://en.wikipedia.org/wiki/San_Antonio_Spurs_all-time_roster)
supports the 20 regular-season players above. Tracy McGrady is included for
[six Spurs playoff appearances in 2013](https://www.si.com/nba/2013/08/26/tracy-mcgrady-retire-nba);
he had no Spurs regular-season appearances. These are career relationships,
not current-roster claims. Coaching, draft rights and signings without playing
appearances do not qualify. Only existing named Homies are included; no new
Homies, clans or tags are created, and unrelated memberships remain unchanged.

## Manual handoff

1. Review the entire migration and confirm its SHA-256 below.
2. In the existing development DataGrip connection, run the
   [read-only check](../db/tests/097_spurs_memberships_check.sql). Expect 21 rows,
   all `identities_valid=true`; before application all memberships are absent.
3. James executes the complete migration transaction manually in development.
   On error, run `ROLLBACK` in that session before rerunning the complete file.
4. Rerun the read-only check; require all 21 rows to have `identities_valid`,
   `membership_present` and `evidence_valid` true. Inspect the clan/Homie pages
   through the existing local app; Cipher does not initiate application writes.
5. Only after successful application and postflight, James runs the guarded
   [ledger handoff](../db/operations/097_record_applied.sql).
6. Repeat fresh preflight, reviewed application, postflight and ledger handling
   in existing production only after development validation and required human
   production approval. Do not use apply-all or replay historical migrations.

Migration SHA-256:

```text
95908765f92870c509d8a0428e762dc47101ded5c498c29574bf0115d5dab485
```

The transaction locks the identity tables for stable endpoint checks and the
relationship table while inserting. It resolves numeric IDs at runtime, aborts
if reviewed identities change and uses `ON CONFLICT DO NOTHING` to preserve
existing relationship metadata on reruns. Existing audit triggers remain active.
No schema objects or application behavior change; no schema mirror is needed.

## Installed state and checksum correction

James confirmed executing the edited migration with Moses Malone's current
`moses` alias and the ledger handoff in both databases. Read-only postflight
confirmed all 21 memberships, identity endpoints and evidence metadata in both.
Cipher performed no database writes. Rerun behavior, write-producing integration
tests and post-application UI checks remain unrun.

The original ledger handoff still contained the checksum for the earlier
`moses-malone` seed. Both databases therefore record
`ffcb847d669553a7eecd229d4f79687e08f94c444a68e289676d395b9cbe866e`,
which does not match the executed edited file's hash above. The migration itself
is preserved as James executed it; the ordinary ledger handoff and read-only
check now use the corrected alias/hash.

James manually ran
[097_repair_recorded_checksum.sql](../db/operations/097_repair_recorded_checksum.sql)
in existing development and production and confirmed completion. It verifies all installed
memberships and evidence, accepts only the known old or corrected applied ledger
state, and updates only the stale checksum. Execution timestamps are preserved;
rerunning after correction is a no-op. Do not rerun the membership migration.
Read-only inspection afterward confirmed both applied ledger hashes match the
local migration file, with no error and original execution timestamps preserved.
Cipher performed no database writes.

Local seed consistency, relationship-only scope, ledger checksum, formatting and
documentation checks passed. The complete database-disabled `verify:agent`
baseline passed outside the restricted sandbox in 145.3 seconds, including
workflow validation, preparation, lint, TypeScript, Prisma generation, 248 Jest
suites (2,011 tests) and the Next production build. Two opt-in suites and six tests
were skipped. Coverage passed all thresholds: 88.63% statements, 81.90% branches,
86.79% functions and 90.06% lines. The earlier `--showConfig` failure occurred
only in the restricted sandbox; no application/configuration change was needed.
Local Node was 22.18.0; hosted CI uses the repository's pinned 22.20.0 and remains
required on the final published commit. No deployment was initiated.
