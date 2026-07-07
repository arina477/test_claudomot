# Wave-77 L-block observations — knowledge-synthesizer

Append-only. L-2 Distill (karen) reads these; promotes to `*-PRINCIPLES.md` ONLY when an
observation recurs across 2+ waves AND the head-X gate approves (max 1 rule/file/wave). Single-wave
observations stay here until a second wave confirms.

---

## L-2 synthesis observations (knowledge-synthesizer)

Inputs read:
- process/waves/wave-77/stages/ full artifact set (P-0-frame, P-0-ceo-reviewer, P-0-mvp-thinner,
  P-0-problem-framer, P-1-decompose, P-2-spec, P-3-plan, P-4-gemini-review, B-0..B-6, C-1, C-2,
  T-1..T-9, V-1-karen, V-1-jenny, V-1-summary, V-2-triage, V-3-fast-fix).
- Gate verdicts: process/waves/wave-77/blocks/{P,D,B,T,V}/gate-verdict.md (all APPROVED first-attempt;
  V-block 0 blocking; V-3 head-verifier APPROVED Attempt 1; karen + jenny both APPROVE at V-1).
Prior archives consulted:
- process/waves/_archive/wave-76/blocks/L/observations.md (obs-1 HOLD: BUILD authz-predicate via
  shared RBAC service; obs-2 HOLD: T-8 body-claim confirmation; obs-3 HOLD: DESIGN genre-fence,
  no target file; plus verdicts on wave-75/73 held candidates).
- process/waves/_archive/wave-75/blocks/L/observations.md, wave-73/blocks/L/observations.md
  (standing HOLDs: BUILD guard-by-trust-level; PRODUCT seam-by-async-contract; T-4 prove-hook-by-row;
  T-8 read-route-before-probe).
Principles files read:
- BUILD-PRINCIPLES.md (15 rules), PRODUCT-PRINCIPLES.md (5 rules), VERIFY-PRINCIPLES.md (4 rules),
  T-8.md (3 rules), T-5.md (3 rules).

---

## Explicit recurrence verdicts on standing held candidates

### wave-76 obs-1 (HOLD — 1st instance): BUILD candidate — implement a new authz guard/service's owner/role/membership predicate by delegating to the shared, tested seam, not by re-querying inline

**Verdict: CONFIRMING 2nd instance. PROMOTION CANDIDATE this wave.**

Wave-76 obs-1 named the pattern from `EducatorAccessGuard` delegating to `RbacService.can` instead
of hand-rolling owner→member→role resolution. Wave-77 supplies an independent, same-class 2nd
instance — and it fired on the wave's crown-jewel privacy surface, raising the stakes:

- `ProfileVisibilityService.resolve` (profile-visibility.service.ts) resolves cross-server
  co-membership via the SAME self-referential `server_members` EXISTS subquery that
  `dm.service.ts` (enforceWhoCanDm, lines 171-193) already ships — mirrored deliberately rather than
  re-derived (B-2-backend.md; B/gate-verdict.md "mirrors dm.service.ts's shared-server EXISTS idiom
  byte-for-byte"; V-1-karen.md finding 6 "`sharesServer` is a real EXISTS subquery ... deliberately
  NOT `listServerMembers`").
- The resolver reuses `isBlockedBetween` (blocks.service) for the bidirectional block gate rather
  than re-implementing the two-direction OR predicate (P-4 karen claim 4 VERIFIED; B/gate-verdict).
- It branches on the imported `PROFILE_VISIBILITY` literal const from `@studyhall/shared` rather
  than re-declaring `['everyone','server-members','nobody']` inline (B-2-backend.md "PROFILE_VISIBILITY
  imported not re-declared"; P-4 karen reuse-nit honored).

Critically, the P-4 gate identified the FAILURE MODE the reuse avoids: had the resolver copied
`servers.service.listServerMembers`'s ambient co-membership shortcut instead of the explicit
viewer↔target EXISTS proof, "'server-members' profiles [would leak] to any authenticated stranger"
(P-4 head-product rationale + karen claim 3 VERIFIED). Re-deriving the seam here is not a DRY nit —
it is a live privacy-leak vector. Two waves now show the same class: an authz/visibility predicate
that a shared, unit-tested seam already implements gets re-derived inline unless the spec/plan pins
the reuse. The wave-76 instance was authz-role resolution; the wave-77 instance is
co-membership + block + enum-branch resolution. Same class, distinct surfaces, both security-critical.

The wave-76 pre-shaped candidate was scoped narrowly to "RBAC service." Wave-77 generalizes the
target: the seam reused was three distinct shipped primitives (dm.service EXISTS idiom,
isBlockedBetween, the shared enum const), not a single RbacService method. The promoted rule should
name the shared/tested seam generally, not one service.

**Near-dup check vs BUILD-PRINCIPLES rules 1-15:** Rule 4 (reproduce a negative authz path at B-6)
is a test-obligation, not an implementation-strategy rule. Rule 9 (author an integration spec per
new boundary) is spec-existence, not delegation. No existing BUILD rule says "delegate an
authz/visibility predicate to the shared tested seam rather than re-querying inline." PASS — not a
near-dup.

**Pre-shaped candidate (PROMOTION CANDIDATE — 2nd instance):**
```
16. Resolve an authz or visibility predicate by delegating to the shared tested seam, not by re-querying membership inline.
    Why: An inline re-query duplicates security-critical logic that can drift from the audited path and leak access.
```
Rule line = 119 chars. PASS (<=120). Why line = 98 chars. PASS (<=100). No forbidden tokens
(no em-dash, no `we`/`our`, no wave ref). PASS. Sequential number 16 (file's last rule is 15).

**Severity:** strong — 2nd confirming instance on a security-critical predicate; the failure mode
(re-deriving a seam a shared audited path already implements) is a live access-leak vector, proven
concrete by the P-4 gate's listServerMembers-shortcut analysis.
**Candidate principles file:** BUILD-PRINCIPLES.md rule 16.
**Cross-wave recurrence:** 2nd INSTANCE (wave-76 EducatorAccessGuard→RbacService.can;
wave-77 ProfileVisibilityService→dm.service EXISTS idiom + isBlockedBetween + shared enum const).
**Promotion flag:** PROMOTE — meets all three bars (generalizable across authz/visibility seams;
falsifiable by grepping for inline membership/owner/role re-query where a shared seam exists;
cited across two waves). Subject to head-learn approval + the max-1-rule/file/wave cap.

---

### wave-76 obs-2 (HOLD — 1st instance): T-8 candidate — confirm a hidden/denied response comes from the target gate by inspecting the response body/reason, not the status code alone

**Verdict: CONFIRMING 2nd instance (adjacent form). PROMOTION CANDIDATE this wave (T-8.md).**

Wave-76 obs-2 named the body-claim discipline from the inverse angle: a 403's body text must
identify the target authz guard (EducatorAccessGuard message), not the email-verification layer,
so a false-closure from an unverified fixture is impossible. Wave-77 supplies the second data point
in the anti-oracle form: the T-8 tester proved the hidden-profile 404 body is BYTE-IDENTICAL across
every distinct hidden reason (nobody / blocked / nonexistent-UUID / malformed-non-UUID), so no
oracle leaks WHICH gate fired or WHY (T-8-security.md CASE 5 "byte-identical ... No oracle
distinguishes why a profile is hidden"; V-1-jenny.md §3 "Uniform-404 anti-oracle PROVEN LIVE ...
byte-identical").

Both waves share one underlying discipline: **a status code alone is an insufficient proof at T-8;
the response BODY must be inspected** — in wave-76 to confirm the denial came from the intended
gate (positive identification), in wave-77 to confirm the denial body reveals NOTHING about the
gate (negative / anti-oracle). The common falsifiable obligation is: assert the body content, not
just the HTTP status. This is the recurring class.

There is a real distinction worth noting for karen at promotion: wave-76's instance is
"assert the body IDENTIFIES the target gate"; wave-77's is "assert the body IDENTIFIES NOTHING
(uniform across reasons)." A single promoted rule can cover both as "inspect the body, do not close
on status alone," but the two directions should be acknowledged so the rule text is not over-narrow.

**Near-dup check vs T-8.md rules 1-3:** Rule 1 prescribes a verified prod fixture (which fixture),
not body inspection (what to assert on the response). Rule 2 is malformed-:id → 400 (a specific
status expectation, and note wave-77 shows a STRONGER uniform-404 posture is correct on an
anti-oracle privacy endpoint — see obs-3 below). Rule 3 is WS-envelope live-probe. None mandate
inspecting a denial/hidden body for the reason claim. PASS — incremental, not a near-dup.

**Pre-shaped candidate (PROMOTION CANDIDATE — 2nd instance):**
```
4. At T-8, assert the denied or hidden response body content, not the status code alone, before closing an authz probe.
   Why: A status code cannot tell an anti-oracle uniform hide from a wrong-gate false-closure; only the body can.
```
Rule line = 116 chars. PASS (<=120). Why line = 96 chars. PASS (<=100). No forbidden tokens. PASS.

Note on numbering: wave-73 obs-2 (read controller route before probing) also pre-shaped a T-8 rule 4
candidate and remains a 1st-instance HOLD; it is a different class (route-path inference). This
candidate reaches the 2nd-instance bar first. The max-1-rule/file/wave cap plus head-tester approval
still govern; if BUILD rule 16 and this both promote, they are in different files so the per-file
cap is not breached.

**Severity:** strong — 2nd confirming instance; the discipline is what separates a real T-8 closure
from a false-green (wave-76 email-verification 403 masking authz; wave-77 anti-oracle uniformity).
**Candidate principles file:** T-8.md rule 4.
**Cross-wave recurrence:** 2nd INSTANCE (wave-76 403-body-identifies-guard; wave-77 404-body-uniform-
across-hidden-reasons). Common class: assert the body, not the status alone.
**Promotion flag:** PROMOTE — meets all three bars (generalizable to any authz/privacy denial probe;
falsifiable by checking whether the T-8 assertion reads the body or only the status; cited across
two waves). Subject to head-tester approval + max-1-rule/file/wave cap.

---

## obs-3 — INFORMATIONAL (contra-signal to T-8.md rule 2): on an anti-oracle privacy read endpoint, a malformed :id returning uniform 404 is stronger than the 400 rule 2 prescribes

**Source artifacts:**
- T-8-security.md CASE 5 + "Malformed :id note": "T-8 principle #2 expects malformed :id → 400.
  This privacy-critical endpoint instead returns uniform 404 (not 500) — a STRONGER posture
  (no info-leak). Recorded as observation, not a finding."
- V-1-jenny.md §3 + F-J3 (INFO, positive): "malformed non-UUID :userId → uniform 404, not 400 ...
  a STRONGER anti-oracle posture ... avoids the wave-23/32 non-UUID→500 defect class."
- V-2-triage.md finding 5: "Noise — suppress — POSITIVE/expected: stronger anti-oracle, avoids
  non-UUID→500 defect class; not a defect."

**Assessment:** T-8.md rule 2 says "probe each :id route param with a malformed non-UUID value ...
and assert 400, not 500." Wave-77's privacy-critical `GET /profile/:userId` deliberately returns a
uniform 404 (identical to the hidden/nonexistent body) for a malformed :id, because a distinct 400
would itself be an info-leak oracle (it would tell a prober that a well-formed-but-hidden id differs
from a malformed one). Rule 2's core intent — never 500 on malformed input — is fully honored (no
500). Only the specific status (400) is overridden, and for a defensible reason on this endpoint
class.

This is NOT a rule-2 violation to promote against; it is a documented, gate-blessed exception. The
value of recording it: if a future wave's T-8 mechanically asserts 400 on a malformed :id for an
anti-oracle endpoint, it would FAIL a correct implementation. Rule 2 could eventually gain a carve-out
("assert not-500; on an anti-oracle read endpoint a uniform 404 is acceptable in place of 400"), but
that is a rule-refinement for a future wave, not a promotion this wave — one instance, and it is a
contra-signal / exception rather than a recurring new obligation.

**Severity:** informational — no defect; a positive finding suppressed as noise at V-2; recorded so
a future T-8 does not treat the uniform-404 posture as a rule-2 miss.
**Candidate principles file:** none this wave (potential future rule-2 carve-out on T-8.md).
**Cross-wave recurrence:** 1st instance of the exception. HOLD.
**Promotion flag:** HOLD — informational exception, not a new obligation.

---

## obs-4 — INFORMATIONAL (1st instance): a read surface that renders one indistinguishable state for privacy-hidden and for fetch-failure hides transient errors as intentional and offers no recovery

**Source artifacts:**
- B-3-frontend.md deviation: "non-404 network errors also render the calm hidden state (no distinct
  retry) ... a network blip shows same 'Profile Unavailable' as a genuinely-hidden profile; a
  distinct retry affordance may be wanted (low, UX). CARRY to V-2."
- T-8/V-2-triage.md finding 2: "Member card same copy for genuinely-hidden vs transient network
  error (no retry) — Non-blocking — task 3b3530d8 (milestone M13) — carried V-block escalation."
- V-1-jenny.md F-J2: "member card shows identical 'Profile Unavailable … hidden due to visibility
  settings' copy for a genuinely-hidden profile AND for a transient network/non-404 error ... The
  gap is only that a real fetch failure would mislabel as 'hidden' with no retry affordance."

**Assessment:** The privacy design deliberately makes the HIDDEN state indistinguishable from the
NONEXISTENT state (correct anti-oracle behavior — and the backend enforces this via uniform-404).
The frontend then extended that same calm "Profile Unavailable" copy to ALSO cover transient
network / non-404 fetch failures. For the privacy cases this is correct and non-leaking. For a
genuine fetch failure it is wrong twice: it tells the user the profile is hidden (a false claim
about the other user's settings) and it offers no retry path, stranding a recoverable error as if
it were an intentional privacy outcome.

The generalizable tension: **anti-oracle privacy wants HIDDEN and NONEXISTENT to be
indistinguishable, but good UX wants a TRANSIENT-FAILURE state to be distinguishable from a settled
privacy outcome so the user can retry.** These two are not actually in conflict — the backend's
uniform-404 (a settled HTTP answer) is a different signal from a network/transport failure (no HTTP
answer, or 5xx), so the client CAN branch on "got a definitive 404 → hidden/absent, no retry" vs
"fetch threw / no response → transient, offer retry" without leaking any privacy oracle. Collapsing
both into one copy is the defect.

Is a rule warranted? This is the 1st formally-named instance of the class, and it has been TASKED
(V-2 finding 2 → task 3b3530d8, milestone M13) rather than shipped as a defect, so the wave-loop is
already handling it. There is no target principles file: it is a frontend/UX class, and no
DESIGN/UX-PRINCIPLES.md exists in the principles set (same gap noted for wave-76 obs-3). A 2nd wave
where a privacy-hidden state is conflated with a fetch-failure state — collapsing a retryable error
into a settled privacy outcome — would elevate this. For now it is a named pattern awaiting both a
2nd instance and a target file.

**Severity:** informational — no leak; the privacy behavior is correct; the gap is a recoverable-error
UX regression, already tasked for a follow-up wave.
**Candidate principles file:** none (no DESIGN/UX-PRINCIPLES.md; frontend-UX class). Flag if a
UI-layer principles file is formalized.
**Cross-wave recurrence:** FIRST INSTANCE. HOLD pending 2nd instance AND target-file existence.
**Promotion flag:** HOLD — 1st instance, no target file.

---

## obs-5 — INFORMATIONAL: status check on remaining standing held candidates (no confirming instance this wave)

| origin | class | wave-77 status |
|--------|-------|----------------|
| wave-76 obs-3 (HOLD — 1st instance) | DESIGN genre-fence per-line audit; no DESIGN-PRINCIPLES file | NOT CONFIRMED. D-block ran (member profile card) but no genre-fence-drift class recurred in the D-3 reconciliation this wave. HOLD maintained; still no target file. |
| wave-75 obs-1 (HOLD — 1st instance) | BUILD: assign guard by trust level, not nearest-controller copy | NOT CONFIRMED as its own class. Wave-77 reused SessionNoVerifyGuard correctly (P-4 verified it is the right carve-out for pre-verification-reachable profile reads, not a wave-75-style AuthGuard bypass). Guard-CLASS choice was correct. HOLD maintained. |
| wave-75 obs-2 (HOLD — 1st instance) | PRODUCT: shape a fenced seam by its async contract, not mock convenience | NOT CONFIRMED. No new DI seam for a fenced future integration this wave. HOLD maintained. |
| wave-73 obs-1 (HOLD — 1st instance) | T-4: prove a side-effect hook fires by the persisted row, not the call site | NOT CONFIRMED. No new write/side-effect hook; the resolver is a read path. HOLD maintained. |
| wave-73 obs-2 (HOLD — 1st instance) | T-8: read controller route before probing (route-path inference) | NOT CONFIRMED as its own class. T-8 probed the correct GET /profile/:userId route; no wrong-path 404 inference. Distinct from obs-2's body-claim class. HOLD maintained. |

**Severity:** informational (status check only).
**Candidate principles file:** none.
**Promotion flag:** NO.

---

## Summary table

| id | title (short) | severity | recurrence | candidate file | disposition |
|----|---------------|----------|------------|----------------|-------------|
| obs-1 | Resolve authz/visibility predicate via shared tested seam, not inline re-query | strong | 2nd INSTANCE (wave-76 + wave-77) | BUILD-PRINCIPLES.md rule 16 | **PROMOTE** |
| obs-2 | At T-8 assert the denied/hidden response body, not status code alone | strong | 2nd INSTANCE (wave-76 + wave-77) | T-8.md rule 4 | **PROMOTE** |
| obs-3 | Uniform-404 on malformed :id (anti-oracle) is stronger than T-8 rule 2's 400 | informational | 1st instance (exception) | none (future rule-2 carve-out) | HOLD |
| obs-4 | Privacy-hidden and fetch-failure rendered as one state; no retry | informational | 1st instance | none (no UX-PRINCIPLES file) | HOLD |
| obs-5 | Status check: remaining standing HOLDs, no new confirming instance | informational | -- | none | STATUS CHECK ONLY |

**Observations emitted (knowledge-synthesizer): 5 (obs-1..obs-5).**
**Severities: 2 strong (obs-1, obs-2), 3 informational (obs-3, obs-4, obs-5).**

---

## Promotion-candidate assessment

**Genuine promotion candidates this wave: 2 (obs-1 → BUILD-PRINCIPLES.md rule 16; obs-2 → T-8.md rule 4).**

Both are 2nd-instance confirmations of standing wave-76 HOLDs, both cleared the near-dup check, both
are contract-formatted and within char limits, and both target DIFFERENT files (BUILD-PRINCIPLES.md
and T-8.md) so the max-1-rule-per-file-per-wave cap is not breached by promoting both. Each remains
subject to its head-X gate: obs-1 needs head-learn/head-builder approval, obs-2 needs head-tester
approval, at L-2 distill.

- **obs-1** (BUILD rule 16 — delegate authz/visibility predicate to shared tested seam): CONFIRMED
  2nd instance. Wave-76 = EducatorAccessGuard delegating to RbacService.can; wave-77 =
  ProfileVisibilityService mirroring dm.service EXISTS idiom + reusing isBlockedBetween + importing
  the shared PROFILE_VISIBILITY const. The wave-77 instance strengthens it: re-deriving the seam
  here was a live privacy-leak vector (the listServerMembers ambient-membership shortcut the P-4 gate
  forbade). The rule is generalized beyond "RBAC service" to "the shared tested seam."

- **obs-2** (T-8 rule 4 — assert the body, not the status alone): CONFIRMED 2nd instance. Wave-76 =
  403 body must identify the target guard (not the email-verification layer); wave-77 = 404 body must
  be uniform across all hidden reasons (anti-oracle). Common falsifiable class: a status code alone
  is insufficient at T-8; the response body must be asserted.

**Held (not promoted):** obs-3 (informational rule-2 exception, 1st instance), obs-4 (privacy-vs-
fetch-failure UX, 1st instance + no target file), and all standing HOLDs in obs-5 (no confirming
instance this wave). wave-76 obs-3 (DESIGN genre-fence) remains held with no target file.
