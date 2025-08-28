-- 005_drop_fn_next_hotfix.sql
-- Purpose: remove legacy dojo.fn_next_hotfix function after application code uses fn_next_patch.
-- Verification:
--   psql $DATABASE_URL -c "\df dojo.fn_next_hotfix"  # should show nothing

drop function if exists dojo.fn_next_hotfix(text);
