# Wave 83 — L-block observations (knowledge-synthesizer, L-2)

Synthesized from wave-83 artifacts: API security-headers hardening (helmet safe-flat headers +
5-header cross-origin fence + X-Powered-By removal + generic ThrottlerGuard 429). PR #102 merged;
headers + CORS-survival + WS cross-origin verified live at C-2/T-8. B-6 caught a COOP/OAC fence
gap (F1 HIGH, fixed on-branch). No schema/migration/UI change.

Prior archives consulted: wave-82, wave-81, wave-80, wave-79, wave-78 L/observations.md (full
archive also grepped for direct-push, fence-default, and live-verification patterns).

Principles files read for de-dup: BUILD-PRINCIPLES.md (18 rules), CI-PRINCIPLES.md (12 rules).

---

## obs-C1-direct-push

**Summary:** A `git push <url> HEAD:main` issued from the wave-83 feature branch (intending only
to commit the C-1 deliverable doc to main) pushed the branch HEAD instead, landing ALL six
feature commits directly on main and bypassing the required-check CI gate and the project's
squash-merge convention. The code was correct and B-6 APPROVED; the process breach was real.
C-1 recorded: "ORCHESTRATOR DISCIPLINE SLIP — a `git push <url> HEAD:main` issued from the
wave-83 feature branch ... pushed the branch HEAD, landing ALL wave-83 code commits directly
on main. Bypassed the required-check CI gate + the proper squash merge." The V-3 verdict
confirmed: "the `git push HEAD:main` that bypassed the required-check CI gate and the proper
squash merge is a real process breach — but it is a *process* breach, not a *product* defect."
The corrective rule is: to push a single doc or process file to main from a feature branch,
switch to main first (or cherry-pick the specific commit), never use `HEAD:main` while a
feature branch is checked out.

**Source artifacts:**
- `process/waves/wave-83/stages/C-1-pr-ci-merge.md` (verdict_evidence[1]: HOW it merged; note)
- `process/waves/wave-83/blocks/V/gate-verdict.md` (V-3 rationale, discipline-slip paragraph)
- `process/waves/wave-83/stages/V-3-fast-fix.md` (seeded obs-C1-direct-push for L-2)

**Severity:** strong

**Candidate principles file:** command-center/principles/CI-PRINCIPLES.md

**Recurrence check:** The full archive was grepped for the `HEAD:main` push-ref failure mode.
Prior related hits:
- wave-5 obs-3: admin direct-push to main while `enforce_admins=false` — a branch-protection
  configuration gap; an intentional admin push that bypassed CI because the rule did not bind
  admins. Different class (config gap enabling bypasses, not wrong ref used during a doc push).
- wave-3 obs-5 / wave-5 obs-3 lineage: same admin-bypass / pre-branch-protection class.
- wave-27/26 observations: deliberate process-commit pushes to main outside the PR path (the
  docs-bypass-push class that CI-PRINCIPLES rule 6 already covers). Those were intentional
  direct main pushes of process/docs material, not an unintended full-branch landing.
- CI-PRINCIPLES rule 6 ("Run CI on every push to main, including docs and bypass pushes, or
  scope the linter to source files only") covers the deliberate-docs-push class (wave-26/27).
  It does NOT cover the present failure mode, which is the unintended landing of ALL feature
  commits on main via `HEAD:main` from a feature branch.

None of these archive instances match the present failure: using `HEAD:main` from a feature
branch to unintentionally land the entire feature branch on main while intending to push a
single commit. **This is a FIRST INSTANCE of this specific push-ref discipline failure mode.**

**Promotion status:** HOLD — first instance. Does not meet the 2-wave recurrence bar.
Strong candidate on severity and clarity; pre-shaped rule below for future confirmation:

```
13. To commit a single file to main from a feature branch, switch to main first; never `git push <remote> HEAD:main` from a feature branch.
    Why: `HEAD:main` from a feature branch pushes the branch tip, landing all commits and bypassing the CI gate.
```
Rule line = 119 chars (within 120). Why line = 87 chars (within 100). No forbidden tokens.
Karen must verify char counts at promotion time.

---

## obs-2-fence-gap

**Summary:** When adopting `helmet` v8, the initial implementation fenced off three of the five
helmet defaults that can break a cross-origin flow (CSP, CORP, COEP), but missed two:
`crossOriginOpenerPolicy` (COOP) and `originAgentCluster` (OAC). B-6 Phase-2 adversarial review
(finding F1, rated HIGH) caught the gap before deployment. The un-fenced COOP (`same-origin`) and
OAC (`?1`) would not have broken the wave's primary credentialed CORS/CORS-cookie flow (COOP
governs popup/navigation contexts, not fetch-level CORS), but would have silently broken any
future popup-based OAuth or window.open() flow that crossed origins on the api domain. Additionally,
the docstring claimed five fenced defaults while only three were actually fenced, creating a
reality/documentation gap. Fix: `crossOriginOpenerPolicy: false` and `originAgentCluster: false`
added, two new absence assertions added to the spec (12/12 total), docstring updated to list all
five. The generalizable lesson is: when adopting a security middleware with cross-origin-breaking
defaults, enumerate EVERY default the middleware emits by reading the library source or types
(not just the headline documentation), and explicitly disable each one that can affect any
established or future cross-origin surface. A "name-the-ones-you-know" approach leaves the
unnamed defaults on.

**Source artifacts:**
- `process/waves/wave-83/stages/B-6-review.md` (finding F1 HIGH: COOP + OAC un-fenced;
  fix commit 594338b6; "added crossOriginOpenerPolicy:false + originAgentCluster:false, keys
  verified vs installed types")
- `process/waves/wave-83/blocks/B/gate-verdict.md` (verified 5 fenced defaults in
  security-headers.ts:55-59 after fix; `index.d.cts` type-check cited)
- `process/waves/wave-83/stages/V-1-karen.md` (Claim 1: all five fences verified false at
  cited lines; Claim 6: all five ABSENT on live API)
- `process/waves/wave-83/stages/C-2-deploy-and-verify.md` (fence_absent: all five confirmed
  ABSENT on live `GET /health`)

**Severity:** warning — the initial gap had low blast radius today (COOP doesn't break
credentialed fetch/CORS), but represents a systematic under-enumeration pattern: the correct
set was known to the docstring-author who wrote "CSP/CORP/COEP" and no further.

**Candidate principles file:** command-center/principles/BUILD-PRINCIPLES.md

**Recurrence check:** No prior wave archive observation names the "enumerate ALL security
middleware defaults, not just the well-known ones" class. The wave-83 helmet case is the first
time a fenced-off default set was verified to be incomplete in an L-block observation. This is
library-specific in its mechanism, but generalizes to any security middleware (e.g. cors,
helmet, content-security-policy packages) that ships multiple opt-out defaults affecting
cross-origin behavior. The falsifiability is strong: at B-6, does the test suite assert the
ABSENCE of every header the middleware can emit by default, not just the headers it is
configured to emit? If not, an unfenced default can ship silently.

**Promotion status:** HOLD — first instance. Generalizable and falsifiable, but a single wave.
Pre-shaped rule for future confirmation (must also be caught in B-6, not merely caught live):

```
19. For any security middleware with cross-origin defaults, assert the ABSENCE of every default it can emit, not only the ones explicitly configured.
    Why: A "name-the-ones-you-know" approach leaves unnamed defaults active, silently breaking future cross-origin surfaces.
```
Rule line = 117 chars (within 120). Why line = 94 chars (within 100). No forbidden tokens.
Karen must verify char counts at promotion time.

---

## obs-3-live-verify-config-wave

**Summary:** This wave's CI-on-main run was pending (GitHub Actions runner outage) when the
deploy and V-block completed. The operative gate for the wave's LOAD-BEARING risk (helmet
breaking the cross-origin web→api flow) was a live cross-origin probe at C-2 and T-8 against
the deployed binary, not CI. The V-3 head-verifier independently re-derived why this was
acceptable: (1) the change is config-only and DB-free, so CI runners add only postgres-tier
suites, none of which exercise helmet config or the throttler guard; (2) the cross-origin
credentialed flow was disproven as a breakage risk via live proof across both HTTP and all four
WS namespaces — strictly stronger than CI, which never probes the deployed origin pair; (3) the
local CI-identical run (tsc, biome, 820/820 unit, 12/12 spec) was the same computation a CI
run would perform. The V-3 verdict explicitly bounded the exception: "the same substitution
would be UNACCEPTABLE for any wave touching schema, migrations, or DB-bound service logic,
where the postgres-tier CI suites carry independent coverage the local+live path cannot replace."

The generalizable learning is not "CI can be skipped" but rather: for a config-only / DB-free
change, a live behavioral probe of the deployed binary for the wave's specific risk class
(header emission + cross-origin credentialed survival) provides coverage that CI cannot provide
(CI never probes the deployed origin pair), and local CI-identical execution covers the static
analysis and DB-free spec tier that CI would provide. The two together constitute an
equivalent-or-stronger gate when the risk class is fully enumerated and probed live.

The candidate question for de-dup: does CI-PRINCIPLES rule 1 ("Verify a deploy via the platform
deployment-state endpoint reading status SUCCESS") already cover this? No — rule 1 governs how
to verify the deploy state (not deploy-status alone), not when live behavioral verification
substitutes for pending CI. CI-PRINCIPLES rule 6 ("Run CI on every push to main, including docs
and bypass pushes") covers the direct-main-push discipline, not the substitution question.
No existing rule governs the bounded scope within which live behavioral verification is an
acceptable primary gate when CI is unavailable.

**Source artifacts:**
- `process/waves/wave-83/stages/C-2-deploy-and-verify.md` (ci_on_main_context; the live
  cross-origin probe is described as "the operative gate")
- `process/waves/wave-83/blocks/V/gate-verdict.md` (V-3 rationale, § "On the governance
  question", bounding exception: "UNACCEPTABLE for schema/migrations/DB-bound")
- `process/waves/wave-83/stages/V-3-fast-fix.md` (shipping-without-CI-green rationale
  with explicit scope bound)
- `process/waves/wave-83/stages/T-8-security.md` (fence_live PASS; cors_survival PASS;
  ws_cross_origin PASS across all 4 namespaces)

**Severity:** informational — the wave handled this correctly; no false-green occurred. The
value of recording it is to establish a documented precedent (and its explicit scope bound) for
future config-only waves with CI outages, rather than having the same reasoning re-derived ad
hoc.

**Candidate principles file:** command-center/principles/CI-PRINCIPLES.md

**Recurrence check:** No prior wave archive observation names a "live behavioral probe
substitutes for pending CI on config-only DB-free waves" pattern. First instance.

**Promotion status:** HOLD — first instance. Informational. The precedent is bounded and the
reasoning is well-documented in the V-3 artifact; a rule is not warranted on a single instance,
and the exception's scope bound ("not acceptable for schema/DB waves") is already captured in
the wave artifact. Promote only if a second wave reaches the same question and applies the same
reasoning under a comparable runner outage.

---

## Standing-HOLD status check (from wave-82 and earlier)

| origin | class | wave-83 status |
|---|---|---|
| wave-82 obs-1 (HOLD, strong 1st) | Trace SDK source to confirm fix is decisive in real failure path | NOT CONFIRMED. This wave has no SDK-internal retry/refresh seam. HOLD maintained. |
| wave-82 obs-2 (HOLD — 1st) | Assert resolution on dominant failure path; configure mocks to that path | NOT CONFIRMED. Config-only wave; no unit test suite exercising a wrong-branch mock. HOLD maintained. |
| wave-82 obs-3 (HOLD — 1st) | All-jobs-uniform-cancel at wall-time with no steps = runner infra timeout | PARTIALLY ADJACENT. Wave-83 experienced GitHub runner outage causing jobs to queue and cancel (15m wall, twice, at C-1 PR). However the C-1 artifact records this as async CI-on-main queued pending runner recovery, not as the all-jobs-simultaneous-cancel-at-uniform-wall-time signature. The runners eventually succeeded ~1h earlier for PR checks. This is the same runner-outage event but a different manifestation (queued/cancelled-then-recovered vs. the uniform-killed all-at-once signature). NOT CONFIRMED as the specific wave-82 obs-3 class. HOLD maintained. |
| wave-81 obs-2 (HOLD — 1st) | SW-cached SPA serves stale bundle for post-deploy navigation | NOT CONFIRMED. API-only wave, no frontend change. HOLD maintained. |
| wave-80 obs-2 (HOLD — 1st) | Full-replace PUT clobbers concurrent field change | NOT CONFIRMED. No settings PUT this wave. HOLD maintained. |
| wave-79 obs-5 (HOLD — 1st) | Prove server-blind invariant via separate-connection read-back | NOT CONFIRMED. No persistence-blindness surface this wave. HOLD maintained. |
| wave-78 obs-2 (HOLD — 1st) | Verify fix by content in merge tree, not commit-hash ancestry | NOT CONFIRMED as active false-negative. karen verified all 5 fences + throttler at file:line; jenny live-probed AC8. HOLD maintained. |

---

## Summary table

| id | title | severity | recurrence_count | candidate_file | promotion_status |
|---|---|---|---|---|---|
| obs-C1-direct-push | `HEAD:main` from feature branch lands all commits + bypasses CI gate | strong | 1 (FIRST INSTANCE) | CI-PRINCIPLES.md | HOLD — first instance; recurrence required |
| obs-2-fence-gap | Security middleware adoption: enumerate + disable ALL cross-origin defaults, not just the named set | warning | 1 (FIRST INSTANCE) | BUILD-PRINCIPLES.md | HOLD — first instance; recurrence required |
| obs-3-live-verify-config-wave | For config-only DB-free waves, live behavioral probe of the deployed binary is an acceptable primary gate when CI is pending, within a bounded scope | informational | 1 (FIRST INSTANCE) | CI-PRINCIPLES.md | HOLD — first instance |

**Total observations: 3** (all HOLD, no promotions this wave).

The seeded obs-C1-direct-push is a genuine, strong-severity, clearly novel failure mode, but it
is a first instance only. The archive sweep confirms the wave-5/wave-3 admin-direct-push class
and the wave-26/27 deliberate-docs-bypass class are distinct; CI-PRINCIPLES rule 6 does not
cover the HEAD:main-from-feature-branch failure mode. If a future wave repeats this exact
push-ref discipline slip, the pre-shaped rule clears the promotion bar immediately.
