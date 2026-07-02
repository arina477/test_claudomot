# Wave 36 — P-4 Verdict

**Reviewer:** head-product (fresh spawn, agentId head-product@wave-36-P-4)
**Reviewed against:** process/waves/wave-36/blocks/P/review-artifacts.md
**Attempt:** 1  (first gate)
**Phase:** 1 (head-product)

## Verdict
APPROVED

## Rationale
This wave discharges wave-35's V-2 test-debt by giving the privacy-enforcement boundary — the named differentiator against Discord — durable regression coverage where today it is proven only by an ephemeral live reproduction. The framing is cause, not symptom: the real gap is missing durable protection, and the deeper "tests should have been authored inline at wave-35 B" observation was correctly routed to BUILD-PRINCIPLES rather than folded into the reframe. It ladders to exactly one live milestone (M7 privacy, in_progress), whose bet-load-bearing headline already SHIPPED — so this hardens the wedge rather than draining debt around a blocked headline (the M5-era failure mode at product-decisions:328, correctly excluded). Every acceptance criterion is falsifiable, and the crown-jewel AC — the integration tier must provably execute against real Postgres (nonzero real-DB row counts, not skipped/no-op) and must NOT mock the system under test — is both the correct anti-test-theater guard and sufficient to catch the wave-17/24 false-green failure mode; a mocked db is explicitly declared a REWORK-worthy defect. The three sibling ACs are trivially scoped and correct: 73e96a9d is docs-only ("NO code", spec-hygiene re-scope off a non-existent notifications surface), b7feab30 is a 1-line-per-page cosmetic date fix. The plan invents no parallel path — it extends the existing apps/api/test/integration pg-harness and mirrors the sibling servers-member-gate.spec.ts / rbac-assignments-authz.spec.ts (both confirmed present), targets the real roster-visibility filter at servers.service.ts (confirmed, the `profileVisibility !== 'nobody' || r.userId === userId` guard), adds no new deps, no schema change, no scale infra — no gold-plating. The floor exemption is a legitimate precedent application, not floor-abuse: wave-36 is the identical shape to wave-24 (pg-harness extension closing a shipped-authz-surface integration-test gap), the test-coverage floor exemption is codified (product-decisions.md wave-16 entry), and the wave-24 BOARD "do-not-re-litigate-the-Nth-per-wave" ruling governs the w16/w23/w24/w25/w26/w27 chain — no fresh BOARD required. design_gap_flag is correctly FALSE (no new UI surface: test files, an existing-string edit, and a docs note; PrivacyPage.tsx/TermsPage.tsx and the internal toUiVisibility fn all pre-exist) → handoff is B-block. Every upstream stage-exit checkbox ticks from a concrete artifact.

## Stage-exit checklist walk (from artifacts)
- **P-0 Frame:** concrete user job + root cause (durable regression protection for the wave-35 authz boundary) ✓; one live milestone cited (M7 6e2f68d8) ✓; falsifiable (silent PII-leak regression is the observable signal) ✓; problem-framer PROCEED + ceo-reviewer PROCEED(HOLD-SCOPE) both present + reconciled ✓.
- **P-1 Decompose:** seed + only the V-2-follow-up siblings that ship together ✓; every AC mvp-critical (no split needed; M7 Class=product-polish so mvp-thinner correctly not spawned) ✓; no task depends on an unbuilt out-of-bundle task (all tests target already-shipped LIVE endpoints) ✓; floor exemption legitimate (wave-24 precedent, codified, correct M5-distinction) ✓.
- **P-2 Spec:** ACs enumerated + each independently verifiable ✓; non-happy states covered for the surfaces in scope (edge-cases: empty roster→A sees self, empty memberships→empty arrays, unauthenticated→401, invalid enum→400-before-write; no NEW user-facing surface so the four-state matrix N/A, and 73e96a9d re-scopes the states-AC to the 4 existing surfaces) ✓; non-goals explicit (NO endpoint changes / no new types / no schema change / NO code / cosmetic-only) ✓; authz surface flagged (security_scope: [user-data-authz, data-export]) — see Phase 2 note ✓; spec contract embedded as YAML head + `---` + prose in the primary task's DB description (confirmed) ✓.
- **P-3 Plan:** reuses locked architecture (pg-harness extension, mirrors existing integration siblings; no parallel mechanism) ✓; introduces no infra the MVP scale doesn't need (no Redis/replica/billing; no new deps) ✓; each step maps to a bundle task + observable artifact (self-consistency sweep: every AC→spec/step; specialists node-specialist / react-specialist / orchestrator all valid) ✓.

## Note carried to Phase 2 (not a Phase 1 blocker)
- **Security-scope routing:** `security_scope: [user-data-authz, data-export]` is flagged. This wave ships NO new auth/session/cookie/rate-limit/user-creation *code* — it authors tests OF an already-shipped authz boundary — so the P-4 security-tightened gate's second-iteration mechanism (triggered by a Phase 2 BLOCK with >2 medium+ findings) is not pre-armed by new attack surface. T-8 should nonetheless review test honesty for these authz/IDOR tests. Karen/jenny to confirm no drift; no action required of Phase 1.
- **Plan file-path latitude:** P-3 lists `apps/api/src/privacy/privacy.controller.spec.ts` with an explicit "or the repo's controller-test location — node-specialist matches the existing pattern" hedge. The AC targets behavior (PUT /profile/privacy → 400/200), not a hardcoded path, so this is acceptable spec latitude; Karen may spot-check the module path in Phase 2.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3

---

## Phase 2 — merged verdicts (recorded by orchestrator)
| Reviewer | Verdict | Notes |
|---|---|---|
| **karen** | **APPROVE** | All 6 load-bearing claims VERIFIED (pg-harness.ts + sibling specs real-PG, roster filter servers.service.ts:253, endpoints/toUiVisibility:59/beforeSend/updatePrivacy exist, CI postgres:16 + DATABASE_URL_TEST, floor-exemption citations real :215/:306, PrivacyPage/TermsPage:40 "2024"). Test-theater-proof. LOW: insertFixtureUser has no profile_visibility param → B-3 sets it via harnessQuery UPDATE (no schema change); verify at T-4 the 'nobody' value is genuinely set+observed. |
| **jenny** | **APPROVE** | 3/3 spec items MATCH shipped wave-35 behavior, 0 DRIFT. No AC asserts a 3-radio UI / enabled who-can-DM / who-can-DM enforcement (would contradict wave-35 descope) — AC3 correctly tests persist-only. Floor-exemption precedent-application legit (milestone-agnostic wave-16 exemption + wave-24 same-shape). Note: T-4 must confirm integration tier PROVABLY executes (wave-17/24 false-green: Turbo strict-env stripping DATABASE_URL_TEST → SKIPPED despite green). |
| **Gemini** | **UNAVAILABLE** | HTTP 429 (rate-limited). Non-blocking; gate proceeds on karen + jenny. |

**GATE PASSED.** karen + jenny APPROVE; Gemini UNAVAILABLE. security_scope flagged but ships no new auth code (tests OF a shipped boundary) → no forced 2nd Phase-2 iteration. Build/test carry-forwards (not spec changes): B-3 seeds profile_visibility via harnessQuery; T-4 asserts nonzero real-DB row counts (tier executed, not skipped).

## Footer (Phase 2)
- gate_passed: true
- next_block: B (design_gap_flag=false)
