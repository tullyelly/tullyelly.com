# Coverage Guard

We now enforce code coverage both locally and in CI so that new changes keep the
suite healthy.

## Local pre-push hook

- Every `git push` runs `npm run test:coverage` via the Husky `pre-push` hook.
- If the run fails to meet the global thresholds (85% lines/statements/functions,
  80% branches) the push is rejected.
- To bypass in emergencies use:

  ```bash
  SKIP_COVERAGE_GUARD=1 git push
  ```

  Use this sparingly and follow up with a fixing PR.

- The hook skips automatically inside CI by checking the `CI` environment.

For a quicker manual check on partial changes, run `npm run test:coverage:changed`
which focuses on files changed relative to `origin/main`.

## CI status check

A dedicated GitHub Actions workflow (`coverage`) runs on every PR and on pushes
to `main`. It executes `npm run test:coverage` and uploads `coverage/lcov.info`
as an artifact. Failures block the PR until coverage is restored.

## Branch protection

Ensure the `coverage` workflow is marked as a required status check on `main`
as part of the branch protection rules. This keeps the server-side gate in lockstep
with the local hook.
