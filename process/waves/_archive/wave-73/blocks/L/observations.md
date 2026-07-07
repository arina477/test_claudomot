# Wave-73 L-block observations — knowledge-synthesizer

Append-only. L-2 Distill (karen) reads these; promotes to `*-PRINCIPLES.md` ONLY when an
observation recurs across 2+ waves AND head-verifier approves (max 1 rule/file/wave). Single-wave
observations stay here until a second wave confirms.

---

## L-2 synthesis observations (knowledge-synthesizer)

Inputs read:
- process/waves/wave-73/stages/ full artifact set (P-0-frame, P-1-decompose, P-2-spec, P-3-plan,
  P-4-gemini-review, B-0-branch-and-schema, B-1-contracts, B-2-backend, B-3-frontend, B-4-wiring,
  B-5-verify, B-6-review, B-6-review-output, C-1-pr-ci-merge, C-2-deploy-and-verify, T-1-static,
  T-2-unit, T-3-contract, T-4-integration, T-5-e2e, T-6-layout, T-8-security, T-9-journey,
  V-1-karen, V-1-jenny, V-1-summary, V-2-triage, V-3-fast-fix).
- Gate verdicts: process/waves/wave-73/blocks/{P,B,T,V}/gate-verdict.md (all APPROVED;
  B-6 Phase-2 /review caught + fixed 4 P2 findings including 2 false-event writes to a
  permanent ledger; T-8 probed the wrong block/unblock route path, resolved by jenny at V-1).
Prior archives consulted:
- process/waves/_archive/wave-{70,71,72}/blocks/L/observations.md (3-wave window; focus on
  wave-72 obs-1 HOLD [CJS bundle scan] and all active HOLDs).
Principles files read:
- BUILD-PRINCIPLES.md (15 rules), CI-PRINCIPLES.md (11 rules), VERIFY-PRINCIPLES.md (4 rules),
  PRODUCT-PRINCIPLES.md (5 rules), T-4.md (0 rules), T-8.md (3 rules),
  command-center/testing/test-writing-principles.md.

---

## Explicit recurrence verdicts on standing held candidates

### wave-72 obs-1 (HOLD — 1st instance): grep the built SPA bundle for require( before merge

**Verdict: NOT a confirming 2nd instance. HOLD maintained.**

Wave-73 did NOT reproduce the CJS-in-browser-bundle failure. The zero-require check was applied
deliberately: karen's V-1 source-claim verification (#6) explicitly grepped the deployed web bundle
at commit 29a140d and confirmed `require("./` count = 0. The P-3 plan noted `packages/shared` stayed
ESM (package.json `"type":"module"`), and B-6 post-fix re-verify confirmed `web build zero-require`.

This is an APPLICATION of the wave-72 lesson, not a confirming failure instance. The wave-72 fix
(switching `@studyhall/shared` to ESM emission) held; no new CJS artifact leaked into the bundle;
the bundle scan produced zero matches exactly because the upstream fix was applied correctly.

Applying a lesson is not a confirming instance. A confirming instance is the SAME failure class
recurring independently. HOLD maintained. For wave-72 obs-1 to cross the promotion bar it needs
a fresh wave where the CJS-in-browser-bundle failure re-occurs (or where the bundle scan
independently catches a different variant of the class). The deliberate check being applied and
passing is valuable evidence of the rule's utility, but it is not the recurrence the protocol
requires for promotion.

---

### wave-71 obs-1 (HOLD — 1st instance): route every mutation through the state owner

**Verdict: NOT CONFIRMED this wave. HOLD maintained.**

Wave-73 introduces no shared-store optimistic state, no React context with mutation methods, and
no component that could bypass a store. The privacy hooks are backend service calls; the frontend
panel is a read-only list with no optimistic mutation path. Not a confirming instance.
HOLD maintained; watch for any wave introducing a component that triggers a write on a
state slice managed by a shared store/context/hook.

---

### wave-70 obs-2 (HOLD — 1st instance): realtime fan-out for a gated write must be downstream of the gate

**Verdict: NOT CONFIRMED this wave. HOLD maintained.**

Wave-73 introduces no websocket fan-out and no realtime delivery path. The privacy-events append
is a fire-and-forget DB insert with no socket emit. Not a confirming instance. HOLD maintained.

---

### wave-70 obs-3 (HOLD — 1st instance): a backend list endpoint must include display fields if UI renders rows by name/avatar

**Verdict: NOT CONFIRMED this wave. HOLD maintained.**

Wave-73's `GET /profile/privacy-events` returns only opaque UUIDs and enum values; the UI renders
plain-language labels derived from enum values, not display names. No display-field gap exists on
this surface. Not a confirming instance. HOLD maintained.

---

## obs-1 — WARNING (1st INSTANCE): assert a side-effect hook fires by reading back the persisted row; a call-site grep is not proof of wiring

**Source artifacts:**
- process/waves/wave-73/stages/P-3-plan.md (§ Binding refinement: "B-2's live-DB integration test
  asserts an ACTUAL privacy_events row after each of the 4 real actions — never a code-read that
  the hook exists (guards the 'plumbing built but not wired' pattern). B-6 must verify each hook
  fires at its seam.")
- process/waves/wave-73/blocks/P/gate-verdict.md (§ Gate 1: "The highest-risk claim —
  per-seam LIVE-DB assertion guarding the wave-71/72 'plumbing built but not wired' pattern — is
  genuinely met: the integration test instantiates the REAL production services and asserts a real
  `privacy_events` row after each of the 5 real actions, via a separate DB connection.")
- process/waves/wave-73/blocks/B/gate-verdict.md (§ Gate 1: "It does NOT code-read hook presence;
  it performs each real action and asserts a real row via the SEPARATE `harnessQuery` pool";
  constructor signatures verified identical to shipped DI so the test exercises the actual shipped
  hooks, not test doubles of the SUT.)
- process/waves/wave-73/blocks/T/gate-verdict.md (§ Rationale: "Per-seam hook-firing (the critical
  claim) is proven at two independent altitudes ... assertions on returned rows, not mock call
  counts — a plausible real bug (hook not wired, wrong event_type, false event on no-op) would
  fail them.")

**Assessment:** Wave-73 built 4 service-level hooks that each append a row after a real action
completes. The single highest-risk failure mode — explicitly named as "plumbing built but not wired"
across P-0, P-3, B-6, and T-9 — is a service that has the hook call in its source but does not
actually invoke it in the real DI graph (wrong injection, missing provider registration, wrong
method called). This failure is invisible to: (a) a grep for the call site ("the append() call
exists at line 124"); (b) a unit test that mocks the append service (the mock is called regardless
of whether the real service is injected); (c) a code-read that the try/catch block is present.

The only proof that a hook fires at its seam is to perform the real parent action through the real
service with a real DB and then query the DB for the expected row. Wave-73 mandated this
explicitly and the B-6 gate verified it was genuinely implemented (real service constructors, real
harness pool, real postgres:16 in CI).

**Near-dup check vs BUILD-PRINCIPLES rules 1-15:**
- Rule 9 ("Author an integration spec exercising every new service or DB boundary in the B-block")
  prescribes that an integration spec EXISTS — not WHAT the spec must assert. A spec that grepped
  for the call site would satisfy rule 9 but would not catch the "plumbing not wired" failure.
  The gap this observation targets is the assertion shape (DB read-back vs. call-site presence),
  not the presence of a spec. Not a near-dup.
- Rule 12 ("Test a component's success callback through its real parent caller") is a frontend
  wiring rule — it targets React component prop-wiring in a browser component test. This
  observation targets backend service-hook wiring in a DB integration test. Different artifact
  layer, different test environment, different failure mode. Not a near-dup.
- Rule 4 (adversarial reproduction at B-6 Phase-2) targets authz and injection boundary
  verification, not side-effect hook firing. Not a near-dup.
- No existing BUILD rule prescribes "assert the persisted side-effect row, not the call site" for
  service hooks at T-4. Not a near-dup.

**Near-dup check vs T-4.md rules:** T-4.md has no rules yet. Not a near-dup.

**Pre-shaped candidate (for future 2nd instance — NOT a nomination; 1st instance only):**
```
1. Prove a service-layer side-effect hook fires by asserting the persisted row in the DB, not by reading the call site.
   Why: A call-site grep passes even when the hook is never invoked in the real DI graph.
```
Rule line = 111 chars. PASS (<=120). Why line with 3-space indent = 83 chars. PASS (<=100).
No forbidden tokens. PASS. Near-dup vs BUILD rules 1-15: PASS. Near-dup vs T-4 rules: PASS.
Candidate file: T-4.md rule 1 candidate (the class is scoped to integration-layer assertion
shape; BUILD rule 9 already covers the existence of the spec).

**Severity:** warning (the risk was real and explicitly named; the failure mode — hook exists in
  source but never fires in the real DI graph — would have shipped invisible plumbing with zero
  audit events; the spec binding refinement was the sole mechanism that prevented it; FIRST
  INSTANCE of this specific class being formally identified and enforced).
**Candidate principles file:** T-4.md rule 1 candidate.
**Cross-wave recurrence:** FIRST INSTANCE. HOLD pending 2nd confirming wave.
**Promotion flag:** HOLD — 1st instance. Watch for any wave introducing a service-level hook
  or side-effect that must fire after a real action (audit, notification, webhook, analytics).

---

## obs-2 — INFORMATIONAL (1st instance): verify the route path from the deployed controller before probing at T-8

**Source artifacts:**
- process/waves/wave-73/stages/T-8-security.md (§ Probe 3: "POST /profile/block/:userId,
  PUT /profile/block/:userId, PATCH /profile/block/:userId, and POST /profile/blocks all return
  404. The block/unblock feature endpoints are not deployed in prod." → marked NOT APPLICABLE.)
- process/waves/wave-73/stages/V-1-jenny.md (§ Finding 1: "T-8 Probe 3 marked block/unblock N/A
  because those paths never existed. The real route is @Controller('blocks') ... @Post() at :67,
  @Delete(':blockedUserId') at :85. I independently probed the deployed API: POST /blocks → 401
  and DELETE /blocks/<uuid> → 401 — confirming the block/unblock seam is mounted and live in
  prod.")
- process/waves/wave-73/stages/V-2-triage.md (§ Noise: "T-8 block/unblock 'route absent':
  RESOLVED by jenny — the seam IS live at @Controller('blocks'); T-8 probed the wrong path.
  Not a defect. Suppress.")
- process/waves/wave-73/blocks/T/gate-verdict.md (§ Rationale: "The honest characterization is
  route-absent/undeployed; it does not change the verdict.")

**Assessment:** The T-8 tester attempted to probe the block/unblock HTTP→hook wiring by guessing
four route variants (`/profile/block/:userId`, `/profile/blocks`, etc.) all of which returned 404.
The conclusion was "feature not deployed." The seam was in fact deployed and live, at the correct
controller-defined path (`/blocks` — `@Controller('blocks')`). The tester inferred the route from
the feature name rather than reading the controller to find the registered path.

This is a testing-discipline gap distinct from the T-8 rules already in place. T-8 rules 1-3
cover: live-probe the authz path with a verified fixture (rule 1); probe malformed :id on the
authed path and assert 400 (rule 2); verify a WS error-envelope fix with a live socket probe
(rule 3). None prescribes "verify the route path from the controller before probing." The gap is
upstream of the probe: the tester must confirm the actual registered path before issuing curl.
This prevents a false "not deployed" conclusion when the seam is live at a different path.

**Consequence in wave-73:** Low-severity (the block/unblock seam was independently covered by
the CI pg-harness at T-4; the T-8 gap was an exclusion from live HTTP→hook wiring, not an
uncovered security boundary; jenny resolved it at V-1; the T-block gate verdict accepted it as
a "documented boundary, seam covered at the integration layer"). No security claim was missed;
the IDOR and auth gate probes were unaffected.

**Near-dup check vs T-8.md rules 1-3:** None of rules 1-3 cover route-path verification before
probing. Not a near-dup.

**Pre-shaped candidate (for future 2nd instance — NOT a nomination; 1st instance only):**
```
4. Read the deployed controller to confirm the registered route path before issuing T-8 probes.
   Why: A route inferred from the feature name rather than the controller returns 404 on the real seam.
```
Rule line = 107 chars. PASS (<=120). Why line with 3-space indent = 92 chars. PASS (<=100).
No forbidden tokens. PASS. Near-dup vs T-8 rules 1-3: PASS.
Candidate file: T-8.md rule 4 candidate.

**Severity:** low (the block/unblock seam was CI-integration-covered; no security AC was actually
  missed; the gap was a probe-path inference error corrected at V-1; consequence was an exclusion
  annotation in T-8, not a missed finding).
**Candidate principles file:** T-8.md rule 4 candidate.
**Cross-wave recurrence:** FIRST INSTANCE. HOLD pending 2nd confirming wave.
**Promotion flag:** HOLD — 1st instance; low severity. Watch for any wave where T-8 marks a
  seam as "not deployed" based on a 404 that is later found to be a wrong-path probe.

---

## obs-3 — INFORMATIONAL: status check on all standing prior observations from the 5-wave window

| origin | class | wave-73 status |
|--------|-------|----------------|
| wave-72 obs-1 (HOLD — 1st instance) | Grep built SPA bundle for require( before merge | NOT CONFIRMED as 2nd instance. Bundle scan was applied and passed (zero matches on 29a140d). Applied lesson, not a new failure. HOLD maintained. |
| wave-71 obs-1 (HOLD — 1st instance) | Route every mutation through the store/module that owns the optimistic state | NOT CONFIRMED. Wave-73 frontend is a read-only list panel; no optimistic mutation path exists. HOLD maintained. |
| wave-70 obs-2 (HOLD — 1st instance) | Realtime fan-out for a gated write must be downstream of the gate | NOT CONFIRMED. Wave-73 introduces no websocket fan-out. HOLD maintained. |
| wave-70 obs-3 (HOLD — 1st instance) | A backend list endpoint must include display fields if UI renders rows by name/avatar | NOT CONFIRMED. The audit log list renders enum labels, not user display names. No display-field gap. HOLD maintained. |
| wave-64 obs-1 (HOLD) | createObjectURL Blob must pair src-change revoke AND unmount revoke | NOT CONFIRMED. Wave-73 introduces no Blob, no createObjectURL. HOLD maintained. |
| wave-60 obs-1 (STRONG HOLD) | Hardcoded palette hex in .tsx files where consumable CSS tokens exist | NOT CONFIRMED. PrivacyActivityPanel.tsx uses DS tokens throughout (no palette hex literals). STRONG HOLD maintained. |
| wave-58 obs-A (HOLD) | Hardening a pass-regardless soft-check into a gating assertion exposes a masked defect | NOT CONFIRMED. No soft-check converted to a gating assertion this wave. HOLD maintained. |
| wave-59 obs-3 (HOLD) | Test a multi-branch pure formatter with a single it.each table | NOT CONFIRMED. Wave-73 tests are a pg-harness integration suite and RTL component tests. No multi-branch pure-function formatter. HOLD maintained. |
| wave-57 obs-1 (HOLD) | Interactive nav/rail button shipped with no onClick from a prior wave | NOT CONFIRMED. PrivacyActivityPanel is read-only (no interactive affordances beyond the "Try again" retry). HOLD maintained. |
| wave-52 obs-3(a) (HOLD) | VERIFY: independently re-probe load-bearing claims before accepting verdict | CONFIRMED BY APPLICATION. Karen git-verified all 6 file-existence claims + the zero-require bundle scan + route live at 401 + append-only surface (no update/delete method). Jenny independently probed the live API: Fixture A generated a real event, B's token returned empty, block/unblock seam confirmed live at /blocks. Head-verifier confirmed no cross-endorsement. Still HOLD for VERIFY rule 5 candidacy. |

**Severity:** informational (status checks; one HOLD confirmed by application; all other HOLDs
  maintained; no new confirming instances across the 5-wave window).
**Candidate principles file:** none (status-check observation only).
**Promotion flag:** NO (status check only).

---

## Summary table

| id | title (short) | severity | recurrence | candidate file | disposition |
|----|---------------|----------|------------|----------------|-------------|
| wave-72 obs-1 verdict | CJS bundle scan — applied lesson, not new failure | informational | NOT CONFIRMED as 2nd instance | none | HOLD maintained |
| wave-71 obs-1 verdict | Route mutations through state owner | informational | NOT CONFIRMED (no optimistic mutation path) | none | HOLD maintained |
| obs-1 | Prove a service-layer side-effect hook fires by asserting the persisted DB row, not the call site | warning | FIRST INSTANCE | T-4.md rule 1 candidate | HOLD — 1st instance |
| obs-2 | Read the deployed controller to confirm the route path before issuing T-8 probes | low | FIRST INSTANCE | T-8.md rule 4 candidate | HOLD — 1st instance; low severity |
| obs-3 | Status check on all standing prior observations: no new confirming instances | informational | — | none | STATUS CHECK ONLY |

**Observations emitted (knowledge-synthesizer): 3 (obs-1, obs-2, obs-3; plus held-candidate
  verdicts for wave-72 obs-1 and wave-71 obs-1)**
**Severities: 1 warning (obs-1), 1 low (obs-2), 1 informational (obs-3)**

---

## Promotion-candidate assessment

**Genuine promotion candidates this wave: 0.**

- **obs-1** (T-4.md rule 1 candidate): HOLD — 1st instance only. Valuable and non-overlapping
  with existing rules, but the 2-wave recurrence bar has not been cleared. Watch for any future
  wave with service-layer hooks (audit, webhook, notification, analytics) where hook firing must
  be proven. If a second wave independently mandates the same "assert the persisted row, not the
  call site" requirement (especially if the pattern is enforced as a binding spec refinement
  again), this should be the T-4.md rule 1 candidate.

- **obs-2** (T-8.md rule 4 candidate): HOLD — 1st instance only, low severity. Watch for any
  wave where T-8 marks a seam as "not deployed" based on a 404 that is later found to be a
  wrong-path probe.

- **wave-72 obs-1** (BUILD-PRINCIPLES candidate — CJS bundle scan): NOT confirmed this wave.
  Wave-73 applied the lesson (zero-require scan passed); the failure did not recur. HOLD
  maintained until a fresh CJS-in-browser-bundle failure independently arises on this codebase.

- **wave-71 obs-1** (BUILD-PRINCIPLES candidate — route mutation through state owner): NOT
  confirmed this wave. HOLD maintained.

This is a clean, well-executed wave with no regressions and no P0/P1 findings. The B-6 Phase-2
/review caught 4 P2 quality issues (2 of which wrote false rows into a permanent append-only
ledger — a meaningful correctness catch), but none constitute a new generalizable failure class
beyond what is already expressed in BUILD rule 15 (multi-step mutation atomicity, promoted from
wave-72) or existing BUILD rules. The wave's primary value to the knowledge base is planting two
1st-instance HOLD candidates in T-4 and T-8, neither of which is ready for promotion.
