CREATE OR REPLACE VIEW v_shaolin_scrolls
            (id, release_name, semver, major, minor, patch, year, month, label, release_date, status, release_type,
             created_at, created_by, updated_at, updated_by)
AS
SELECT s.id,
       (((((((((('shaolin '::TEXT || s.major) || '.'::TEXT) || s.minor) || '.'::TEXT) || s.patch) || ' – '::TEXT) ||
           s.year) || '-'::TEXT) || LPAD(s.month::TEXT, 2, '0'::TEXT)) || ' '::TEXT) ||
       CASE
           WHEN rt.code IS NOT NULL AND
                POSITION((LOWER(REPLACE(rt.code, '_'::TEXT, ' '::TEXT) || ':'::TEXT)) IN (LOWER(s.label::TEXT))) <> 1
               THEN ((REPLACE(rt.code, '_'::TEXT, ' '::TEXT) || ': '::TEXT) || s.label::TEXT)::CHARACTER VARYING
           ELSE s.label
           END::TEXT                                                                AS release_name,
       (((('v'::TEXT || s.major) || '.'::TEXT) || s.minor) || '.'::TEXT) || s.patch AS semver,
       s.major,
       s.minor,
       s.patch,
       s.year,
       s.month,
       s.label,
       s.release_date::text                                                      AS release_date,
       rs.code                                                                      AS status,
       rt.code                                                                      AS release_type,
       s.created_at,
       s.created_by,
       s.updated_at,
       s.updated_by
    FROM shaolin_scrolls s
             JOIN release_status rs ON rs.id = s.release_status_id
             JOIN release_type rt ON rt.id = s.release_type_id;

ALTER TABLE v_shaolin_scrolls
    OWNER TO tullyelly_admin;