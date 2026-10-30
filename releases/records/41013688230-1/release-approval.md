## Native source production release

Revision: 75b07fdf5d414f24d797dfe1fe5678ae870c9dc0
Target revision: 75b07fdf5d414f24d797dfe1fe5678ae870c9dc0
Operation: deploy
Evidence SHA-256: 8a098e07f4f22c14348c78a7c9d4556fe0ebbc7f82edee5ea6a66b708a4e7d03
Source SHA-256: 1a3dea064852a66b2137a95ffd17625d9a7c5e0ecae19fdbdbdddc9362992ce3
Workflow revision: 75b07fdf5d414f24d797dfe1fe5678ae870c9dc0
Workflow run: 41013688230
Workflow attempt: 1
Reused exact-revision CI run: 41013123817
Canonical application build: Vercel native source build after human approval.
Build settings SHA-256: 49230b4fcf0fe3bde7c4236cf32f6219c726257f7531aef63638f5e140627c92
Previous deployment: dpl_5kXM8TLD21DfraQPSPohSZVH7RHb
Deployment identity: unavailable
Preparation: success; protected operation: pending

Compatibility risks: analytics-activation, analytics-maintenance, database-query-contract, database-schema, runtime-configuration; review compatibility at the human production gate.
Application-only schema deferral: reviewed in releases/deferred-schema.json; SQL is not applied and migration approval remains separate.
Schema deferral SHA-256: 0fe953e0c3684eb8a79177bed117bd395d5c1eecab568e9828279d1b53e9042f
Analytics intended collection: on.
Analytics intent SHA-256: 778cd070a1fa385d23bbb51e4e654c48daf16b8b3d1c7cfd966082dbe15bb559
Manual DataGrip readiness: development WU-1212; production WU-1213; database target SHA-256 911585abc1a11bc8b40cd57e28b5a1391e6262345f11a15db7d5a83a499b01c9.
Runtime collection intent applies to the staged production deployment too; promotion does not change its immutable environment. Metadata alone is not verification. Read-only runtime/catalog checks must match before promotion; no SQL or collect/import action is executed.
Changed source paths: 71
- AGENTS.md
- __tests__/analytics-admin.test.tsx
- __tests__/analytics-archive.test.ts
- __tests__/analytics-authorization.test.ts
- __tests__/analytics-cron.test.ts
- __tests__/analytics-monitoring.test.ts
- __tests__/analytics-readiness.test.ts
- __tests__/analytics-report-ui.test.tsx
- __tests__/analytics-report.test.ts
- __tests__/analytics-traffic-chart.test.tsx
- __tests__/jest-git-environment.test.ts
- __tests__/release/analytics-intent.test.ts
- __tests__/release/code-cli.test.ts
- __tests__/release/native-code-release.test.ts
- __tests__/release/native-evidence.test.ts
- __tests__/release/public-verification.test.ts
- __tests__/release/release-summary.test.ts
- app/api/cron/analytics/route.ts
- app/api/health/analytics/route.ts
- app/mark2/admin/analytics/Report.tsx
- app/mark2/admin/analytics/page.tsx
- components/analytics/TrafficChart.tsx
- content/chronicles/vercel.mdx
- db/diagnostics/analytics-schema.sql
- db/diagnostics/analytics-validation.sql
- db/migrations/088_enforce_homie_tcdb_snapshot_difference_sign.sql
- db/operations/analytics/00_read_only_preflight.sql
- db/operations/analytics/01_initialize_ledger.sql
- db/operations/analytics/076_apply_with_ledger.sql
- db/operations/analytics/077_apply_with_ledger.sql
- db/operations/analytics/90_read_only_postflight.sql
- db/operations/analytics/SHA256SUMS
- db/schema/tables/homie_tcdb_snapshot.sql
- docs/README.md
- docs/analytics-migration-handoff.md
- docs/analytics-monitoring.md
- docs/analytics-neon-setup.md
- docs/analytics-production-handoff.md
- docs/analytics-rollout.md
- docs/analytics-validation.md
- docs/archive/analytics-october-recovery.md
- docs/archive/analytics-october-setup.md
- docs/caching.md
- docs/migrations.md
- docs/production-releases.md
- docs/schema-compatibility-review.md
- docs/validation.md
- jest.config.cjs
- lib/analytics-archive/collector.ts
- lib/analytics-archive/monitoring.ts
- lib/analytics-archive/readiness-contract.ts
- lib/analytics-archive/readiness.ts
- lib/analytics-archive/report.ts
- lib/images/optimus-images-manifest.json
- public/images/optimus/vercel/fern.webp
- public/images/optimus/vercel/freak.webp
- public/images/optimus/vercel/gully.webp
- releases/analytics-state.json
- releases/deferred-schema.json
- scripts/production-release.ts
- scripts/release/analytics-intent.ts
- scripts/release/application-health.ts
- scripts/release/check-cli.mjs
- scripts/release/code-cli.ts
- scripts/release/code-invariants.mjs
- scripts/release/code-release.ts
- scripts/release/code-report.ts
- scripts/release/native-evidence.ts
- scripts/release/prepare-evidence.ts
- scripts/release/public-verification.ts
- scripts/release/release-summary.mjs

| Stage | Duration | Result |
| --- | ---: | --- |
| Installing source dependencies | 63.3 s | success |
| Installing release CLI | 10.8 s | success |
| Checking pinned CLI contract | 11.1 s | success |
| Bundling release executor | 0.8 s | success |
| Generating automatic release evidence | 11.6 s | success |

Protected credential: not observed.

| Provider phase | Duration | Result |
| --- | ---: | --- |
| CLI invocation/upload (opaque provider call) | unavailable | not reached |
| Deployment creation (API candidate observed) | unavailable | not reached |
| Remote build (READY required) | unavailable | not reached |
| Staged verification | unavailable | not reached |
| Exact-deployment promotion | unavailable | not reached |
| Public verification | unavailable | not reached |

Phase durations can overlap; the CLI does not expose a separate upload/request boundary.

Failure context:
- Awaiting human approval; no protected operation has run.

Only the checksum-bound analytics intent is approved through the existing human gate. No migration, manual collection/import, automatic retry, rollback, database restore or credential recovery is authorized.
