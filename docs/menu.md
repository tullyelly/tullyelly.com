# Menu Gating

The menu tree comes from `dojo.v_menu_published` and is filtered server-side before it reaches any React component. Capability enforcement is applied in `app/_menu/getMenu.ts`; the client never sees gated nodes, so there is no hydration flicker.

## Capabilities

- `app/_auth/capabilities.ts` wraps the raw feature list into a `Capabilities` object with a `has()` helper and the backing `Set`.
- `auth.ts` enriches the NextAuth JWT/session with effective features from `dojo.v_authz_effective_features`; the JWT checks `dojo.authz_get_revision` on every request, so grants/revokes become visible immediately after the DB bump touches the revision.
- `app/_auth/session.ts` reads `session.user.features` (or `session.user.capabilities`) from NextAuth and falls back to an empty set, so the default posture is deny.

## requires

- Every nav item can declare `requires: string[]`. All entries must be truthy strings; blank strings are discarded.
- Items pass only when **every** required capability is present. Use small, specific keys (examples: `menu.cardattack.tcdb.rankings`).
- When legacy data still writes `featureKey`, the filter treats it as a single-item `requires` list. Keep `featureKey` populated so analytics can attribute clicks to features.

## hidden

- Set `hidden: true` to suppress an item regardless of capability ownership.
- Hidden nodes are removed recursively; if a persona or group ends up with no visible children it disappears from the tree, keeping the UI clean.

## Local override

- Set `NEXT_PUBLIC_MENU_SHOW_ALL=1` (or `true`/`yes`) in `.env.local` to bypass filtering during development. Remember to remove it before shipping.

## Testing guidance

- Unit tests cover the capability builder and the filtering walk; add fixture updates when new meta fields are introduced.
- Snapshot tiny persona trees whenever you tweak the filter so we keep regressions obvious.
