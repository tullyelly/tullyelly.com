-- Assessment only. Do not call migration runner status/verify to initialize a ledger.
BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY;
SELECT current_database() AS database,current_user AS role,
       current_setting('transaction_read_only') AS read_only,
       has_database_privilege(current_user,current_database(),'TEMP') AS can_create_temp;
SELECT n.nspname,pg_get_userbyid(n.nspowner) AS owner,
       has_schema_privilege(current_user,n.oid,'USAGE') AS usage,
       has_schema_privilege(current_user,n.oid,'CREATE') AS can_create
FROM pg_namespace n WHERE n.nspname='dojo';
SELECT c.relname,c.relkind,pg_get_userbyid(c.relowner) AS owner
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='dojo' AND (c.relname LIKE 'analytics_%' OR c.relname='schema_migration'
  OR c.relname IN ('authz_app','authz_role','authz_feature','authz_role_feature','authz_user_app_role','authz_policy_rev'))
ORDER BY c.relname;
SELECT table_name,column_name,data_type,is_nullable,column_default,is_identity,identity_generation
FROM information_schema.columns WHERE table_schema='dojo'
AND (table_name LIKE 'analytics_%' OR table_name='schema_migration'
  OR table_name IN ('authz_app','authz_role','authz_feature','authz_role_feature','authz_user_app_role','authz_policy_rev'))
ORDER BY table_name,ordinal_position;
SELECT c.relname,k.conname,pg_get_constraintdef(k.oid,true) AS definition,k.convalidated
FROM pg_constraint k JOIN pg_class c ON c.oid=k.conrelid JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='dojo' AND (c.relname LIKE 'analytics_%' OR c.relname='schema_migration'
  OR c.relname IN ('authz_app','authz_role','authz_feature','authz_role_feature','authz_user_app_role','authz_policy_rev'))
ORDER BY c.relname,k.conname;
SELECT (SELECT count(*) FROM dojo.authz_app WHERE slug='admin') AS admin_apps,
       (SELECT count(*) FROM dojo.authz_role WHERE name='admin') AS admin_roles,
       (SELECT count(*) FROM dojo.authz_feature WHERE key='admin.analytics.manage') AS analytics_features,
       (SELECT count(*) FROM dojo.authz_role_feature g JOIN dojo.authz_feature f ON f.id=g.feature_id
        WHERE f.key='admin.analytics.manage') AS analytics_grants;
SELECT a.slug AS app,f.key,f.enabled,r.name AS role,g.effect
FROM dojo.authz_feature f JOIN dojo.authz_app a ON a.id=f.app_id
LEFT JOIN dojo.authz_role_feature g ON g.feature_id=f.id
LEFT JOIN dojo.authz_role r ON r.id=g.role_id
WHERE f.key='admin.analytics.manage' ORDER BY r.name;
SELECT p.proname,pg_get_userbyid(p.proowner) AS owner,p.prosecdef,p.proconfig,
       pg_get_functiondef(p.oid) AS definition,
       has_function_privilege(current_user,p.oid,'EXECUTE') AS can_execute
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='dojo' AND p.proname IN ('authz_bump_revision','authz_get_revision')
ORDER BY p.proname;
SELECT c.relname,t.tgname,t.tgenabled,pg_get_triggerdef(t.oid,true) AS definition
FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='dojo' AND NOT t.tgisinternal
AND c.relname IN ('authz_feature','authz_role_feature','authz_user_app_role','authz_policy_rev')
ORDER BY c.relname,t.tgname;
-- Aggregates only; do not export user IDs or membership rows.
SELECT count(*) AS affected_users,COALESCE(sum(revision),0) AS revision_sum
FROM (
 SELECT DISTINCT m.user_id,COALESCE(r.revision,0) AS revision
 FROM dojo.authz_user_app_role m JOIN dojo.authz_role role ON role.id=m.role_id
 LEFT JOIN dojo.authz_policy_rev r ON r.user_id=m.user_id
 WHERE role.name='admin' AND (m.app_id IS NULL OR m.app_id=
   (SELECT id FROM dojo.authz_app WHERE slug='admin'))
) affected;
SELECT to_regclass('dojo.schema_migration')::text AS ledger;
ROLLBACK;
