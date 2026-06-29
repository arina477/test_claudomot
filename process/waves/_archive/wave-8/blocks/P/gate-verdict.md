# Wave 8 — P-4 Gate Verdict (Phase 1, security-tightened)

**Block:** P · **Wave:** 8 (M2 invites + join-flow — multi-user unlock) · **Gate:** P-4 · **Milestone:** M2 (41e61975) · **Wave db id:** 44af7dae
**Security-tightened gate:** APPLIES (invites = access-control surface; user-creation-into-a-server).
**Phase 1 verdict:** **APPROVED → Phase 2 (karen + jenny, mandatory)** — with 2 binding pre-merge carry-forwards (neither is a security gap).

---

## Load-bearing security ACs — all verified TRUE against the as-built codebase

| # | Load-bearing claim | Verdict | Evidence |
|---|---|---|---|
| 1 | Invite codes CSPRNG ≥128-bit, unguessable + non-enumerable; both ad-hoc `invites.code` AND permanent `servers.invite_code` | **PASS** | Plan + spec: `crypto.randomBytes(16).toString('base64url')` (~22 chars, 128-bit), shared util for both tiers. PK strategy already `gen_random_uuid()` (no sequential enumeration). Spec AC explicit + falsifiable. |
| 2 | Public preview GET /invites/:code = minimum-summary only (`{server:{id,name,memberCount}}`), no members/channels; mechanism sound | **PASS** | Verified against code: `app.module.ts` registers ONLY `ThrottlerGuard` as `APP_GUARD` — there is **no** global `AuthGuard`. `servers.controller.ts` applies `@UseGuards(AuthGuard)` per-method. Plan's "no @UseGuards = public" is correct AS-BUILT (the `_library.md` line-105 "JwtAuthGuard applied globally" is stale design intent, never implemented that way — plan correctly cites reality). No global guard to leak through and none to accidentally block. Global ThrottlerGuard still applies → rate-limited public endpoint (a plus on an enumeration target). |
| 3 | POST /invites/:code/join requires a VERIFIED session (not merely authed); unauthed→401, unverified→403 | **PASS** | Verified against code: `auth.guard.ts` runs `verifySession()` with FULL global claim validators (= EmailVerification REQUIRED per `session-no-verify.guard.ts` header comment + fail-closed `EmailVerification.init({mode:'REQUIRED'})`). The relaxed `SessionNoVerifyGuard` exists ONLY for /me + /profile; plan correctly uses `AuthGuard` for join → unauthed 401, unverified 403. |
| 4 | max_uses enforced ATOMICALLY (no concurrent overshoot); idempotent re-join | **PASS (with carry-forward B)** | Single-statement conditional `UPDATE invites SET uses=uses+1 WHERE code=$ AND NOT revoked AND (max_uses IS NULL OR uses<max_uses) AND (expires_at IS NULL OR expires_at>now()) RETURNING server_id` → atomic, no overshoot. Re-join idempotency via `INSERT server_members ON CONFLICT (server_id,user_id) DO NOTHING` — verified the `unique().on(server_id,user_id)` constraint exists in `db/schema/servers.ts:27`. |

**Data model:** invites table (FK→servers cascade) + `servers.invite_code` (unique, backfilled in-migration) are net-new — confirmed no `invites.ts` schema / `apps/api/src/invites` dir exists yet, correctly planned as one migration with a CSPRNG backfill data step. design/invite-join.html confirmed present (24 KB) → D-block is validate/compose (TRUE-delta), not net-new.

## Stage-exit checklist (P-0→P-3)
- **P-0 Frame:** PASS — problem-framer PROCEED + ceo-reviewer PROCEED(HOLD-SCOPE) both present + reconciled; cited to M2 (41e61975); 4 security flags raised → carried to P-2/T-8. Falsifiable signal: organizer shares link → cohort member joins → lands in server with channels.
- **P-1 Decompose:** PASS — one coherent multi-user-unlock vertical slice (4 tightly-coupled tasks); backend-before-frontend dependency order intact; no out-of-bundle dependency. mvp-thinner correctly SKIP (platform-foundation, not product-feature class).
- **P-2 Spec:** PASS — ACs enumerated + independently verifiable; states covered (join page: loading/valid/invalid-or-expired/already-member/joining/joined); non-goals explicit (NO RBAC/kick-ban/settings, NO realtime); auth/user-creation surface flagged for tightened gate; full spec contract embedded as fenced YAML at head of seed task description (verified in DB).
- **P-3 Plan:** PASS with carry-forward A — reuses keyset/idempotency/membership patterns; introduces no MVP-unneeded infra (no Redis/multi-replica/billing); each step maps to a bundle task + observable artifact. **One architecture deviation flagged (A).**

## Carry-forwards (binding, B-block — NOT security-gate REWORK triggers)
- **(A) Module placement vs locked architecture.** P-3 proposes a standalone `InvitesModule` at `apps/api/src/invites/`. Locked decision #3 in `_library.md` ("`invites` table owned by ServersModule — no standalone Invite module") + #2/#3 co-location rationale say invites belong inside **ServersModule**. The `_library.md` "wins on any conflict." head-builder MUST either fold the invite service/controller into ServersModule per decision #3, or record an explicit justified deviation in product-decisions. Mechanical, low-cost; does not change contract or security posture.
- **(B) Re-join must not burn a use-slot.** Spec edge-case requires "re-join = no-op 200, doesn't double-increment." The plan's sketched order (conditional UPDATE-then-INSERT-ON-CONFLICT) would increment `uses` even when the membership insert no-ops for an existing member → a re-joining member consumes a max_uses slot. B-block must order so the increment happens only when a NEW membership row is created (e.g. INSERT…ON CONFLICT…RETURNING gate, or membership pre-check, within one txn). The spec (the contract) is correct; only the plan sketch is naive. **T-8 must add a re-join-doesn't-double-increment assertion** alongside the already-planned code-non-enumerability + verified-join-gate + max_uses-concurrency probes.

## Scope / gold-plating
PASS — owner/member only; two-tier invite is locked decision #4 (right-sized, not gold-plated); RBAC/kick-ban/settings + realtime correctly deferred. No premature compliance/multi-tenant/billing. NOTE (from ceo-reviewer): "see channels per role" completes with the deferred RBAC bundle — do NOT mark the M2 success metric fully closed at this wave.

## Specialists
database-administrator/postgres-pro, backend-developer, head-designer, react-specialist — all valid per AGENTS.md and correctly matched to the 4 blocks.

---

```yaml
head_signoff:
  verdict: APPROVED
  stage: P-4
  phase: 1
  security_tightened_gate: APPLIES
  reviewers: {}   # Phase 2: karen + jenny mandatory before final block-exit
  failed_checks: []
  load_bearing_security: { entropy: PASS, public_preview: PASS, verified_join: PASS, atomic_max_uses: PASS }
  carry_forwards:
    - "A: fold InvitesModule into ServersModule per locked architecture decision #3 (or justify) — B-block"
    - "B: re-join must not double-increment uses (spec AC); B-block ordering + T-8 assertion"
  design_gap_flag: true   # TRUE-delta — invite-join.html exists; D-block validates/composes
  rationale: >
    All four load-bearing invite security ACs verify TRUE against the as-built codebase, not just
    the spec: CSPRNG 128-bit non-enumerable codes for both invite tiers; minimum-summary public
    preview with a sound no-global-guard public-route mechanism (app.module.ts registers only
    ThrottlerGuard; servers.controller uses per-method AuthGuard — plan cites reality over the stale
    _library line 105); verified-session join via AuthGuard (full EmailVerification-REQUIRED claims,
    not the relaxed SessionNoVerifyGuard) → 401 unauthed / 403 unverified; atomic single-statement
    conditional max_uses update + ON CONFLICT(server_id,user_id) idempotent re-join against the
    confirmed unique constraint. Scope is held to the multi-user wedge (no RBAC/realtime/billing).
    Two real but non-security findings (module placement vs locked decision #3; re-join use-slot
    burn) are recorded as binding B-block/T-8 carry-forwards — both cheaply correctable with the
    spec contract already correct, neither a load-bearing security gap. Build-ready → proceed to the
    mandatory Phase-2 karen + jenny pool under the tightened gate.
  next_action: PROCEED_TO_P4_PHASE2_REVIEWERS
```

---
## Phase 2 — Karen + jenny + Gemini — PASS
- **Karen APPROVE** — 9/9 claims VERIFIED vs live: CSPRNG randomBytes(16) 128-bit; no global AuthGuard (only ThrottlerGuard) → unguarded GET=public; AuthGuard=verifySession verified-only (NoVerify scoped to /me+/profile); server_members UNIQUE(server_id,user_id) → ON CONFLICT idempotent; conditional max_uses UPDATE…RETURNING serializes (no overshoot); specialists cataloged; two-tier=locked #4 (not gold-plating). 
- **jenny APPROVE** — 4/4 blocks MATCH; delivers the join (multi-user) half of M2 success metric; RBAC/"per-role channel visibility"/kick-ban/settings/realtime correctly DEFERRED (M2 NOT fully closed at this wave). revoked column schema-forward (no revoke endpoint this wave — acceptable).
- **Gemini CONCERN (non-material)** — two-tier dual-source: locked arch #4 + standard Discord pattern (permanent share-link + revocable ad-hoc); defensible, kept clean via one resolver.
## BINDING CARRY-FORWARDS to B (both CONFIRMED by Karen + jenny):
- **(A) ServersModule, NOT standalone InvitesModule** — arch decision #3 (invites live in ServersModule); P-3 drifted ("apps/api/src/invites/"). B-0/B-2: build invite schema/service/controller INSIDE ServersModule.
- **(B) re-join no-double-increment (genuine defect in P-3's SQL order)** — P-3 sketched UPDATE-uses++ THEN INSERT-ON-CONFLICT → burns a use-slot on an existing-member re-join. B MUST reorder: INSERT server_members RETURNING first, increment uses ONLY when a new row is returned, one txn. T-8 MUST assert re-join non-increment + use DISTINCT users for the max_uses=1 concurrency test.
GATE: PASS → D-block (design_gap_flag TRUE-delta: validate design/invite-join.html + compose the share modal). Security-tightened gate satisfied. T-8 mandatory (code non-enumerability + verified-join + max_uses concurrency + re-join non-increment).
