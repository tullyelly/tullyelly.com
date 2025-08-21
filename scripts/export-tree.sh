#!/usr/bin/env bash
set -euo pipefail

DEPTH="${1:-3}"
IGNORE="node_modules|.git|.next|dist|build|coverage|.vercel"

# Ensure tree exists (gentle nudge if not)
if ! command -v tree >/dev/null 2>&1; then
  echo "Missing 'tree'. On Debian/Ubuntu: sudo apt-get update && sudo apt-get install -y tree" >&2
  exit 1
fi

tree -L "$DEPTH" -I "$IGNORE" > app-tree.txt
echo "Wrote app-tree.txt (depth=$DEPTH)"