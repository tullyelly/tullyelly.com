# Two-file migration handoff template

Issue, shared branch and reviewed revision: TBD.
Status: prepared; not applied. Actual read-only application/history observations: TBD.

Run the complete files in this order in existing development, then approved production:

1. `db/migrations/NNN_name.sql` (migration and necessary checks in one transaction).
2. `db/operations/NNN_record_applied.sql` (effect checks and canonical ledger record).

Stop on either failure. Roll back a failed migration and do not run the ledger.
If the migration succeeds but recording fails, repair the ledger problem without
replaying the migration automatically. Investigate uncertain commits read-only.

Canonical filename/SHA-256: TBD. Ledger SHA-256/manifest: TBD.
Safe automated validation and unrun engineering tests: TBD.
Running-application compatibility and release evidence owned by Cipher: TBD.
Actual blockers: TBD, or none. No extra manual diagnostic checklist.
