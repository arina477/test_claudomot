# Wave 29 — P-4 Verdict

**Reviewer:** head-product (fresh spawn, gate Phase 1)
**Reviewed against:** process/waves/wave-29/blocks/P/review-artifacts.md
**Attempt:** 2  (attempt 1 = REWORK on P-3, both defects now addressed)
**Phase:** 1 (head-product own-verdict; Phase 2 reviewer pool NOT run in this artifact)
**Wave type:** single-spec, `claimed_task_ids=[d23a0740]`
**design_gap_flag:** false → skip D → B-1 Contracts FIRES (shared-package deletion)

## Verdict
APPROVED

## Rationale
The P-block is build-ready. Both attempt-1 REWORK defects are resolved in `process/waves/wave-29/stages/P-3-plan.md`, and no new under-determination or spec-vs-bet drift surfaces on re-walk. The framing (real wave-14 debt, code-verified; align→delete reframe correct and grep-gated), decomposition (single seed; under-floor PRECEDENT-APPLICATION override-ship, 8th, wave-24 do-not-relitigate ruling, `floor_merge_attempt=0`, no fresh BOARD), and strategic disposition (M5 park-or-key held with the founder, ceo M6 pivot non-executable this wave and correctly sharpened rather than front-run) were all sound at attempt 1 and are unchanged. The single load-bearing defect that failed attempt 1 — an under-determined Part-1 operator fix that let the builder silently violate AC1 — is now locked to the one legal, AC-satisfying form; the barrel-deletion scope is corrected to both re-exports. Each of the four gate questions passes.

## REWORK-resolution verification (attempt 1 → attempt 2)

### Q1 / Defect 1 — Operator fix locked (was: ambiguous two-candidate "OR" fork)
**RESOLVED.** P-3 steps 4 (servers.service.ts:249) + 5 (presence.gateway.ts:125) now name the single form: replace BOTH `??` with `||`.
- `displayName: r.displayName || r.email.split('@')[0] || r.userId`
- `const displayName = userRow?.display_name || userRow?.email?.split('@')[0] || userId;`

Both rejected forms are explicitly excluded and correct to exclude:
- `A ?? B || C` — mixing `??` with `||` without parens is a JS/TS **SyntaxError**. Excluded.
- `A ?? (B || C)` — parses, but a stored-empty `display_name === ''` is falsy-but-defined, so `??` keeps it → renders `''`, **failing AC1's stored-empty guard**. Excluded.

The full `||`-chain is the ONLY legal AND AC1-satisfying form. Unambiguous, legal, AC1-satisfying — all three empty conditions (null display_name, empty stored display_name, empty local-part) fall through to userId; AC2 (normal email → local-part) and AC3 (non-null display_name → that value) hold by short-circuit on the first truthy operand.

### Q2 / Defect 2 — Barrel deletion scope corrected (was: :23 only)
**RESOLVED.** P-3 step 2 deletes BOTH `index.ts:23` (schema value re-export) AND `index.ts:34` (`ServerMembersResponse` type re-export); step 1 deletes the schema (`servers.ts:66-68`) + inferred type (`:69`). Both barrel lines grep-confirmed present (per prior spawn + prompt). Isolated typecheck (step 3) + repo typecheck (B-4) are the AC4 safety nets.

**Spec-vs-plan note (not drift):** the spec's `contracts.types` names the barrel re-export singularly (`:23`). The plan's two-line deletion is the strictly-correct superset — AC4 demands `@studyhall/shared typecheck stay green`, and a dangling `:34` type re-export of a deleted type breaks typecheck. Deleting both is what completing AC4 *requires*; the plan corrects the spec's under-specified line rather than diverging from intent. No spec rework needed.

### Q3 — All 5 ACs map to steps; nothing under-determined
- AC1 (null AND empty-stored display_name AND empty local-part → userId) → locked `||`-chain at steps 4+5, asserted by unit step 6. PASS.
- AC2 (normal email → local-part) → same locked form (short-circuit), step 6. PASS.
- AC3 (non-null display_name → that value) → same locked form, step 6. PASS.
- AC4 (schema+type+barrel removed, typecheck green) → steps 1 + 2 (both :23 and :34) + 3 isolated typecheck + B-4 repo typecheck. PASS.
- AC5 (wire unchanged, bare `ServerMember[]`) → no API/controller step (untouched). PASS.
- Edge-case "align-instead-of-delete if a live consumer is found at B" preserved as the deviation clause. Nothing under-determined.

### Q4 — Strategic disposition
Sound. d23a0740 is the only buildable-now, founder-credential-free, non-front-running option. ceo-reviewer's M6 voice/video pivot is strategically correct but NON-EXECUTABLE this wave (M6 promotion requires the founder-reserved M5 park-or-key decision, pending since digest 2026-07-01) — correctly folded into the sharpened founder escalation, NOT acted on, NOT re-raised as a new ask. The 8th under-floor override-ship is PRECEDENT-APPLICATION (not a fresh BOARD), per the wave-24 standing ruling. No orphan-wave, symptom-framing, or gold-plating pattern fires. `design_gap_flag=false` → B (not D); B-1 Contracts fires (shared-package mutation), correctly not skipped. No auth/session/cookie/rate-limit surface → security-scope tightened gate not triggered.

## Stage-exit checklist (walked from artifacts, not inferred)
- [x] P-0 frame — root cause named; maps to M5 (a5232e16) in_progress; problem-framer REFRAME + ceo-reviewer RECONSIDER + mvp-thinner OK all present and reconciled.
- [x] P-1 decompose — single seed; no out-of-bundle unbuilt dependency; override-ship precedent-correct.
- [x] P-2 spec — 5 ACs each independently verifiable; edge-cases + non-goal named; embedded as fenced YAML at head of d23a0740.description (verified via DB read). No user-facing UI surface → empty/loading/error/offline N/A (backend resolution + shared-type delete).
- [x] P-3 plan — reuses established path (operator fix + pure deletion; no parallel mechanism, no architecture-library conflict); no MVP-excess infra; every step maps to a task + observable artifact.
- [x] Security-scope tightened gate — NOT triggered (displayName is a display string, never a key).
- [x] design_gap_flag handoff correctly set (false → B); B-1 Contracts fires.

## Next action
PROCEED_TO_B-block. Carry forward (do NOT re-raise): the M5 park-or-key fork + ceo M6-concrete alternative, founder-pending since digest 2026-07-01.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 1

---

# Wave 29 — P-4 Verdict (Phase 2 — Karen + jenny + Gemini merged)

**Phase:** 2 | **Attempt:** 2 (post-REWORK)

## Per-reviewer status
| Reviewer | Verdict | Detail |
|---|---|---|
| **karen** | **APPROVE** | All 8 load-bearing claims VERIFIED against real files: part-1 sites (servers.service.ts:249, presence.gateway.ts:125) exact; the `'' ?? x → ''` vs `'' \|\| x → x` premise correct (fix valid); part-2 schema+type (servers.ts:66-69) + BOTH barrels (index.ts:23,34); zero source consumers (only def+type+2 barrels); wire is bare `ServerMember[]` (controller:81, web api.ts:132); specialists in AGENTS.md. Deletion genuinely dead; operator fix at right layer; locked `\|\|`-chain resolves the syntax hazard. |
| **jenny** | **APPROVE** | 5 drift checks: (1) members contract is the bare array (journey-map:171) — deleted wrapper drifts from nothing; (2) `\|\|` fix preserves happy-path resolution order, changes only the empty-string edge; (3) precedent chain w24/25/26/27 real; (4) M5 park-or-key + M6 escalation = enrich-not-re-raise (matches wave-27 precedent), not front-run; (5) backend-only, no journey surface dropped. **Non-blocking note:** wave-28 override-ship was never logged to product-decisions.md (only the wave-28 RBAC decision) — precedent still stands on w24/25/26/27; reconcile the log at L-1. |
| **Gemini** | **UNAVAILABLE** | helper exit=3, HTTP 429 (rate-limited); already retried once. Degradable per P-4 Action 3 — does NOT block; gate proceeds on Karen + jenny. |

## Merged Phase 2 verdict: PASS
head-product APPROVED (attempt 2) + karen APPROVE + jenny APPROVE (drift note non-blocking → L-1 log reconciliation) + Gemini UNAVAILABLE (non-blocking) → **P-block gate PASSED**.

## Carry to downstream
- **L-1:** append the wave-28 + wave-29 under-floor override-ship entries to product-decisions.md (jenny flagged the wave-28 gap — append-only log staleness weakens future BOARD/precedent signal).
- **B:** P-3 operator form is LOCKED (`displayName || localpart || userId` × 2 sites, both `??`→`||`); delete BOTH barrel re-exports (:23 + :34); grep-verify zero consumers before deleting.
- **Founder-pending:** M5 park-or-key + M6 alternative (digest A/B) — record-only carry, not re-raised.

## Footer
- verdict_complete: true
- phase2_complete: true
- gate: PASSED
- design_gap_flag: false → next block B-0 (skip D)
