# Wave 87 — P-2 Spec (pointer)

**Source of truth:** `tasks` row `dc4abee3-1e41-41aa-a76b-c65a6b38e457` `.description` (YAML head + `---` + prose). This file is a convenience copy, not canonical.

**wave_type:** single-spec · **claimed_task_ids:** [dc4abee3-1e41-41aa-a76b-c65a6b38e457] · **design_gap_flag:** false

## Acceptance criteria (copy)
1. New PUBLIC-server join (joinPublicServer) → new server_members.role_id = server's is_default role id (not NULL), when such a role exists.
2. New INVITE join (joinViaInvite, ad-hoc or permanent) → same: role_id = server's default role id.
3. Server with NO is_default role → join still succeeds, role_id NULL (behavior-preserving fallback, no throw).
4. Re-join by existing member → existing role_id unchanged (onConflictDoNothing skips insert; never reset to default).
5. No user-visible permission change; invite use-count increment + public/private gating + membership counts unchanged.

## Scope guard
Behavior-preserving data-hygiene. NOT a security fix (T-8 must not rescope to authz). No schema change / migration. Shared `resolveDefaultRoleId(tx, serverId)` feeds both join inserts. B-block caveat: no unique idx on (server_id, is_default) → LIMIT 1 + zero-default NULL fallback; keep backfill-roles.ts live until new-NULL creation drains.
