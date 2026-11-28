# Chronicle publishing performance

WU-1117 targets five automated minutes from saved MDX and prepared images to a
publicly verified receipt, including local publication, PR and merged-target
checks, setup and normal runner queues. Human review and approval waiting are
reported separately. Release-specific active operator effort targets one minute.
Approval-to-public is a second clock; it cannot replace the full clock.

## Baseline; WU-1305

The November 27 Thanksgiving publication provides these existing observations:

| Phase                                             | Seconds | Evidence                                                                          |
| ------------------------------------------------- | ------: | --------------------------------------------------------------------------------- |
| PR CI elapsed                                     |     297 | [PR CI](https://github.com/tullyelly/tullyelly.com/actions/runs/45946946603)      |
| Main CI elapsed                                   |     241 | [Main CI](https://github.com/tullyelly/tullyelly.com/actions/runs/45947471491)    |
| Dispatcher job                                    |      97 | [Dispatcher](https://github.com/tullyelly/tullyelly.com/actions/runs/45947945719) |
| Release preparation job                           |     138 | [Release](https://github.com/tullyelly/tullyelly.com/actions/runs/45948107918)    |
| Preparation-end to production-start gap           |     490 | Same release; approval and scheduling combined                                    |
| Production job                                    |     148 | Same release                                                                      |
| Stage, verify, promote and public acceptance step |     103 | Same release; provider build is not isolated                                      |
| Final summary job                                 |      38 | Same release                                                                      |

PR CI creation to release completion was 25 minutes 41 seconds. Main CI creation
to completion of the release was 20 minutes 14 seconds. These spans include gaps
between operations and human waiting; neither is an automated-only measurement.
Local pre-push duration, active human effort, exact approval timestamp and cache
state are unavailable. The full author-ready clock therefore remains unknown.
Do not subtract the entire 490-second gap as proven human time.

The preceding release had 141 seconds of preparation and 212 seconds of production
work ([evidence](https://github.com/tullyelly/tullyelly.com/actions/runs/45752240946)).
This variation is a reason to retain cold/slow results alongside the median.

## Initial budget and priorities

| Automated phase                                 | Working budget, seconds |
| ----------------------------------------------- | ----------------------: |
| Local focused preparation/publication           |                      20 |
| PR and exact merged-target content checks       |                      50 |
| Dispatch and evidence preparation               |                      40 |
| Production staging/build/promotion/verification |                     160 |
| Queue allowance and receipt                     |                      30 |
| Total                                           |                     300 |

These are engineering budgets, not measured achievable guarantees. Start with
repeated validation across pre-push, PR and main; then installation overhead.
The dispatcher spent 72 seconds installing dependencies and preparation spent
83 seconds installing tools/dependencies. The existing release already performs
one native production build. Probe concurrency is a secondary improvement.

## Recording the pilot

For each authorized release retain exact source/run/deployment links, author-ready
and public-receipt timestamps, local publication duration, PR/main check spans,
dispatch/preparation spans, actual approval waiting, queue time, upload/build
duration when available, staged probes, promotion, public probes and summary.
Use existing stage reports/log timings; unavailable values stay unknown. Cache
state must be observed or marked unknown. Never infer build duration from the
combined provider-operation step. Do not dispatch releases for benchmarking.

Report total elapsed, automated elapsed, human waiting and active operator effort
separately. If human waiting cannot be isolated, automated elapsed is unknown;
report the observed spans instead. Five pilot releases establish an initial
median and slowest observation, not a reliable tail percentile. Current required
validation and production approval apply until reviewed changes implement the
focused profile. This baseline changes no release policy.

## Release setup implementation; WU-1309

Dispatcher and preparation install the pinned tools/release lock instead of the
application graph. The fresh Actions checkout links that ignored dependency tree
for source bundling; existing local node_modules are preserved. App/private and
provider credentials are refused by installation and appear only in later scoped
steps. npm download caches remain keyed by the tooling lock; cache misses use
the same exact locked installation. The pinned provider CLI remains separately
installed and checked. The summary checks out only its dependency-free renderer
and helpers, omitting media.

An isolated /tmp fixture installed 297 packages in 13 seconds and successfully
bundled dispatcher, preparation and production executors without application
dependencies. This is a fresh dependency directory with the existing local npm
download cache; it is not a hosted before/after measurement or a proven cold
network result. The historical hosted dispatcher installation was 72 seconds
and release installation 83 seconds. Hosted cache-hit/miss and phase results
remain part of WU-1312's next authorized production test.

## Verification implementation; WU-1310

Independent page and image reads use at most four workers per batch. Active
readers settle before a failure is surfaced, and errors retain the original
probe ordering. Each application verification owns a two-minute abort deadline
in addition to existing request timeouts. Duplicate Chronicle/image GETs reuse
response bytes only inside that pass, with a 16 MiB retention budget; owner and
authorization responses are never cached. Staged/public passes remain separate.
All existing content, hash, redirect and authorization assertions remain.

A local synthetic batch of twelve 20 ms reads took 254 ms serially and 63 ms with
four workers. This demonstrates scheduling only; hosted staged/public network
timings remain unmeasured until the authorized pilot. The pinned CLI 63.1.2
loopback contract passed under Node 22.20.0 without a provider deployment.

## Production pilot preparation; WU-1312

The complete focused command passed against an isolated checkout of the real
Thanksgiving source commit 3361dde44d84ea55a46f05e23a93fda616c0875b, comparing
6b9dbe88b2d0cf5e80ec4c6b7ae8d784645d0938. It inspected all 2,380 image records
without a dimension cache, reproduced the manifest, compiled the changed post,
checked its two image assets and passed eight suites / 56 tests. Preparation
took 10.6 seconds and Jest 2.687 seconds locally. Dependencies were already
installed; these numbers exclude CI setup, review, queues and native deployment.

Read-only inspection on November 27, 2026 found the active main ruleset requiring
`Lint, test, build` from GitHub Actions (15368), strict up-to-date checks, one
approval, stale/last-push and code-owner review. That observed ruleset needs no
status rename for the profile gate. Classic protection was not independently
verified and no setting was changed.

The new read-only status command successfully read the original release receipt
for run 45948107918, attempt 1, application
ff4c7e920aaa69502a4cd542a28b8ac95c629a07 and deployment
dpl_7W8Rv76kJQxUka1k2PgbANeQGV9S. The original record says public verification
pending; workflow success is not public proof. No suitable local read-only
Vercel metadata credential was available to run the standalone completion
verifier. Preserve this record for resolution or an explicit supersession
decision during release coordination.

The first implementation release exercises the application profile, smaller
setup, concurrent verification and receipts through the existing protected gate.
WU-1312 and the epic stay open for actual production acceptance and timing.
WU-1313 remains conditional; local results do not justify a new content platform
or establish the five-minute hosted objective. No production attempt was run as
part of preparation.
