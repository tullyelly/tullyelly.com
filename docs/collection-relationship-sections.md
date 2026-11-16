# Collection relationship sections; WU-1266

Existing Fam/person pages show **Collections inspired by [person]** separately
from their Chronicle feed. Existing collection subject pages show **Why I collect
this**, linking to the people behind James's collection reasons. Explanations are
recorded historical text, not present preference or ownership assertions.

The shared `CollectionRelationships` server boundary uses Suspense for loading.
Its pure view reuses Card and TagLink, including canonical routes and source/
destination disabling from the public metadata snapshot. It shows direct reasons
only, and an optional Alternate names section without another identity/card count.
No editor, new route, palette, persona rename or broad parity work is introduced.

Surfaces:

- Shared `IdentityDetailPage`: incoming inspired collections for Fam people;
  outgoing collection reasons for other existing identity contexts.
- CardAttack homie and clan detail pages: outgoing collection reasons alongside
  existing ranking/history and membership sections.
- Existing custom Bonnibel and Jeff Meff Fam pages: incoming inspired collections,
  using the same component and their unchanged feed behavior.

`loadCollectionRelationshipData` consumes WU-1265's direct typed helpers. Only
incoming inspired-collection rows request counts, using existing homie rankings
or clan rankings according to the subject's recorded CardAttack role. Each count
retains its own snapshot date; clan sports remain separate. Missing/unsupported
counts show **Card count unavailable**, never an invented zero. Existing real
zero-count snapshots can display zero. No source counts are added across athletes,
teams or people, and no unique-card total is claimed.

Count reads run concurrently and deduplicate within a request. A count outage
preserves valid reasons with a missing-count label. Invalid/unavailable motivation
metadata yields **Collection relationships are unavailable right now** and a
server diagnostic, distinct from a successful empty result. Alternate-name read
failure is diagnosed and omitted without inventing a name. Empty sections explain
that no reasons/inspired collections are recorded. Production builds skip all new
relationship/count reads. Existing request-scoped alias freshness and 300-second
Homies directory caching remain documented in [alias resolution](tag-alias-resolution.md).

Membership sections and their Chronicle inheritance are unchanged. A Fam feed
receives its own alias-equivalent tags and existing true membership ancestors;
it never receives motivated athletes' tags. `cal/eldrid` and
`the-lazer/lazer-face` remain separate. Page/query integration mocks verify that
Lulu, cal and the-lazer retain their own/group feed beside the new section.

## Validation and state

No manual SQL execution required for this UI story. It uses the installed
100/101 contract; real seeds and per-usage data review belong to WU-1267. Mocked
unit/page checks cover direction, dated individual counts, several sport contexts,
no summed total, unsupported/missing/outage counts, malformed relations,
build-time suppression, disabled links, alternate labels and family feed separation.
The app dev server was not started; no live session/database writes are used for
visual evidence. Live seeded page behavior and production deployment remain
separate from these safe checks.

The final database-disabled `verify:agent` baseline passed locally in 116.2 seconds:
262 suites/2,098 tests passed, two suites/six tests skipped, unchanged coverage
thresholds and Next production build passed. An initial DOM test failed because it
tried to render the async RSC child as a client component; the existing parent test
now isolates that boundary, with separate real data/view and feed integration
coverage. Final focused integration passed three suites/14 tests. Local Node is
22.18.0 versus CI pin 22.20.0; no hosted CI result is claimed. Session baseline log:
`/tmp/wu1266-verify.log`.

Offline Chromium rendered the actual pure view and Card/TagLink with mock public
data, compiled site CSS and an anchor substitute for Next Link. At 390px and
1280px there was no horizontal overflow, Tab focused the canonical LeBron link,
and a disabled alternate name remained non-navigable text. Mock screenshots were
inspected at `/tmp/wu1266-390.png` and `/tmp/wu1266-1280.png`; they show individual
sport/date counts and an unavailable section. All network requests were blocked;
no server, app session or database was used. This is component layout/keyboard
visual evidence, not live Next routing, streaming/hydration or seeded production
verification. No merge or deployment occurred.
