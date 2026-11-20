-- Engineering source embedded in ledger; not a separate manual step.
SET LOCAL search_path=pg_catalog;
SELECT pg_advisory_xact_lock(hashtextextended('cipher:homie-tag-identity',0));
LOCK TABLE dojo.homie,dojo.clan,dojo.tags IN SHARE MODE;
LOCK TABLE dojo.tag_relation IN SHARE MODE;
DO $prerequisite$
BEGIN
 IF current_database()<>'tullyelly_db' THEN RAISE EXCEPTION '103: unexpected database'; END IF;
 IF NOT EXISTS(SELECT 1 FROM dojo.schema_migration
  WHERE filename='102_seed_tag_relationship_examples.sql'
  AND checksum='a43c0b79b07766cfae67a0d821d2ee4fecabd7ee42f865af9aa969d3004235de'
  AND checksum_algorithm='sha256' AND status='applied'
  AND applied_at IS NOT NULL AND error_message IS NULL) THEN
  RAISE EXCEPTION '103: reviewed 102 prerequisite missing or conflicting';
 END IF;
END;
$prerequisite$;
CREATE TEMP TABLE clan_audit_seed (
 homie_id bigint, homie_name text, source_slug text, clan_id bigint,
 clan_name text, clan_slug text, evidence_url text,
 PRIMARY KEY(source_slug,clan_slug)
) ON COMMIT DROP;
INSERT INTO clan_audit_seed VALUES
  (3,'Allen Iverson','allen-iverson',33,'Philadelphia 76ers','sixers','https://cdn.nba.com/teams/uploads/sites/1610612755/2024/01/23-24-76ers-Media-Guide-Update-compressed.pdf'),
  (5,'Tim Thomas','tim-thomas',33,'Philadelphia 76ers','sixers','https://cdn.nba.com/teams/uploads/sites/1610612755/2024/01/23-24-76ers-Media-Guide-Update-compressed.pdf'),
  (7,'Toni Kukoč','toni',33,'Philadelphia 76ers','sixers','https://cdn.nba.com/teams/uploads/sites/1610612755/2024/01/23-24-76ers-Media-Guide-Update-compressed.pdf'),
  (13,'Glenn Robinson','big-dog',33,'Philadelphia 76ers','sixers','https://cdn.nba.com/teams/uploads/sites/1610612755/2024/01/23-24-76ers-Media-Guide-Update-compressed.pdf'),
  (21,'Jrue Holiday','jrue',33,'Philadelphia 76ers','sixers','https://cdn.nba.com/teams/uploads/sites/1610612755/2024/01/23-24-76ers-Media-Guide-Update-compressed.pdf'),
  (104,'Chris Webber','timeout',33,'Philadelphia 76ers','sixers','https://cdn.nba.com/teams/uploads/sites/1610612755/2024/01/23-24-76ers-Media-Guide-Update-compressed.pdf'),
  (106,'Julius Erving','julius-erving',33,'Philadelphia 76ers','sixers','https://cdn.nba.com/teams/uploads/sites/1610612755/2024/01/23-24-76ers-Media-Guide-Update-compressed.pdf'),
  (109,'Justin Holiday','justin',33,'Philadelphia 76ers','sixers','https://cdn.nba.com/teams/uploads/sites/1610612755/2024/01/23-24-76ers-Media-Guide-Update-compressed.pdf'),
  (121,'Joel Embiid','the-process',33,'Philadelphia 76ers','sixers','https://cdn.nba.com/teams/uploads/sites/1610612755/2024/01/23-24-76ers-Media-Guide-Update-compressed.pdf'),
  (155,'Dikembe Mutombo','dikembe',33,'Philadelphia 76ers','sixers','https://cdn.nba.com/teams/uploads/sites/1610612755/2024/01/23-24-76ers-Media-Guide-Update-compressed.pdf'),
  (213,'James Harden','beard',33,'Philadelphia 76ers','sixers','https://cdn.nba.com/teams/uploads/sites/1610612755/2024/01/23-24-76ers-Media-Guide-Update-compressed.pdf'),
  (217,'P.J. Tucker','pops-junior',33,'Philadelphia 76ers','sixers','https://cdn.nba.com/teams/uploads/sites/1610612755/2024/01/23-24-76ers-Media-Guide-Update-compressed.pdf'),
  (228,'Andrew Lang','andrew-lang',33,'Philadelphia 76ers','sixers','https://cdn.nba.com/teams/uploads/sites/1610612755/2024/01/23-24-76ers-Media-Guide-Update-compressed.pdf'),
  (242,'Tyrone Hill','tyrone-hill',33,'Philadelphia 76ers','sixers','https://cdn.nba.com/teams/uploads/sites/1610612755/2024/01/23-24-76ers-Media-Guide-Update-compressed.pdf'),
  (315,'Tobias Harris','tobias',33,'Philadelphia 76ers','sixers','https://cdn.nba.com/teams/uploads/sites/1610612755/2024/01/23-24-76ers-Media-Guide-Update-compressed.pdf'),
  (410,'Armen Gilliam','armen-gilliam',33,'Philadelphia 76ers','sixers','https://cdn.nba.com/teams/uploads/sites/1610612755/2024/01/23-24-76ers-Media-Guide-Update-compressed.pdf'),
  (434,'Charles Barkley','sir-charles',33,'Philadelphia 76ers','sixers','https://cdn.nba.com/teams/uploads/sites/1610612755/2024/01/23-24-76ers-Media-Guide-Update-compressed.pdf'),
  (608,'Joe Smith','joe-smith',33,'Philadelphia 76ers','sixers','https://cdn.nba.com/teams/uploads/sites/1610612755/2024/01/23-24-76ers-Media-Guide-Update-compressed.pdf'),
  (622,'Jimmy Butler','playoff-jimmy',33,'Philadelphia 76ers','sixers','https://cdn.nba.com/teams/uploads/sites/1610612755/2024/01/23-24-76ers-Media-Guide-Update-compressed.pdf'),
  (703,'George Hill','blm',33,'Philadelphia 76ers','sixers','https://cdn.nba.com/teams/uploads/sites/1610612755/2024/01/23-24-76ers-Media-Guide-Update-compressed.pdf'),
  (707,'Ersan İlyasova','charge',33,'Philadelphia 76ers','sixers','https://cdn.nba.com/teams/uploads/sites/1610612755/2024/01/23-24-76ers-Media-Guide-Update-compressed.pdf'),
  (708,'Moses Malone','moses',33,'Philadelphia 76ers','sixers','https://cdn.nba.com/teams/uploads/sites/1610612755/2024/01/23-24-76ers-Media-Guide-Update-compressed.pdf'),
  (7,'Toni Kukoč','toni',34,'Atlanta Hawks','hawks','https://library.sfo2.cdn.digitaloceanspaces.com/publications/basketball/yearbooks/KATLHMG-2021.pdf'),
  (13,'Glenn Robinson','big-dog',34,'Atlanta Hawks','hawks','https://library.sfo2.cdn.digitaloceanspaces.com/publications/basketball/yearbooks/KATLHMG-2021.pdf'),
  (109,'Justin Holiday','justin',34,'Atlanta Hawks','hawks','https://library.sfo2.cdn.digitaloceanspaces.com/publications/basketball/yearbooks/KATLHMG-2021.pdf'),
  (115,'Vince Carter','vinsanity',34,'Atlanta Hawks','hawks','https://library.sfo2.cdn.digitaloceanspaces.com/publications/basketball/yearbooks/KATLHMG-2021.pdf'),
  (155,'Dikembe Mutombo','dikembe',34,'Atlanta Hawks','hawks','https://library.sfo2.cdn.digitaloceanspaces.com/publications/basketball/yearbooks/KATLHMG-2021.pdf'),
  (203,'Aaron Holiday','aaron-holiday',34,'Atlanta Hawks','hawks','https://www.nba.com/game/atl-vs-mil-0022200085'),
  (209,'Wes Matthews','wes',34,'Atlanta Hawks','hawks','https://www.nba.com/players/wesley/matthews/202083'),
  (228,'Andrew Lang','andrew-lang',34,'Atlanta Hawks','hawks','https://library.sfo2.cdn.digitaloceanspaces.com/publications/basketball/yearbooks/KATLHMG-2021.pdf'),
  (303,'Bob Sura','bob-sura',34,'Atlanta Hawks','hawks','https://library.sfo2.cdn.digitaloceanspaces.com/publications/basketball/yearbooks/KATLHMG-2021.pdf'),
  (305,'Jeff Teague','jeff',34,'Atlanta Hawks','hawks','https://library.sfo2.cdn.digitaloceanspaces.com/publications/basketball/yearbooks/KATLHMG-2021.pdf'),
  (412,'Jabari Parker','jabari',34,'Atlanta Hawks','hawks','https://library.sfo2.cdn.digitaloceanspaces.com/publications/basketball/yearbooks/KATLHMG-2021.pdf'),
  (415,'Danny Manning','danny-manning',34,'Atlanta Hawks','hawks','https://library.sfo2.cdn.digitaloceanspaces.com/publications/basketball/yearbooks/KATLHMG-2021.pdf'),
  (504,'Sidney Moncrief','sidney-moncrief',34,'Atlanta Hawks','hawks','https://library.sfo2.cdn.digitaloceanspaces.com/publications/basketball/yearbooks/KATLHMG-2021.pdf'),
  (521,'Dominique Wilkins','the-human-highlight-film',34,'Atlanta Hawks','hawks','https://library.sfo2.cdn.digitaloceanspaces.com/publications/basketball/yearbooks/KATLHMG-2021.pdf'),
  (601,'Tracy McGrady','t-mac',34,'Atlanta Hawks','hawks','https://library.sfo2.cdn.digitaloceanspaces.com/publications/basketball/yearbooks/KATLHMG-2021.pdf'),
  (603,'Jason Terry','jason-terry',34,'Atlanta Hawks','hawks','https://library.sfo2.cdn.digitaloceanspaces.com/publications/basketball/yearbooks/KATLHMG-2021.pdf'),
  (608,'Joe Smith','joe-smith',34,'Atlanta Hawks','hawks','https://library.sfo2.cdn.digitaloceanspaces.com/publications/basketball/yearbooks/KATLHMG-2021.pdf'),
  (707,'Ersan İlyasova','charge',34,'Atlanta Hawks','hawks','https://library.sfo2.cdn.digitaloceanspaces.com/publications/basketball/yearbooks/KATLHMG-2021.pdf'),
  (708,'Moses Malone','moses',34,'Atlanta Hawks','hawks','https://library.sfo2.cdn.digitaloceanspaces.com/publications/basketball/yearbooks/KATLHMG-2021.pdf'),
  (903,'Ken Norman','ken-norman',34,'Atlanta Hawks','hawks','https://library.sfo2.cdn.digitaloceanspaces.com/publications/basketball/yearbooks/KATLHMG-2021.pdf'),
  (115,'Vince Carter','vinsanity',35,'Orlando Magic','magic-kingdom','https://magicweb.blob.core.windows.net/resources/communications/orlando-magic-media-guide-2025-26.pdf'),
  (125,'Juwan Howard','juwan',35,'Orlando Magic','magic-kingdom','https://magicweb.blob.core.windows.net/resources/communications/orlando-magic-media-guide-2025-26.pdf'),
  (140,'Shawn Kemp','reign-man',35,'Orlando Magic','magic-kingdom','https://magicweb.blob.core.windows.net/resources/communications/orlando-magic-media-guide-2025-26.pdf'),
  (150,'Cole Anthony','cole',35,'Orlando Magic','magic-kingdom','https://magicweb.blob.core.windows.net/resources/communications/orlando-magic-media-guide-2025-26.pdf'),
  (301,'Anfernee Hardaway','penny',35,'Orlando Magic','magic-kingdom','https://magicweb.blob.core.windows.net/resources/communications/orlando-magic-media-guide-2025-26.pdf'),
  (315,'Tobias Harris','tobias',35,'Orlando Magic','magic-kingdom','https://magicweb.blob.core.windows.net/resources/communications/orlando-magic-media-guide-2025-26.pdf'),
  (333,'Patrick Ewing','the-ewing-theory',35,'Orlando Magic','magic-kingdom','https://magicweb.blob.core.windows.net/resources/communications/orlando-magic-media-guide-2025-26.pdf'),
  (407,'Joe Ingles','ingles',35,'Orlando Magic','magic-kingdom','https://magicweb.blob.core.windows.net/resources/communications/orlando-magic-media-guide-2025-26.pdf'),
  (432,'Shaquille O''Neal','diesel',35,'Orlando Magic','magic-kingdom','https://magicweb.blob.core.windows.net/resources/communications/orlando-magic-media-guide-2025-26.pdf'),
  (433,'Grant Hill','drinks-sprite',35,'Orlando Magic','magic-kingdom','https://magicweb.blob.core.windows.net/resources/communications/orlando-magic-media-guide-2025-26.pdf'),
  (521,'Dominique Wilkins','the-human-highlight-film',35,'Orlando Magic','magic-kingdom','https://magicweb.blob.core.windows.net/resources/communications/orlando-magic-media-guide-2025-26.pdf'),
  (601,'Tracy McGrady','t-mac',35,'Orlando Magic','magic-kingdom','https://magicweb.blob.core.windows.net/resources/communications/orlando-magic-media-guide-2025-26.pdf'),
  (707,'Ersan İlyasova','charge',35,'Orlando Magic','magic-kingdom','https://magicweb.blob.core.windows.net/resources/communications/orlando-magic-media-guide-2025-26.pdf'),
  (1103,'Brandon Jennings','bucks-in-six',35,'Orlando Magic','magic-kingdom','https://magicweb.blob.core.windows.net/resources/communications/orlando-magic-media-guide-2025-26.pdf');
DO $endpoints$
DECLARE problems text;
BEGIN
 SELECT string_agg(s.source_slug||' -> '||s.clan_slug, ', ' ORDER BY s.clan_slug,s.source_slug)
 INTO problems
 FROM clan_audit_seed s
 LEFT JOIN dojo.homie h ON h.id=s.homie_id AND h.name=s.homie_name AND h.tag_slug=s.source_slug
 LEFT JOIN dojo.clan c ON c.id=s.clan_id AND c.name=s.clan_name AND c.slug=s.clan_slug
 LEFT JOIN dojo.tags src ON src.slug=s.source_slug
 LEFT JOIN dojo.tags dst ON dst.slug=s.clan_slug
 WHERE h.id IS NULL OR c.id IS NULL OR src.id IS NULL OR dst.id IS NULL
 OR (SELECT count(*) FROM dojo.homie hh WHERE hh.tag_slug=s.source_slug)<>1
 OR src.href IS DISTINCT FROM '/cardattack/homies/'||s.source_slug
 OR src.href_kind IS DISTINCT FROM 'homie'
 OR src.meta#>>'{identity,kind}' IS DISTINCT FROM 'person'
 OR src.meta#>>'{identity,contexts,cardattack,role}' IS DISTINCT FROM 'homie'
 OR src.meta#>>'{identity,contexts,cardattack,href}' IS DISTINCT FROM '/cardattack/homies/'||s.source_slug
 OR src.meta#>>'{homie_sync,retired}'='true'
 OR (src.meta#>>'{homie_sync,homie_id}' IS NOT NULL AND src.meta#>>'{homie_sync,homie_id}'<>s.homie_id::text)
 OR dojo.homie_tag_reserved_reason(src.id) IS NOT NULL
 OR dst.href IS DISTINCT FROM '/cardattack/clans/'||s.clan_slug
 OR dst.href_kind IS DISTINCT FROM 'clan'
 OR dst.meta#>>'{identity,kind}' IS DISTINCT FROM 'group'
 OR dst.meta#>>'{identity,contexts,cardattack,role}' IS DISTINCT FROM 'clan'
 OR dst.meta#>>'{identity,contexts,cardattack,href}' IS DISTINCT FROM '/cardattack/clans/'||s.clan_slug;
 IF problems IS NOT NULL THEN
  RAISE EXCEPTION '103: missing or changed reviewed endpoint; stop' USING DETAIL=problems;
 END IF;
END;
$endpoints$;
DO $effects$
BEGIN
 IF EXISTS(SELECT 1 FROM clan_audit_seed s
  JOIN dojo.tags src ON src.slug=s.source_slug JOIN dojo.tags dst ON dst.slug=s.clan_slug
  WHERE NOT EXISTS(SELECT 1 FROM dojo.tag_relation r
   WHERE r.source_tag_id=src.id AND r.target_tag_id=dst.id AND r.relation_type='member_of'
    AND r.meta->>'membership_basis'='played_for'
    AND r.meta->>'affiliation_scope'='professional'
    AND r.meta->>'evidence_url' IS NOT NULL)) THEN
  RAISE EXCEPTION '103: reviewed membership/evidence missing; stop';
 END IF;
END;
$effects$;
