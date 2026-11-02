# Menu Gating

The menu tree comes from `dojo.v_menu_published` and is filtered server-side before it reaches any React component. Capability enforcement is applied in `lib/menu/getMenu.ts`; the client never sees gated nodes, so there is no hydration flicker.

## Capabilities

- `app/_auth/capabilities.ts` wraps the raw feature list into a `Capabilities` object with a `has()` helper and the backing `Set`.
- `auth.ts` enriches the NextAuth JWT/session with effective features from `dojo.v_authz_effective_features`; the JWT checks `dojo.authz_get_revision` on every request, so grants/revokes become visible immediately after the DB bump touches the revision.
- `app/_auth/session.ts` reads `session.user.features` (or `session.user.capabilities`) from NextAuth and falls back to an empty set, so the default posture is deny.

## requires

Database filtering and NavItem serialization share `resolveMenuRequirements`.
A nonempty normalized `meta.requires` array overrides `feature_key` for visibility;
string entries are trimmed and blank/non-string entries discarded. Every resolved
requirement must pass the existing feature gate. Missing, malformed or empty
normalized requirements fall back to the trimmed feature key. With neither source,
the row is ungated. Explicit requirements do not remove the feature key used for
analytics attribution. Synchronous errors and rejected checks deny access, with
per-feature decisions cached within each filtering operation.

Public browse rows have NULL feature keys and no requirements. Admin retains
`menu.mark2.admin` for attribution, while migration 095 supplies both
`admin.app.view` and `admin.membership.manage` as explicit visibility requirements.
This does not grant permissions or replace server enforcement.

## hidden

- Set `hidden: true` to suppress an item regardless of capability ownership.
- Hidden nodes are removed recursively; if a persona or group ends up with no visible children it disappears from the tree, keeping the UI clean.

## Local override

- Set `NEXT_PUBLIC_MENU_SHOW_ALL=1` (or `true`/`yes`) in `.env.local` to bypass filtering during development. Production runtime ignores this flag.

## Testing guidance

- Unit tests cover the capability builder and the filtering walk; add fixture updates when new meta fields are introduced.
- Snapshot tiny persona trees whenever you tweak the filter so we keep regressions obvious.

## Category counts

Migration 084 adds `menu.cardattack.categories` beneath the existing Cardattack
parent at `/cardattack/categories`, mirroring Clans menu grants. Fallback navigation
uses the same destination; desktop, drawer, command menu and breadcrumbs consume
the shared menu data. Manual SQL changes follow the existing five-minute menu
cache/revalidation behavior. See [category setup](card-category-counts.md).

## Public menu coverage

Migration 094 adds Chronicle tags, five persona release logs, Cardattack Local
Card Shops/USPS, Uncle Jimmy volleyball and four review directories, plus Traffic
statistics and Flowers beneath their existing persona roots. It removes only the
menu gates on eight public browse links: Cardattack Homies/Clans/Categories,
The Abbott Crates/Homies/Clans and Uncle Jimmy Fam/Squads. Server mutation
permissions and `/mark2/admin` remain unchanged.

The [reviewed SQL and DataGrip handoff](public-menu-coverage.md) owns exact routes,
orders, hashes, preservation checks and development-first execution. It retains
custom labels and the curated `/unclejimmy/squad` page separately from Squads.
Dedicated account/search/home controls, detail URLs, diagnostics, redirect aliases
and stale fallback destinations are intentionally excluded. Menu caches keep
their existing 300-second revalidation behavior; applying SQL is not an immediate
refresh of every rendered menu.

## Mobile and protected discovery

The mobile drawer preserves quick Shaolin landing access beneath Home and exposes
allowed non-landing Shaolin children in its ordinary persona accordion, including
Chronicle tags. Both controls use distinct IDs; the accordion omits the landing
link already provided above. Future allowed children flow from the shared menu.

Analytics administration lives in the request-scoped Admin layout, behind
`admin.app.view`, owner session identity and strict `admin.analytics.manage`.
There is no global Analytics menu row or shared cached owner decision. The Admin
landing retains its additional membership-management boundary.

The [095 handoff](admin-menu-discovery.md) owns application-before-metadata order,
exact SQL/hashes, development-first validation, fresh production preflight and
manual ledger handling. Fallback data matches the public inventory and removes
stale internal aliases; runtime database navigation remains authoritative. Account,
home and search controls, diagnostics, redirects and entity details stay outside
persona-menu coverage.

## Lowercase menu labels

Migration 096 lowercases published, non-hidden database menu labels, including
capability-gated destinations. It preserves custom wording, routes, ordering,
requirements and all unrelated fields; suppressed content stays unchanged.
See the [096 DataGrip and ledger handoff](lowercase-menu-labels.md) for exact
files/hashes, preservation checks and development-first manual execution.
Future authored database menu labels should be lowercase. Applied migration
files remain immutable; 096 supersedes earlier title-case label expectations.
