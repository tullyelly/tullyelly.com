-- 004_fn_next_patch.sql
-- Purpose: add dojo.fn_next_patch(label, status_code, release_type_code) and retain legacy fn_next_hotfix(text)
-- Verification:
--   psql $DATABASE_URL -c "SELECT * FROM dojo.fn_next_patch('Example', 'planned', 'hotfix');"
--   psql $DATABASE_URL -c "SELECT * FROM dojo.fn_next_hotfix('Example legacy');"

-- Rename existing fn_next_patch(text) to fn_next_hotfix(text) if it exists
ALTER FUNCTION IF EXISTS dojo.fn_next_patch(text)
  RENAME TO fn_next_hotfix;

-- Create new function with status and release_type parameters
create or replace function dojo.fn_next_patch(
  p_label text,
  p_status_code text,
  p_release_type_code text
)
returns table(scroll_id bigint, generated_name text)
language plpgsql
as
$$
declare
  v_major int;
  v_minor int;
  v_patch int;
  v_status_id smallint;
  v_release_type_id smallint;
begin
  -- Resolve codes to ids (validate existence)
  select rs.id into v_status_id
    from dojo.release_status rs
   where rs.code = p_status_code;
  if v_status_id is null then
    raise exception 'Unknown release_status code: %', p_status_code;
  end if;

  select rt.id into v_release_type_id
    from dojo.release_type rt
   where rt.code = p_release_type_code;
  if v_release_type_id is null then
    raise exception 'Unknown release_type code: %', p_release_type_code;
  end if;

  -- Latest released major/minor
  select s.major, s.minor
    into v_major, v_minor
    from dojo.shaolin_scrolls s
    join dojo.release_status rs on rs.id = s.release_status_id
   where rs.code = 'released'
   order by s.major desc, s.minor desc, s.patch desc
   limit 1;

  v_major := coalesce(v_major, 2);
  v_minor := coalesce(v_minor, 0);

  -- Next patch for that major/minor
  select coalesce(max(s.patch), 0) + 1
    into v_patch
    from dojo.shaolin_scrolls s
   where s.major = v_major
     and s.minor = v_minor;

  -- Insert new row
  insert into dojo.shaolin_scrolls as ss
    (major, minor, patch, year, month, label, release_status_id, release_type_id)
  values (
    v_major,
    v_minor,
    v_patch,
    extract(year from current_date)::int,
    extract(month from current_date)::int,
    p_label,
    v_status_id,
    v_release_type_id
  )
  returning ss.id into scroll_id;

  return query
    select vs.id, vs.release_name::text as generated_name
      from dojo.v_shaolin_scrolls vs
     where vs.id = scroll_id;
end;
$$;

alter function dojo.fn_next_patch(text, text, text) owner to tullyelly_admin;
