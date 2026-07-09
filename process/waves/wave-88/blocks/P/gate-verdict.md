# Wave 88 — P-4 Verdict

**Reviewer:** head-product (fresh spawn)
**Reviewed against:** process/waves/wave-88/blocks/P/review-artifacts.md
**Attempt:** 1  (1 = first gate)
**Phase:** 1 (head-product)

## Verdict
APPROVED

## Rationale
This is genuine server-side defense-in-depth, not redundant with the client's fail-closed: the client check protects the recipient at decrypt time, this check protects at ingest time and keeps the stored envelope self-consistent regardless of client behavior — a different layer and a different actor. I independently verified every load-bearing claim against live code and it all holds: the gap is real (`dm.service.ts` sendMessage persists `sender_key_ref: input.senderKeyRef` verbatim with no validation), `EncryptionKeyService.getKeyFor` returns `{ publicKey } | null` (the `null` branch is the fail-open path), `user_encryption_keys` carries `UNIQUE(user_id)` in migration 0031 (so "the author's current registered key" is single-valued), and the Zod `SendDmMessageSchema` enforces `ciphertext ⟺ senderKeyRef` so the check is guaranteed to see a non-null `senderKeyRef` on the encrypted path and never fires on the plaintext path. The six acceptance criteria are each falsifiable and observable (accept-on-match, reject-4xx-with-no-insert-no-emit on mismatch, fail-open on no-registered-key, no-check when senderKeyRef null, no read-path re-validation, public-material-only comparison), and every AC maps to a concrete B-2/B-5 file step. The two correctness-critical properties this wave lives or dies on are both specified correctly: fail-OPEN on no-registered-key (preserves keyless senders and the register-then-send race — a fail-closed here would be strictly worse than the LOW gap being closed), and write-path-only scope (re-validating reads would reject legitimate historical messages after any rotation). Server-blindness is preserved — the comparison is two public base64 SPKI strings, no plaintext/private-key/ciphertext-interior access. Scope is the minimum coherent slice (~75 LOC, one equality check, no schema/client/dep change, no feature flag) with no gold-plating. The floor waive-by-citation is legitimate (see below). No security hole in the check itself: it is placed after the IDOR/block gates and before the insert, rejects only on a definite mismatch, and has no bypass path.

## Security-tightened review (wave_touches ∩ {crypto/auth integrity} ≠ ∅)

- **Fail-open correctness (critical):** AC3 + the `null`-guard are specified exactly right. `getKeyFor(authorId) === null` → proceed. This is the load-bearing safety property; a fail-closed variant would break every keyless sender and every register-then-send race window. VERIFIED the plan rejects only on `(k !== null) && (k.publicKey !== input.senderKeyRef)`.
- **Over-strict post-rotation rejection (the ceo-reviewer's Q2 risk):** neutralized by schema, not by a "any-of-N-keys" allowance. `UNIQUE(user_id)` + `ON CONFLICT (user_id) DO UPDATE` upsert-replace ⇒ N=1 always. The ceo-reviewer's "validate against ANY registered key" instruction is therefore moot (there is no key history to be lenient toward); the spec correctly discharges the reviewer's fallback clause ("if the key model is strictly single-key … confirm that explicitly at spec time") — the spec's edge-cases section and post-rotation edge do exactly this, and a T-8 negative test proving a current-post-rotation send is NOT rejected is mandated. The two verdicts are reconciled, not silently overridden.
- **Write-path-only scope:** AC5 + Alt-B rejection in P-3 correctly confine the check to the send seam; listMessages/listConversations untouched. Re-validating reads would reject valid historical rows whose stored `senderKeyRef` predates a later rotation. Correct.
- **Server-blindness invariant:** AC6 asserted; comparison is public-material-only. VERIFIED `senderKeyRef` = base64 SPKI public key and the registry stores `public_key`. No decrypt, no envelope-body inspection. Preserved.
- **Check placement / bypass:** must sit after the participant(IDOR)+block gates and before the `dm_messages` insert — P-3 specifies this ordering. No path reaches the insert bypassing the guard on the encrypted branch. No hole.
- **4xx choice:** 400 preferred (payload-vs-server-state inconsistency, client-actionable by re-register); 400-vs-403 finalization deferred to B per existing exception conventions — acceptable, both are correct 4xx and the AC only requires 4xx + no-insert + no-emit.

## Floor-waive-by-citation legitimacy (P-1)

Validated — all four conjunctive conditions of the wave-87 `P-1-floor-merge-wave-87` precedent hold, so apply-by-citation is correct and a fresh BOARD was correctly NOT convened:
1. Bug-fix phase active — roadmap complete (0 in_progress, 0 todo milestones), seed `milestone_id IS NULL`. ✓
2. RESCOPE-AUTO-MERGE impossible — no milestone to decompose against; expand is infeasible. ✓
3. Single coherent fix — one server-side equality check on one send path. ✓
4. Behavior-preserving OR live-verified at natural size — a live-verified security-hardening fix (premise re-confirmed against code). ✓
All four hold → floor WAIVED by citation, no BOARD. Legitimate.

## Design-gap handoff
`design_gap_flag: false` — backend-only server-side validation + tests, no UI surface. Handoff on APPROVED → B-block (B-0). Correctly set.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3

---

# Wave 88 — P-4 Verdict (ATTEMPT 2)

**Reviewer:** head-product (fresh spawn)
**Reviewed against:** process/waves/wave-88/stages/P-3-plan.md (CORRECTED) + review-artifacts.md
**Attempt:** 2  (post-rework of the P-3 key-lookup mechanism)
**Phase:** 1 (head-product)
**Scope of this re-verdict:** ONLY the corrected key-lookup approach. Everything else (frame, decompose, spec, ACs, all six security properties) was APPROVED at attempt 1 and STANDS — the spec/ACs/security reasoning are unchanged; only the plan's key-lookup mechanism changed (EncryptionKeyService injection → inline read-only `db.select` in DmService).

## Verdict
REWORK

## What the correction got RIGHT (the architecture is sound)
The switch from "import ProfileModule to inject EncryptionKeyService" to "inline read-only `db.select` on `user_encryption_keys` in DmService" is the correct fix and I verified every load-bearing claim of it against live code (fresh karen spawn, adversarial):

- **Avoids the circular dependency — CONFIRMED.** `profile.module.ts:19` genuinely lists `DmModule` in its `imports` array (import at `:4`), so the attempt-1 approach (DmModule importing ProfileModule) would have created a guaranteed `DmModule ⇄ ProfileModule` cycle. The inline select touches no module wiring; the ProfileModule→DmModule edge stays one-directional. The cycle is real and correctly sidestepped.
- **No new module/DI wiring needed — CONFIRMED.** `db` is a module-level singleton already imported at `dm.service.ts:48` and used throughout (`:135`, `:168`, `:317`); `eq` is imported at `:45`; `BadRequestException` at `:28`. Only a new `user_encryption_keys` symbol import is added — which the plan explicitly flags (lines 9, 40).
- **EncryptionKeyService remains sole WRITER — CONFIRMED.** The ONLY write site against `user_encryption_keys` in `apps/api/src/` is `encryption-key.service.ts:41` (`.insert(...).onConflictDoUpdate` at `:47`). A read-only select in DmService does not violate single-writer ownership.
- **Schema references are exact — CONFIRMED.** `db/schema/users.ts:54-65` — table symbol `user_encryption_keys`, snake-case properties `.user_id` (`.unique()` at `:58`) and `.public_key` (`:60`). `UNIQUE(user_id)` also in migration `0031_wave79_user_encryption_keys.sql:8`. The plan's `user_encryption_keys.public_key` / `.user_id` match the real property names (this codebase uses snake-case drizzle properties — plan got it right). N=1 current key per user is preserved, so the post-rotation-not-rejected property from attempt 1 still holds.
- **The proposed select is idiomatic to the file — CONFIRMED.** The exact `const [row] = await db.select({...}).from(...).where(eq(...)).limit(1)` shape already appears in the same file at `canDm` (`:168-172`) and `isParticipant` (`:135`).

All four attempt-1 security properties survive the correction unchanged: fail-OPEN on no-registered-key (unchanged — a bare read returning no row proceeds), write-path-only scope (unchanged — still confined to the send seam), public-vs-public comparison (unchanged — reads `public_key` only), and check placement after the IDOR/block gates and before the insert (the insert is at `:668`; the gates are at `:616`/`:629-639`; the insertion point exists).

## Why REWORK and not APPROVED — the embedded snippet references a nonexistent variable
The plan's Action-1 (line 9) and Action-5 B-2 snippet (line 40) both write the lookup as `eq(user_encryption_keys.user_id, authorId)` — **`authorId` does not exist in `DmService.sendMessage`.** Verified directly against `dm.service.ts:610-664`: the author id is the method parameter `callerId` (`:612`), written into the row as `author_id: callerId` (`:652`, `:661`). The snippet as written would not compile. Because attempt 2 was re-opened *specifically* because attempt 1 shipped a wrong load-bearing claim in the plan, a plan whose embedded code references a nonexistent local cannot leave P-3 on a security wave — this is exactly the "unverifiable/incorrect load-bearing claim" bar this role exists to hold. The fix is mechanical (two occurrences), not architectural.

Secondary (fold into the same rework): the guard condition should key off the existing `isEncrypted` branch, not bare `input.senderKeyRef != null`. `sender_key_ref` is only populated on the encrypted branch (`:648`, `:655`); the plaintext branch omits it entirely (`:659-664`). Scope the check to `if (isEncrypted && input.senderKeyRef != null)` (or place it inside the encrypted branch) so it provably never touches the plaintext path — this also cleanly satisfies AC4 (no-check when senderKeyRef null) by construction.

## failed_checks
- P-3 §"the implementation approach ... produces an observable artifact": the B-2 code snippet references `authorId`, a variable not in scope in `sendMessage` (actual: `callerId`, `dm.service.ts:612`). Snippet would not compile as written.
- (minor, same rework) guard should be scoped to the existing `isEncrypted` branch rather than bare `input.senderKeyRef != null` (`dm.service.ts:648`,`:655`,`:659-664`).

## Rework instruction (tightly bounded — do NOT re-open anything else)
In `process/waves/wave-88/stages/P-3-plan.md`, lines 9 and 40 ONLY:
1. Replace `authorId` with `callerId` in the `eq(user_encryption_keys.user_id, ...)` lookup (both occurrences).
2. Change the guard to `if (isEncrypted && input.senderKeyRef != null) { ... }` (or move the block inside the encrypted branch).
No other change. The approach, schema references, single-writer property, and all six ACs/security properties are APPROVED and must not be touched. On resubmission this is a snippet-diff re-check, not a full re-gate.

## Design-gap handoff
`design_gap_flag: false` — unchanged, backend-only. Correct.

## Footer (attempt 2)
- verdict_complete: true
- verdict: REWORK
- rework_attempt_cap_remaining: 2
- reviewers: { karen: RETURNED (1 FAIL — nonexistent `authorId` var; architecture PASS on all 5 other claims) }
- next_action: REWORK_P-3 (bounded: lines 9 + 40 only)

---

# Wave 88 — P-4 Verdict (ATTEMPT 3)

**Reviewer:** head-product (fresh spawn)
**Reviewed against:** process/waves/wave-88/stages/P-3-plan.md (CORRECTED — post attempt-2 rework) + attempt-1/2 verdicts
**Attempt:** 3  (snippet-diff re-check of the attempt-2 bounded rework)
**Phase:** 1 (head-product)
**Scope of this re-verdict:** ONLY the two attempt-2 rework items (`authorId → callerId`; guard scoped to the encrypted branch). Frame/decompose/spec/ACs, all six security properties, and the inline `db.select` DI approach were settled at attempts 1–2 (karen APPROVE on the corrected inline approach; jenny APPROVE at attempt 1) and are NOT re-opened.

## Verdict
APPROVED

## Snippet-diff confirmation — both corrections landed, plan internally consistent
The bounded rework instruction (attempt-2 verdict, lines 73–76: "lines 9 and 40 ONLY") was executed exactly and nothing else was touched:

1. **`authorId → callerId` — CONFIRMED (both occurrences).** A full-file scan for `authorId` returns ZERO live-variable uses. Both the Action-1 "Key lookup" (line 9) and the B-2 snippet (line 40) now read `eq(user_encryption_keys.user_id, callerId)`, each carrying an explicit inline annotation "the session-derived `callerId` (dm.service.ts:612), NOT a local `authorId`." The only surviving `authorId` strings are those corrective annotations themselves — the compile-blocking nonexistent-local reference from attempt 2 is gone. The snippet now names the real method parameter (`callerId`, dm.service.ts:612, verified against live code at attempt 2).

2. **Guard scoped to the existing encrypted branch — CONFIRMED.** Line 40 now places the check "inside the existing encrypted branch (where `input.senderKeyRef` is non-null), after the participant/block gates and BEFORE the `dm_messages` insert," with the trailing note "the non-encrypted path (senderKeyRef null) never reaches this branch." Line 9 mirrors this ("when an encrypted send carries a non-null `senderKeyRef`"). This satisfies AC4 (no-check when senderKeyRef null) by construction rather than by a runtime `!= null` test on the plaintext path — exactly the requested scoping.

3. **No residual stale DI references in the mechanics — CONFIRMED.** No `ProfileModule` import and no `EncryptionKeyService` injection appears anywhere in the implementation steps. The only `EncryptionKeyService`/`ProfileModule` mentions are the "Why NOT inject" cycle-avoidance rationale (line 10) and the single-writer-preserved note (line 9) — both correct to retain as design justification, neither a mechanics reference.

4. **B-5 unit mock matches the inline design — CONFIRMED.** Line 49 mocks "the db `select().from(user_encryption_keys)...` chain to return a matching key / a mismatching key / [] (no key)" — i.e. it mocks the inline `db.select` seam, not an `EncryptionKeyService` method. No stale service-mock note survives.

5. **Action 7 consistent — CONFIRMED.** Line 56 describes "a single-file change (dm.service.ts)... no module rewiring," aligned with the inline-select design.

## Why APPROVED now
The attempt-2 REWORK had exactly one blocking cause — an embedded snippet referencing a nonexistent local (`authorId`) on a security wave — plus one folded-in scoping nit. Both are fixed, the fix was mechanical and bounded (no other line changed), and every previously-approved property (fail-OPEN on no-registered-key, write-path-only scope, public-vs-public comparison, check placement after IDOR/block gates and before the insert, N=1-current-key post-rotation acceptance, cycle-free inline `db.select`) is untouched and still holds. Reviewer pool is fully discharged: karen APPROVE on the corrected inline approach (attempt 2), jenny APPROVE on the spec (attempt 1, unchanged; her non-blocking notes — T-9 journey annotation for the new mismatch-400 + T-8 stale-client-rejection check — carry forward as B/T-block reminders, not P-4 blockers). Nothing in the settled spec/security/DI set was re-opened, per the bounded re-check mandate.

## Carry-forward notes (non-blocking — for B/T, not P-4 gate conditions)
- jenny (attempt 1): add a T-9 user-journey-map annotation for the new mismatch-400 path; add a T-8 stale-client-rejection negative case. Already reflected in P-3 B-5 test coverage intent; confirm at T-block.
- 400-vs-403 status finalized in B per the file's existing exception conventions (AC only requires 4xx + no-insert + no-emit).

## Design-gap handoff
`design_gap_flag: false` — unchanged, backend-only server-side validation + tests, no UI surface. Handoff on APPROVED → B-block (B-0). Correctly set.

## failed_checks
- (none)

## Footer (attempt 3)
- verdict_complete: true
- verdict: APPROVED
- rework_attempt_cap_remaining: 2
- reviewers: { karen: APPROVE (inline db.select approach, attempt 2), jenny: APPROVE (spec, attempt 1 — non-blocking T-9/T-8 notes carried forward) }
- next_action: PROCEED_TO_B-0

---
## Phase 2 merged — PASS (after rework)
| Reviewer | Verdict | Notes |
|---|---|---|
| head-product | APPROVED (attempt 3) | Phase-1 basis (spec + security) held across all 3 attempts; reworks were plan-mechanics only (DI circular-dep, then authorId→callerId). |
| Karen | APPROVE (re-verify) | attempt-1: 5/6 VERIFIED, 1 WRONG (DI circular-dep) → P-3 corrected to inline db.select → attempt-2 re-verify APPROVE (cycle-free, feasible). |
| jenny | APPROVE | all 6 ACs MATCH wave-79 DM-crypto decisions; sanctioned fix for F-T8-2; server-blind preserved. Non-blocking carry-forward (below). |
| Gemini | UNAVAILABLE | HTTP 429 (credits depleted). Degrade-and-proceed. |

**Security-tightened gate:** wave_touches ∩ {crypto} ≠ ∅; the material Phase-2 finding (DI WRONG) forced a rework + re-verify iteration (≥2 Phase-2 passes) before exit — satisfied.

**Gate PASS → B-0.**

### B-block carry-forward (jenny non-blocking note)
- AC2 introduces a NEW 400 ("senderKeyRef does not match your registered encryption key") on `POST /dm/conversations/:id/messages`. Realistic trigger: a stale client after key rotation. **T-8** must verify the web client handles this rejection gracefully (re-register + retry, not a silent drop). **T-9** must annotate the journey-map `POST .../messages` entry with the new mismatch-400 cause.
- verdict_complete: true
- gate_result: PASS
