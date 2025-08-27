#!/usr/bin/env bash
set -euo pipefail

# 1. Remove the old app/shaolin-scrolls directory
if [ -d "app/shaolin-scrolls" ]; then
  echo "Deleting old app/shaolin-scrolls..."
  rm -rf app/shaolin-scrolls
fi

# 2. Rename app/scrolls → app/shaolin-scrolls
if [ -d "app/scrolls" ]; then
  echo "Renaming app/scrolls to app/shaolin-scrolls..."
  mv app/scrolls app/shaolin-scrolls
else
  echo "ERROR: app/scrolls does not exist."
  exit 1
fi

# 3. Update imports/references across repo
#    Find any imports or references to "app/scrolls" and replace with "app/shaolin-scrolls"
echo "Updating references..."
grep -rl "app/scrolls" . | while read -r file; do
  sed -i.bak 's@app/scrolls@app/shaolin-scrolls@g' "$file"
  rm "${file}.bak"
done

# 4. Run linter & typecheck to confirm no dangling references
echo "Running lint & typecheck..."
npm run lint
npm run typecheck

echo "Migration complete: app/scrolls → app/shaolin-scrolls"
