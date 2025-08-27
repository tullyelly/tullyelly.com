# scripts/should-build.sh
#!/usr/bin/env bash
set -eo pipefail

# Handle Vercel env vs local runners
BASE="${VERCEL_GIT_PREVIOUS_SHA:-HEAD~1}"
HEAD="${VERCEL_GIT_COMMIT_SHA:-HEAD}"

# If git history is shallow on Vercel, fall back safely
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Not a git repo; force build."
  exit 1
fi

CHANGED="$(git diff --name-only "$BASE" "$HEAD" || true)"

# Trigger a build ONLY if app-relevant files changed
PATTERN='^(app/|pages/|src/|components/|public/|next\.config\.(js|mjs|ts)$|vercel\.json$|package(-lock)?\.json$|pnpm-lock\.yaml$)'

if echo "$CHANGED" | grep -Eq "$PATTERN"; then
  echo "Relevant changes → build."
  exit 1   # non-zero → Vercel builds
else
  echo "No relevant changes → skip."
  exit 0   # zero → Vercel skips build
fi