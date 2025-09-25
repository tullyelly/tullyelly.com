SEEDS PLAN ; WU-375 (Spike)
Actual SQL lands in WU-376.

Apps
Insert into dojo.authz_app: ('tcdb','TCDB', is_public=true).

Features
Insert into dojo.authz_feature:

tcdb.snapshot.create ; “create homie snapshot”

tcdb.snapshot.view ; “view snapshot history” (future)

Roles
viewer, editor, admin.

Grants (dojo.authz_role_feature)
viewer: (none for v1)

editor: allow tcdb.snapshot.create

admin: allow all seeded features (explicit rows)

User Mapping (dojo.authz_user_role)
Map my NextAuth user (auth.users.id) to admin.

Example (illustrative; implement in WU-376)
sql
Copy code
-- app
INSERT INTO dojo.authz_app (slug, name, is_public) VALUES ('tcdb','TCDB', true);

-- features
INSERT INTO dojo.authz_feature (app_id, key, description)
SELECT id, 'tcdb.snapshot.create', 'create homie snapshot' FROM dojo.authz_app WHERE slug='tcdb';
INSERT INTO dojo.authz_feature (app_id, key, description)
SELECT id, 'tcdb.snapshot.view', 'view snapshot history' FROM dojo.authz_app WHERE slug='tcdb';

-- roles
INSERT INTO dojo.authz_role (name, description) VALUES
('viewer','default viewer'),
('editor','can create snapshots'),
('admin','full access');

-- grants (editor → create)
INSERT INTO dojo.authz_role_feature (role_id, feature_id, effect)
SELECT r.id, f.id, 'allow'
FROM dojo.authz_role r, dojo.authz_feature f
WHERE r.name='editor' AND f.key='tcdb.snapshot.create';

-- grants (admin → all)
INSERT INTO dojo.authz_role_feature (role_id, feature_id, effect)
SELECT r.id, f.id, 'allow'
FROM dojo.authz_role r, dojo.authz_feature f
WHERE r.name='admin';
