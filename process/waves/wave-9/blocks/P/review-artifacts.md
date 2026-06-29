# Wave 9 — P-block review artifacts
**Block:** P · **Wave topic:** M2 invite-completion (revoke endpoint+UI + share-modal-permanent-default + invite_code backfill) · **Gate:** P-4 · **Status:** in-progress
| Stage | Deliverable | Status |
|---|---|---|
| P-0 | stages/P-0-frame.md | done (PROCEED; revoke-authz + 404-honesty + idempotent-backfill flags; design TRUE-delta) |
| P-1 | done (multi-spec, whole, 8a→8b→revoke) |
| P-2 | done (3-block; revoke-authz + 404 + idempotent-backfill) |
| P-3..P-4 | pending | |
## Context
- wave_db_id 88aff17b (wave 9); M2 41e61975. claimed [863c10ef invite-revoke (seed), 5331b7d5 share-modal-permanent (8b), 08ff762f invite_code-backfill (8a)]. Finishes the invites feature (wave-8 deferrals/drifts). UI wave (revoke UI + share modal) → D-block delta likely.
- BOARD binding conditions (wave-8 N): (1) RBAC is wave-10's seed unconditionally. (2) backfill must be idempotent + collision-safe vs UNIQUE(invite_code), CSPRNG, committed migration (not auto-migrate). (3) invite-revoke needs honest revoked-link affordance + server-side authorization; T-8 applies (access-control surface). 
- Builds on wave-8 invites (invites table has `revoked` column already — schema-forward; this wave wires the endpoint+UI). PUSH after each stage (BUILD rule 2). Autonomous mode: automatic.
