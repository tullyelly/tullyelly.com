-- 005_drop_fn_next_hotfix.sql
-- Purpose: drop legacy fn_next_hotfix after migration.
-- Verification:
--   psql $DATABASE_URL -f db/migrations/005_drop_fn_next_hotfix.sql

DROP FUNCTION IF EXISTS dojo.fn_next_hotfix(text);
