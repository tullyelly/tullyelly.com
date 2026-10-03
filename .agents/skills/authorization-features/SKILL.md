---
name: authorization-features
description: Change tullyelly authorization features, memberships, grants, server permission gates, or policy revision and invalidation behavior.
---

# Authorization Features

Read [required context](../../../docs/authz/AUTHZ-CONTRACT.md) and the relevant procedures in the
[docs index](../../../docs/README.md).

Read the authz workflow and touched server consumers. Map feature/app scope and every privileged entry point; enforce permissions server-side. Preserve deny precedence and strict revision checks. Use guarded membership actions/functions; for feature/grant changes identify all affected users and preserve revision bumps, notifications, and post-commit invalidation. Keep menu/UI hints aligned and session data request-scoped. Test relevant denial, scope, stale policy, mutation, and freshness cases. Update the owning contract and report live migration verification separately.

Verification is owned by [validation](../../../docs/validation.md); follow its
baseline and applicable additional checks.
