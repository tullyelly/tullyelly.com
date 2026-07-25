# CAPABILITIES ; WU-375 (Spike)

**Scope:** We gate features, not public pages. The homie directory is public; snapshot creation and homie updates are gated.

## Grammar & Naming

- **Key format:** `{app}.{area}.{verb}` (lowercase; dots; no spaces).
- **Examples:** `tcdb.snapshot.create`, `tcdb.snapshot.view` (future).
- **Wildcards:** not supported in v1 (explicit keys only).
- **Global kill-switch:** each feature has `enabled BOOLEAN` (ops can disable).

## Initial Feature Keys (v1)

| key                    | app  | description                        | status     |
| ---------------------- | ---- | ---------------------------------- | ---------- |
| `tcdb.snapshot.create` | tcdb | create a homie snapshot via UI/API | **active** |
| `tcdb.homie.update`    | tcdb | update an existing homie           | **active** |
| `tcdb.snapshot.view`   | tcdb | read/inspect snapshot history      | future     |

## Roles (baseline)

- `viewer`: default; no gated features.
- `editor`: can create snapshots and update homies.
- `admin`: full access to seeded features (explicit grants).

## Evaluation Principles

- Deny-by-default; **deny overrides allow**.
- Unknown keys → deny.
- Server is authoritative (`must()`); UI `requires` flags are hints only.
