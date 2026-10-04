# Coverage guard

The commands, thresholds, and hook/CI behavior are defined in
[validation](validation.md). Full Jest coverage remains required.

The pre-push hook blocks a push when its coverage run fails. An emergency
SKIP_COVERAGE_GUARD=1 bypass must be used sparingly and followed by a fixing PR;
it does not waive the validation policy. The hook skips in CI runners.

The coverage workflow should be configured as a required main status check.
Verify live branch protection separately; this repository cannot prove that
setting. Workflow failure and merge enforcement are different facts.
