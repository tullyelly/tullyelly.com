# WU-1000 verification and handoff

Implementation follows WU-1288 through WU-1299 sequentially on
`epic/WU-1000-frontend-facelift`. The [route matrix](routes.md) accounts for all 74
page entry points. [Progress](progress.md) records each story's checks and retained
behavior. No database migration, new permission, import or deployment is required
by this code change.

## Scope and integration review

- Existing public paths, canonical aliases and persona terminology are retained.
  Identity metadata now uses authored names and canonical identities. Custom Fam
  metadata preserves its authored previews. The metadata scanner recognizes typed
  declarations and named re-exports through the TypeScript parser.
- Shared public URL controls, safe directory returns and page/section hierarchy
  apply to comparable directories. Alias redirects preserve archive context.
  Private edits, session capabilities and mutation state stay outside URLs.
- The unused original identity-card branch was removed after confirming all four
  route consumers use the new directory. Other domain components retain consumers;
  they are not obsolete merely because their styling differs.
- No Chronicle/static MDX, relationship queries, induction calculations, release
  extraction, media URLs, theme palette or global stylesheet was rewritten.
  Existing tests cover aliases, counts, deduplication, multi-sport metrics, zero
  versus unknown values and server authorization.
- Identity reads are deduplicated within the React request cache across metadata,
  profile and artist music rendering. Root navigation retains its existing request
  cache. Clans/Scrolls retain server limits; Clans' sort is allowlisted before SQL
  LIMIT and included in the existing cache key. No new per-row query was added.

## Evidence boundaries

The isolated browser harness uses real shared/route components and synthetic data
at 375px, 768px and 1440px. It serves fixture documents through Playwright request
interception, never starts the app/dev server, loads environment files or seeds a
database. Server-query fixture navigation is explicitly an adapter, not proof of
connected Next/database integration. Editor requests in the separate chart harness
are intercepted, not sent to a database. Anonymous/authorized menu cases use safe
mocks and exercise the real capability filtering code.

Representative before/after images in `evidence/` use identical synthetic rows.
Before images render the three actual component sources from `5dbe09d8`, with the
current shared dependencies and stylesheet; they are component comparisons, not
screenshots of an earlier deployment. After images use this branch. Reproduce the
before set by extracting HomieDirectory, RankingDetailPage and ChronicleListClient
to a temporary mirrored directory, linking its node_modules to this checkout,
then setting `FACELIFT_BASELINE_DIR` for the visual-comparison Playwright cases.
Omit that variable for the current candidate. Both use the same fixtures.

The design/baseline validation took 131.7s; subsequent full story runs ranged from
111.5s to 153.8s on this host. Those timings are build/test observations, not a
production latency benchmark. Existing domain queries and data sizes remain the
performance boundary; this change does not turn server paging into full-table
client loading. Browser fixtures bundle many routes together for tests and are
not representative of production route bundle sizes.

## Release boundary

Code preparation and safe verification do not mean merged or deployed. Jira stays
In Progress pending review, per the repository workflow. The current sprint and
release assignment are recorded on the epic and stories. Database-writing tests,
seeding, real authentication/session creation and live mutation workflows remain
owner-operated and unrun. No SQL was prepared/applied for this epic. Production
release approval is separate from this implementation request.

## Reproducible safe checks

- `SKIP_DB=true NEXT_TELEMETRY_DISABLED=1 npm run verify:agent`: workflows,
  preparation, lint/docs, types, Prisma generation, thresholded Jest and Next build.
- `SKIP_DB=true npm run test:components`: 38 Vitest checks, including menu gates.
- `PLAYWRIGHT_CHROME_PATH=/usr/bin/chromium npx playwright test --config playwright.facelift.config.ts`:
  44 browse/navigation/visual/reflow checks passed, including 320px narrow reflow.
- `PLAYWRIGHT_CHROME_PATH=/usr/bin/chromium npx playwright test --config playwright.charts.config.ts`:
  16 chart/editor fixture checks passed; mutations are intercepted.
- `npm run lint:metadata`, `npm run check:emdash`, `npm run guard:self-fetch`,
  `npm run docs:check`: passed. Formatting is also checked explicitly over the
  working tree, since the repository's base..HEAD selector excludes untracked work.

Screenshots: [profile before](evidence/before-profile-375.png),
[profile after](evidence/after-profile-375.png),
[Homies before](evidence/before-homies-1440.png),
[Homies after](evidence/after-homies-1440.png),
[Chronicles before](evidence/before-chronicles-375.png),
[Chronicles after](evidence/after-chronicles-375.png).

The route reconciliation script found 74 page files and zero unmapped paths.
The final Jira read-back confirmed the epic and all 12 stories in active sprint
run 64, fix version shaolin 2.7.63 (the Thanksgiving release), with James as
assignee/reporter, appropriate components, Medium priority and existing labels.
Stories use the established one-point estimate convention. Start dates reflect
November 28, 2026. No speculative due date or team assignment was invented.

## Final candidate result

The final baseline passed in 112.3s: 274 Jest suites, 2,168 tests, thresholded
coverage and the Next production build. Two pre-existing suites/six tests remain
skipped. Local Node was v24.22.3; CI owns the pinned Node 22.20.0 result.

An additional anonymous local production probe was attempted on loopback port
4317 at 375px and 1440px. Home, Cardattack, Chronicles, tags and the Mark2 release
log returned HTTP 500/error boundaries because this workspace lacks the production
auth secret and DATABASE_URL. Production escape-hatch rules are retained; requesting
SKIP_DB does not turn this into a configured production runtime. No credentials or
database URLs were added, no authentication was initiated and no database write
was performed. The local server was stopped. This attempt does **not** establish
Next hydration or rendered SEO success; those connected-runtime checks remain
pending in the owner's configured environment. The generic error boundary reflowed
without horizontal overflow, but that is not a substitute for successful pages.
