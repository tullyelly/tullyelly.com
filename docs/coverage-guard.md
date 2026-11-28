# Coverage guard

[Validation](validation.md) defines commands, thresholds and the reviewed content
profile. Application/engineering changes require full thresholded Jest coverage.
Eligible Chronicle-only changes run focused compilation, inference, asset and
renderer checks instead; they never claim full application coverage.

The required `Lint, test, build` profile gate runs real validation on every target.
Its companion check is `coverage` after full application validation, or `Chronicle
content checks` after focused validation. Both depend on successful guardrails;
a skipped/failed/cancelled prerequisite cannot pass. lcov exists only for the
application profile. Require the profile gate rather than an unconditional
coverage context that would block eligible content. Preserve existing review,
strict/up-to-date and workflow ownership protections through any owner-reviewed
settings transition. Repository code does not change GitHub settings.

Pre-push uses the same profile selector and blocks failed content checks. The
application fallback retains lint/typecheck/smoke/coverage. The existing emergency
SKIP_COVERAGE_GUARD=1 bypass never waives required validation. Hooks skip in CI.
See [rollout](validation.md#chronicle-content-profile-wu-1117) for the contract.
