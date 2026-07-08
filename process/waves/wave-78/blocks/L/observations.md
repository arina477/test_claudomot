# Wave-78 L-block observations — knowledge-synthesizer

Append-only. L-2 Distill (karen) reads these; promotes to `*-PRINCIPLES.md` ONLY when an
observation recurs across 2+ waves AND the head-X gate approves (max 1 rule/file/wave). Single-wave
observations stay here until a second wave confirms, UNLESS a strong 1st instance clears the bar on
its own merit (head-X discretion).

---

## L-2 synthesis observations (knowledge-synthesizer)

Inputs read:
- process/waves/wave-78/stages/ full artifact set (P-0-frame, P-0-ceo-reviewer, P-0-mvp-thinner,
  P-0-problem-framer, P-1-decompose, P-2-spec, P-3-plan, P-4-gemini-review, B-0..B-6,
  B-6-review-output, C-1-pr-ci-merge, C-2-deploy-and-verify, T-1..T-9, V-1-karen, V-1-jenny,
  V-1-summary, V-2-triage, V-3-fast-fix).
- Gate verdicts: process/waves/wave-78/blocks/{P,B,T,V}/gate-verdict.md (all APPROVED first-attempt;
  B-6 /review found 1 High — anti-oracle fail-open — FIXED via B-3 re-entry commit 1fca71a; V-block
  0 blocking; karen + jenny both APPROVE at V-1; head-verifier APPROVED Attempt 1).
Prior archives consulted (most recent 3):
- process/waves/_archive/wave-77/blocks/L/observations.md — obs-1 (BUILD authz/visibility seam) and
  obs-2 (T-8 assert-body) BOTH reached 2nd instance and were flagged PROMOTE.
- process/waves/_archive/wave-76/blocks/L/observations.md, wave-75/blocks/L/observations.md
  (the pre-promotion HOLD history for those two).
Principles files read:
- BUILD-PRINCIPLES.md (16 rules), PRODUCT-PRINCIPLES.md (5 rules), VERIFY-PRINCIPLES.md (4 rules),
  DESIGN-PRINCIPLES.md (1 rule), T-8.md (4 rules), T-5.md (3 rules), T-6.md (0 rules).

**Critical de-dup up front (both wave-77 promotion candidates SHIPPED — do NOT re-propose):**
- **BUILD-PRINCIPLES.md rule 16 already exists:** "Resolve an authz or visibility check by delegating
  to the shared tested seam, not by re-querying membership inline." Promoted at wave-77 L-2.
- **T-8.md rule 4 already exists:** "Assert the body content of a denied or hidden response at T-8,
  not the status code alone, before closing the probe." Promoted at wave-77 L-2.
Wave-78's anti-oracle body-uniformity work (T-8 Probe 1, jenny B2.1/B2.4) is a THIRD instance of the
T-8 rule-4 class, but rule 4 is already shipped — no re-promotion, recorded here as confirming-in-
practice only.

---

## Explicit recurrence verdict on the standing wave-77 obs-4 HOLD

### wave-77 obs-4 (HOLD — 1st instance): a read surface rendering one indistinguishable state for privacy-hidden AND fetch-failure hides transient errors as intentional, with no recovery

**Verdict: RESOLVED this wave, NOT a confirming 2nd instance of the conflation class. The class MUTATED into a sharper one (see obs-1).**

Wave-77 obs-4 named the conflation defect (one calm "Profile Unavailable" copy for BOTH a genuinely-
hidden profile AND a transient fetch failure, no retry) and recorded it as TASKED to 3b3530d8 /
milestone M13, awaiting both a 2nd instance and a target file. Wave-78 is exactly that follow-up
leg: it SPLIT the two states (B-3-frontend.md Block 2 — added a 4th `error` FetchState with a distinct
amber retryable surface; the hidden 404 path kept byte-identical). So the conflation defect is
CLOSED, not recurring. It is not a confirming 2nd instance of "hidden-and-failure-are-one-state,"
because that state no longer exists.

But splitting them EXPOSED a new, sharper failure mode that the B-6 /review caught (obs-1 below): the
first split shipped fail-OPEN (`status !== 404 → retryable`), leaking 401/403/410/429 into the visibly-
distinct retryable surface — a latent privacy oracle. The lesson has therefore evolved from "don't
conflate the two states" (wave-77) to "when you DO split them, the split must fail closed to hidden"
(wave-78). obs-1 carries that forward as a fresh 1st instance.

**Disposition:** wave-77 obs-4 RETIRED as resolved. Its successor concern is obs-1.

---

## obs-1 — STRONG (1st INSTANCE): a client branch distinguishing a privacy-hidden state from an error state must fail closed to hidden, allowlisting the error triggers, not `!== hiddenStatus`

**Source artifacts:**
- process/waves/wave-78/stages/B-3-frontend.md Block 2: first shipped the split as `status !== 404
  → retryable`; the fail-closed inversion (`error` only for non-HttpError throw OR `status >= 500`;
  every other status → byte-identical hidden) landed on B-3 re-entry.
- process/waves/wave-78/stages/B-6-review-output.md finding 1 (High, P2→load-bearing): "Anti-oracle
  fail-OPEN default: card branched `status !== 404 → retryable error state`, routing 401/403/410/429
  into the visibly-distinct retryable surface ... a latent privacy oracle: a future target-specific
  non-404 would leak WHY a profile is hidden with no failing test. Also DRIFTS from the spec." →
  FIXED commit 1fca71a (inverted to fail-CLOSED allowlist + added 403→hidden guard test).
- process/waves/wave-78/stages/V-1-karen.md Claim 2 (APPROVE): quotes MemberProfileCard.tsx:211-219
  "the FAIL-CLOSED allowlist form: `error` state reachable ONLY for a non-HttpError throw OR
  `status >= 500`; every other status collapses to the uniform `hidden`. Confirmed NOT the old
  `!== 404` fail-open form (no `!== 404` anywhere in the file)."
- process/waves/wave-78/stages/T-8-security.md Probe 3 (PASS, proven LIVE): a forced 403 on the card
  collapsed to byte-identical HIDDEN, no retry button — "directly exercises the fail-closed arm in the
  deployed binary."
- process/waves/wave-78/stages/V-1-jenny.md B2.4 + F-J3: deployed routes every non-5xx/non-404 status
  (401/403/410/429) → hidden; "a SAFE superset the spec under-specified rather than a divergence."

**Assessment:** The generalizable class: when a client (or any consumer) has a branch that must
distinguish a PRIVACY-HIDDEN outcome (indistinguishable-by-design, anti-oracle) from an ERROR/retryable
outcome, the branch must be written as an ALLOWLIST of the error triggers (here: non-HttpError transport
throw OR `status >= 500`), with the DEFAULT arm falling to hidden. The tempting inverse — allowlist the
hidden trigger (`status !== 404 → retryable`, i.e. "only the one known status is hidden, everything
else is an error") — is fail-OPEN: any status the author did not enumerate (401/403/410/429, or a
future target-specific status) leaks into the visibly-distinct surface and becomes a privacy oracle
telling a prober WHY a resource is withheld. The failure is silent: the server today returns a uniform
404, so no test fails; the leak only fires if a future server path introduces a distinguishing status.

This is a first-class 1st instance and it fired on the wave's crown-jewel privacy surface. It is
distinct from the two already-shipped anti-oracle rules: BUILD rule 16 is about SERVER-side predicate
reuse (delegate to the shared seam); T-8 rule 4 is a TEST obligation (assert the body, not status).
Neither governs the CLIENT branch DIRECTION — allowlist-error-fail-to-hidden vs. allowlist-hidden-fail-
to-error. This rule is the client-side complement: it governs which arm is the default when a branch
straddles a privacy boundary.

**Near-dup check:**
- vs BUILD-PRINCIPLES rules 1-16: rule 16 (delegate authz/visibility to shared seam) is server-side
  predicate reuse; this is a client branch-direction rule. Rule 12 (test success callback through real
  parent) is a test-wiring rule. No BUILD rule says "a privacy-vs-error branch fails closed to hidden."
  PASS — not a near-dup.
- vs T-8.md rules 1-4: rule 4 (assert the body, not status) is what to ASSERT at test time; this is how
  to WRITE the branch. Complementary, not a dup. A T-8-scoped phrasing would be a test obligation
  ("probe a non-404/non-5xx status and assert it renders hidden, not the retryable surface"); a BUILD-
  scoped phrasing is the implementation rule ("write the branch as an error-allowlist defaulting to
  hidden"). Either target is defensible; the implementation rule (BUILD) is the root cause the test
  rule would catch. PASS — not a near-dup in either file.

**Pre-shaped candidate — BUILD-PRINCIPLES.md rule 17 (root-cause / implementation form):**
```
17. Write a client branch that separates a privacy-hidden state from an error state as an error allowlist defaulting to hidden.
    Why: An inverted hidden-allowlist leaks every unenumerated status into the visible error surface as a privacy oracle.
```
Rule line = 130 chars — **FAILS the ≤120 limit.** Karen must tighten at promotion. A conforming form:
```
17. Default a privacy-hidden-vs-error client branch to hidden, allowlisting only the error triggers, never `!== hiddenStatus`.
    Why: An inverted hidden-allowlist leaks every unenumerated status into the visible error surface as an oracle.
```
Rule line = 120 chars. PASS (=120). Why line = 96 chars. PASS (<=100). No forbidden tokens (no em-dash;
backtick literal is not forbidden). Karen to re-verify char count on the final chosen wording.

**Severity:** strong — a real latent privacy-leak on the crown-jewel anti-oracle surface, missed by
head-builder Phase-1 + unit tests, caught only by the adversarial /review pass, fixed pre-merge, and
proven fail-closed LIVE (T-8 Probe 3, forced 403 → hidden). The failure mode is silent-until-a-future-
status and untested-by-default, which is exactly the class worth a standing rule.
**Candidate principles file:** BUILD-PRINCIPLES.md rule 17 (implementation/root-cause form) — OR a
T-8 test-obligation form if head-tester prefers the probe framing. Not both (one root cause).
**Cross-wave recurrence:** FIRST INSTANCE (the wave-77 obs-4 conflation defect is the ancestor concern,
but this specific fail-open-after-split class is new this wave).
**Promotion flag:** STRONG 1st INSTANCE — meets generalizable + falsifiable + cited. Below the usual
2-wave bar, but the standing-rule note above permits a strong 1st instance at head-X discretion given
the security-critical, silent-failure nature. Recommend head-learn CONSIDER; if not taken, HOLD for a
2nd instance (any future wave where a privacy/anti-oracle branch ships as `!== hiddenStatus` fail-open).

---

## obs-2 — WARNING (1st INSTANCE): verify a fix's CONTENT is present in the merge tree, not that its cited commit hash is an ancestor of a squash-merge commit

**Source artifacts:**
- process/waves/wave-78/stages/V-1-karen.md Claim 2 hash-provenance note: "The prompt asserted this fix
  landed via commit `1fca71a`; `git merge-base --is-ancestor 1fca71a 855e811` returns FALSE (not an
  ancestor). PR #97 was squash-merged, so original per-commit hashes do not survive as ancestors of
  the merge commit. The FIX CONTENT is verifiably present in the merge tree (quoted above); only the
  cited hash is stale. Not a missing-fix; a claim-hash mismatch. No fix required."
- process/waves/wave-78/blocks/V/gate-verdict.md (head-verifier): independently re-ran
  `git merge-base --is-ancestor 1fca71a 855e811` → FALSE, then re-read `855e811:MemberProfileCard.tsx`
  directly and confirmed the fail-closed branch content is in-tree + `grep '!== 404'` returns NONE.
- process/waves/wave-78/stages/C-1-pr-ci-merge.md: `merge_strategy: squash`, per project.yaml
  merge_strategy: squash; branch deleted on merge (per-commit hashes garbage-collected).

**Assessment:** Under a squash merge (this project's `merge_strategy: squash`), every per-commit hash
on the feature branch is rewritten into a single new merge commit; the originals become non-ancestors
and, after `--delete-branch`, are unreachable. A verifier who checks a claimed fix by asserting its
cited commit hash `--is-ancestor` of the merge commit will get FALSE for a fix that is genuinely
present — a false-negative "missing fix." The correct verification reads the fix CONTENT out of the
merge tree (`git show <merge>:<path>`, grep the changed logic, quote the branch), not the commit
ancestry. This wave both reviewers (karen + head-verifier) independently avoided the false-negative by
switching to content inspection; the value of a rule is to make that switch mandatory rather than
reviewer-dependent, since a mechanical ancestry check on a squash repo would FAIL a correct fix.

The class is generalizable to any squash-or-rebase-merge repo (rebase also rewrites hashes) and
falsifiable (does the V-1 verification quote the fix content from the merge tree, or only assert commit
ancestry?). It is cited by two independent V-1 artifacts this wave.

**Near-dup check vs VERIFY-PRINCIPLES rules 1-4:**
- Rule 1 (verify seeding via create-path source, not runtime): about WHERE to look for a seed, not
  commit-vs-content provenance. Not a dup.
- Rule 3 (re-verify a fast-fix against the reviewer's live reproduction on deployed state, not source
  alone): closest neighbor — both are "prove the fix is really there." But rule 3 governs fast-fix
  re-verification against a LIVE reproduction; this governs claim-PROVENANCE under squash-merge (content-
  in-tree vs. hash-as-ancestor). Distinct axis: rule 3 is deployed-behavior; this is merge-tree
  provenance. Not a near-dup, but karen should note the adjacency at promotion.
- Rules 2, 4: unrelated. PASS.

**Pre-shaped candidate (HOLD — 1st instance only):**
```
5. Verify a claimed fix by its content in the merge tree, not by asserting its commit hash is an ancestor of the merge commit.
   Why: A squash or rebase merge rewrites per-commit hashes, so a real fix reads as a non-ancestor.
```
Rule line = 122 chars — **FAILS the ≤120 limit.** Conforming form:
```
5. Verify a claimed fix by its content in the merge tree, not by whether its commit hash is an ancestor of the merge commit.
   Why: A squash or rebase merge rewrites per-commit hashes, so a genuinely present fix reads as a non-ancestor.
```
Rule line = 121 chars — still over. Tighter:
```
5. Verify a claimed fix by its content in the merge tree, not by whether its commit hash is a merge-commit ancestor.
   Why: A squash or rebase merge rewrites per-commit hashes, so a genuinely present fix reads as a non-ancestor.
```
Rule line = 114 chars. PASS. Why line = 103 chars — **over by 3.** Tighter why:
```
   Why: A squash or rebase merge rewrites per-commit hashes, so a real present fix reads as a non-ancestor.
```
Why line = 100 chars. PASS (=100). No forbidden tokens. Karen to re-verify final char counts.

**Severity:** warning — no defect shipped; both reviewers avoided the false-negative unaided. The value
is naming the class so a future verifier on this squash-merge repo does not mechanically assert hash
ancestry and reject a correct fix. Real but low-frequency (fires only when a prompt/claim cites a pre-
squash hash), so a 2nd instance is the right bar unless it recurs.
**Candidate principles file:** VERIFY-PRINCIPLES.md rule 5.
**Cross-wave recurrence:** FIRST INSTANCE. HOLD pending 2nd confirming wave.
**Promotion flag:** HOLD — 1st instance. Watch for any future wave where a V-1 verification asserts a
cited fix commit is a merge-commit ancestor (and gets FALSE) on this squash-merge repo, risking a
false "missing fix."

---

## obs-3 — INFORMATIONAL: the adversarial /review pass caught a real latent privacy leak that head-builder Phase-1 + unit tests missed

**Source artifacts:**
- process/waves/wave-78/stages/B-6-review.md: "Phase 1 fresh head-builder → APPROVED (Attempt 1) ...
  Phase 2 (/review): critical pass + independent adversarial subagent. 1 High finding (anti-oracle
  fail-open default) → FIXED via B-3 re-entry (commit 1fca71a)."
- process/waves/wave-78/stages/B-6-review-output.md conclusion: "The finding-1 catch is the review's
  value: it aligned the implementation with the spec's stated intent AND hardened the crown-jewel
  anti-oracle to fail-closed."

**Assessment:** head-builder Phase-1 (code-read) APPROVED, and the touched-file unit suite was green
(the server returns a uniform 404 today, so no fail-open test could fail), yet the fail-open leak was
real and latent. Only the Phase-2 adversarial /review subagent — reading the branch adversarially for
what a FUTURE server status would do — caught it. This directly reinforces the existing discipline in
BUILD-PRINCIPLES.md rule 4 ("Reproduce one negative path per authz or injection boundary at B-6 Phase-2;
a Phase-1 code-read APPROVE is not sufficient"). Wave-78 is a clean confirming instance of rule 4's
premise: a Phase-1 APPROVE was insufficient; the Phase-2 adversarial pass was load-bearing. No NEW rule
is warranted — rule 4 already encodes it — but the instance is worth recording so the value of the
mandatory Phase-2 adversarial pass is visible in the archive (a future cost-cutting temptation to skip
Phase-2 on a "trivial UX polish" wave would have shipped a privacy oracle here).

**Severity:** informational — reinforces shipped BUILD rule 4; no new rule.
**Candidate principles file:** none (BUILD rule 4 already covers it).
**Cross-wave recurrence:** confirming-in-practice of an already-shipped rule.
**Promotion flag:** NO.

---

## obs-4 — INFORMATIONAL: status check on remaining standing held candidates

| origin | class | wave-78 status |
|--------|-------|----------------|
| wave-77 obs-3 (HOLD — 1st instance) | T-8 rule-2 carve-out: uniform-404 on malformed :id (anti-oracle) stronger than the 400 rule prescribes | NOT CONFIRMED as a new obligation, but RE-OBSERVED: wave-78 T-8 Probe 1 again shows malformed non-UUID → uniform 68-byte 404 (not 400/500) on the same anti-oracle endpoint. Still an exception, not a rule; still no promotion target (would be a future T-8 rule-2 carve-out). HOLD maintained, now with a 2nd sighting of the exception on the SAME endpoint (not an independent surface — weak). |
| wave-75 obs-2 (HOLD — 1st instance) | PRODUCT: shape a fenced seam by its async contract, not mock convenience | NOT CONFIRMED. No new DI seam for a fenced future integration this wave (client-side UX polish only). HOLD maintained. |
| wave-73 obs-1 (HOLD — 1st instance) | T-4: prove a side-effect hook fires by the persisted row, not the call site | NOT CONFIRMED. The academicRole clear IS a write, and the integration test reads it back via a separate harness connection (V-1-karen Claim 6) — correct technique — but it is a direct-column write, not a side-effect HOOK (audit/notification/webhook). Adjacent, not the hook class. HOLD maintained. |
| wave-76 obs-3 (HOLD — 1st instance) | DESIGN genre-fence per-line audit | NOT CONFIRMED. No D-block this wave (client-side polish on the existing card; no new mockup generated). Note: DESIGN-PRINCIPLES.md now EXISTS (1 rule) — the target-file gap that held this candidate is closed, so a 2nd genre-fence instance could now promote. HOLD maintained. |

**Severity:** informational (status check only).
**Candidate principles file:** none.
**Promotion flag:** NO.

---

## Summary table

| id | title (short) | severity | recurrence | candidate file | disposition |
|----|---------------|----------|------------|----------------|-------------|
| obs-1 | Privacy-hidden-vs-error client branch must fail closed to hidden (error-allowlist), not `!== hiddenStatus` | strong | 1st INSTANCE (successor to wave-77 obs-4) | BUILD-PRINCIPLES.md rule 17 (or T-8 test form) | STRONG 1st — head-learn CONSIDER; else HOLD |
| obs-2 | Verify a fix by content in the merge tree, not commit-hash ancestry under squash-merge | warning | 1st INSTANCE | VERIFY-PRINCIPLES.md rule 5 | HOLD — 1st instance |
| obs-3 | Adversarial /review caught a latent privacy leak Phase-1 + units missed | informational | confirms shipped BUILD rule 4 | none | NO (already covered) |
| obs-4 | Status check: remaining standing HOLDs; wave-77 obs-4 retired as resolved | informational | -- | none | STATUS CHECK ONLY |

**Observations emitted (knowledge-synthesizer): 4 (obs-1..obs-4).**
**Severities: 1 strong (obs-1), 1 warning (obs-2), 2 informational (obs-3, obs-4).**

---

## Promotion-candidate assessment

**Genuine promotion candidates this wave: 1 conditional (obs-1, as a strong 1st instance at head-learn
discretion); 0 that clear the routine 2-wave bar.**

- **obs-1** (BUILD-PRINCIPLES.md rule 17 — client privacy-vs-error branch fails closed): STRONG 1st
  INSTANCE. Generalizable (any privacy/anti-oracle client branch), falsifiable (does the branch
  allowlist the error triggers and default to hidden, or allowlist hidden via `!== hiddenStatus`?),
  cited (B-3, B-6-review-output finding 1, V-1-karen Claim 2, T-8 Probe 3, V-1-jenny B2.4). It is the
  successor to wave-77 obs-4 (conflation), which wave-78 resolved by splitting the states — and the
  split itself introduced the fail-open failure this rule guards. Below the routine 2-wave bar, but the
  security-critical, silent-until-future-status nature is exactly the profile of a strong 1st instance.
  Recommend head-learn CONSIDER promotion this wave; if declined, HOLD for a clean 2nd instance. The
  pre-shaped rule text overran ≤120 on the first draft — karen MUST re-verify the final wording's char
  count (a conforming form is supplied). Distinct from shipped BUILD rule 16 (server-seam reuse) and
  T-8 rule 4 (assert-the-body) — this governs client branch DIRECTION, an axis neither covers.

- **obs-2** (VERIFY-PRINCIPLES.md rule 5 — content-in-tree vs hash-ancestry under squash-merge): HOLD —
  1st instance. Real and generalizable to any squash/rebase repo, but no defect shipped (both reviewers
  avoided the false-negative unaided) and it fires only when a claim cites a pre-squash hash. 2nd-instance
  bar is correct. Pre-shaped text needed two tightening passes to fit the limits — karen to re-verify.

- **obs-3, obs-4:** no promotion (obs-3 confirms shipped BUILD rule 4; obs-4 is a status check).

**Retired:** wave-77 obs-4 (privacy-hidden/fetch-failure conflation) — RESOLVED this wave by the state
split; its successor concern is obs-1. **No re-promotion of the two wave-77 shippers** (BUILD rule 16,
T-8 rule 4) — both are already in the principles files; wave-78's anti-oracle body-uniformity work is a
confirming-in-practice instance of the shipped T-8 rule 4, not a new candidate.

**Standing HOLD that got a 2nd data point this wave:** none that qualifies as an independent 2nd
instance. wave-77 obs-3 (uniform-404-on-malformed-:id exception) got a 2nd SIGHTING, but on the SAME
endpoint as the 1st — not an independent surface, so it does not clear the recurrence bar; it remains a
documented T-8 rule-2 exception awaiting a future carve-out, not a promotion.
