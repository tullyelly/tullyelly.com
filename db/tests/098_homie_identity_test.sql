-- JAMES ONLY; existing DEVELOPMENT after 098. Never agent-run or production-run.
-- Run as a complete script with stop-on-error. On error ROLLBACK the console.
-- Rows roll back; identity/serial sequences may acquire harmless gaps.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='60s';
DO $tests$
DECLARE
  homie_id bigint := -1261001;
  source_id integer;
  destination_id integer;
  clan_id integer;
  original_ctid tid;
BEGIN
  IF current_setting('transaction_isolation')<>'read committed' THEN RAISE EXCEPTION 'use READ COMMITTED'; END IF;
  IF EXISTS(SELECT 1 FROM dojo.homie WHERE id=homie_id OR tag_slug LIKE 'wu-1261-fixture%')
     OR EXISTS(SELECT 1 FROM dojo.tags WHERE slug LIKE 'wu-1261-fixture%') THEN RAISE EXCEPTION 'fixture namespace occupied; review'; END IF;
  SELECT t.id INTO STRICT clan_id FROM dojo.tags t JOIN dojo.clan c ON c.slug=t.slug WHERE c.slug='the-monastery';
  INSERT INTO dojo.homie(id,name,tag_slug,drafted) OVERRIDING SYSTEM VALUE VALUES(homie_id,'WU-1261 Fixture','wu-1261-fixture',2000);
  SELECT id INTO STRICT source_id FROM dojo.tags WHERE slug='wu-1261-fixture';
  IF NOT EXISTS(SELECT 1 FROM dojo.tags WHERE id=source_id AND display_name='wu-1261 fixture' AND href='/cardattack/homies/wu-1261-fixture') THEN RAISE EXCEPTION 'insert synchronization failed'; END IF;
  UPDATE dojo.homie SET name='WU-1261 Renamed' WHERE id=homie_id;
  IF NOT EXISTS(SELECT 1 FROM dojo.tags WHERE id=source_id AND display_name='wu-1261 renamed') THEN RAISE EXCEPTION 'managed name update failed'; END IF;
  SELECT ctid INTO original_ctid FROM dojo.tags WHERE id=source_id;
  UPDATE dojo.homie SET name=name,tag_slug=tag_slug WHERE id=homie_id;
  IF (SELECT ctid FROM dojo.tags WHERE id=source_id)<>original_ctid THEN RAISE EXCEPTION 'same-value update rewrote tag'; END IF;

  -- A legacy pure generated tag can adopt its label from OLD without claiming mixed tags.
  UPDATE dojo.tags SET meta=meta-'homie_sync' WHERE id=source_id;
  UPDATE dojo.homie SET name='WU-1261 Legacy Rename' WHERE id=homie_id;
  IF NOT EXISTS(SELECT 1 FROM dojo.tags WHERE id=source_id AND display_name='wu-1261 legacy rename') THEN RAISE EXCEPTION 'legacy managed label not updated'; END IF;
  INSERT INTO dojo.homie(id,name,tag_slug,drafted) OVERRIDING SYSTEM VALUE VALUES(-1261004,'WU-1261 Null Fixture',NULL,2000);
  UPDATE dojo.homie SET name='WU-1261 Null Renamed' WHERE id=-1261004;
  IF EXISTS(SELECT 1 FROM dojo.tags WHERE meta#>>'{homie_sync,homie_id}'='-1261004') THEN RAISE EXCEPTION 'null insert/name update created a tag'; END IF;

  -- Authored fields survive sync; only proven managed context fields retire.
  UPDATE dojo.tags SET display_name='authored label',href='/custom/fixture',href_kind='custom',is_clickable=false,
    meta=meta||'{"unrelated":{"keep":true}}'::jsonb WHERE id=source_id;
  UPDATE dojo.homie SET name='WU-1261 New Name' WHERE id=homie_id;
  IF NOT EXISTS(SELECT 1 FROM dojo.tags WHERE id=source_id AND display_name='authored label' AND href='/custom/fixture' AND NOT is_clickable AND meta#>>'{unrelated,keep}'='true') THEN RAISE EXCEPTION 'authored fields overwritten'; END IF;

  INSERT INTO dojo.tag_relation(source_tag_id,target_tag_id,relation_type) VALUES(source_id,clan_id,'member_of');
  BEGIN UPDATE dojo.homie SET tag_slug='wu-1261-fixture-unproven' WHERE id=homie_id; RAISE EXCEPTION 'unproven clan edge accepted';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM='unproven clan edge accepted' THEN RAISE; END IF; END;
  IF (SELECT tag_slug FROM dojo.homie WHERE id=homie_id)<>'wu-1261-fixture'
    OR EXISTS(SELECT 1 FROM dojo.tags WHERE slug='wu-1261-fixture-unproven') THEN RAISE EXCEPTION 'ambiguous rename was not atomic'; END IF;
  DELETE FROM dojo.tag_relation WHERE source_tag_id=source_id AND target_tag_id=clan_id AND relation_type='member_of';

  INSERT INTO dojo.tags(slug,name,display_name,href_kind,meta) VALUES('wu-1261-fixture-next','fixture','destination label','tag','{"destination":true}') RETURNING id INTO destination_id;
  INSERT INTO dojo.tag_relation(source_tag_id,target_tag_id,relation_type,meta) VALUES
    (source_id,clan_id,'member_of','{"membership_basis":"played_for","evidence_url":"https://example.invalid/fixture","source_evidence":"keep"}'),
    (destination_id,clan_id,'member_of','{"membership_basis":"played_for","evidence_url":"https://example.invalid/destination","destination_evidence":"keep"}');
  UPDATE dojo.homie SET tag_slug='wu-1261-fixture-next' WHERE id=homie_id;
  IF EXISTS(SELECT 1 FROM dojo.tag_relation WHERE source_tag_id=source_id AND target_tag_id=clan_id AND relation_type='member_of')
     OR NOT EXISTS(SELECT 1 FROM dojo.tag_relation WHERE source_tag_id=destination_id AND target_tag_id=clan_id
       AND meta->>'destination_evidence'='keep' AND meta#>>'{homie_sync_merged_edges,0,meta,source_evidence}'='keep') THEN RAISE EXCEPTION 'clan dedup/evidence preservation failed'; END IF;
  IF NOT EXISTS(SELECT 1 FROM dojo.tags WHERE id=source_id AND display_name='authored label' AND href='/custom/fixture' AND NOT is_clickable
    AND meta#>'{identity,contexts,cardattack}' IS NULL AND meta#>>'{unrelated,keep}'='true') THEN RAISE EXCEPTION 'retired authored tag corrupted'; END IF;

  -- Forward collisions and preexisting format/uniqueness constraints are atomic.
    BEGIN UPDATE dojo.homie SET tag_slug='cal' WHERE id=homie_id; RAISE EXCEPTION 'expected collision not rejected';
    EXCEPTION WHEN raise_exception THEN IF SQLERRM='expected collision not rejected' THEN RAISE; END IF; END;
    BEGIN UPDATE dojo.homie SET tag_slug='the-lazer' WHERE id=homie_id; RAISE EXCEPTION 'expected collision not rejected';
    EXCEPTION WHEN raise_exception THEN IF SQLERRM='expected collision not rejected' THEN RAISE; END IF; END;
    BEGIN UPDATE dojo.homie SET tag_slug='g-league' WHERE id=homie_id; RAISE EXCEPTION 'expected collision not rejected';
    EXCEPTION WHEN raise_exception THEN IF SQLERRM='expected collision not rejected' THEN RAISE; END IF; END;
    BEGIN UPDATE dojo.homie SET tag_slug='BAD SLUG' WHERE id=homie_id; RAISE EXCEPTION 'format guard missing'; EXCEPTION WHEN check_violation THEN NULL; END;
    BEGIN UPDATE dojo.homie SET tag_slug='eldrid' WHERE id=homie_id; RAISE EXCEPTION 'uniqueness guard missing'; EXCEPTION WHEN unique_violation THEN NULL; END;
  IF (SELECT tag_slug FROM dojo.homie WHERE id=homie_id)<>'wu-1261-fixture-next' THEN RAISE EXCEPTION 'collision changed athlete'; END IF;

  BEGIN UPDATE dojo.tags SET href='/unclejimmy/fam/fixture',href_kind='squad' WHERE id=destination_id; RAISE EXCEPTION 'reverse route guard missing';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM='reverse route guard missing' THEN RAISE; END IF; END;
  BEGIN UPDATE dojo.tags SET meta=jsonb_set(meta,'{identity,contexts,unclejimmy}','{"role":"fam"}'::jsonb) WHERE id=destination_id; RAISE EXCEPTION 'reverse context guard missing';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM='reverse context guard missing' THEN RAISE; END IF; END;
  BEGIN INSERT INTO dojo.tag_relation(source_tag_id,target_tag_id,relation_type) SELECT destination_id,id,'member_of' FROM dojo.tags WHERE slug='g-league'; RAISE EXCEPTION 'reverse membership guard missing';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM='reverse membership guard missing' THEN RAISE; END IF; END;
  BEGIN INSERT INTO dojo.unclejimmy_squad_item(section_key,slug,label,kind) VALUES('nuclear-reactor','wu-1261-fixture-next','fixture','person'); RAISE EXCEPTION 'reverse roster guard missing';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM='reverse roster guard missing' THEN RAISE; END IF; END;

  -- Multi-hop reverse membership cannot reserve an already claimed athlete.
  INSERT INTO dojo.tags(slug,name) VALUES('wu-1261-fixture-middle','fixture middle');
  INSERT INTO dojo.tag_relation(source_tag_id,target_tag_id,relation_type) SELECT destination_id,id,'member_of' FROM dojo.tags WHERE slug='wu-1261-fixture-middle';
  BEGIN INSERT INTO dojo.tag_relation(source_tag_id,target_tag_id,relation_type) SELECT s.id,t.id,'member_of' FROM dojo.tags s,dojo.tags t WHERE s.slug='wu-1261-fixture-middle' AND t.slug='g-league'; RAISE EXCEPTION 'indirect guard missing';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM='indirect guard missing' THEN RAISE; END IF; END;

  UPDATE dojo.homie SET tag_slug=NULL WHERE id=homie_id;
  IF NOT EXISTS(SELECT 1 FROM dojo.homie WHERE id=homie_id AND tag_slug IS NULL)
    OR NOT EXISTS(SELECT 1 FROM dojo.tags WHERE id=destination_id AND href IS NULL AND href_kind='tag') THEN RAISE EXCEPTION 'null transition/fallback failed'; END IF;
  UPDATE dojo.homie SET tag_slug='wu-1261-fixture-again' WHERE id=homie_id;
  IF NOT EXISTS(SELECT 1 FROM dojo.tag_relation r JOIN dojo.tags t ON t.id=r.source_tag_id WHERE t.slug='wu-1261-fixture-again' AND r.target_tag_id=clan_id AND r.meta->>'destination_evidence'='keep') THEN RAISE EXCEPTION 'null-to-slug evidence recovery failed'; END IF;
  UPDATE dojo.homie SET tag_slug='wu-1261-fixture-final' WHERE id=homie_id;
  IF NOT EXISTS(SELECT 1 FROM dojo.tags WHERE slug='wu-1261-fixture-again' AND href IS NULL AND href_kind='tag') THEN RAISE EXCEPTION 'repeated rename fallback failed'; END IF;
  PERFORM dojo.assert_homie_tag_exclusivity();
END;
$tests$;
ROLLBACK;
