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

CREATE OR REPLACE FUNCTION dojo.fn_next_patch(p_label TEXT)
RETURNS TABLE(scroll_id BIGINT, generated_name TEXT)
LANGUAGE plpgsql
AS $$
DECLARE
  v_major INT;
  v_minor INT;
  v_patch INT;
BEGIN
  -- Get latest released major/minor
  SELECT s.major, s.minor
    INTO v_major, v_minor
    FROM dojo.shaolin_scrolls s
    JOIN dojo.release_status rs ON rs.id = s.release_status_id
   WHERE rs.code = 'released'
   ORDER BY s.major DESC, s.minor DESC, s.patch DESC
   LIMIT 1;

  v_major := COALESCE(v_major, 2);
  v_minor := COALESCE(v_minor, 0);

  -- Next patch within that major/minor
  SELECT COALESCE(MAX(s.patch), 0) + 1
    INTO v_patch
    FROM dojo.shaolin_scrolls s
   WHERE s.major = v_major
     AND s.minor = v_minor;

  -- Insert next hotfix row
  INSERT INTO dojo.shaolin_scrolls AS ss
    (major, minor, patch, year, month, label, release_status_id, release_type_id)
  VALUES (
    v_major,
    v_minor,
    v_patch,
    EXTRACT(YEAR FROM CURRENT_DATE)::INT,
    EXTRACT(MONTH FROM CURRENT_DATE)::INT,
    p_label,
    (SELECT rs.id FROM dojo.release_status rs WHERE rs.code = 'planned'),
    (SELECT rt.id FROM dojo.release_type rt WHERE rt.code = 'hotfix')
  )
  RETURNING ss.id
    INTO scroll_id;

  RETURN QUERY
    SELECT vs.id, vs.generated_name
      FROM dojo.v_shaolin_scrolls vs
     WHERE vs.id = scroll_id;
END;
$$;

CREATE OR REPLACE FUNCTION dojo.fn_next_minor(p_label TEXT)
RETURNS TABLE(scroll_id BIGINT, generated_name TEXT)
LANGUAGE plpgsql
AS $$
DECLARE
  v_major INT;
  v_minor INT;
BEGIN
  -- Get the current highest major
  SELECT MAX(s.major)
    INTO v_major
    FROM dojo.shaolin_scrolls s;

  v_major := COALESCE(v_major, 2);

  -- Next minor within that major
  SELECT COALESCE(MAX(s.minor), -1) + 1
    INTO v_minor
    FROM dojo.shaolin_scrolls s
   WHERE s.major = v_major;

  -- Insert next minor row
  INSERT INTO dojo.shaolin_scrolls AS ss
    (major, minor, patch, year, month, label, release_status_id, release_type_id)
  VALUES (
    v_major,
    v_minor,
    0,
    EXTRACT(YEAR FROM CURRENT_DATE)::INT,
    EXTRACT(MONTH FROM CURRENT_DATE)::INT,
    p_label,
    (SELECT rs.id FROM dojo.release_status rs WHERE rs.code = 'planned'),
    (SELECT rt.id FROM dojo.release_type rt WHERE rt.code = 'minor')
  )
  RETURNING ss.id
    INTO scroll_id;

  -- Return matching view row
  RETURN QUERY
    SELECT vs.id, vs.generated_name
      FROM dojo.v_shaolin_scrolls vs
     WHERE vs.id = scroll_id;
END;
$$;
