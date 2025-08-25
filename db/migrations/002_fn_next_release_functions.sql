-- 002_fn_next_release_functions.sql
-- Purpose: Port MySQL stored procedures sp_next_hotfix and sp_next_minor into PostgreSQL functions.
-- Differences vs MySQL:
--   * COALESCE replaces IFNULL.
--   * EXTRACT(YEAR/MONTH FROM CURRENT_DATE) replaces YEAR(CURDATE()) and MONTH(CURDATE()).
--   * RETURNING is used instead of LAST_INSERT_ID().
-- Verification:
--   psql $NEON_DATABASE_URL -f db/migrations/002_fn_next_release_functions.sql
--   psql $NEON_DATABASE_URL -c "SELECT * FROM dojo.fn_next_minor('Test minor');"
--   psql $NEON_DATABASE_URL -c "SELECT * FROM dojo.fn_next_hotfix('Test hotfix');"

CREATE OR REPLACE FUNCTION dojo.fn_next_hotfix(label TEXT)
RETURNS TABLE(id BIGINT, generated_name TEXT)
LANGUAGE plpgsql
AS $$
DECLARE
  v_major INT;
  v_minor INT;
  v_patch INT;
  v_id    BIGINT;
BEGIN
  SELECT s.major, s.minor
    INTO v_major, v_minor
    FROM dojo.shaolin_scrolls s
    JOIN dojo.release_status rs ON rs.id = s.release_status_id
    WHERE rs.code = 'released'
    ORDER BY s.major DESC, s.minor DESC, s.patch DESC
    LIMIT 1;

  v_major := COALESCE(v_major, 2);
  v_minor := COALESCE(v_minor, 0);

  SELECT COALESCE(MAX(patch), 0) + 1
    INTO v_patch
    FROM dojo.shaolin_scrolls
    WHERE major = v_major AND minor = v_minor;

  INSERT INTO dojo.shaolin_scrolls AS ss
    (major, minor, patch, year, month, label, release_status_id, release_type_id)
  VALUES (
    v_major,
    v_minor,
    v_patch,
    EXTRACT(YEAR FROM CURRENT_DATE)::INT,
    EXTRACT(MONTH FROM CURRENT_DATE)::INT,
    label,
    (SELECT id FROM dojo.release_status WHERE code = 'planned'),
    (SELECT id FROM dojo.release_type WHERE code = 'hotfix')
  )
  RETURNING ss.id INTO v_id;

  RETURN QUERY
    SELECT v_id, vs.generated_name
    FROM dojo.v_shaolin_scrolls vs
    WHERE vs.id = v_id;
END;
$$;

CREATE OR REPLACE FUNCTION dojo.fn_next_minor(label TEXT)
RETURNS TABLE(id BIGINT, generated_name TEXT)
LANGUAGE plpgsql
AS $$
DECLARE
  v_major INT;
  v_minor INT;
  v_id    BIGINT;
BEGIN
  SELECT MAX(major) INTO v_major FROM dojo.shaolin_scrolls;
  v_major := COALESCE(v_major, 2);

  SELECT COALESCE(MAX(minor), -1) + 1
    INTO v_minor
    FROM dojo.shaolin_scrolls
    WHERE major = v_major;

  INSERT INTO dojo.shaolin_scrolls AS ss
    (major, minor, patch, year, month, label, release_status_id, release_type_id)
  VALUES (
    v_major,
    v_minor,
    0,
    EXTRACT(YEAR FROM CURRENT_DATE)::INT,
    EXTRACT(MONTH FROM CURRENT_DATE)::INT,
    label,
    (SELECT id FROM dojo.release_status WHERE code = 'planned'),
    (SELECT id FROM dojo.release_type WHERE code = 'minor')
  )
  RETURNING ss.id INTO v_id;

  RETURN QUERY
    SELECT v_id, vs.generated_name
    FROM dojo.v_shaolin_scrolls vs
    WHERE vs.id = v_id;
END;
$$;
