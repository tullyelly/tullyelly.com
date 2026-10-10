-- Run this read-only script in the confirmed dev/analytics DataGrip console.
-- Query results contain schema metadata, not application rows.
-- query: begin
BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY;
-- query: target
SELECT current_database() AS database, current_user AS role,
       current_setting('transaction_read_only') AS read_only,
       current_setting('server_version') AS version;
-- query: schemas
SELECT nspname AS schema, pg_get_userbyid(nspowner) AS owner
FROM pg_namespace WHERE nspname IN ('dojo', 'auth') ORDER BY nspname;
-- query: relations
SELECT n.nspname AS schema, c.relname AS name, c.relkind AS kind,
       pg_get_userbyid(c.relowner) AS owner,
       CASE WHEN c.relkind IN ('v','m') THEN pg_get_viewdef(c.oid, true) END AS definition
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname IN ('dojo','auth') AND c.relkind IN ('r','p','v','m','S')
ORDER BY n.nspname,c.relname;
-- query: columns
SELECT table_schema,table_name,column_name,ordinal_position,data_type,udt_name,
       is_nullable,column_default,is_identity,identity_generation
FROM information_schema.columns WHERE table_schema IN ('dojo','auth')
ORDER BY table_schema,table_name,ordinal_position;
-- query: constraints
SELECT n.nspname AS schema,c.relname AS table_name,k.conname AS name,
       pg_get_constraintdef(k.oid,true) AS definition,k.convalidated AS validated
FROM pg_constraint k JOIN pg_class c ON c.oid=k.conrelid
JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname IN ('dojo','auth') ORDER BY n.nspname,c.relname,k.conname;
-- query: indexes
SELECT schemaname,tablename,indexname,indexdef FROM pg_indexes
WHERE schemaname IN ('dojo','auth') ORDER BY schemaname,tablename,indexname;
-- query: functions
SELECT n.nspname AS schema,p.proname AS name,
       pg_get_function_identity_arguments(p.oid) AS arguments,
       pg_get_functiondef(p.oid) AS definition
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname IN ('dojo','auth') AND p.prokind IN ('f','p')
ORDER BY n.nspname,p.proname,arguments;
-- query: triggers
SELECT n.nspname AS schema,c.relname AS table_name,t.tgname AS name,
       pg_get_triggerdef(t.oid,true) AS definition,t.tgenabled AS enabled
FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid
JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname IN ('dojo','auth') AND NOT t.tgisinternal
ORDER BY n.nspname,c.relname,t.tgname;
-- query: ledger_presence
SELECT to_regclass('dojo.schema_migration')::text AS ledger;
-- query: prerequisites
SELECT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='tullyelly_admin') AS application_role,
       to_regclass('dojo.authz_app')::text AS authz_app,
       to_regclass('dojo.authz_role')::text AS authz_role,
       to_regclass('dojo.authz_feature')::text AS authz_feature,
       to_regprocedure('dojo.authz_bump_revision(uuid)')::text AS revision_function;
-- query: rollback
ROLLBACK;
