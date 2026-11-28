# Publish a Chronicle

1. Review and merge the saved Chronicle/images through the usual PR. CI selects
   the profile automatically and validates the exact merged revision.
2. Run `npm run chronicle:publish -- <full-merged-SHA>`. Open the printed Actions
   link and approve the existing **production-release** gate.
3. Read the receipt. A verified result includes the exact SHA/deployment and
   publication links. The command can remain running while you approve.

Use `npm run chronicle:status -- <full-SHA>` to reconnect without starting another
deployment. The existing GitHub App dispatcher UI remains supported. Production
execution and credentials stay in GitHub Actions; this command is optional local
coordination using the existing App installation configuration.

## What the profiles mean

Content: supported published MDX, associated images, reproducible manifest and
the exact daily Jira metadata record. Content is prepared once, compiled and
checked alongside relevant renderer/inference/feed tests. Unrelated application
coverage, typechecking and CI builds are omitted. Editorial/presentation defects
remain an accepted risk; make a small forward correction through the same path.

Application: code, dependencies, workflows, settings, unknown MDX behavior,
removals/renames/unpublishing or an unverified production baseline. It retains
the full validation path. There is no force-fast flag. Both profiles still get
one native production build, staged checks, exact-ID promotion and public checks.
The WU-1117 implementation release itself uses the application profile.

## Only stop for an actual exception

- **Needs merge/checking:** finish the existing review/checks. The command never
  merges or approves on your behalf.
- **Failed:** follow the linked run's concrete failure. Fix and review the source;
  do not repeatedly dispatch the same failed operation.
- **Dispatch unconfirmed:** a request may have reached GitHub. Inspect Actions and
  reconcile that exact SHA before any separately authorized retry. A durable local
  intent prevents a repeat request even after a lost connection.
- **Public verification pending:** promotion succeeded but public acceptance has
  not been established. Use the existing
  [public verification procedure](production-releases.md#portable-completion-of-public-verification).
- **Receipt unavailable:** inspect the linked run. Missing/expired artifacts never
  become a verified result. Retain the non-secret receipt with the release record.

One release coordinator owns dispatch. The command holds a repository lock while
watching; after a crash, inspect its owner/run before clearing a stale lock. Keep
main stable until completion. Existing pending verification records and baseline
drift checks still apply. No automatic rollback, SQL, provider configuration or
credential change belongs to this publication operation.

The [performance record](chronicle-publishing-performance.md) defines the clocks
and known limitations. WU-1312 owns the first authorized production test and live
timing evidence; local/fixture passes do not establish production success.
