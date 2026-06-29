# Wave 9 — P-4 Gate Verdict (M2 invite-completion)

**Block:** P · **Stage:** P-4 · **Wave:** 9 (db_id 88aff17b) · **Milestone:** M2 41e61975
**Gate type:** Security-tightened (revoke = access-control surface; T-8 applies)
**Phase:** 1 (head-product checklist gate)
**Tasks:** 08ff762f (8a backfill), 5331b7d5 (8b permanent-default), 863c10ef (revoke seed)

## VERDICT: REWORK

Build-readiness is blocked by ONE load-bearing infrastructure gap in the 8a
backfill plan. Everything else (revoke authz design, revoked→404 honesty,
idempotency, scope discipline, design delta) checks out and is build-ready.
Fix the cited 8a gen mechanism and this is a clean APPROVED → Phase 2.

---

## Load-bearing finding (the REWORK cause)

**8a backfill gen mechanism is unavailable in the database.**

The P-3 plan (P-3-plan.md line 4) and the spec prose specify the migration uses
`gen_random_bytes(16)`:

```
UPDATE servers SET invite_code = translate(encode(gen_random_bytes(16),'base64'),'+/=','-_') WHERE invite_code IS NULL
```

`gen_random_bytes` ships with the **pgcrypto** extension, which is **NOT installed**
in this database. Verified live:

```
SELECT gen_random_bytes(16);
→ ERROR: function gen_random_bytes(integer) does not exist
SELECT extname FROM pg_extension WHERE extname='pgcrypto';  → (0 rows)
SELECT gen_random_uuid();  → da444e4d-...  (works — core PG 13+, NOT pgcrypto)
```

The plan's parenthetical "pgcrypto gen_random_bytes = CSPRNG" assumed pgcrypto is
present. It is not. As written, the migration would fail at C-2 `db:migrate`.

### Required fix (cited) — prefer the app-side gen that wave-8 already uses

The wave-8 code already solves CSPRNG invite-code generation **app-side**, not in
SQL. `apps/api/src/servers/servers.service.ts:25`:

```ts
return randomBytes(16).toString('base64url');   // node:crypto — the locked pattern
```

This is the established, architecture-consistent generator. The backfill must
reuse it, not invent a parallel SQL-CSPRNG path (architecture-blind-plan
anti-pattern). Two acceptable shapes, in preference order:

1. **App-side data-migration script** (preferred — matches the locked pattern):
   a drizzle/SQL migration that runs a committed seed/backfill step generating
   each code via `randomBytes(16).toString('base64url')` in JS, looping rows
   `WHERE invite_code IS NULL`, with the **23505 retry already proven at
   servers.service.ts:203-233** for the rare UNIQUE(invite_code) collision.
   Idempotent (only NULL rows). Committed, NOT auto-migrate-on-boot.

2. **Enable pgcrypto first** (`CREATE EXTENSION IF NOT EXISTS pgcrypto;` as the
   first statement of the same committed migration) THEN use the SQL
   `gen_random_bytes` expression. Acceptable ONLY if collision handling vs
   UNIQUE(invite_code) is genuinely solved (a bare bulk `UPDATE` cannot retry a
   per-row 23505 — it aborts the whole statement). Option 1 is strictly safer
   and stays on the locked pattern; option 2 requires the extension-enable to be
   committed and the collision strategy spelled out.

**Builder must NOT use `gen_random_bytes` without first committing
`CREATE EXTENSION pgcrypto` — flag carried to B-0.** Recommend option 1.

> Live-effect note: 0 prod servers today, so the backfill's real value is
> forward-safety + correctness/re-runnability (spec AC2 already states this).
> That does NOT lower the bar — the migration must still apply cleanly at C-2.

---

## Stage-exit checklist (walked from artifacts)

### P-0 Frame — PASS
- [x] Root cause, concrete job: revoke = the missing WRITE verb of a lifecycle whose READ path already 404s on revoked. Not a symptom.
- [x] One live bet / milestone: M2 41e61975 (invites = Discord-parity acquisition surface). Cited.
- [x] Falsifiable: revoke→preview+join 404; backfill→no NULL invite_code; observable.
- [x] problem-framer PROCEED + ceo-reviewer PROCEED(HOLD-SCOPE) present and reconciled; mvp-thinner correctly SKIP (platform-foundation).

### P-1 Decompose — PASS
- [x] One coherent completion bundle (revoke + 2 wave-8 drift fixes), same subsystem (ServersModule invites + InviteShareModal). Kept whole — justified, not splittable.
- [x] Every AC mvp-critical to "invites lifecycle is complete."
- [x] Build order 8a→8b→revoke respects the dependency (permanent code must exist before modal defaults to it). No dep on unbuilt out-of-bundle task.

### P-2 Spec — PASS (one mechanism defect, see Load-bearing finding)
- [x] ACs enumerated, each independently verifiable.
- [x] Edge cases present: non-owner/non-creator→403, re-revoke idempotent, revoked→preview+join 404, NULL-code fallback, no-ad-hoc-row-on-plain-open, permanent-code-not-revocable (rotation out of scope).
- [x] Non-goals explicit: NO RBAC (wave-10), kick/ban, settings, analytics/audit/expiry-UI.
- [x] Access-control surface (revoke) flagged for the tightened security gate + T-8.
- [x] Full spec contract embedded as fenced YAML at head of seed task 863c10ef description (verified via DB read).
- [~] 8a AC names CSPRNG + idempotent + collision-safe + committed correctly, but the *prose mechanism* (`gen_random_bytes`) is unavailable — see fix above. AC intent is sound; the named primitive is wrong.

### P-3 Plan — REWORK (the gate-blocking item)
- [x] Revoke reuses ServersModule (arch #3) + the existing read-path revoked-filter; does not invent a parallel resolution path.
- [x] No unjustified infra (no Redis/multi-replica/billing).
- [x] Each step maps to a bundle task + observable artifact.
- [ ] **8a step specifies an unavailable primitive (`gen_random_bytes`/pgcrypto absent) and diverges from the locked app-side `randomBytes` generator.** Architecture-blind + infra-unavailable. Must be reworked to option 1 (preferred) or option 2 with committed `CREATE EXTENSION`.

---

## Security-tightened judgments (revoke = access control)

- **Revoke authz — PASS (design).** Plan: POST /invites/:code/revoke under AuthGuard; authorize caller == servers.owner_id OR == invites.created_by, else 403. Server-side, not client-trusted. RBAC-"admin" correctly deferred to wave-10 (BOARD-bound). Both authz columns exist (invites.created_by NOT NULL; servers.owner_id NOT NULL — schema confirmed). T-8 must test 403 for non-owner/non-creator.
- **Revoked honesty — PASS (confirmed against wave-8 code).** The read path ALREADY filters revoked, so revoke just flips the flag and existing reads honor it:
  - Preview ad-hoc: `validateInviteActive(adHocInvite)` (servers.service.ts:251) throws on `invite.revoked` (line 38) → 404. CONFIRMED.
  - Join ad-hoc: same `validateInviteActive` inside the txn (line 325) PLUS the atomic consume re-checks `AND NOT ${invites.revoked}` (line 374). CONFIRMED.
  - Permanent servers.invite_code has no `revoked` concept — correct: revoke applies to invites-table rows only; permanent-code rotation is explicitly out of scope (spec edge-case). No leak.
  - Idempotent re-revoke: planned (set revoked=true → 200/no-op). T-8 must assert.
- **8a backfill — PARTIAL.** Idempotent (WHERE NULL) ✓, committed (not auto-migrate) ✓, CSPRNG-intended ✓, collision-aware (23505-retry pattern exists at :203-233) ✓ — BUT the gen primitive is unavailable (see Load-bearing finding). The 23505-retry only works with the app-side loop (option 1); a bare bulk SQL UPDATE cannot per-row retry.
- **8a→8b ordering — PASS.** Backfill lands first (B-0) so the permanent code exists before the modal defaults to it; 8b spec also mandates NULL-code graceful fallback (belt-and-suspenders).
- **8b member-exposure — PASS (scoped).** servers.invite_code exposed to MEMBERS in server detail (or a member-gated GET /servers/:id/invite-code) behind AuthGuard + server membership. Not public, no non-member leak. Modal stops minting ad-hoc on open (kills row accumulation) — the wave-8 V-1 drift fix. Confirmed the mint-on-open exists today: InviteShareModal `useEffect → fetchInvite → createInvite(serverId)` (InviteShareModal.tsx:81-90) is exactly what 8b must replace.

## Other gate items
- **design_gap_flag TRUE-delta — PASS.** Revoke affordance + share-modal-default change against existing design/invite-share.html → D-block composes deltas only. Correct.
- **Scope / gold-plating — PASS.** No RBAC/kick-ban/settings/analytics/audit/expiry-UI. Right-sized completion bundle. Holds the wedge.
- **T-8 planned coverage — PASS.** Plan names: revoke authz (403 non-owner/creator) + revoked→404 preview+join + backfill idempotency. All three present.

---

## Next action
REWORK_P-3 → return to P-3 author with the single cited fix: replace the 8a
`gen_random_bytes` mechanism with the locked app-side `randomBytes(16).toString('base64url')`
backfill (option 1, preferred) reusing the 23505-retry, OR commit
`CREATE EXTENSION IF NOT EXISTS pgcrypto` ahead of the SQL gen (option 2) with an
explicit per-row collision strategy. Re-run P-4 Phase 1 on the corrected plan;
on PASS proceed to Phase 2 (karen + jenny mandatory) before block-exit APPROVED.

```yaml
head_signoff:
  verdict: REWORK
  stage: P-4
  phase: 1
  reviewers: {}   # Phase 2 (karen + jenny) gated behind Phase-1 PASS — not yet spawned
  failed_checks:
    - "P-3: 8a backfill specifies gen_random_bytes (pgcrypto) — extension NOT installed; migration would fail at C-2 db:migrate"
    - "P-3: 8a gen diverges from the locked app-side randomBytes generator (servers.service.ts:25); architecture-blind parallel path"
  passed_security_checks:
    - "revoke authz: server-side owner_id||invites.created_by, 403 otherwise (both columns exist)"
    - "revoked->404: confirmed in wave-8 read path (validateInviteActive svc:38/251/325 + atomic NOT revoked svc:374)"
    - "8a idempotent (WHERE NULL) + committed (not auto-migrate) + 23505-retry pattern available"
    - "8b member-gated invite_code exposure, no non-member leak; mint-on-open confirmed present (InviteShareModal.tsx:81-90) for removal"
  rationale: >
    All framing, decomposition, spec, security, and scope checks pass and the wave
    is build-ready in every dimension except one load-bearing infrastructure fact:
    the 8a backfill plan calls gen_random_bytes, which requires pgcrypto, and
    pgcrypto is not installed in this database (verified live: function does not
    exist; 0 rows in pg_extension). As written the migration aborts at C-2. The fix
    is cited and small — reuse the wave-8 app-side randomBytes generator (the locked
    pattern) with the existing 23505 collision retry, or commit CREATE EXTENSION
    pgcrypto with an explicit collision strategy. Revoke access-control design is
    sound (server-side owner/creator gating, 403 otherwise) and revoked->404 honesty
    is already enforced by the wave-8 read path, so revoke only needs to flip the
    flag. Returning to P-3 for the single mechanism fix; not approving through the
    infra gap.
  next_action: REWORK_P-3
```

---

# ATTEMPT 2 — Phase 1 re-gate (8a fix re-verification)

**Re-spawn:** fresh head-product · **Trigger:** attempt-1 REWORK had exactly ONE
failed check (8a backfill gen mechanism unavailable). P-3 + spec 8a AC reworked.

## VERDICT: APPROVED (Phase 1) → proceed to Phase 2 (karen + jenny, security-tightened)

The single attempt-1 REWORK cause is resolved. Re-verified the fix from artifacts
and the codebase; all attempt-1 PASSES re-confirmed unchanged. Phase 1 checklist
is fully ticked. Authorizing Phase 2 reviewer spawn.

---

## The 8a fix — RESOLVED (re-verified line-by-line)

The attempt-1 cause was: 8a specified `gen_random_bytes` (pgcrypto), which is not
installed → the migration would abort at C-2 `db:migrate`. Re-checked live:
pgcrypto **still absent** (`SELECT extname FROM pg_extension WHERE extname='pgcrypto'`
→ 0 rows), so the gap was real and the fix had to route around it — which it does.

Reworked artifacts (both read this attempt):
- **P-3-plan.md line 4** now reads: app-side `randomBytes(16).toString('base64url')`
  (servers.service.ts:25) in a committed BACKFILL SCRIPT
  (`apps/api/src/db/backfill-invite-codes.ts`), run at C-2 via
  `pnpm --filter @studyhall/api db:backfill`, per-row 23505 collision-retry
  (servers.service.ts:203-233 pattern), idempotent `WHERE invite_code IS NULL`,
  NOT auto-migrate-on-boot. The rejected SQL/pgcrypto alt is recorded with reason.
- **Spec AC1 (task 08ff762f, DB-read this attempt)** now encodes the same:
  "app-side, NOT a pure-SQL migration — pgcrypto/gen_random_bytes is NOT installed …
  randomBytes(16).toString(base64url) + per-row 23505 collision-retry … Run at C-2
  via a db:backfill step. Idempotent (WHERE NULL, re-run no-op) + true per-row
  collision-safe vs UNIQUE(invite_code)."

Load-bearing claims the fix rests on — verified against the codebase this attempt:
- `randomBytes(16).toString('base64url')` exists at servers.service.ts:25 (the
  locked CSPRNG generator). CONFIRMED.
- 23505 per-row retry exists: `catch` on `pgErr.code === '23505'` with `MAX_RETRIES`
  loop at servers.service.ts ~49-52 / :203-233. CONFIRMED — this retry only works in
  the app-side per-row loop (option 1); a bulk SQL UPDATE cannot per-row-retry, so the
  chosen shape is the correct one.
- Backfill script file not yet present (`apps/api/src/db/backfill-invite-codes.ts`
  absent) — CORRECT for P-4: that is a B-block artifact. P-4 gates the plan + spec
  contract, not built code.

Resolves all three sub-conditions of the REWORK:
1. **Abort-at-deploy risk** — eliminated (no pgcrypto dependency; runs in Node).
2. **Idempotent** — `WHERE invite_code IS NULL` → re-run is a no-op.
3. **Collision-safe** — per-row 23505 retry vs UNIQUE(invite_code), reusing the
   proven wave-8 pattern. Stays on the locked architecture (no parallel SQL-CSPRNG
   path) — clears the architecture-blind-plan anti-pattern that attempt-1 also flagged.

## Attempt-1 PASSES — re-confirmed unchanged (no regression from the 8a edit)

The 8a fix touched only the 8a plan line + 8a AC1. All other checks were PASS at
attempt 1 and are unaffected:
- Revoke authz: server-side `owner_id` OR `invites.created_by`, 403 otherwise. PASS.
- Revoked→404 on preview + join: already enforced by the wave-8 read path
  (`validateInviteActive` svc:38/251/325 + atomic `NOT revoked` svc:374). PASS.
- 8b member-gated `invite_code` exposure (no non-member leak); mint-on-open removed. PASS.
- 8a→8b build ordering (permanent code exists before modal defaults to it). PASS.
- Scope / no-RBAC (RBAC deferred to wave-10); no gold-plating. PASS.
- design_gap_flag TRUE-delta (compose against existing invite-share.html). PASS.
- T-8 planned coverage (revoke authz 403 + revoked→404 + backfill idempotency). PASS.

## Phase-1 checklist — fully ticked
P-0 Frame PASS · P-1 Decompose PASS · P-2 Spec PASS (mechanism defect now cured) ·
P-3 Plan PASS (8a step now uses an available, architecture-consistent primitive) ·
all security-tightened judgments PASS. No remaining failed checks.

```yaml
head_signoff:
  verdict: APPROVED
  stage: P-4
  phase: 1
  attempt: 2
  reviewers: {}   # Phase 2 (karen + jenny, mandatory, security-tightened) — spawn next, not yet returned
  failed_checks: []
  resolved_checks:
    - "P-3 8a: gen_random_bytes/pgcrypto replaced by app-side randomBytes(16).toString(base64url) in committed db:backfill script — no deploy-abort risk (pgcrypto re-verified absent: 0 rows)"
    - "P-3 8a: now reuses locked wave-8 generator (servers.service.ts:25) + 23505 per-row retry (svc:203-233) — architecture-consistent, idempotent (WHERE NULL), collision-safe"
  passed_security_checks:
    - "revoke authz: server-side owner_id||invites.created_by, 403 otherwise"
    - "revoked->404 preview+join: wave-8 read path (validateInviteActive svc:38/251/325 + atomic NOT revoked svc:374)"
    - "8a backfill idempotent (WHERE NULL) + collision-safe (per-row 23505 retry) + committed (not auto-migrate-on-boot)"
    - "8b member-gated invite_code exposure, no non-member leak; mint-on-open removed"
  rationale: >
    Attempt-1 REWORK had a single load-bearing cause — the 8a backfill called
    gen_random_bytes, which requires pgcrypto, and pgcrypto is not installed (re-verified
    live this attempt: 0 rows in pg_extension), so the migration would have aborted at C-2.
    The reworked P-3 plan (line 4) and spec AC1 now both use the wave-8 app-side
    randomBytes(16).toString('base64url') generator inside a committed backfill SCRIPT
    (apps/api/src/db/backfill-invite-codes.ts) run at C-2 via db:backfill, with per-row
    23505 collision-retry and WHERE invite_code IS NULL idempotency. Both load-bearing
    code facts are confirmed in the codebase (generator at servers.service.ts:25; 23505
    retry at servers.service.ts:49-52/203-233). This removes the deploy-abort risk,
    satisfies idempotent + collision-safe, and stays on the locked architecture instead of
    a parallel SQL-CSPRNG path. All other attempt-1 PASSES (revoke authz, revoked->404,
    8b member-gating, 8a->8b ordering, scope/no-RBAC, design delta, T-8 coverage) were
    untouched by the 8a edit and are re-confirmed. Phase 1 is fully ticked; advancing to
    the mandatory Phase 2 security-tightened reviewer pool (karen + jenny).
  next_action: PROCEED_TO_P-4_PHASE_2
```

---
## Phase 2 — Karen + jenny + Gemini — PASS
- **Karen APPROVE** — 7/7 claims VERIFIED vs wave-8 code (revoke authz columns exist; revoked→404 already filtered at preview+join+atomic-consume; pgcrypto absent → app-side backfill+23505 correct; 8b mint-on-open real to replace + invite_code member-exposable; createServer self-gens invite_code; no gold-plating). 
- **jenny APPROVE** — 3/3 blocks MATCH; encodes the BOARD bindings verbatim; scope clean (RBAC wave-10, no role_id pull-forward). (cosmetic: P-3 commit subject says gen_random_bytes — stale; plan body correct.)
- **Gemini CONCERN → FOLLOW-UP (both reviewers concur)** — permanent invite_code irrevocable (8b makes it default): acceptable deferral (0 prod servers, additive, no unmet AC). Queued as M2 task + logged in product-decisions. NOT folded in.
## T-8 GATING CONDITIONS (karen, → T-block): (1) 8a re-run no-op + 23505 exercised; (2) revoke non-owner/non-creator → 403; (3) revoked → 404 on BOTH preview + join asserted; (4) 8b regression-guard: plain modal open creates NO ad-hoc invite row.
GATE: PASS → D-block (TRUE-delta). Security-tightened satisfied. Build order 8a→8b→revoke.
