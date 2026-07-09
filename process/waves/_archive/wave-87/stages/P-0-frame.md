# Wave 87 — P-0 Frame

## Discover

- **wave_db_id:** 2c9f024d-4ac0-41a8-8f1b-4cac82d5289f (wave_number 87, status=running)
- **Prior-work citation:** wave-9 authored `apps/api/src/db/backfill-roles.ts` (default-role seeding + NULL-role member backfill) and the per-server `is_default=true` role at `createServer`. wave-67 V-1 (F67-T5-2, jenny) surfaced the residual NULL-role-on-join observation that seeded this wave.
- **Roadmap milestone:** unassigned (roadmap complete; founder bug-fix phase).
- **Spec-contract short-circuit verdict:** `no-prior-spec` → full P-1..P-3.
- **Product-decision resolutions:** none (no Tier-3 signal; behavior-preserving hygiene fix — see Reframe).

### Grounding evidence (verified this stage — for karen spot-check at P-4)
- `createServer` seeds a per-server default role: `roles.values({ name:'Member', …all-flags-false, is_default:true, position:0 })` — `apps/api/src/servers/servers.service.ts:102-110`.
- `joinPublicServer` inserts membership with only `{ server_id, user_id }` (no role_id → NULL) — `servers.service.ts:709-710`.
- `joinViaInvite` inserts membership with only `{ server_id, user_id }` (no role_id → NULL) — `servers.service.ts:752-753`. Both join cores are byte-identical inserts.
- `backfill-roles.ts` exists to repair exactly this: upsert default 'Member' role per server, then `UPDATE server_members SET role_id = <default> WHERE role_id IS NULL` — idempotent, re-runnable — `apps/api/src/db/backfill-roles.ts:47-80`.
- RBAC resolution (per problem-framer, verified): `rbac.service.ts` `can()` default-denies NULL role_id but every caller is a management/moderation route (denying a plain member those is correct); `canViewChannel()` explicitly treats NULL as implicit base member (public channels visible, private default-deny). Base-member message send/read run through the base-member lane. → NULL ≡ default-'Member' (all flags false) at the permission layer.

## Reframe

### Original task framing (seed dc4abee3)
"joinPublicServer + joinViaInvite insert server_members with role_id=NULL. Open RBAC question: should a joining member be assigned a default member role, or is NULL the intended 'plain member' state? If RBAC keys on role_id, NULL-role members may misbehave (denied base actions)." — framed as a possible **RBAC security/correctness gap**.

### problem-framer verdict — REFRAME
`process/waves/wave-87/stages/P-0-problem-framer.md`. Matched antipatterns #1 (symptom-vs-cause) and #6 (no-consumer assignment). **NULL role_id is the INTENDED SAFE base-member state, not an RBAC gap** — the security framing EVAPORATES (same shape as the ParseUUIDPipe seed this wave's own history anticipated). RBAC has two lanes: privileged (`can()` correctly denies NULL) and base-member (`canViewChannel()` treats NULL as implicit base member). A blind "assign a default role because the finding said so" would be a **no-op behavior change / RBAC churn**. Reduces the seed to an OPTIONAL, behavior-preserving legibility/data-hygiene item: converge new-join role_id onto the existing default 'Member' role so the live tree matches the backfilled invariant. Explicitly NOT a security fix.

### ceo-reviewer verdict — PROCEED (HOLD-SCOPE), conditional
`process/waves/wave-87/stages/P-0-ceo-reviewer.md`. Value is contingent on the gap-vs-safe finding: if a real gap → core-wedge correctness, PROCEED; if intended-safe → thin, converge or re-seed, don't inflate a hollow wave. Load-bearing scope check it demanded P-1/P-2 resolve: **does a per-server default role already exist?** — resolved YES (verified above: `createServer` seeds it, backfill maintains it). So this is NOT a roles-seeding/migration feature; it is a one-point shared-core convergence. Near-zero blast radius (zero external users; near-zero NULL rows), which makes now the cheap, correctly-timed moment.

### Merge / mediation outcome
Both reviewers **converged on the same reframed target** (behavior-preserving convergence onto the existing default role), with no conflict and no hard-stop. Per P-0 Action 6, a REFRAME normally re-spawns reviewers so the *new* framing gets independent eyes — but here the new framing was **produced by the reviewers themselves in agreement**, and ceo-reviewer's one open scope question (does a default role exist?) is answered YES by verified code. Re-spawning would ask them to re-review their own converged conclusion — pure churn. Orchestrator adopts the reframe at head-product altitude and PROCEEDS. (mvp-thinner not spawned — no active `product-feature` milestone; roadmap complete.)

### Disposition: REFRAMED → PROCEED to P-1

### Final framing the rest of P-block will use
**Converge new-join role assignment onto the server's existing default 'Member' role, in the shared membership-insert core, so `joinPublicServer` and `joinViaInvite` stop creating `role_id`-NULL rows.**
- **Scope:** in each join transaction, resolve the server's `is_default=true` role id and set `role_id` on the `server_members` insert. Apply once in a shared path so both join routes inherit it.
- **Invariant closed:** new joins match what `backfill-roles.ts` already enforces (no member with NULL role_id) → the backfill becomes purely historical rather than a perpetually-required repair.
- **Behavior-preserving:** the default 'Member' role has all permission flags false — identical permission surface to NULL at the RBAC layer. No user-visible behavior change; this is data-hygiene, not a permission change.
- **Explicitly NOT a security fix.** T-8 security must not over-scope this into an authz change. The `wave_touches` set does NOT include auth/sessions/csrf — no P-4 security-tightened gate.
- **Testable ACs:** after `joinPublicServer` / `joinViaInvite`, the new `server_members` row has `role_id` = the server's `is_default=true` role (not NULL); re-join remains idempotent; existing member counts / permission behavior unchanged.
