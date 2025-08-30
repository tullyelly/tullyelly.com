#!/usr/bin/env bash
set -euo pipefail

files=$(git grep -l "use server" -- '**/*.{ts,tsx}' || true)

if [ -z "$files" ]; then
  exit 0
fi

bad=$(echo "$files" | xargs -r grep -nE 'export (const|let|var|class|enum|type|interface)' || true)

if [ -n "$bad" ]; then
  echo "Invalid 'use server' exports detected:"
  echo "$bad"
  exit 1
fi
