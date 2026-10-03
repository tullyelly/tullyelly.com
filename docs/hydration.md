# Hydration and deterministic dates

Server-rendered markup must match the first client render. Fetch domain data
through server helpers, pass serializable snapshots, and preserve the consumer's
initial-data contract. Do not add mount-time refetches that overwrite that snapshot.
Convert Date values to ISO strings when the interface requires JSON timestamps;
not every server component must return a plain JSON object.

Import parseDateish, fmtDate, fmtDateTime, and fmtTime from `@/lib/datetime`.
All new DATE handling flows through parseDateish; avoid constructing dates from
raw YYYY-MM-DD strings. The parser anchors date-only values at noon UTC so
America/Chicago displays the same calendar day. Formatters use en-US with an
explicit timezone (default America/Chicago). fmtRelative exists but uses Date.now;
it is not stable across SSR/client renders. Compute and pass a fixed label when
initial relative text must match.

Use stable keys and explicit sort comparators. Avoid current time, randomness,
locale-dependent formatting, and browser-presence branches in render paths.
Move browser-only work to effects or dedicated client components; put ssr:false
dynamic imports in an appropriate client boundary.
[eslint.config.mjs](../eslint.config.mjs) defines actual selectors and exceptions;
it is more precise than claiming all Date constructions are universally banned.

Do not fetch the app's own API from server rendering; call its underlying server
helper. See [self-fetch guard](../scripts/assert-no-self-fetch.ts).
Preserve route-specific nodejs/dynamic/noStore policies rather than declaring all
DB pages identical. [Caching](caching.md) explains freshness separately.

Evidence: [datetime helper](../lib/datetime.ts),
[date tests](../__tests__/lib.datetime.test.ts),
[Scrolls reads](../lib/scrolls.ts), and
[browser console fixture](../e2e/fixtures.ts).
[Validation](validation.md) owns browser test prerequisites; Playwright is a
separate check, not part of baseline CI.
