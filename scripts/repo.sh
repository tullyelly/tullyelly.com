# edit .github/workflows/ci.yml to this:
cat > .github/workflows/ci.yml <<'YAML'
name: CI

on:
  push:
    branches: ['**']
  pull_request:
  workflow_dispatch:

jobs:
  build-and-check:
    runs-on: ubuntu-latest
    env:
      CI: true
      NEXT_TELEMETRY_DISABLED: 1
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - name: Install deps
        run: npm ci
      - name: Lint
        run: npm run lint --if-present
      - name: Typecheck
        run: npm run typecheck --if-present
      - name: Build
        run: npm run build --if-present
YAML

git add .github/workflows/ci.yml
git commit -m "ci: WU-186 broaden triggers (push on all branches, PRs, manual)"
git push -u origin "$(git branch --show-current)"