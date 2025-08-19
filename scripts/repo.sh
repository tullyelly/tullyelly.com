# create workflows folder under .github
mkdir -p .github/workflows

# add CI workflow
cat > .github/workflows/ci.yml <<'YAML'
name: CI
on:
  pull_request: { branches: [ "main" ] }
  push:        { branches: [ "main" ] }

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

# commit on a new branch
git checkout -b ci/add-workflow
git add .github/workflows/ci.yml
git commit -m "ci(WU-186): add lint/typecheck/build workflow"
git push -u origin ci/add-workflow
