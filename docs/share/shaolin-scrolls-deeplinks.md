# Shaolin Scrolls deep-linking notes (WU-616 Story 1)

Approach implemented:

- Detection: `ScrollsPageClient` reads `usePathname()` and normalizes the path; when it starts with `/mark2/shaolin-scrolls` and the last segment is numeric, it calls `openWithId(id)` to show `ScrollDialog`.
- Guardrails: non-numeric or extra segments skip opening and replace the URL with the base list to avoid runtime errors.
- Close behavior: `ScrollDialog` closes via `onOpenChange(false)` and calls `router.replace("/mark2/shaolin-scrolls")`; focus returns to the triggering link when available.
- Navigation: table and card links push `/mark2/shaolin-scrolls/:id` on primary clicks, letting the route-based effect open the modal; meta/ctrl/middle clicks still use normal navigation.
- The `/mark2/shaolin-scrolls/[id]` route now renders the list page so deep links load the list plus modal instead of a standalone detail page.

SEO and sitemap:

- `app/sitemap.ts` now enumerates all scroll IDs (paged in batches) and adds `/mark2/shaolin-scrolls/:id` entries with `lastModified` from `release_date` when present; failures fall back to base URLs.
- Existing detail metadata uses `makeDetailGenerateMetadata` to emit canonical URLs and OpenGraph/Twitter data for each release path; no query params are used.

Open questions resolved:

- `useParams` was not used; pathname parsing keeps the logic centralized and resilient to list pagination/query params.
- No query parameters are added; routing relies solely on the path for modal state.
