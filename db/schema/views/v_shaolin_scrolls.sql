CREATE OR REPLACE VIEW dojo.v_shaolin_scrolls AS
SELECT
      s.id,
  -- Build a friendly display name:
  -- "shaolin X.Y.Z – YYYY-MM <Type: label>"
  (
    'shaolin ' || s.major || '.' || s.minor || '.' || s.patch
    || ' – ' || s.year || '-' || LPAD(s.month::text, 2, '0') || ' '
    || CASE
         -- Translate code like "planned_release" -> "Planned Release"
         WHEN rt.code IS NOT NULL
              AND position(
                    lower( replace(rt.code, '_', ' ') || ':' )
                  in lower(s.label)
                  ) <> 1
           THEN replace(rt.code, '_', ' ') || ': ' || s.label
         ELSE s.label
       END
  ) AS release_name,

  -- Minimal "vX.Y.Z"
  ('v' || s.major || '.' || s.minor || '.' || s.patch) AS semver,

  s.major,
  s.minor,
  s.patch,
  s.year,
  s.month,
  s.label,
  rs.code AS status,
  rt.code AS release_type,
  s.created_at,
  s.created_by,
  s.updated_at,
  s.updated_by
FROM dojo.shaolin_scrolls s
JOIN dojo.release_status rs ON rs.id = s.release_status_id
JOIN dojo.release_type   rt ON rt.id = s.release_type_id;