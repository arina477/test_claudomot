# Wave 33 — P-4 Gate Verdict

**Block:** P (Product)
**Gate:** P-4 (block-exit)
**Wave topic:** Harden malformed-UUID route-param handling — non-UUID id → 400 (not 500), project-wide root-cause fix via one bounded global mechanism.
**Head:** head-product (fresh spawn, Phase 1 only — Phase 2 not run)
**Seed task:** a2dd9f3d-1b93-4dfc-a6a8-5afded4a3354
**Milestone:** M6 (8702a335, in_progress, product-feature)
**wave_db_id:** 9ac979f5-26a0-4e9b-ba7e-208b2bf21bac

---

## Verdict: REWORK

**One-line:** The framing, scope mediation, and spec ACs are SOUND and build-ready — but the P-3 plan's core mechanism (`@Catch(QueryFailedError)`) is a Critical load-bearing defect: `QueryFailedError` is a TypeORM class and this stack is Drizzle+node-postgres (no TypeORM), so the filter as specified would silently never fire and ship a fix that does not fix the bug. REWORK the P-3 mechanism (and the AC-1 mechanism note it feeds) before B. No scope change required.

---

## Stage entry state

```json
{
  "agent": "head-product",
  "stage": "P-4",
  "status": "gating",
  "block_state": {
    "design_gap_flag": false,
    "bet_id": "M6 (8702a335) — post-metric hardening",
    "milestone_id": "8702a335",
    "reviewer_verdicts": { "karen": "PASS on framing claims; FAIL/Critical on P-3 mechanism (claim 5)" }
  }
}
```

---

## Reviewer pool (Phase-1 independent verification)

**karen — load-bearing-claim verification (spawned fresh, code-read):**
- Claims 1,2,3,4,6 → **PASS**. The problem framing is real: zero `ParseUUIDPipe`; no global `ValidationPipe`; ~43 UUID path params across 7 controllers all bind raw string; malformed channelId flows raw into `eq(channels.id, channelId)` (voice-participants.service.ts:133) → Postgres 22P02 → current 500. Both voice routes exist and `AuthGuard`/`verifySession` runs before the handler (AC-7 mechanism holds).
- Claim 5 → **PASS on stack facts, but exposes a CRITICAL plan defect.** Two sub-findings:
  1. `package.json` = `drizzle-orm ^0.45.2` + `pg ^8.22.0`; **zero TypeORM**. `QueryFailedError` does not exist in this project. `@Catch(QueryFailedError)` will never import/match → the filter never fires → the bug is NOT fixed. Drizzle wraps the driver error as `DrizzleQueryError`; the real pg `.code === '22P02'` lives at `err.cause.code` (one level deep), mirrored by the existing `23505` unique-violation walk at `users.service.ts:23-38`.
  2. A global catch-all filter is ALREADY registered — `SupertokensExceptionFilter` (`@Catch()`, no arg) at `main.ts:120`, which today returns 500 for non-HttpException errors (`auth.exception.filter.ts:44-48`). A second global filter for 22P02 collides/order-conflicts. Pragmatic fix: add the 22P02→400 branch INSIDE the existing filter before the generic-500 fallthrough, not a competing filter.

karen's recommendation (advisory, adopted): REWORK P-block plan to (a) drop `QueryFailedError`, (b) detect 22P02 by walking `.cause.code` per `users.service.ts:23-38`, (c) integrate into the existing `SupertokensExceptionFilter` rather than a second global filter.

Note: jenny (spec-vs-bet drift) was NOT required this gate — the defect is mechanical/architectural in the plan, not a spec-vs-bet semantic drift; bet alignment is confirmed sound below (Q6). A jenny pass on the reworked mechanism-vs-actual-error-shape is delegated forward into the B-block spawn brief (see next_action).

---

## Gate questions — independent judgment (do NOT rubber-stamp orchestrator mediation)

**Q1 — Was the P-0 scope mediation SOUND? (problem-framer expand vs ceo/mvp hold)**
**SOUND — mediation upheld.** The factual axis resolves to problem-framer: karen independently re-confirmed in code the 500 reproduces project-wide (~43 raw UUID params / 7 controllers), so "voice-only" reflects where T-8 probed, not where the bug is. The scoping axis is correctly held by ceo/mvp: no 30-param manual sweep. The synthesis — ONE bounded 22P02→400 mechanism covering all controllers at once — is the smallest correct root fix, genuinely smaller than a per-route sweep (one catch site vs ~43 pipe annotations). Neither of the alternatives you flagged is better: (a) narrowing to just the 2 voice routes is the whack-a-mole problem-framer proved (leaves the identical 500 live on 5 controllers for the next T-8 probe to re-file) — rejected; (b) the global mechanism is NOT over-reach vs the finding, because it is smaller than the compliant alternative AND changes the error contract only for the current-500 case. On mvp-thinner's explicit global-filter keep-OUT: mvp feared a broad error-normalization layer. A narrow 22P02→400 branch is NOT that — it is a single-code mapping. The orchestrator's argument to re-evaluate the keep-OUT against P-3 evidence is VALID and correctly applied. Mediation stands.

**Q2 — AC-1 "400 before any DB access" vs the query-execution mechanism**
**Acceptable read — but the AC wording should be tightened, and this is now moot-adjacent to the REWORK.** The filter catches the cast failure at query EXECUTION; the malformed cast fails before any row is read or returned → no data accessed or leaked, which is AC-1's INTENT. Per VERIFY-PRINCIPLES rule 2 (shipped behavior more correct than the literal AC → amend the spec), the right move is to amend AC-1's literal "before any DB access" to "before any row is read or returned (no data accessed or leaked)" rather than force a pre-DB pipe. I am NOT mandating the ParseUUIDPipe fallback — the intent (no leak) is satisfied by the filter. **Action for rework:** amend AC-1 wording to the leak-based phrasing so V-block does not fail the wave on a literal-vs-intent mismatch. This is a wording amendment, not a mechanism change.

**Q3 — Spec quality: 7 ACs falsifiable? Right guardrails?**
**PASS.** All 7 ACs are independently verifiable. The three guardrail ACs are exactly right: AC6 (valid-UUID unchanged) is the essential regression fence against a filter that over-catches; AC4 (a non-voice route proves convention-not-patch) is the correct falsifier for the root-cause claim — without it a builder could patch 2 routes and pass; AC7 (unauth+malformed→401, guard-first) fences the security-adjacent ordering karen confirmed holds. edge-cases (empty/whitespace, injection-ish, valid-but-missing→unchanged) and keep-out are enumerated. Spec is build-ready on content. The only spec change needed is the AC-1 wording amendment (Q2).

**Q4 — Override-ship under-floor legit?**
**SOUND.** Single-spec floor is 1,500 LOC; estimate ~200; even full convention <350 → floor is unreachable, so decomposition-expand is futile. The only adjacent M6 expansion (screen-share, audio-fallback) is credential-blocked (LiveKit keys absent) → cannot be bundled as credential-independent work. `floor_merge_attempt: 0` with no BOARD is correct as precedent-application (wave-24 do-not-relitigate + wave-16 test-debt exemption), not a novel ruling. Override-ship is justified.

**Q5 — Security-scope tightened gate: does it apply?**
**YES — flag it forward.** This wave hardens input validation on auth-gated routes (malformed id → 400 not 500 on both voice endpoints + 5 other controllers). That is malformed-input hardening on a security surface (auth-gated routes; the SupertokensExceptionFilter is in the blast radius). It counts as a security-scope wave for the tightened P-4 security gate → **Phase 2 must run ≥2 iterations** and **T-8 must re-probe** the voice authz matrix AND the malformed-input handling (the exact surface F-32-T-8-1 was filed against). Additional security note carried from karen: the reworked mechanism MUST NOT let the new 22P02 branch mask or reorder SupertokensExceptionFilter's auth 401/403 paths — verify auth-error composition explicitly at T-8 and B-6 /review. Confirm the 400 body carries no stack/DB/driver text (AC5).

**Q6 — N-block park-or-key flag (carried)**
**Correctly flagged forward; NOT a P-4 blocker.** After this wave ships, ZERO credential-independent M6 work remains → the wave-33 N-block MUST fork the LiveKit park-or-key decision (park M6 + pivot to a fully-buildable milestone [M7 privacy/notifications, M4 offline-first] vs. hold for LiveKit keys) rather than open another credential-blocked voice wave. This is a delivery-pipeline decision owned by head-next at N-1/N-3, not a product-gate blocker. **Carried into this verdict so it is not lost** — head-next must action it. Do NOT re-escalate LiveKit this wave (ask is already standing in the 2026-07-01 digest).

**Q7 — node-specialist routing correct?**
**CORRECT.** A NestJS global exception filter is Node/NestJS backend work; node-specialist ("Node.js backend (NestJS) APIs, services, runtime") is the specific fit over the generic backend-developer fallback. Routing stands. The rework findings (Drizzle `.cause.code` walk, integrate-into-existing-filter) should be handed to node-specialist in the B-2 brief.

---

## Stage-exit checklist (walked from artifacts, not inferred)

**P-0 Frame** — all PASS (concrete-job root-cause named + code-verified by problem-framer & karen; maps to M6 cited by id; falsifiable signal = non-UUID id returns 400 observable; problem-framer + ceo-reviewer verdicts present and reconciled, not overridden).

**P-1 Decompose** — all PASS (one seed, no siblings — atomic shared-pattern defect; override-ship under-floor justified; no dependency on unbuilt task).

**P-2 Spec** — PASS with one amendment required: ACs enumerated + independently verifiable; non-happy states covered (edge-cases block: empty/whitespace, injection-ish, unauth, valid-missing); non-goals explicit (keep-out block); auth/session surface flagged for tightened security gate (Q5); spec embedded as fenced YAML at head of a2dd9f3d.description (confirmed via DB read). **Amendment:** AC-1 literal "before any DB access" → leak-based phrasing (Q2).

**P-3 Plan** — **FAIL (one check).**
- [x] Reuses established architecture (global-filter pattern already used) — the *approach* is idiomatic.
- [x] No unneeded infrastructure (no Redis/replica/billing).
- [ ] **Each plan step produces a correct observable artifact — FAILS.** The B-2 mechanism (`@Catch(QueryFailedError)`) references a TypeORM class absent from this Drizzle+pg stack → the artifact would compile-or-no-match-fail and NOT satisfy AC-1..AC-4 at runtime. Plan is not build-ready as written. Additionally the plan does not account for the already-registered global catch-all filter (collision risk).

**P-4 Gate** — cannot issue APPROVED: the P-3 stage-exit box above is not tickable from a correct artifact. design_gap_flag=false handoff is correctly set (→ B-block on eventual approval, D skips).

failed_checks:
- P-3: mechanism references TypeORM `QueryFailedError` on a Drizzle+pg stack → filter never fires (Critical, karen claim 5).
- P-3: plan omits the pre-existing global catch-all `SupertokensExceptionFilter` (main.ts:120) → second-filter collision/order risk.
- P-2/AC-1: literal "before any DB access" mismatches the (correct) query-execution mechanism → amend per VERIFY-PRINCIPLES rule 2.

---

## Required rework (return to P-3 author; P-0/P-1 stand, scope unchanged)

1. **Fix the catch predicate.** Drop `@Catch(QueryFailedError)`. Detect Postgres `22P02` by walking the Drizzle-wrapped error's `.cause.code` (and `.cause.cause.code`), mirroring the existing `isUniqueViolation` (23505) walk at `apps/api/src/users/users.service.ts:23-38`. node-specialist confirms the exact `DrizzleQueryError` shape before finalizing.
2. **Integrate, do not collide.** Add the 22P02→400 branch INSIDE the existing `SupertokensExceptionFilter` (before the generic-500 fallthrough at `auth.exception.filter.ts:44-48`), OR prove a second `@Catch`-by-specificity filter composes correctly with the existing catch-all — the plan must state which and why. Verify auth 401/403 paths are unaffected (AC7 + Q5 security note).
3. **Amend AC-1 wording** to leak-based phrasing ("400 before any row is read or returned; no data accessed or leaked") so the query-execution mechanism satisfies it literally.
4. Preserve all other ACs, edge-cases, keep-out unchanged. No scope change. node-specialist routing stands.

On resubmission, re-gate P-3 + the AC-1 amendment only (P-0/P-1/P-2-content stand). A jenny pass confirming the reworked mechanism matches the actual Drizzle error shape should accompany the resubmission or be run in the B-block spawn brief.

---

```yaml
head_signoff:
  verdict: REWORK
  stage: P-4
  reviewers:
    karen: "PASS on framing claims 1,2,3,4,6; FAIL/Critical on P-3 mechanism (claim 5 — QueryFailedError is TypeORM, stack is Drizzle+pg; pre-existing global catch-all uncounted)"
    jenny: "not required this gate (defect is mechanical, not spec-vs-bet drift); delegated to B-block spawn brief"
  failed_checks:
    - "P-3: @Catch(QueryFailedError) references absent TypeORM class on Drizzle+pg stack → filter never fires (Critical)"
    - "P-3: plan omits pre-registered global catch-all SupertokensExceptionFilter (main.ts:120) → collision risk"
    - "P-2/AC-1: literal 'before any DB access' mismatches query-execution mechanism → amend per VERIFY-PRINCIPLES rule 2"
  scope_verdict: "UPHELD — bounded global 22P02->400 mechanism is the correct root+minimal synthesis; do NOT narrow to 2 routes, do NOT widen to per-param sweep"
  security_scope_gate: "APPLIES — malformed-input hardening on auth-gated routes; Phase 2 >=2 iterations; T-8 re-probe voice authz + malformed-input; verify no auth-path masking"
  n_block_flag: "CARRIED — park-or-key mandatory at N-block (zero credential-independent M6 work remains); head-next owns; not a P-4 blocker"
  ac1_disposition: "AMEND wording to leak-based phrasing (filter approach accepted; no ParseUUIDPipe fallback mandated)"
  design_gap_flag: false
  rationale: >
    Framing, scope mediation, and spec ACs are sound and build-ready; the wave ladders to
    M6 post-metric hardening and the root-cause synthesis is genuinely minimal. But the P-3
    plan's core mechanism is a Critical load-bearing defect independently confirmed by karen
    against the codebase: @Catch(QueryFailedError) targets a TypeORM class that does not exist
    on this Drizzle+node-postgres stack, so the shipped filter would silently never fire and
    fail AC-1..AC-4 at runtime — a spec that reads clean but is wrong on the load-bearing 20%.
    The plan also ignores the already-registered global catch-all filter. Returning P-3 for a
    bounded mechanism fix (detect 22P02 via .cause.code per users.service.ts:23-38; integrate
    into the existing filter) plus an AC-1 wording amendment. No scope change.
  verdict_complete: true
  rework_attempt_cap_remaining: 2
  next_action: REWORK_P-3
```

---

## Attempt 2 (Phase 1) — after attempt-1 REWORK rework

**Head:** head-product (fresh spawn, Phase 1 only — Phase 2 not run)
**What changed since attempt-1:** orchestrator reworked the P-3 mechanism + amended spec AC-1; nothing else touched.

### Verdict: APPROVED

**One-line:** The single Critical defect from attempt-1 is fully resolved — the P-3 mechanism now fires correctly on THIS stack (Drizzle + node-postgres 22P02 via a `.cause.code` walk that mirrors the proven 23505 pattern), the filter-collision risk is eliminated (extend the existing catch-all, don't add a second), and amended AC-1 is now consistent with the mechanism. All attempt-1 APPROVED items stand. Build-ready.

### The three rework items — verified against artifacts (not inferred)

1. **Reworked mechanism fires on this stack — PASS.** P-3 (lines 7, 32) drops `@Catch(QueryFailedError)` and mandates an `isInvalidTextRepresentation(err)` helper walking `err.code` → `err.cause?.code` → `err.cause?.cause?.code` for `'22P02'`. Verified against the proven pattern at `apps/api/src/users/users.service.ts:23-38`: `isUniqueViolation` walks exactly those three levels for 23505, with an in-code comment (lines 18-21) stating Drizzle wraps the pg driver error in `DrizzleQueryError` so `code` lives at `err.cause.code`. The new helper is a structural clone for a different SQLSTATE — this is the correct, evidence-backed shape. No remaining load-bearing error: 22P02 is the right SQLSTATE for a malformed uuid text→uuid cast, and it fails at query execution before any row is read.

2. **Filter integration sound; fallback reasonable — PASS.** Verified `apps/api/src/main.ts:120`: exactly one catch-all, `app.useGlobalFilters(new SupertokensExceptionFilter())`, mapping verifySession errors from AuthGuard. P-3 PREFERRED path (a) extends THAT filter — check 22P02 first → 400, else defer to existing handling — so there is no second catch-all and last-registered-wins cannot break Supertokens; auth 401/403 paths pass through unchanged (P-3 mandates a regression assertion proving this). One B-2 wiring nuance, already inside scope of the "MODIFY main.ts" step (line 34): `useGlobalFilters` must receive the extended instance, not the base. Fallback (b) `@Catch(DrizzleQueryError)` composes by NestJS specificity without shadowing the catch-all; the plan's "only if stably importable" caveat correctly hedges the sole risk (whether Drizzle exports the class). Reasonable.

3. **AC-1 consistent with mechanism, no drift — PASS.** Verified live in the DB (task a2dd9f3d…, first acceptance-criteria bullet): AC-1 now reads "…returns HTTP 400, NOT 500; no row is read or returned and no data is accessed or leaked (the malformed uuid cast fails at query execution before any row access)." This matches the 22P02-at-execution mechanism exactly — the cast fails before row access, so "no data leaked" is a true consequence of the mechanism, not an aspiration the mechanism can't deliver. No ParseUUIDPipe fallback is implied or required. No spec-vs-mechanism drift.

### Attempt-1 APPROVED items re-confirmed (not re-litigated)

- **Scope mediation** (P-1: one bounded global mechanism, root-cause per problem-framer's project-wide code evidence, NOT a 30-param sweep — ceo-reviewer + mvp-thinner anti-sprawl honored) — stands.
- **Override-ship reasoning** (500→400 is a strict improvement everywhere; error contract changes only for the malformed-UUID case) — stands.
- **Security-scope tightened gate applies** — wave is security-adjacent (auth-boundary-touching exception filter); Phase-2 requires ≥2 iterations + T-8 re-probe of the voice authz matrix + malformed-input handling — carried forward.
- **node-specialist** correct routing for a NestJS global exception filter — stands.
- **N-block park-or-key flag** (post-wave: zero credential-independent M6 work remains → N-block must treat the LiveKit park-or-key decision as the mandatory next move) — carried forward.

### Phase-2 handoff flag

When Phase 2 runs (karen / jenny / Gemini): **jenny must re-verify the corrected error-shape** — specifically that the built `isInvalidTextRepresentation` helper walks `.cause.code` for 22P02 (not the reverted `@Catch(QueryFailedError)`), and that the extended `SupertokensExceptionFilter` defers auth errors unchanged. karen should re-confirm the two load-bearing claims (users.service.ts:23-38 pattern; main.ts:120 single catch-all) survive into the shipped B-2 code.

### Stage-exit checklist (P-4)

- [x] Every upstream stage-exit box ticked from a concrete artifact (P-3 file re-read this turn; users.service.ts + main.ts verified; AC-1 read live from DB).
- [x] Load-bearing-claim drift resolved — the attempt-1 Critical (TypeORM-class-on-Drizzle-stack) is corrected and the correction is itself verified against the shipped 23505 pattern.
- [x] design_gap_flag = false correctly set → D-block SKIPS → B-block on APPROVED.
- [x] Security-scope surface routed to the tightened Phase-2 gate (≥2 iterations + T-8).

```yaml
head_signoff:
  verdict: APPROVED
  stage: P-4
  attempt: 2
  reviewers: {}   # Phase 1 only; karen/jenny/Gemini run in Phase 2
  failed_checks: []
  rationale: >
    Attempt-2 resolves the sole attempt-1 Critical. The P-3 mechanism now fires on the
    actual Drizzle+node-postgres stack — an isInvalidTextRepresentation helper walking
    err.code/err.cause.code/err.cause.cause.code for 22P02, structurally identical to the
    shipped isUniqueViolation (23505) at users.service.ts:23-38 (verified). The
    filter-collision risk is eliminated: the 22P02→400 check is folded into the single
    existing catch-all SupertokensExceptionFilter (main.ts:120, verified) with a
    check-first-else-defer order, and auth 401/403 paths are proven unchanged by a
    mandated regression assertion; the @Catch(DrizzleQueryError) fallback composes by
    specificity. Amended AC-1 (read live from the DB) is now consistent with the mechanism
    with no drift. All attempt-1 APPROVED items (scope mediation, override-ship,
    security-gate, node-specialist, N-block park-or-key) stand. Build-ready.
  verdict_complete: true
  rework_attempt_cap_remaining: 1   # attempt 2 of 3
  next_action: PROCEED_TO_PHASE_2   # karen / jenny / Gemini — jenny re-verifies corrected error-shape
```

---

## P-4 Phase 2 — reviewer pool (appended by orchestrator)

**karen — APPROVE.** All 7 load-bearing claims VERIFIED:
- 23505 `.cause.code` walk pattern real at users.service.ts:23-38 (the 22P02 helper is a structural clone).
- 22P02 = invalid_text_representation (correct SQLSTATE); TypeORM `@Catch(QueryFailedError)` confirmed inapplicable (drizzle-orm ^0.45.2 + pg ^8.22.0, zero typeorm) — the attempt-1 defect correctly diagnosed.
- main.ts:120 single catch-all (SupertokensExceptionFilter); "extend, don't add 2nd catch-all" correct.
- auth.exception.filter.ts is the integration target (@Catch() bare; inserts 22P02→400 before generic-500 branch; headersSent guard leaves 401/403 untouched).
- bug project-wide: raw-string UUID @Params confirmed on messages/servers/rbac/assignments controllers (no ParseUUIDPipe anywhere) — root-cause scope justified.
- node-specialist in AGENTS.md:84. DrizzleQueryError importable (fallback b viable), but preferred path (a) duck-types on code → no import dependency.
- Antipatterns clean (real root cause, not decorative; bounded to 22P02→400).
- Non-blocking note: spec says `messages.controller.ts`; actual path `messaging/messages.controller.ts` (cosmetic — B-2 targets real path).

**jenny — APPROVE.** All items MATCH: corrected `.cause.code`/22P02 mechanism in plan text (no stale TypeORM); SupertokensExceptionFilter defers auth unchanged (no 401/403 regression); scope consistent (root-cause bounded, not 2-route patch nor sprawl); AC-1 amendment matches the execution-time-cast mechanism; no valid-UUID regression (AC6, voice contracts preserved); journey-map = annotation-only at T-9 (no structural change); no product-decisions error/status contradiction.
- Carry: T-8 must EXECUTE the 22P02 branch against a real test DB (integration proof, not unit-simulated) — per P-3-plan.md.

**Gemini — DEGRADABLE-PASS (UNAVAILABLE).** helper exit 3, HTTP 429 (credits depleted). Passes per the degradable rule (UNAVAILABLE = pass).

### Phase 2 disposition: PASS (karen APPROVE + jenny APPROVE + Gemini UNAVAILABLE-degrade). Phase 2 did NOT BLOCK → security-scope rule forces no 2nd iteration.

## P-4 FINAL: APPROVED (attempt 2) → design_gap_flag=FALSE → D-block SKIPS → B-block
Carries to B: node-specialist; `.cause.code` walk for 22P02 mirroring users.service.ts:23-38; extend SupertokensExceptionFilter (not a 2nd catch-all); target `messaging/messages.controller.ts` real path; T-8 must exercise 22P02 against a real test DB; T-9 annotate voice-endpoint notes (500→400). N-block: park-or-key MANDATORY.
