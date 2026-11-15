# Manual migration handoff template

Copy into the task's owning document and replace every placeholder. This template
is not an instruction to execute any SQL now.

Issue / epic / shared branch: TBD. Reviewed revision: TBD.
Canonical filename and SHA-256: TBD. Operation path and SHA-256: TBD.
Assertions path and SHA-256: TBD. Regeneration/check command: TBD.
Database observations: development TBD; production TBD; captured time and target
identity, prerequisites, effect and exact ledger state TBD.
Status: repository prepared TBD; SQL applied TBD; postflight verified TBD;
release compatibility prepared/verified TBD; production deployment TBD.

| Order | Environment                               | Exact file or command                                   | Purpose                                       | Expected result | Stop if                                |
| ----- | ----------------------------------------- | ------------------------------------------------------- | --------------------------------------------- | --------------- | -------------------------------------- |
| 1     | Existing development, read-only           | TBD exact preflight                                     | Identify target/prerequisites/history         | TBD             | Any mismatch/ambiguity                 |
| 2     | Existing development, James writes        | TBD atomic operation                                    | Effects, assertions and ledger in one commit  | TBD             | Any error or uncertain acknowledgement |
| 3     | Existing development, read-only           | TBD postflight                                          | Verify effects, preservation and exact ledger | TBD             | Any failed check                       |
| 4     | Existing development, James writes/checks | TBD human tests/app checks                              | Validate behavior                             | TBD             | Any failed behavior                    |
| 5     | Production prerequisite                   | TBD reviewed SQL approval and fresh read-only preflight | Confirm dev evidence and current target       | TBD             | Missing approval or drift              |
| 6     | Existing production, James writes         | TBD atomic operation                                    | Apply reviewed effects and ledger             | TBD             | Any error/uncertain commit             |
| 7     | Existing production, read-only            | TBD postflight                                          | Verify preservation and exact ledger          | TBD             | Any mismatch                           |

Normal path ledger: `dojo.schema_migration`, updated by TBD atomic operation;
no separate ledger SQL required when included. Review-only canonical file: TBD;
do not execute separately. Conditional initialization/reconciliation: TBD exact
file and prerequisite, or explicitly none. Never run conditional files routinely.

Deployment timing / compatibility with the currently running app: TBD.
Verified live application baseline / complete guarded diff and record: TBD.
Evidence prepared now: TBD. Must refresh after execution and at release: TBD.
Actual backup coverage, unrun recovery checks and accepted limitations: TBD.
Passed checks: TBD. Failed checks: TBD. Unrun database-writing checks: TBD.
James must complete before deployment: TBD. Cipher's read-only follow-up: TBD.
Immediate next action: TBD. If no manual SQL is needed, state it explicitly.
