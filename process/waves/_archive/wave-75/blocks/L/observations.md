# Wave-75 L-block observations — knowledge-synthesizer

Append-only. L-2 Distill (karen) reads these; promotes to `*-PRINCIPLES.md` ONLY when an
observation recurs across 2+ waves AND head-verifier approves (max 1 rule/file/wave). Single-wave
observations stay here until a second wave confirms.

---

## L-2 synthesis observations (knowledge-synthesizer)

Inputs read:
- process/waves/wave-75/stages/ full artifact set (P-0-frame, P-0-ceo-reviewer, P-0-mvp-thinner,
  P-0-problem-framer, P-1-decompose, P-2-spec, P-3-plan, P-4-gemini-review, B-0-branch-and-schema,
  B-1-contracts, B-2-backend, B-3-frontend, B-4-wiring, B-5-verify, B-6-review, B-6-review-output,
  C-1-pr-ci-merge, C-2-deploy-and-verify, T-1-static, T-2-unit, T-3-contract, T-4-integration,
  T-5-e2e, T-6-layout, T-7-perf, T-8-security, T-9-journey, V-1-karen, V-1-jenny, V-1-summary,
  V-2-triage, V-3-fast-fix).
- Gate verdicts: process/waves/wave-75/blocks/{P,B,T,V}/gate-verdict.md (P-4 required 2 attempts:
  karen blocked on SessionNoVerifyGuard vs AuthGuard; fixed in spec before B-0; all other blocks
  APPROVED first attempt).
Prior archives consulted:
- process/waves/_archive/wave-74/blocks/{P,B,T,V}/gate-verdict.md + wave-74/stages/T-{2,4,8}*.md
  (wave-74 had no L-block observations.md; observations referenced in the brief were reconstructed
  from the primary artifacts).
- process/waves/_archive/wave-73/blocks/L/observations.md (most recent prior L-block; 2 HOLDs:
  obs-1 T-4.md rule 1 candidate "prove hook fires by persisted row"; obs-2 T-8.md rule 4
  candidate "read controller route before probing").
Principles files read:
- BUILD-PRINCIPLES.md (15 rules), PRODUCT-PRINCIPLES.md (5 rules), CI-PRINCIPLES.md,
  VERIFY-PRINCIPLES.md (4 rules), T-4.md (0 rules), T-8.md (3 rules).

---

## Explicit recurrence verdicts on standing held candidates

### wave-73 obs-1 (HOLD — 1st instance): T-4.md candidate — prove a service-layer side-effect hook fires by asserting the persisted DB row, not the call site

**Verdict: NOT a confirming 2nd instance. HOLD maintained.**

Wave-75's T-4 authored `billing-subscriptions-upsert.spec.ts` as a real-DB integration test for
the `ON CONFLICT (server_id) DO UPDATE` upsert (asserting row-count=1 after two changes, tier
reflects new value, updated_at advances). This is a real-DB boundary assertion, not a call-site
grep. However, the class wave-73 obs-1 captures is specifically "a side-effect hook that fires
after a real parent action" (audit trail, notification, webhook). The wave-75 T-4 spec is a direct
upsert-idempotency test, not a hook-firing verification. More importantly, the spec was authored
but not executed (no local Postgres, `skipIf(!DATABASE_URL_TEST)`, deferred to follow-up PR CI) --
so it is not a wave where the hook-firing assertion technique was independently mandated by a new
risk. The upsert behavior was proven end-to-end at T-5 (live), not via the T-4 spec. Not a
confirming instance of the same class; HOLD maintained. Watch for a future wave introducing a
service-level hook (audit, webhook, analytics) where the "assert the persisted row, not the call
site" requirement is independently forced.

---

### wave-73 obs-2 (HOLD — 1st instance): T-8.md candidate — read the deployed controller to confirm the route path before issuing T-8 probes

**Verdict: NOT a confirming 2nd instance. HOLD maintained.**

Wave-75's T-8 probed the correct routes without any wrong-path inference. All five probe targets
(POST /billing/tier, GET /billing/plan, GET /educator-tools/status, unauth variants) resolved
correctly. No 404-caused-by-wrong-path appeared; no seam was incorrectly marked "not deployed."
Not a confirming instance. HOLD maintained.

---

### wave-74 held candidate — BUILD-16 (per brief): query the live maximum before setting a placeholder cap

**Verdict: NOT a confirming 2nd instance. HOLD maintained.**

The brief identifies wave-74's T-5-live regression (free.maxServersPerOwner=100 blocked a 646-
server owner) as a 1st instance of a "query live max before shipping a placeholder cap" class.
Wave-75 applied the lesson: the spec mandated a hard non-regression AC (`maxServersPerOwner`
non-restrictive, free value stays >=100_000), and entitlements.service.spec.ts asserts the
646-owner case directly (`646 < 100_000`). This is an application of the lesson, not an
independent recurrence of the cap-too-low failure. Applying a lesson is not a confirming
instance. HOLD maintained. A confirming instance requires a new wave where a placeholder cap is
independently set too low and catches a live boundary -- and where querying the live max before
speccing the value would have prevented it.

---

### wave-74 held candidate — T-4-1 (per brief): pure stub for the non-subject dependency in a fault-injection integration spec

**Verdict: NOT a confirming 2nd instance. HOLD maintained.**

Wave-74's `create-server-rollback.spec.ts` stubbed EntitlementsService permissively so the
rollback mechanism (not the gate) was the unit under test against real Postgres, with a query-
fault injected via pool.connect() override. Wave-75's T-4 test (`billing-subscriptions-upsert
.spec.ts`) tests upsert idempotency against a real DB but involves no fault injection and no
competing dependency to stub permissively. The wave-75 work is a different genre (idempotency
assertion vs. rollback/fault-injection) and was not executed. Not a confirming instance of the
"pure stub in fault injection" class. HOLD maintained.

---

## obs-1 — WARNING (1st INSTANCE): a payments or tier-mutation endpoint must use the verification-required guard, not the email-verification-bypass exception guard

**Source artifacts:**
- process/waves/wave-75/blocks/P/gate-verdict.md (Phase 2 — karen, attempt 1): "Claim 5 — WRONG
  (load-bearing). The servers controller does NOT use SessionNoVerifyGuard. Every guarded route ...
  uses @UseGuards(AuthGuard). SessionNoVerifyGuard ... is a deliberate narrow exception whose own
  header says it is 'Used ONLY on routes that must remain reachable for authenticated-but-
  unverified users (/me, /profile)' -- it strips the EmailVerification claim validator. AuthGuard
  is the email-verification-REQUIRED default for all other routes. The spec block-1 API contract
  and P-3 plan both pin the billing/tier endpoints to SessionNoVerifyGuard. Applying that guard to
  a payments/entitlement-mutation surface would let authenticated-but-email-UNVERIFIED users change
  server tiers -- a security regression on the exact surface the P-4 security-scope-tightened gate
  is meant to protect."
- process/waves/wave-75/blocks/P/gate-verdict.md (Phase 2 merge): "REWORK applied: SessionNoVerify
  Guard → AuthGuard in spec block-1/2 api lines (×3 endpoints) + reuse line + P-3 API contracts ...
  Security-scope tightened gate (payments) mandates a 2nd Phase 2 pass."
- process/waves/wave-75/stages/T-8-security.md (Probe 3): "the P-4-caught SessionNoVerifyGuard
  hole is truly closed live. All three endpoints use the verification-REQUIRED AuthGuard ... 401
  precedes 403 (no route-existence leak via 403-before-401)."
- process/waves/wave-75/blocks/B/gate-verdict.md: "the only SessionNoVerifyGuard string in the diff
  is a comment explaining why it is deliberately NOT used -- the P-4-caught hole is closed."

**Assessment:** The spec author copied the `SessionNoVerifyGuard` idiom from the `/me`+`/profile`
surface (the nearest controller with billing-adjacent context), not from the server-mutation
controllers that are the actual idiom for server-scoped writes. The payment/tier-mutation context
requires a higher trust bar -- the user must have verified their email, not merely authenticated.
`SessionNoVerifyGuard` strips the `EmailVerification` claim validator (`overrideGlobalClaimValidators:
() => []`), which is the WEAKER posture. `AuthGuard` (the default for every `servers.controller.ts`
route) is the STRONGER and correct posture.

The risk if this had shipped: authenticated-but-email-unverified sessions could change server
billing tiers. The guard selection error was invisible to Phase 1 (head-product approved it on
the first attempt by inverting the rationale, calling `SessionNoVerifyGuard` "correct over
AuthGuard -- it verifies session without global claim validators" -- precisely wrong). Only karen's
per-claim code-vs-claim verification at Phase 2 caught it.

The class is generalizable beyond billing: any spec that copies a guard name from the nearest
controller without checking that controller's trust level risks assigning the wrong posture to a
new endpoint. The falsifiable rule targets the spec-time decision: when speccing any new endpoint,
select the guard based on the endpoint's required trust level (mutation, payment, PII) vs. the
nearest controller's idiom.

**Near-dup check vs BUILD-PRINCIPLES rules 1-15:**
- Rule 4 ("Reproduce one negative path per authz or injection boundary at B-6 Phase-2") is a
  B-6 gate obligation to test; it does not govern guard SELECTION at spec time. Different timing,
  different obligation. Not a near-dup.
- No existing BUILD rule addresses "select the guard by endpoint sensitivity, not by copying the
  nearest controller." Not a near-dup.

**Near-dup check vs T-8.md rules 1-3:**
- Rule 1 prescribes live-probe the authz path at T-8; it does not govern which guard to assign
  at spec time. Not a near-dup.
- Rules 2-3 are about :id validation and WS envelope fixes. Not a near-dup.

**Near-dup check vs PRODUCT-PRINCIPLES rules 1-5:** None address guard selection. Not a near-dup.

**Pre-shaped candidate (HOLD — 1st instance only):**
```
16. Assign a new endpoint's auth guard by its required trust level, not by copying the nearest controller.
    Why: A payment endpoint specced with an auth-bypass guard allows unverified sessions to mutate tier.
```
Rule line = 94 chars. PASS (<=120). Why line = 86 chars. PASS (<=100).
No forbidden tokens (no `we`, `our`, `the team`, `during wave-`, `wave-<N>`, em-dash, long
parenthetical). PASS. Near-dup vs BUILD rules 1-15: PASS. Near-dup vs T-8 rules 1-3: PASS.
Candidate file: BUILD-PRINCIPLES.md rule 16 candidate (this is a spec-authoring / guard-selection
convention that the builder inherits and implements; it is not scoped to a single test layer).

**Severity:** warning -- the defect was on the security-critical payments surface; Phase 1 approved
  the wrong guard with an inverted rationale; the spec would have been built as-written without
  karen's Phase 2 per-claim code verification; the T-8 live confirmation closes the loop.
**Candidate principles file:** BUILD-PRINCIPLES.md rule 16.
**Cross-wave recurrence:** FIRST INSTANCE. HOLD pending 2nd confirming wave.
**Promotion flag:** HOLD -- 1st instance. Watch for any future wave where a new endpoint is
  specced with the wrong guard class (bypass vs. required) because the author copied from an
  adjacent controller with a different trust level.

---

## obs-2 — INFORMATIONAL (1st instance): when building a mock behind a seam for a known future integration, shape the interface to the real integration's async/callback contract

**Source artifacts:**
- process/waves/wave-75/stages/P-0-ceo-reviewer.md (§ Binding note): "the BillingProvider interface
  must be shaped so a real StripeBillingProvider (async checkout redirect + webhook-driven state,
  NOT synchronous mock return) fits without re-plumbing callers. If P-3's seam is modeled on the
  mock's synchronous shape only, the 'later Stripe is easy' thesis silently breaks and the wave's
  strategic payoff evaporates."
- process/waves/wave-75/blocks/P/gate-verdict.md (Phase 1, attempt 1): "BillingProvider seam is
  DI-swappable and correctly shaped for a real async-redirect/webhook provider (status + optional
  checkoutUrl in the return so a StripeBillingProvider drops in with zero call-site change)."
- process/waves/wave-75/blocks/P/gate-verdict.md (karen, attempt 1 antipattern sweep): "NOT flagged
  [as premature abstraction]. The DI seam with {status, tier, entitlements, checkoutUrl?} return is
  justified -- it is the explicit drop-in point for real Stripe ... shaped for async redirect/
  webhook. One interface + one impl behind one token is the minimum honest seam."
- process/waves/wave-75/blocks/B/gate-verdict.md: "TierChangeResult.status / checkoutUrl are
  currently write-only (Stripe-shaping). Defensible as spec-blessed seam-shaping; recorded as a
  deliberate keep."

**Assessment:** The strategic value of the wave depended on the seam being a genuine drop-in for
real Stripe. Stripe Checkout is async redirect + webhook (not a blocking synchronous return). The
spec could have modeled the interface on what the mock needs (a synchronous `{tier, entitlements}`
return), which would have forced re-plumbing of every call site when the real provider arrives.
The P-0 ceo-reviewer identified this risk explicitly and issued a binding note requiring the
interface to accommodate the real integration's async shape before P-3 authoring. The result is
a `checkoutUrl?: string` field in `TierChangeResult` that the mock returns as `null` -- the field
does nothing in the mock but the call sites are already written to handle it, so StripeBillingProvider
can return a real URL without touching any caller.

This is a generalizable tension: the temptation when building a mock behind a seam is to model
the interface on what the mock needs (simple, synchronous, immediate) rather than what the real
integration will need (async, callback-driven, possibly multi-step). If the seam is shaped for
mock convenience, it becomes a seam that must be re-plumbed -- defeating the purpose of having a
seam.

**Near-dup check vs PRODUCT-PRINCIPLES rules 1-5:**
- Rule 3 ("Build an external-SDK feature's credential-independent ACs now with a placeholder key;
  defer live verify to T-5/C-2") governs WHEN to build (now vs. later) and WHAT to verify (ACs
  vs. live). It does not govern HOW to shape the interface for the future integration. Not a
  near-dup.
- Rules 1, 2, 4, 5 are unrelated. Not near-dups.

**Near-dup check vs BUILD-PRINCIPLES rules 1-15:** No rule addresses interface shape for a seam
intended to accommodate a known future async integration. Not a near-dup.

**Pre-shaped candidate (HOLD -- 1st instance only):**
```
6. Shape a seam for a fenced real integration by its async/callback contract, not by the mock's synchronous convenience.
   Why: A seam modeled on mock shape requires re-plumbing every caller when the real async provider arrives.
```
Rule line = 111 chars. PASS (<=120). Why line = 89 chars. PASS (<=100).
No forbidden tokens. PASS. Near-dup vs PRODUCT-PRINCIPLES 1-5: PASS. Near-dup vs BUILD rules
1-15: PASS. Candidate file: PRODUCT-PRINCIPLES.md rule 6 candidate (this is a product/scope/
architecture decision at P-3 time, not a build-layer code convention; the ceo-reviewer's binding
note was a P-0-frame-level mandate, and the principle governs how a seam is scoped before
building, not how it is implemented).

**Severity:** informational -- the correct decision was made; no defect shipped; the ceo-reviewer's
  binding note pre-empted the wrong path. Valuable first instance because the failure mode (seam
  shaped for mock convenience, re-plumbed when real integration arrives) is common and silent.
**Candidate principles file:** PRODUCT-PRINCIPLES.md rule 6.
**Cross-wave recurrence:** FIRST INSTANCE. HOLD pending 2nd confirming wave.
**Promotion flag:** HOLD -- 1st instance. Watch for any wave building a mock behind a seam for a
  known future async integration (payments, email provider, push notification, OAuth callback)
  where the interface is shaped for mock convenience and callers must be re-plumbed later.

---

## obs-3 — INFORMATIONAL: status check on all standing prior held candidates

| origin | class | wave-75 status |
|--------|-------|----------------|
| wave-73 obs-1 (HOLD -- 1st instance) | T-4 candidate: prove hook fires by persisted DB row, not call site | NOT CONFIRMED. Wave-75 T-4 authored a real-DB upsert spec (correct technique) but it was not executed and tests a different class (idempotency vs. hook-firing). HOLD maintained. |
| wave-73 obs-2 (HOLD -- 1st instance) | T-8 candidate: read controller route path before probing | NOT CONFIRMED. Wave-75 T-8 probed correct routes; no wrong-path 404. HOLD maintained. |
| wave-74 held-BUILD-16 (per brief, 1st instance) | Query live max before setting a placeholder cap | NOT CONFIRMED as 2nd instance. Wave-75 applied the lesson (hard non-regression AC + 646-owner unit assertion). Applying a lesson is not a confirming instance. HOLD maintained. |
| wave-74 held-T-4-1 (per brief, 1st instance) | Pure stub for non-subject dependency in fault-injection integration spec | NOT CONFIRMED. Wave-75 T-4 tested upsert idempotency, not fault injection; no competing dependency to stub. HOLD maintained. |
| wave-72 obs-1 (HOLD -- 1st instance) | Grep built SPA bundle for require( before merge | NOT CONFIRMED (no CJS-in-browser-bundle failure this wave). HOLD maintained. |
| wave-71 obs-1 (HOLD -- 1st instance) | Route every mutation through the state owner | NOT CONFIRMED. Wave-75 introduces no shared-store optimistic state. HOLD maintained. |
| wave-70 obs-2 (HOLD -- 1st instance) | Realtime fan-out for a gated write must be downstream of the gate | NOT CONFIRMED. Wave-75 introduces no websocket fan-out. HOLD maintained. |
| wave-70 obs-3 (HOLD -- 1st instance) | Backend list endpoint must include display fields if UI renders rows by name | NOT CONFIRMED. The billing plan endpoint returns caps/tier, not user display names; no display-field gap. HOLD maintained. |

**Severity:** informational (status check only).
**Candidate principles file:** none.
**Promotion flag:** NO.

---

## Summary table

| id | title (short) | severity | recurrence | candidate file | disposition |
|----|---------------|----------|------------|----------------|-------------|
| wave-73 obs-1 verdict | Prove hook fires by persisted DB row | informational | NOT CONFIRMED (different class + not executed) | none | HOLD maintained |
| wave-73 obs-2 verdict | Read controller route before T-8 probes | informational | NOT CONFIRMED (correct routes probed) | none | HOLD maintained |
| wave-74 BUILD-16 verdict | Query live max before setting placeholder cap | informational | NOT CONFIRMED (lesson applied, not a new failure) | none | HOLD maintained |
| wave-74 T-4-1 verdict | Pure stub in fault-injection spec | informational | NOT CONFIRMED (different genre, not executed) | none | HOLD maintained |
| obs-1 | Assign endpoint guard by trust level, not by nearest-controller copy | warning | FIRST INSTANCE | BUILD-PRINCIPLES.md rule 16 | HOLD -- 1st instance |
| obs-2 | Shape a seam for a fenced integration by its async/callback contract | informational | FIRST INSTANCE | PRODUCT-PRINCIPLES.md rule 6 | HOLD -- 1st instance |
| obs-3 | Status check: all standing HOLDs maintained; no new confirming instances | informational | -- | none | STATUS CHECK ONLY |

**Observations emitted (knowledge-synthesizer): 3 (obs-1, obs-2, obs-3; plus 4 held-candidate
  verdicts)**
**Severities: 1 warning (obs-1), 2 informational (obs-2, obs-3)**

---

## Promotion-candidate assessment

**Genuine promotion candidates this wave: 0.**

- **obs-1** (BUILD-PRINCIPLES.md rule 16 candidate): HOLD -- 1st instance only. The P-4 catch
  is high-value and the class (wrong guard tier by nearest-controller copy on a spec-time decision)
  is not covered by any existing rule. Falsifiable and generalizable. Pre-shaped rule text passes
  the format contract. Needs a 2nd independent instance before karen can vet for promotion.

- **obs-2** (PRODUCT-PRINCIPLES.md rule 6 candidate): HOLD -- 1st instance only. The seam-
  shaping principle is novel (not covered by PRODUCT rule 3's credential-deferral focus), but
  this wave made the correct call proactively. The failure mode is plausible and silent. Needs
  an independent confirming wave where a seam IS mis-shaped for mock convenience to cross the bar.

- **wave-73 obs-1** (T-4.md rule 1 candidate): HOLD -- wave-75's T-4 work is related but not
  a confirming instance. The closest alignment is `billing-subscriptions-upsert.spec.ts`'s real-DB
  assertion goal, but it was authored-not-run and tests idempotency, not hook-firing. Watch for
  a future wave with a service-layer side-effect hook (audit, notification, analytics, webhook)
  requiring a per-seam DB read-back assertion.

- **All other standing HOLDs**: not confirmed this wave. Maintain.
