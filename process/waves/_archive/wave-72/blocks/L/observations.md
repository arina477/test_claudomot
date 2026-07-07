# Wave-72 L-block observations — knowledge-synthesizer

Append-only. L-2 Distill (karen) reads these; promotes to `*-PRINCIPLES.md` ONLY when an
observation recurs across 2+ waves AND head-verifier approves (max 1 rule/file/wave). Single-wave
observations stay here until a second wave confirms.

---

## L-2 synthesis observations (knowledge-synthesizer)

Inputs read:
- process/waves/wave-72/stages/ full artifact set (P-3-plan, B-5-verify, B-6-review,
  B-6-review-output, C-1-pr-ci-merge, C-2-deploy-and-verify, T-5-e2e, T-6-layout,
  T-8-security, V-1-karen, V-1-jenny, V-2-triage, V-3-fast-fix).
- Gate verdicts: process/waves/wave-72/blocks/{B,T,V}/gate-verdict.md (all APPROVED;
  B-6 Phase-2 /review caught + fixed a P1 non-atomic erasure; T-block caught + fixed a P0
  browser-bundle white-screen within the wave).
- CI workflow: .github/workflows/ci.yml (jobs: lint, typecheck, test, build, secret-scan,
  boot-probe [required; boots compiled API], e2e [non-required; E2E_BASE_URL = live prod]).
Prior archives consulted:
- process/waves/_archive/wave-{68,69,70,71}/blocks/L/observations.md (4-wave window;
  explicit recurrence checks for wave-71 obs-1 HOLD, wave-70 obs-2 HOLD, wave-70 obs-3 HOLD,
  wave-69 obs-2 held candidate, wave-58 obs-B HOLD).
Principles files read:
- BUILD-PRINCIPLES.md (14 rules), CI-PRINCIPLES.md (10 rules), VERIFY-PRINCIPLES.md (4 rules),
  PRODUCT-PRINCIPLES.md (5 rules), command-center/testing/test-writing-principles.md.

---

## Explicit recurrence verdicts on standing held candidates

### wave-71 obs-1 (HOLD — 1st instance): route every mutation through the state owner, not the raw API client

**Verdict: NOT CONFIRMED this wave. HOLD maintained.**

Wave-72 introduces no shared-store optimistic state, no React context with mutation methods, and
no component that could bypass a store. The erasure path is a fire-and-forget API call; there is
no client-side optimistic set that a component could mutate directly. Not a confirming instance.
HOLD maintained; watch for any wave where a component triggers a write on a state slice managed
by a shared store/hook.

---

### wave-70 obs-2 (HOLD — 1st instance): realtime fan-out for a gated write must be downstream of the gate

**Verdict: NOT CONFIRMED this wave. HOLD maintained.**

Wave-72 introduces no websocket fan-out, no realtime delivery path, and no gated write with a
parallel delivery channel. The session-revoke is sequential within a transaction; no socket emit
is present in the erasure path. Not a confirming instance. HOLD maintained.

---

### wave-70 obs-3 (HOLD — 1st instance): a backend list endpoint must include display fields if a UI renders rows by name/avatar

**Verdict: NOT CONFIRMED this wave. HOLD maintained.**

Wave-72 introduces a 409 response that includes owned-server names (from `servers.name`), but the
server names are already present in the service query at authoring time — this is not a case where
a DTO was specced without display fields while a UI required them. Not a confirming instance.
HOLD maintained.

---

### wave-69 obs-2 (HOLD — 2nd instance, recurrence bar cleared, awaiting karen post-wave-69): Phase-1 code-read APPROVED; Phase-2 /review caught P1 atomicity defect invisible to static inspection

**Verdict: CONFIRMED — THIRD INSTANCE. Recurrence bar cleared; candidate now 3-instance strong.**

The wave-72 B-6 Phase-2 /review found a P1 non-atomic erasure at `account-deletion.service.ts:62-85`:
three auto-committed statements (scrub UPDATE, revokeAllSessionsForUser, server_members DELETE) ran
without a `db.transaction()`. A failure on the revokeAllSessions network call would leave PII
already scrubbed + committed but server_members NOT deleted; the idempotency guard on retry would
silently return `{status:'deleted'}` without completing the members delete. Phase-1 head-builder
code-read returned APPROVED (all 8 security/functional ACs verified); Phase-2 /review caught the
atomicity gap on a fresh adversarial read.

This is the THIRD INSTANCE of the class logged as wave-65 obs-3 (1st: React async + Dexie
non-atomic put+prune) and wave-69 obs-2 (2nd: server TOCTOU SELECT→update without FOR UPDATE in
transaction). Wave-72 is a server-side variant: a multi-statement mutation sequence with no wrapping
transaction, where partial failure leaves a permanently inconsistent record. All three instances
were caught only by adversarial Phase-2 /review after Phase-1 APPROVED; none were visible to static
code-read. The pre-shaped candidate from wave-69 obs-2 covered "read-modify-write status flip."
Wave-72 broadens the class to any multi-step mutation that must be all-or-nothing; a status-flip
SELECT→UPDATE is one instance; a scrub→revoke→members-delete is another. The generalizable rule
targets the atomicity envelope, not the specific operation shape.

Near-dup check vs BUILD-PRINCIPLES rules 1-14:
- Rule 4 covers "reproduce one negative path per authz or injection boundary at B-6 Phase-2" —
  this is about authz, not multi-statement atomicity. Not a near-dup.
- Rule 5 covers "in-flight coalescing flag" — async loop dedup, not DB transaction atomicity. Not
  a near-dup.
- No existing rule prescribes wrapping multi-step mutations in a DB transaction.
- Not a near-dup.

Pre-shaped candidate rule (3rd instance; wave-69's cap slot went to obs-1; karen to adjudicate):
```
15. Wrap any multi-step mutation that must be all-or-nothing in a DB transaction, not separate auto-committed statements.
    Why: Separate auto-commits leave a partial failure as a permanently inconsistent record.
```
Rule line = 115 chars. PASS (<=120). Why line with 4-space indent = 82 chars. PASS (<=100).
No forbidden tokens. PASS. Near-dup vs BUILD rules 1-14: PASS.
Candidate file: BUILD-PRINCIPLES rule 15 candidate.

Cap note: wave-71 obs-1 is also a BUILD-PRINCIPLES candidate (HOLD, 1st instance). If both reach
promotion in the same wave, karen must apply the per-file per-wave cap and pick one.

**Severity:** warning (P1 finding; a mid-sequence failure would have silently abandoned members
  delete on retry; caught by adversarial /review after Phase-1 APPROVED; third confirming instance).
**Candidate principles file:** BUILD-PRINCIPLES rule 15 candidate.
**Cross-wave recurrence:** THIRD INSTANCE. Wave-65 obs-3 = 1st; wave-69 obs-2 = 2nd; wave-72 = 3rd.
  Recurrence bar cleared (cleared at wave-69 obs-2; cap adjudication deferred then).
**Promotion flag:** HOLD for karen + head-builder; 3rd instance, bar cleared twice over. Cap note
  above applies if wave-71 obs-1 is also nominated this wave.

---

### wave-58 obs-B (HOLD — 1st instance): prod-baseURL e2e is post-deploy verification, not a pre-merge gate

**Verdict: CONFIRMED — SECOND INSTANCE. Recurrence bar CLEARED.**

Wave-58 obs-B recorded the FIRST INSTANCE: the CI e2e was RED at C-1 because the e2e tests live
prod (which still had the bug), not the branch; the correct response was to classify e2e as
non-required in CI so the fixing branch could merge.

Wave-72 is the SECOND INSTANCE — from the opposite direction. At C-1 in wave-72, all 7 CI checks
passed (lint, typecheck, test, build, secret-scan, boot-probe, e2e). The e2e passed because it
tests `E2E_BASE_URL: https://web-production-bce1a8.up.railway.app` — the PREVIOUSLY DEPLOYED
commit (wave-71), not the branch's newly built artifacts. The regression (raw `require(` in the
browser bundle) was invisible to the e2e because the e2e never exercised the branch's bundle.
The P0 surfaced only after deploy at T-5 (live UI test on the newly deployed commit).

Wave-58's instance: e2e red at C-1 due to prod having the bug = e2e correctly non-required to
  allow the fix to merge.
Wave-72's instance: e2e green at C-1 despite a regression in the branch = e2e silently passes
  because it tests the OLD deployed commit, not the branch under test.
Both are consequences of the same structural property: a prod-baseURL e2e answers "does deployed
prod satisfy the assertions?" not "does this branch's built artifacts satisfy the assertions?"

Near-dup check vs CI-PRINCIPLES rules 1-10: confirmed clean (rule-set has not changed since
wave-58 obs-B was first logged; no new CI rule covers this class).
Candidate file: CI-PRINCIPLES rule 11 candidate (pre-shaped at wave-58; text carried forward).

Pre-shaped rule (from wave-58 obs-B; verified format-compliant then; re-checked now):
```
11. Classify an e2e suite whose baseURL targets deployed prod as non-required in CI; it is post-deploy verification, not a pre-merge gate.
    Why: A production-baseURL e2e tests the deployed binary, not the branch under test.
```
Rule line = 138 chars. FAIL (>120). Needs trimming.

Trimmed option:
```
11. Mark an e2e whose baseURL targets deployed prod as non-required; it verifies the deployed binary, not the branch.
    Why: A production-baseURL e2e tests the prior deployed commit, not the branch under test.
```
Rule line = 116 chars. PASS (<=120). Why line with 4-space indent = 89 chars. PASS (<=100).
No forbidden tokens. PASS.
Near-dup vs CI rules 1-10: PASS.
Candidate file: CI-PRINCIPLES rule 11 candidate.

**Severity:** strong (the P0 white-screen reached prod because the e2e at C-1 tested the old
  commit and passed green; the regression in the branch bundle was invisible to CI; direct causal
  path from this gap to the prod outage).
**Candidate principles file:** CI-PRINCIPLES rule 11 candidate.
**Cross-wave recurrence:** SECOND INSTANCE. Wave-58 obs-B = 1st (red e2e at C-1 proved prod had
  the bug, not the branch). Wave-72 = 2nd (green e2e at C-1 despite regression in branch bundle,
  because e2e tested old deployed commit). Recurrence bar cleared.
**Promotion flag:** HOLD — 2nd instance; recurrence bar cleared; awaiting karen + head-ci-cd.

---

## obs-1 — STRONG (NEW PROMOTION CANDIDATE): a CI build job exiting 0 does not prove the browser bundle runs; the built SPA bundle must be scanned for CJS artifacts before merge

**Source artifacts:**
- process/waves/wave-72/blocks/T/findings-aggregate.md (§ P0 RESOLVED: "BUILD-PRINCIPLES rule 1
  (boot the prod-built artifact before merge) was skipped at B-5 (dev-smoke deferred) — that gap
  let the runtime require() bug reach prod despite green CI build")
- process/waves/wave-72/stages/B-5-verify.md (§ Dev-server smoke: "Local app DB + SuperTokens
  core unreachable in the build worker → full dev-server smoke deferred to the CI boot-probe
  (required) + the live post-deploy verification at C-2 / the T-block")
- process/waves/wave-72/stages/V-3-fast-fix.md (§ L-2 candidate: "BUILD-PRINCIPLES rule 1 …
  was skipped at B-5 (dev-smoke deferred), which let the runtime require() white-screen reach
  prod despite green CI build")
- .github/workflows/ci.yml (boot-probe job: builds + boots `apps/api/dist/src/main.js`, polls
  `/health`; this is an API boot probe — it does NOT load the web SPA bundle in a browser context;
  the build job runs `pnpm build` and exits 0 on bundle emission without executing the bundle)

**Assessment:** The P0 root cause was `@rollup/plugin-commonjs` producing a raw `require(` call
in the browser bundle when `@studyhall/shared` was imported a second time via a namespace import.
The sequence of CI gates that passed:
1. `build` job: exits 0 because the bundle was emitted without a rollup error. A build exit 0 means
   the bundler produced output; it does not mean the output executes correctly in a browser runtime
   where `require` is undefined.
2. `boot-probe` job: builds the project and boots the COMPILED API (`apps/api/dist/src/main.js`)
   in a Node.js environment. Node.js has `require`; the API boot never loads the web SPA bundle.
   This probe verifies the API starts up with its runtime config; it is not a browser-runtime check.
3. `e2e` job: tests `E2E_BASE_URL = live prod` (old working commit) — see wave-58 obs-B above.
4. B-5 dev-server smoke: deferred ("established pattern" in the build worker).

BUILD-PRINCIPLES rule 1 ("Boot the production-built artifact in a prod-like container and exercise
its runtime config before merge") is the spirit of what was skipped. However, rule 1 was authored
in the context of API boot + config correctness (the boot-probe CI job implements it for the API).
Rule 1 does NOT enumerate a distinct check for the browser SPA bundle, which is a different artifact
class: it runs in a browser JavaScript engine where `require` is undefined, not in a Node.js
container. These are different runtime environments and the gap they expose is different.

The actionable, falsifiable, non-overlapping rule is: before merge, grep the built SPA bundle for
the presence of `require(` — a zero count proves no CJS artifact leaked into the browser output.
This is a 30-second B-5 check that would have caught the P0 before it was merged. It is NOT
covered by rule 1 (which is about booting the artifact, not scanning its content for runtime-fatal
tokens) and NOT covered by the CI `build` job (which exits 0 on emission, not correctness).

Alternatively, the upstream fix (which is what the wave's forward-fix did: switch `@studyhall/shared`
from a CJS barrel to an ESM-emitting package) can be stated as a rule: a workspace package consumed
by a browser bundle must be configured to emit ESM. Either form is falsifiable; the bundle-scan form
is the pre-merge detection rule; the ESM-emission form is the root-cause prevention rule.

Near-dup check vs BUILD-PRINCIPLES rules 1-14:
- Rule 1: "Boot the production-built artifact in a prod-like container and exercise its runtime
  config before merge." This covers API startup correctness. The wave-72 gap is specifically the
  BROWSER BUNDLE runtime, a distinct artifact class. The boot-probe CI job implements rule 1 for
  the API; no rule or CI job implements an equivalent check for the SPA bundle. Not a near-dup —
  the existing rule covers a different artifact and a different check type (boot vs scan).
- Rule 2 (push after every stage): different class.
- All other rules 3-14: none address browser bundle content scanning or shared-package ESM
  emission for a bundled SPA. Not near-dups.

Pre-shaped candidate rules (two options; karen to select one):

Option A — bundle content scan (detection at B-5):
```
15. Before merge, grep the built SPA bundle for raw require( and fail if any match is found.
    Why: A green build job proves the bundle was emitted, not that it runs in a browser runtime.
```
Rule line = 90 chars. PASS (<=120). Why line with 4-space indent = 91 chars. PASS (<=100).
No forbidden tokens. PASS. Near-dup vs BUILD rules 1-14: PASS.

Option B — root-cause prevention (ESM emission from shared packages):
```
15. Configure a workspace package consumed by a browser bundle to emit ESM, not a CJS barrel.
    Why: A bundler transpiles only the first CJS import; a second import emits raw require at runtime.
```
Rule line = 93 chars. PASS (<=120). Why line with 4-space indent = 97 chars. PASS (<=100).
No forbidden tokens. PASS. Near-dup vs BUILD rules 1-14: PASS.

Option A is the narrower, directly falsifiable check at the B-5 verify step; Option B encodes the
root-cause fix applicable to any cross-package dependency. Both are non-overlapping with rule 1.
Karen to decide which class the rule targets (detection vs prevention) and the target file.

Candidate file: BUILD-PRINCIPLES rule 15 candidate (both options). Note cap conflict: wave-69 obs-2
confirmed candidate (obs above, 3rd instance) is ALSO a BUILD-PRINCIPLES candidate. Karen must apply
the per-file per-wave cap and promote at most one BUILD-PRINCIPLES rule this wave.

**Severity:** strong (a P0 prod outage; every route white-screened for all users on new deployments;
  required a forward-fix PR + redeploy within the same wave; the gap — deferred dev-smoke + no
  bundle scan + CI e2e testing live prod — created a direct path from a B-5 build workaround to a
  prod outage; FIRST INSTANCE of this specific class).
**Candidate principles file:** BUILD-PRINCIPLES rule 15 candidate.
**Cross-wave recurrence:** FIRST INSTANCE. HOLD pending 2nd confirming wave for promotion, BUT
  see cap note: if karen adjudicates this as novel enough and the wave-69 obs-2 confirmed candidate
  is held for a later cap slot, obs-1 would be the promotion-eligible candidate this wave.
**Promotion flag:** HOLD — 1st instance for this specific class (browser bundle CJS scan). The
  wave-69 obs-2 confirmed candidate (multi-step mutation atomicity, 3rd instance) is the
  stronger-recurrence BUILD-PRINCIPLES candidate this wave. Karen to adjudicate cap.

---

## obs-2 — INFORMATIONAL: status check on all standing prior observations from the 5-wave window

| origin | class | wave-72 status |
|--------|-------|----------------|
| wave-71 obs-1 (HOLD — 1st instance) | Route every mutation through the state owner, not the raw API client | NOT CONFIRMED. Wave-72 introduces no shared-store optimistic state, no store mutation path, no component that could bypass a store. HOLD maintained. |
| wave-70 obs-2 (HOLD — 1st instance) | Realtime fan-out for a gated write must be downstream of the gate in the same callstack | NOT CONFIRMED. Wave-72 introduces no websocket fan-out, no realtime delivery path. HOLD maintained. |
| wave-70 obs-3 (HOLD — 1st instance) | A backend list endpoint must include display fields if a UI renders rows by name/avatar | NOT CONFIRMED. The 409 server list in wave-72 includes server names at authoring time. Not a new independent instance of the contract-seam gap. HOLD maintained. |
| wave-69 obs-2 (HOLD — 2nd instance, recurrence bar cleared) | Phase-1 APPROVE; Phase-2 /review catches atomicity/concurrency defect | CONFIRMED — THIRD INSTANCE. See verdict section above. 3-instance strong; pre-shaped BUILD rule candidate. Cap conflict with obs-1 (also BUILD). |
| wave-58 obs-B (HOLD — 1st instance) | Prod-baseURL e2e is post-deploy verification, not a pre-merge gate | CONFIRMED — SECOND INSTANCE. See verdict section above. Recurrence bar cleared; pre-shaped CI-PRINCIPLES rule 11 candidate. |
| wave-64 obs-1 (HOLD) | createObjectURL Blob must pair src-change revoke AND unmount revoke | NOT CONFIRMED. Wave-72 introduces no Blob, no createObjectURL, no image object URL. HOLD maintained. |
| wave-60 obs-1 (STRONG HOLD) | Hardcoded palette hex in .tsx files where consumable CSS tokens exist | NOT CONFIRMED. Wave-72 web changes are DangerZonePanel.tsx (uses registered danger tokens from the DESIGN-SYSTEM; no new palette hex literals). STRONG HOLD maintained. |
| wave-58 obs-A (HOLD) | Hardening a pass-regardless soft-check into a gating assertion exposes a masked production defect | NOT CONFIRMED. No soft-check converted to a gating assertion this wave. HOLD maintained. |
| wave-59 obs-3 (HOLD) | Test a multi-branch pure formatter with a single it.each table | NOT CONFIRMED. Wave-72 tests are real-component RTL (DangerZonePanel 18/18) and pg-harness integration (real DB). No multi-branch pure-function formatter. HOLD maintained. |
| wave-57 obs-1 (HOLD) | Interactive nav/rail button shipped with no onClick from a prior wave | NOT CONFIRMED. All wave-72 interactive affordances ship wired (acknowledgment gate, delete submit, cancel). HOLD maintained. |
| wave-52 obs-3(a) (HOLD) | VERIFY: independently re-probe load-bearing claims before accepting verdict | CONFIRMED BY APPLICATION. Karen git-verified all security-critical file:line claims (supertokens.config.ts doors i and ii, AppModule registration, avatar_key scrub) + ran git-cat-file on key paths. Jenny independently live-probed all 5 security ACs (no-IDOR, 409 non-destructive, both re-auth doors, PII erasure) against prod. Head-verifier confirmed no cross-endorsement. Still HOLD for VERIFY rule 5 candidacy. |

**Severity:** informational (status checks; two HOLDs confirmed as new instances — see verdict
  sections above; all other HOLDs maintained).
**Candidate principles file:** none (this is a status-check observation; the confirmed-instance
  verdicts are in the dedicated verdict sections above).
**Promotion flag:** NO (status check only).

---

## Summary table

| id | title (short) | severity | recurrence | candidate file | disposition |
|----|---------------|----------|------------|----------------|-------------|
| wave-69 obs-2 verdict | Phase-1 APPROVE; /review catches atomicity defect; 3rd instance | warning | THIRD INSTANCE (wave-65 obs-3 = 1st; wave-69 obs-2 = 2nd; wave-72 = 3rd). Bar cleared twice. | BUILD-PRINCIPLES rule 15 candidate | HOLD — 3rd instance; karen + head-builder; cap conflict with obs-1 |
| wave-58 obs-B verdict | Prod-baseURL e2e tests old deployed commit, not branch; passes green despite regression in new bundle | strong | SECOND INSTANCE (wave-58 obs-B = 1st). Recurrence bar cleared. | CI-PRINCIPLES rule 11 candidate | HOLD — 2nd instance; karen + head-ci-cd |
| obs-1 | CI build exits 0 but browser bundle was not runtime-verified; CJS artifact in SPA bundle caused P0 white-screen | strong | FIRST INSTANCE | BUILD-PRINCIPLES rule 15 candidate | HOLD — 1st instance; strongest novel-class candidate; cap conflict with wave-69 obs-2 confirmed candidate |
| obs-2 | Status check on standing prior observations: wave-69 obs-2 and wave-58 obs-B confirmed; all other HOLDs maintained | informational | — | none | STATUS CHECK ONLY |

**Observations emitted (knowledge-synthesizer): 2 (obs-1, obs-2; plus two explicit held-candidate verdicts)**
**Severities: 1 strong (obs-1), 2 confirmed-verdict (wave-69 obs-2 = warning / 3rd instance; wave-58 obs-B = strong / 2nd instance), 1 informational (obs-2)**
**Promotion-eligible this wave:**
- wave-58 obs-B confirmed (2nd instance): CI-PRINCIPLES rule 11 candidate. Karen + head-ci-cd.
- wave-69 obs-2 confirmed (3rd instance): BUILD-PRINCIPLES rule 15 candidate. Karen + head-builder.
- obs-1 (1st instance): BUILD-PRINCIPLES rule 15 candidate. Cap conflict with wave-69 obs-2 confirmed. Karen to adjudicate: if wave-69 obs-2 confirmed gets the BUILD slot, obs-1 waits for a 2nd confirming instance. If obs-1 is judged to be the higher-impact novel rule, wave-69 obs-2 confirmed waits — but given it has 3 instances it is the stronger-recurrence candidate.
**CI-PRINCIPLES cap:** wave-58 obs-B confirmed is the sole CI-PRINCIPLES candidate this wave. No cap conflict.
**BUILD-PRINCIPLES cap:** two candidates compete — wave-69 obs-2 confirmed (3-instance strong) vs obs-1 (1-instance new). Karen must pick one for the BUILD slot this wave; the other is held.
**Nominations for karen vetting:** wave-58 obs-B confirmed (CI-PRINCIPLES rule 11); wave-69 obs-2 confirmed (BUILD-PRINCIPLES rule 15 primary candidate, pre-shaped above); obs-1 (BUILD-PRINCIPLES rule 15 alternate candidate, two option shapes above — karen to adjudicate cap conflict and, if nominating obs-1, select Option A vs Option B).
