# Wave 55 — P-4 Gate verdict

**Block:** P (Product) · **Gate:** P-4 · **Mode:** automatic · **Head:** head-product
**Wave:** DM privacy 'server-members' truth-table integration coverage (M8 tail, test-only)
**Verdict source:** head-product (independent; artifact-walked, code-verified)

---

## Verdict: **APPROVED**

The reframe is sound and code-verified; the two ACs are falsifiable and pin the boundary; the floor override-ship is correctly applied to a genuine (LOW) privacy-fence test; the plan respects the established integration-test architecture with no gold-plating. Hand off to B-block (design_gap_flag=false).

---

## Judge results

### 1. Reframe sound? — YES (code-verified)

- **Predicate confirmed** at `apps/api/src/dm/dm.service.ts:704-711`: `and(inArray(alias.server_id, callerServerIds), ne(alias.user_id, callerId), ne(users.who_can_dm, 'nobody'))`. This admits `'server-members'` and `'everyone'` **identically** — neither value is special-cased. The seed's positive-only 'server-members' assertion is therefore genuinely REDUNDANT with the existing `'everyone'` control (spec case (a), line 110). problem-framer's antipattern-#3 (demo-path tunnel vision) call is correct.
- **Load-bearing cell is the NEGATIVE**, confirmed. The distinguishing contract of the 'server-members' tier is "reachable ONLY via shared-server membership." A positive-only test stays green through a future predicate-widening leak; the disjoint-exclusion assertion is the regression fence. Correct.
- **2-cell truth-table is the right scope** — not over (no re-testing 'nobody'/'everyone' at new layers, no group-DM matrix, no wave-wide enum sweep — ceo-reviewer explicitly excluded those) and not under (positive alone leaves the READ path asymmetric with the fence it expresses). One `it()` block, one bundle. Correct.

### 2. ACs falsifiable? — YES

- **AC-1 (positive):** 'server-members' co-member in SERVER_S IS returned. Falsifiable: fails if the predicate ever drops 'server-members'.
- **AC-2 (negative, load-bearing):** 'server-members' user sharing NO server is EXCLUDED. Falsifiable: fails if a future refactor widens the shared-server join for the 'server-members' tier.
- Edge cases in the spec (`edge-cases[]`) pin both cells + the regression-fence intent. Plan (P-3) covers both via a dedicated `it('(c) ...')` block reusing the pg-harness + `insertFixtureUser(id,email,undefined,'server-members')`; single file, node-specialist; verified the 4th-param mechanic exists (`pg-harness.ts:96-108`, `who_can_dm` param, DB default 'everyone'). Falsifiable + covered.

### 3. Floor override-ship — CORRECTLY APPLIED

- P-1 correctly identifies sub-floor (~40-80 LOC << 1,500 single-spec floor) and override-ships per PRODUCT rule 5 / obs-B 6th instance. This is a genuine privacy-boundary regression fence on the named who-can-DM differentiator (LOW severity, not wasteful micro-wave, no valid merge candidate — the DM-scale pagination pair c5051444 is a distinct surface). Not padded, not split (splitting 2 assertions is the floor's anti-goal). Correct.

### 4. N-1 carry (M9-soon) — SOUND SIGNAL, does not block this wave

- ceo-reviewer's milestone-disposition flag is well-reasoned: the M8 tail (7 open) carries ZERO unshipped M8 *feature* scope (2 test-debt + 4 DM-polish + this); the M8 success metric (teacher side + private 1:1/group DMs, real-time + offline-tolerant) is substantively met across waves 46-54. Continued DM-micro-polish has diminishing bet value against the offline-first / displace-Discord wedge (ad1a3685). Recommending N-1 weigh promoting M9 (Monetization) — draining only the high-leverage tail (this fence + c5051444 pagination) and treating cosmetics as fold-in debt — is a sound signal to carry forward. Correctly scoped as a flag, NOT this wave's verdict to execute. Recorded in P-0-frame § N-1 CARRY; re-affirmed here for N-1 pickup. Does not block APPROVED.

### mvp-thinner "partly covered" concern — CORRECTLY WEIGHED, adjudicated

mvp-thinner argued the 'server-members' negative is already structurally covered by case (b)'s disjoint fence (claimed "enum-independent"). **Decisive fact (code-verified):** `who_can_dm` DB column defaults to `'everyone'` (`schema/users.ts:16`), and case (b) inserts `USER_Z_DISJOINT` with the 3-arg `insertFixtureUser` (spec line 133) → i.e. `who_can_dm='everyone'`. So case (b) proves the shared-server scope fence only for the **'everyone' tier**. The explicit 'server-members'-tier disjoint assertion is NOT redundant: it locks the fence against a future refactor that special-cases the 'server-members' tier's join (a change case (b) would sail through green). mvp-thinner itself flagged this as EXPANSION-not-thinning with "no verdict impact" and explicitly did NOT oppose (deferred to ceo-reviewer's lane). The explicit tier-specific negative is worth adding. Reviewer verdicts reconciled, none silently overridden.

---

## Stage-exit checklist (walked from artifacts, not inferred)

**P-0 Frame** — all ticked
- [x] Root cause named: unverified 'server-members' privacy BEHAVIOR (not a coverage corner) — problem-framer REFRAME, code-confirmed.
- [x] Maps to one live bet: ad1a3685 (academic + offline-first displaces Discord; who-can-DM = privacy differentiator) + milestone M8 84e17739 (in_progress).
- [x] Falsifiable: both cells have observable pass/fail signals against real Postgres.
- [x] problem-framer (REFRAME) + ceo-reviewer (SELECTIVE-EXPANSION) present + reconciled; mvp-thinner (OK) present, concern adjudicated above.

**P-1 Decompose** — all ticked
- [x] One seed, no siblings; 2-cell truth-table = one coherent bundle.
- [x] Every AC mvp-critical-or-floor-justified; nothing peelable (single AC unit).
- [x] No dependency on unbuilt out-of-bundle task.

**P-2 Spec** — all ticked
- [x] 2 ACs enumerated, each independently verifiable (+ regression + no-regression ACs).
- [x] User-facing state matrix: N/A — test-only, no UI surface (design_gap_flag=false). Non-happy states of the SUT (excluded/blocked) ARE the spec's core.
- [x] Non-goals named: no re-test of 'nobody'/'everyone' at new layers, no group-DM matrix, no enum sweep, no production/schema change.
- [x] Security-scope: privacy fence is test-only (no auth/session/cookie/rate-limit CHANGE) → no tightened-gate routing required; noted in manifest.
- [x] Full spec contract embedded as fenced YAML at head of task 344eabde `description` (verified via DB read).

**P-3 Plan** — all ticked
- [x] Reuses established architecture: wave-48 pg-harness + `insertFixtureUser` 4th-param + real-Postgres CI layer; no parallel path.
- [x] No new infra (no Redis/replica/billing); zero deps, zero schema.
- [x] Single step → the bundle task; observable artifact = passing `it('(c) ...')` in CI real-Postgres.

**P-4 Gate** — all ticked
- [x] Every upstream checkbox ticked from a concrete artifact + independent code verification (dm.service.ts, spec, pg-harness, schema).
- [x] Reviewer pool reconciled; mvp-thinner drift resolved (code-verified non-redundant). No unresolved spec-vs-bet drift.
- [x] design_gap_flag=false → hand off to B-block (not D-block).

---

```yaml
head_signoff:
  verdict: APPROVED
  stage: P-4
  reviewers:
    problem-framer: REFRAME (reconciled; code-confirmed)
    ceo-reviewer: SELECTIVE-EXPANSION (reconciled)
    mvp-thinner: OK (concern adjudicated — negative is non-redundant; who_can_dm default='everyone' means case (b) covers only the everyone-tier fence)
  failed_checks: []
  rationale: >
    The reframe from a redundant positive-only assertion to the 2-cell 'server-members'
    privacy truth-table is sound and code-verified: getDmCandidates (dm.service.ts:704-711)
    admits 'server-members' and 'everyone' identically, so the positive is redundant with
    the existing everyone-control and the NEGATIVE (disjoint 'server-members' excluded) is
    the load-bearing untested cell. The mvp-thinner "already covered by case (b)" concern is
    correctly overridden: case (b)'s disjoint user carries who_can_dm='everyone' (DB default),
    so the explicit 'server-members'-tier negative is a genuine regression fence against a
    future tier-specific predicate widening. Both ACs are falsifiable, the plan reuses the
    locked pg-harness architecture with zero infra/schema/deps, and the sub-floor override-ship
    is correctly applied to a real LOW-severity privacy-fence test on the named who-can-DM
    differentiator. The M9-soon milestone-disposition flag is a sound signal, correctly carried
    to N-1 and non-blocking here.
  next_action: PROCEED_TO_B (design_gap_flag=false → B-block, not D-block)
  n1_carry: >
    ceo-reviewer milestone-disposition flag — M8 tail has zero unshipped feature scope; success
    metric substantively met. N-1 should weigh promoting M9 (Monetization); drain only high-leverage
    tail (this fence + c5051444 pagination), treat DM-polish cosmetics as fold-in debt.
```

---
# Wave 55 — P-4 Phase 2 merge
| Reviewer | Verdict | Notes |
|---|---|---|
| karen | APPROVE | 4/4 code facts VERIFIED: predicate `ne(who_can_dm,'nobody')` admits server-members≡everyone (dm.service.ts:708); case (b) disjoint user = default 'everyone' tier (spec:133) so tier-specific negative genuinely untested; insertFixtureUser 4th-param supports 'server-members' (pg-harness.ts:104); test-only, node-specialist in AGENTS.md. |
| jenny | APPROVE | 4/4 drift MATCHES: semantics match shipped who_can_dm='server-members' model (product-decisions:441/587); closes a journey-map-documented V-2 gap (:354/:359); reframe faithful to wave-54 carry; M9-soon carry consistent with M8-drain pattern. Cosmetic note: seed title still says "positive-control" (SoT description correct). |
| Gemini | UNAVAILABLE (429) | degrades |

**PASS.** karen+jenny APPROVE, Gemini UNAVAILABLE. design_gap_flag false → B-block. gate_result: PASSED.
