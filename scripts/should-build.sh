#!/usr/bin/env bash
set -eo pipefail

# When Vercel runs this on its server, these vars may exist:
# VERCEL_GIT_PREVIOUS_SHA = previously deployed commit
# VERCEL_GIT_COMMIT_SHA   = current commit

BASE="${VERCEL_GIT_PREVIOUS_SHA:-HEAD~1}"
HEAD="${VERCEL_GIT_COMMIT_SHA:-HEAD}"

# List changed files between previous and current
CHANGED="$(git diff --name-only "$BASE" "$HEAD" || true)"

# Paths that REQUIRE a deploy if changed
PATTERN='^(app/|pages/|src/|components/|public/|next\.config\.(js|mjs|ts)$|vercel\.json$|package(-lock)?\.json$|pnpm-lock\.yaml$)'

if echo "$CHANGED" | grep -Eq "$PATTERN"; then
  echo "Relevant app changes detected → build required."
  exit 1   # exit 1 tells Vercel: DO build
else
  echo "No relevant changes → skip build."
  exit 0   # exit 0 tells Vercel: skip build
fi