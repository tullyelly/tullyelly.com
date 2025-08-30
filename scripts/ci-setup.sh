#!/usr/bin/env bash
set -euo pipefail

# Prefer TEST_DATABASE_URL, then PREVIEW_DATABASE_URL, else a placeholder that matches a valid Postgres URL shape.
DB_URL="${TEST_DATABASE_URL:-}"
if [ -z "${DB_URL}" ]; then
  DB_URL="${PREVIEW_DATABASE_URL:-}"
fi
if [ -z "${DB_URL}" ]; then
  # Placeholder; not used to connect during build, only to satisfy validation shape.
  DB_URL="postgresql://postgres:postgres@127.0.0.1:5432/postgres?schema=public"
fi

# Export for subsequent workflow steps
{
  echo "DATABASE_URL=${DB_URL}"
} >> "$GITHUB_ENV"

# Also drop a dotenv for local debugging if needed
echo "DATABASE_URL=${DB_URL}" > .env.ci
