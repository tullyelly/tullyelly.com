-- Execute only when analytics-schema.sql confirms this ledger exists.
BEGIN READ ONLY;
SELECT filename, checksum, checksum_algorithm, status, applied_at,
       attempted_at, execution_ms,
       error_message IS NOT NULL AS has_error
FROM dojo.schema_migration ORDER BY filename;
ROLLBACK;
