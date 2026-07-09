# Wave 86 — T-9 Block-Exit Gate Verdict

**Block:** T (Test) · **Gate:** T-9 Journey · **Attempt:** 1
**Reviewer:** head-tester (fresh independent review)
**Wave:** explicit antiCsrf posture ('NONE', header-correct) + CSRF regression guard · wave_type=[auth] · backend config-only · deployed live @a9556248 (api 0f38d1fe)

## VERDICT: APPROVED

The security wave is genuinely proven. Not coverage theater.

---

## Judgments

### 1. T-8 live security proof — SUFFICIENT + AIRTIGHT
The pen-test is a rigorous, non-vacuous proof of the live CSRF posture:
- **Same-route triangulation** on POST /servers: Bearer → 201, cookie-only+evil-origin → 401, no-auth → 401. This simultaneously proves the route is genuinely **state-changing AND guarded** (Bearer 201) and that a **cookie-only cross-site forgery cannot authenticate** (401). A test that only showed the 401 without the 201 control would be vacuous; this one isn't.
- The safety of `antiCsrf:'NONE'` is contingent on there being **no cookie-borne auth transport**. `login_unregressed` (tokens returned as response headers, NO set-cookie) confirms the header-transport invariant that makes `'NONE'` non-weakening. This is the load-bearing corroboration and it is present.
- Foreign-origin CORS rejection (ACAO scoped to web origin, attacker origin not reflected) is correct defense-in-depth corroboration.
- `antiCsrf` is a **global session-recipe posture**, not per-route — proving it on one genuinely-guarded state-changing route is sufficient for the posture claim. No gap.
- wave-49 F-2 resolved on the deployed surface. No live vuln (correct framing: this wave is legibility + regression-lock, not a live-CVE fix).

### 2. Regression guard (T-2 / T-4) — GENUINELY EFFECTIVE, not theater
Three properties make it a real tripwire, all confirmed in the stage evidence:
- **Structurally-valid cookie** (not a garbage string) → a failure means the transport pin rejected it, not that a malformed token 401'd for the wrong reason.
- **'any'-transport control block** proves the header pin is load-bearing (legit bearer reaches verification; cookie-only forged → UNAUTHORISED).
- **Shared CSRF_POSTURE const** wires the test to the prod config, so a prod transport change breaks the test.
- T-4 explicitly states the tripwire was **exercised** ("verified tripwire fires on a header→any pin flip") — the flip was actually run, not merely asserted. Drives the **real** SuperTokens Session recipe, not a mock (does not mock the system under test). Confirmed: fails on a transport-pin flip.

### 3. Skip honesty — ALL CORRECT
- **T-5 (e2e)** skipped: config-only, no user-visible behavior change; auth login is covered LIVE at T-8, which is a stronger proof than a synthetic e2e for this wave. Agree.
- **T-3 (contract)** skipped: no contract change. Correct.
- **T-6 (layout)** skipped: no UI. Correct.
- **T-7 (perf)** skipped: not perf-heavy (a config posture value). Correct.
All skips are honest and appropriate for a backend auth-config wave.

### 4. Operational findings disposition — CORRECT (out of scope, non-blocking)
PATCH /servers/:id 500-on-malformed-body (a validation-gap 500 that should be 400 — NOT an auth bypass), missing server-delete route, and the benign leftover fixture-owned test row (id 200ddd1c…, owner = e2e account, not a real user) are all genuinely out of scope for a CSRF-posture wave. Filing to backlog task 1c728847 rather than bundling into this wave is the right disposition. None is a CSRF/auth regression; none blocks this gate.
- **Non-blocking note carried forward:** the leftover test row needs out-of-band DB cleanup (no delete route exists) — tracked on 1c728847.

### 5. Coverage gap / theater scan — NONE BLOCKING
No coverage theater found. Only honest caveat: T-8 proves one route, not an enumeration of every state-changing endpoint — but since `antiCsrf` is a global session-recipe posture, single-route proof is sufficient. Not a gap.

---

## Journey regeneration
```yaml
journey_regen_skipped: true
reason: "Config-only auth-posture wave. No route added/removed/changed, no screen, no endpoint signature change. antiCsrf:'NONE' is an internal session-recipe config value made explicit; user-facing surface inventory (routes/screens/endpoints) is unchanged. Nothing for the journey map to regenerate."
```
Agreed — SKIP is correct.

---

## Gate summary
Static (CI green PR #106), unit (api 821 + csrf-posture 4/4), integration (real Session recipe, exercised tripwire, shared prod const), and LIVE security (airtight same-route forged-cookie rejection + unregressed header-transport login + CORS scoping) all pass. Skips are honest. Operational findings correctly out-of-scope and backlogged. The regression guard is a real, verified tripwire. The live CSRF posture is genuinely proven correct and non-weakening on the deployed surface.

**APPROVED — proceed to V-block.**
