# Wave 10 — P-4 Gate Verdict (Phase 1)

**Block:** P · **Wave:** 10 (wave_db_id abe06365) · **Milestone:** M2 41e61975 · **Stage:** P-4 · **Gate type:** SECURITY-TIGHTENED (RBAC = access-control core, highest-stakes M2 gate)
**Tasks:** 35f191f4 (RbacModule seed) · 2c927c44 (channel-perm-overrides + guard) · 7a10f13d (owner-lockout) · 0b9bcf35 (role-mgmt UI)

## VERDICT: APPROVED (Phase 1) → proceed to Phase 2 (karen + jenny mandatory)

One carry-instruction (architecture table-name reconciliation, B-0). Not a blocker — semantics unaffected, no security gap fires.

---

## Upstream stage-exit checkboxes (ticked from artifacts, not inferred)

- [x] P-0 frame: problem-framer PROCEED (cause-layer: role_id nullable scaffold, no roles/RbacService/guard today; channel access = membership-only). ceo-reviewer PROCEED-HOLD-SCOPE (closes M2 last success-metric clause; v6b-thinned model IS the scope). mvp-thinner SKIP (platform-foundation). Both reviewers reconciled.
- [x] P-1 decompose: one required dependency chain (foundation → channel-gating → owner-lockout → UI); KEEP WHOLE justified (splitting ships half-RBAC = success metric unmet); only defensible seam recorded if B proves too big.
- [x] P-2 spec: 4-block, ACs independently verifiable; all six load-bearing enforcement claims encoded; embedded as fenced YAML at head of primary task description (DB row verified).
- [x] P-3 plan: reuses locked architecture (guard composition L107, RbacService.can single entry L317, session-userId, keyset-unaffected); no MVP-excess infra (no Redis/multi-replica/billing); each step maps to a bundle task.
- [x] design_gap_flag TRUE — server-settings.html EXISTS (44KB, verified) → roles-tab is a content/interaction delta (D-block, not net-new page). Correct handoff.

## Security-tightened enforcement audit (each = load-bearing; verified buildable against live code)

| Surface | Spec AC | Live-code support | Verdict |
|---|---|---|---|
| **can() SERVER-SIDE + owner-superuser + default-DENY** | AC2/35f191f4: owner_id→true; else role flag; no role/flag→false; gates every mgmt action | `servers.owner_id` (text, SuperTokens id) present; `server_members.role_id` nullable scaffold present | PASS |
| **userId from session (no IDOR)** | AC3/35f191f4 + arch L107 (guard reads params/session, never body) | `findServerDetail(userId, serverId)` already takes session userId; guard-composition pattern locked L107 | PASS |
| **no self-promote** | AC3/35f191f4: assign-role gated can(manage_members); Member lacks it → 403 | derivable from can() + role flags | PASS |
| **guard reads ROUTE PARAMS (no body-spoof)** | AC3/2c927c44 + arch L107 explicit | guard-composition pattern locked; `@UseGuards(JwtAuthGuard, ChannelPermissionGuard)` | PASS |
| **channel-list server-side filter (no enumeration)** | AC2/2c927c44: findServerDetail filters channels by caller visibility, non-visible ABSENT | live `findServerDetail` currently returns ALL channels (no filter) → real, buildable delta; takes userId already | PASS (delta confirmed) |
| **private channel default-DENY** | AC1/2c927c44: is_private → deny unless override grants role | `channels.is_private` (bool default false) scaffold present (wave-8) | PASS |
| **owner-lockout TRANSACTIONAL** | AC1/7a10f13d: in-txn re-check / row-lock; concurrent demote+leave → owner remains; 409 | enforced in service paths; no schema obstacle | PASS |

No REWORK trigger fires: can() IS server-side; self-promote IS blocked; guard IS route-params; channel-list IS server-filtered; owner-lockout IS transactional. T-8 plan (P-3 L22) covers all six probes + IDOR + body-spoof + enumeration + concurrent-race.

## Architecture conformance

- [x] **#6 single-role-per-member** respected: one `server_members.role_id` FK, no many-to-many join. Plan + spec + live scaffold all single-role.
- [x] **#3 module placement**: RbacModule as cohesive module imported by/alongside ServersModule is acceptable (P-3 L9, L23; arch L58 explicitly lists RbacModule as its own module owning roles/overrides). No parallel-path invention.
- [x] **owner_id canonical superuser** preserved (not folded into a role).
- [x] **Permission model = boolean columns on `roles`** (not a `role_permissions` join table) — matches decision #6 (L573, the conflict-resolution table that wins). Note: module-list prose L58 names a `role_permissions` table, which contradicts #6 in the same doc; #6 is authoritative → boolean-columns is correct. Plan follows #6. No action needed beyond awareness.

### CARRY to B-0 (table-name reconciliation — non-blocking)

`_library.md` self-declares "**This document wins on any conflict across branches**" and names the channel-override table **`permissions`** (`UNIQUE (channel_id, role_id)`, L144 Databases table + #6 L573). The spec/plan name it **`channel_permission_overrides`**. P-0 flagged this exact reconciliation; P-2 resolved to `channel_permission_overrides` without recording why the authoritative library name was overridden. Constraint shape is identical; enforcement semantics unaffected; spec is internally consistent + buildable as written → NOT a security gap, does not block. **B-0 instruction:** EITHER (a) name the table `permissions` per the authoritative library, OR (b) keep `channel_permission_overrides` AND append a product-decisions.md entry recording the deliberate override of the library name (clearer/explicit name for a channel-scoped override table). Either is defensible; the drift must not silently reach the migration. Hand to B-0 (database-administrator/postgres-pro) for the call.

## Scope discipline (self-use-mvp wedge)

- [x] SMALL fixed permission set (manage_server/roles/channels/members) — NO permission-matrix, custom-builder, or hierarchy (the v6b-thinned model). Not gold-plated.
- [x] Not too thin — cutting any chain piece ships unenforced/unsafe/unusable RBAC (ceo-reviewer concurs).
- [x] Backfill app-side (per wave-9 lesson, NOT pgcrypto) — P-3 L7.
- [x] Ownership transfer deferred (invariant just blocks) — appropriate MVP scope, not premature.

## Carry-forwards to downstream blocks

- **B-block (ESCALATION-CRITICAL):** verified-prod-fixture 4a2ad286 — 3rd+ authed wave without a live-verify fixture; RBAC authed paths REQUIRE live verification. Flag at B / C-2.
- **B-0:** table-name reconciliation (above) + FK add on `server_members.role_id` → `roles.id` + `channel_permission_overrides.role_id`/`channel_id` cascades + `unique(channel_id, role_id)`.
- **Phase 2 (mandatory):** karen — verify load-bearing claims (live scaffolds, guard-composition pattern, findServerDetail signature, table-name divergence) against codebase line-by-line. jenny — verify spec matches M2 bet ("channels per role") + the v6b-thinned arch (no scope drift to matrix/hierarchy).

---

```yaml
head_signoff:
  verdict: APPROVED
  stage: P-4
  phase: 1
  reviewers: { problem-framer: PROCEED, ceo-reviewer: PROCEED-HOLD-SCOPE, mvp-thinner: SKIP }
  failed_checks: []
  security_tightened: true
  load_bearing_enforcement_audit: PASS  # can()-server-side, no-self-promote, guard-route-params, channel-list-filter, private-default-deny, owner-lockout-txn
  design_gap_flag: true
  carry_instructions:
    - "B-0: reconcile channel-override table name (_library 'permissions' wins-on-conflict vs spec 'channel_permission_overrides') — rename OR record override in product-decisions.md; do not let drift reach migration"
    - "B: verified-prod-fixture 4a2ad286 ESCALATION-CRITICAL — RBAC authed paths need live verification"
  rationale: >
    All six load-bearing server-side enforcement claims (can() server-side + owner-superuser + default-DENY + session-userId;
    no-self-promote; guard route-params-only; server-side channel-list filtering; private default-deny; transactional owner-lockout)
    are present in the P-2 spec ACs and confirmed buildable against the live scaffolds (server_members.role_id nullable,
    channels.is_private, findServerDetail(userId,serverId) returning unfiltered channels = a real delta). No REWORK security
    trigger fires. Architecture #6 (single-role) and #3 (RbacModule placement) respected; scope is the v6b-thinned fixed-flag
    model, neither gold-plated nor too thin. The one divergence — the channel-override table name vs the authoritative library's
    'permissions' — is a naming reconciliation with identical constraint shape and zero enforcement impact, carried to B-0 as an
    explicit instruction rather than blocking the gate. design_gap_flag correctly TRUE (server-settings.html exists → roles-tab delta).
  next_action: PROCEED_TO_P-4_PHASE_2  # karen + jenny mandatory before final block-exit
```

---
## Phase 2 — Karen + jenny (Gemini UNAVAILABLE-transient, advisory) — PASS
- **Karen APPROVE** — 9/9 claims VERIFIED claim→code: scaffolds exist (role_id/owner_id/is_private); findServerDetail returns ALL channels (filter is a real delta); guard-composition supports route-param ChannelPermissionGuard; owner-gate + TOCTOU-txn precedents live (revokeInvite/joinViaInvite); #6 boolean-flags (no join table); specialists cataloged; no gold-plating/fake. TABLE NAME → RECORD-OVERRIDE (keep channel_permission_overrides; _library self-contradictory). B-0 carry: product-decisions entry (DONE) + UNIQUE(channel_id,role_id)+INDEX(channel_id).
- **jenny APPROVE** — 4/4 blocks MATCH; closes M2 success-metric "channels per role"; no over-reach (no matrix/builder/hierarchy/multi-role); #6 respected; last M2 feature bundle; scaffolds code-verified. Stale _library permissions/role_permissions = optional L-housekeeping.
GATE: PASS → D-block (TRUE-delta server-settings roles tab). Security-tightened satisfied. CARRY to B: table=channel_permission_overrides (logged); server-side can()/default-deny/no-self-promote/route-param-guard/channel-list-filter/txn-owner-lockout; verified-prod-fixture 4a2ad286 ESCALATION-CRITICAL for B live-verify. Build order: RbacModule → channel-overrides+guard ∥ owner-lockout → UI.
