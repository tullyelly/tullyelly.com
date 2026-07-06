-- 059_allow_homie_tag_href_kind.sql
-- Allow dojo.tags route metadata to point at cardattack homie routes.

SET search_path = dojo, public;

BEGIN;

ALTER TABLE tags
    DROP CONSTRAINT tags_href_kind_check;

ALTER TABLE tags
    ADD CONSTRAINT tags_href_kind_check
        CHECK (href_kind = ANY
               (ARRAY [
                   'tag'::TEXT,
                   'persona'::TEXT,
                   'squad'::TEXT,
                   'homie'::TEXT,
                   'custom'::TEXT,
                   'external'::TEXT,
                   'none'::TEXT
               ]));

COMMIT;
