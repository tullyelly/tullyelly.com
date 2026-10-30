# WU-1223 release reconciliation

Historical release: run 41013688230, attempt 1; application
`75b07fdf5d414f24d797dfe1fe5678ae870c9dc0`; deployment
`dpl_BN2SCie2s22hHXnqSVUT8hzYn11t`.

## Preserved evidence

The evidence, preparation/production JSONL reports and approval report are original
extracted bytes. Do not regenerate or format them. Evidence SHA-256 is
`8a098e07f4f22c14348c78a7c9d4556fe0ebbc7f82edee5ea6a66b708a4e7d03`.
All four original archives were downloaded and their SHA-256 verified against
GitHub's artifact metadata on October 30, 2026. Local archive copies and the
executor remain under `.cache/WU-1223/original`; they are not review source.

| Artifact ID              | Original ZIP SHA-256                                               |
| ------------------------ | ------------------------------------------------------------------ |
| 12959200200; preparation | `4423c3d324ec2926f8d5a86c33e94cbb0e74629e654bf213b5989578b3dacfa7` |
| 12958603729; production  | `08a5ab8a3e5418bc86deed6e1eb608b5b03ad854dbecc53cbebcb2db6280d2b4` |
| 12958543663; executor    | `6bfc73973a4f13eb2c48b8b085b776b0ab123a27161a22b67699880b925f5b03` |
| 12958523718; evidence    | `47a43b2f4b7b24f3439d3f5ba9bfbdbb5db7947dc4adb8b99111e7657912f279` |

The original artifacts expire October 31, 2026, around 06:24-06:29 UTC.

## Historical checkpoint

Production report events 13-25 establish creation success (11206 ms), remote
build READY success (100949 ms), staged verification success (7375 ms), promotion
and assignment confirmation success (5489 ms), then public verification failure
(16541 ms). The final diagnostic is `api.request`, transport, `vercel.alias`,
`TimeoutError`. The run remains failed.

At the released source, the public-verification phase's only alias metadata path
is the guard after a confirmed Cloudflare challenge. Its metadata GET timed out
after promotion had already been confirmed. This is a source-path inference in
addition to the phase evidence; the original challenge trace was not retained
when that subsequent guard failed. The network/provider reason for the timeout
is unknown. No public acceptance is inferred from promotion or READY.

## New read-only observations

October 30, 2026, approximately 17:24-17:32 UTC: connected Vercel GETs returned
READY, production target, the exact release SHA and expected project for the
candidate. Separate alias GETs returned both `tullyelly.com` and
`www.tullyelly.com` assigned to that exact deployment and project. Project GET
returned the expected team/project and the same latest production deployment.
The connector's reduced project response did not expose `targets.production`,
and its reduced deployment metadata exposed only `githubCommitSha`; the complete
run/attempt/source/evidence binding therefore remains for the strict verifier.

`verification-receipt.json` is a separate current receipt from the existing
GET-only command. It remains pending because this execution context has no
`VERCEL_RELEASE_READ_TOKEN`. No public probes or provider binding checks ran in
that command. Do not substitute an owner/deployment token or rewrite evidence.

## Owner follow-up

Validation of the focused working-tree changes: `SKIP_DB=true npm run
verify:agent` passed in 112.3 seconds, including lint, TypeScript, Prisma
generation, 247 passing Jest suites / 2,001 passing tests, thresholded coverage
(88.63% statements, 81.90% branches, 86.79% functions, 90.06% lines) and the Next
production build. Two opt-in suites / six tests were skipped. The baseline used
installed Node 22.18.0; trusted CI still uses pinned 22.20.0. Initial local test
mock type errors were corrected before this successful baseline.

The pinned CLI 63.1.2 loopback contract passed with temporary Node 22.20.0,
without changing repository dependencies. Documentation, explicit changed-file
Prettier and whitespace checks passed. These are mocked/local checks; they do
not establish live acceptance. Database-writing integration and recovery checks
remain unrun. No dev server was started. Changes are prepared in the working
tree; no commit, PR, release dispatch or deployment was created.

Use a reviewed checkout with dependencies and an existing approved read-only
metadata credential context, supplying optional Actions read access if needed:

```bash
npm run --silent release:verify-public -- --run 41013688230 --attempt 1 --deployment dpl_BN2SCie2s22hHXnqSVUT8hzYn11t --sha 75b07fdf5d414f24d797dfe1fe5678ae870c9dc0 --evidence releases/records/41013688230-1/release-evidence.json --location OWNER_EXECUTION_LABEL
```

Save a new receipt separately. A nonzero exit leaves public acceptance pending;
resolve its exact diagnostic without rerunning/deploying/promoting automatically.
Review the focused WU-1223 changes through the existing review process. WU-1213
remains open for actual scheduled Cron, Sentry delivery and James-operated
production collection/repeat/import validation. No database operations, settings
changes, collection/import, workflow rerun or deployment mutation were performed.
