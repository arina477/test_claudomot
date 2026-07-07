# Wave-76 L-block observations — knowledge-synthesizer

Append-only. L-2 Distill (karen) reads these; promotes to `*-PRINCIPLES.md` ONLY when an
observation recurs across 2+ waves AND head-verifier approves (max 1 rule/file/wave). Single-wave
observations stay here until a second wave confirms.

---

## L-2 synthesis observations (knowledge-synthesizer)

Inputs read:
- process/waves/wave-76/stages/ full artifact set (P-0-frame, P-0-ceo-reviewer, P-0-mvp-thinner,
  P-0-problem-framer, P-1-decompose, P-2-spec, P-3-plan, P-4-gemini-review, B-0-branch-and-schema,
  B-1-contracts, B-2-backend, B-3-frontend, B-4-wiring, B-5-verify, B-6-review, C-1-pr-ci-merge,
  C-2-deploy-and-verify, T-1-static, T-2-unit, T-3-contract, T-4-integration, T-5-e2e, T-6-layout,
  T-7-perf, T-8-security, T-9-journey, V-1-karen, V-1-jenny, V-1-summary, V-2-triage, V-3-fast-fix).
- Gate verdicts: process/waves/wave-76/blocks/{P,D,B,T,V}/gate-verdict.md (all blocks APPROVED;
  D-3 required 2 refine iterations: both reviewers independently returned REVISE on iteration 0
  for genre drift, converged to APPROVE on iteration 2; P-4 first-attempt APPROVED — karen caught
  1 HIGH non-blocking finding; B-6 and T, V all first-attempt APPROVED).
Prior archives consulted:
- process/waves/_archive/wave-75/blocks/L/observations.md (obs-1 HOLD: BUILD-16 guard-by-trust-level;
  obs-2 HOLD: PRODUCT-6 seam-by-real-async-contract).
- process/waves/_archive/wave-74/blocks/L/observations.md (no file; candidates reconstructed from brief).
- process/waves/_archive/wave-73/blocks/L/observations.md (obs-1 HOLD: T-4 rule 1 candidate —
  prove hook fires by persisted row; obs-2 HOLD: T-8 rule 4 candidate — read controller route before probing).
Principles files read:
- BUILD-PRINCIPLES.md (15 rules), PRODUCT-PRINCIPLES.md (5 rules), CI-PRINCIPLES.md,
  VERIFY-PRINCIPLES.md (4 rules), T-4.md (0 rules), T-8.md (3 rules).
Archive grep results:
- No prior observations.md entry documents the "generated mockup drifts toward genre conventions
  the brief fences; both reviewers independently caught it" class.
- No prior observations.md entry documents the "email-verification 403 masking an authz 403" class.
- No prior observations.md entry documents the "hand-roll authz predicate when a unit-tested
  shared service already implements it" class (closest archive hits are RbacService import-type
  erasure [wave-12] and canViewChannelById parameter [wave-33] — different classes entirely).

---

## Explicit recurrence verdicts on standing held candidates

### wave-75 obs-1 (HOLD — 1st instance): BUILD-16 candidate — assign a new endpoint's auth guard by its required trust level, not by copying the nearest controller

**Verdict: NOT a confirming 2nd instance. HOLD maintained.**

Wave-76's P-4 did not reproduce the guard-selection error class. Karen's HIGH finding at P-4 Phase 2
was "EducatorAccessGuard re-derives the owner/role predicate by hand instead of delegating to
RbacService.can" — a different class (DRY / authz-primitive reuse) rather than a wrong GUARD
TYPE being selected (bypass vs. required). Wave-76 throughout uses AuthGuard (the verification-
required posture) correctly: B-2 confirms "AuthGuard not SessionNoVerifyGuard" and the B-6 gate
explicitly notes "AuthGuard uses verifySession() (verification-required), not SessionNoVerifyGuard."
The GUARD CLASS choice (which tier of trust: bypass vs. required) was correct this wave. Not a
confirming instance. HOLD maintained. Watch for any future wave where a new endpoint is specced
with the wrong guard class because the author copied from an adjacent controller with a different
trust level.

---

### wave-75 obs-2 (HOLD — 1st instance): PRODUCT-6 candidate — shape a seam for a fenced integration by its async/callback contract, not by the mock's synchronous convenience

**Verdict: NOT a confirming 2nd instance. HOLD maintained.**

Wave-76 introduces no new DI seam for a fenced future integration. The billing provider seam is
the one planted in wave-75; wave-76 builds on top of it (EducatorAccessGuard and EducatorAnalyticsService
are backend-only services with no async-redirect pattern). Not a confirming instance. HOLD maintained.
Watch for any wave building a mock behind a seam for a known future async integration (payments,
email provider, push notification, OAuth callback) where the interface is shaped for mock convenience
and callers must be re-plumbed later.

---

### wave-73 obs-1 (HOLD — 1st instance): T-4.md rule 1 candidate — prove a service-layer side-effect hook fires by asserting the persisted DB row, not by reading the call site

**Verdict: NOT a confirming 2nd instance. HOLD maintained.**

Wave-76's T-4 tests the EducatorAnalyticsService (count/group aggregates returning correct zero-
valued structs on empty, correct shapes on seeded data). This is a read-aggregate assertion, not
a write-hook firing assertion: no side-effect hook is introduced (analytics is a read-only service
over existing tables) and the "plumbing built but not wired" risk is not the operative concern
on a read path. Not a confirming instance. HOLD maintained. Watch for a future wave introducing a
service-level hook (audit, notification, webhook, analytics write) where "assert the persisted row,
not the call site" is the operative proving technique.

---

### wave-73 obs-2 (HOLD — 1st instance): T-8.md rule 4 candidate — read the deployed controller to confirm the registered route path before issuing T-8 probes

**Verdict: NOT a confirming 2nd instance. HOLD maintained.**

Wave-76's T-8 probed the correct routes (`GET /servers/:serverId/educator-tools/status` and
`GET /servers/:serverId/educator-tools/analytics`) without any wrong-path inference; the full
authz matrix was produced without a 404-caused-by-wrong-path. T-8 notes the routes explicitly
from the deployed controller. Not a confirming instance. HOLD maintained.

---

## obs-1 — WARNING (1st INSTANCE): when speccing a new authz guard, resolve the owner/role predicate via the existing shared authz service rather than re-deriving it inline

**Source artifacts:**
- process/waves/wave-76/blocks/P/gate-verdict.md (Phase 2 — karen, HIGH finding): "The spec
  (contracts.types) and P-3 plan (line 6, 28) describe EducatorAccessGuard as re-deriving the
  predicate from 'the servers.service owner idiom + the roles capability model' — i.e. hand-rolling:
  load server → owner_id check → load server_members → load role → read .manage_assignments. But
  apps/api/src/rbac/rbac.service.ts:53 already ships RbacService.can(userId, serverId, permission)
  which implements EXACTLY this predicate: owner short-circuit (line 65) OR member→role.manage_assignments
  (line 91), with full default-deny ... and IDOR-safe userId-from-session. It is unit-tested
  (rbac.service.spec.ts covers owner-superuser, null-role default-deny, manage_assignments true/false).
  Neither spec nor plan mentions it."
- process/waves/wave-76/blocks/P/gate-verdict.md (Phase 2 — karen, conclusion): "Required fix (B-2):
  EducatorAccessGuard.canActivate should resolve owner/educator via RbacService.can(userId, serverId,
  'manage_assignments') ... rather than re-querying servers/server_members/roles inline. Not a
  BLOCK on its own: the predicate the plan describes is functionally CORRECT ... this is a
  build-quality/DRY steer, not a wrong predicate."
- process/waves/wave-76/stages/B-2-backend.md: "682e0912 (8da61b2): EducatorAccessGuard delegates
  to RbacService.can(userId, serverId, 'manage_assignments') — NO hand-rolled owner/role
  (karen P-4 HIGH honored)."
- process/waves/wave-76/blocks/B/gate-verdict.md (Phase 1): "EducatorAccessGuard (apps/api/src/billing/
  educator-access.guard.ts) delegates the entire owner/educator predicate to RbacService.can(userId,
  serverId, 'manage_assignments') — it does NOT hand-roll owner/role/membership resolution, closing
  the karen P-4 HIGH."

**Assessment:** The plan author derived the EducatorAccessGuard predicate by tracing the nearest
existing guard implementation (the `server.owner_id !== userId` idiom in servers.service.ts:482)
and the capability model (roles table with `manage_assignments`), then described constructing those
queries inline in the guard body. This is textbook re-derivation: the plan "discovers" the same
owner/role resolution logic that `RbacService.can` already encapsulates, audited, and unit-tests.
The failure mode if unaddressed: B-2 ships ~30 lines of duplicated security-critical resolution
logic that can drift from the canonical RBAC path on a future capability rename or role-model
change. The billing module already imports RbacService in test wiring, so the dependency path
exists.

The class is distinct from wave-75 obs-1 (BUILD-16 HOLD). Wave-75's guard class was wrong (bypass
vs. required trust level — a selection error). This wave's guard class is correct (AuthGuard chosen
correctly, EducatorAccessGuard predicate is correct). The failure here is inside the guard's
implementation: duplicating an existing tested primitive rather than delegating to it. The "which
guard" question is answered correctly; the "how to implement the predicate inside the guard"
question was answered with hand-rolled code instead of a shared service.

**Near-dup check vs BUILD-PRINCIPLES rules 1-15:**
- Rule 9 ("Author an integration spec exercising every new service or DB boundary") prescribes
  spec existence, not whether the predicate inside a guard delegates to a shared service. Not a
  near-dup.
- Rule 4 ("Reproduce one negative path per authz boundary at B-6 Phase-2") is a gate obligation
  to test; it does not govern whether the predicate is implemented inline or via delegation. Not
  a near-dup.
- No existing BUILD rule says "resolve owner/role authz via the shared RBAC service rather than
  re-querying inline." Not a near-dup.

**Near-dup check vs PRODUCT-PRINCIPLES rules 1-5:**
- Rule 1 ("Verify every seed claim about what exists or is absent in the code at P-0") is scoped
  to P-0 existence-checking, not to guard implementation strategy. However, karen's finding IS
  a violation of rule 1's spirit: the plan acted on a false-absent premise ("the predicate must
  be built") when the predicate already existed (RbacService.can). The observation could be read
  as a PRODUCT-PRINCIPLES rule 1 instance. Critical distinction: rule 1 fires at P-0 when the
  seed premise is wrong; this finding fired at P-4 Phase 2 because the PLAN described hand-rolling
  a predicate without checking whether a shared service already implements it. The timing is
  P-3/plan-authoring, not P-0 problem-framing. The principle this observation targets is sharper
  and specific to security-critical shared services: "before implementing an authz predicate in a
  new guard, check whether a shared, tested RBAC service already resolves it." PRODUCT rule 1 is
  broader; this is narrower and BUILD-scoped. Not a near-dup — but the interaction with rule 1
  should be noted at promotion if this reaches the 2nd instance bar.

**Pre-shaped candidate (HOLD — 1st instance only):**
```
16. Implement a new authz guard's owner/role predicate by delegating to the shared RBAC service, not by re-querying inline.
    Why: An inline re-query duplicates security-critical logic that can drift from the audited shared path.
```
Rule line = 115 chars. PASS (<=120). Why line = 93 chars. PASS (<=100).
No forbidden tokens. PASS. Near-dup vs BUILD rules 1-15: PASS (see above). Candidate file:
BUILD-PRINCIPLES.md rule 16 (this is a build/implementation convention for guard authoring, not a
product-scope or test-layer rule; karen's HIGH was a "build-quality/DRY steer" in her own words).

Note on numbering: wave-75 obs-1 pre-shaped a BUILD-PRINCIPLES rule 16 candidate (guard by trust
level). If that candidate is promoted first, this candidate would become rule 17. At the 2nd-instance
point the numbering resolves from the file's current last rule. Both are BUILD candidates; both
are HOLDs; neither conflicts with the other.

**Severity:** warning — the defect was caught by karen's Phase-2 per-claim code verification;
  without it, B-2 would have shipped an inline re-derivation of a security-critical predicate
  that duplicates the audited RbacService.can path. The BUILD fix was applied before B-2 ran.
**Candidate principles file:** BUILD-PRINCIPLES.md rule 16 (or 17 depending on prior promotions).
**Cross-wave recurrence:** FIRST INSTANCE. HOLD pending 2nd confirming wave.
**Promotion flag:** HOLD — 1st instance. Watch for any wave where a guard or service implements
  an owner/role/membership predicate inline (load server, check owner_id, load members, check role
  flag) when a shared, tested RBAC service that already resolves the same predicate is available.

---

## obs-2 — WARNING (1st INSTANCE): at T-8, prove an authz-guard denial with a VERIFIED account whose 403 carries the target guard's message; an unverified account's 403 is the auth layer, not the authz gate

**Source artifacts:**
- process/waves/wave-76/stages/T-8-security.md (§ 1 — Owner/educator gate, opening): "Fixture B
  (studyhall-e2e-fixture-b, da74148e) — a VERIFIED, NON-owner, member of the school-tier Proof
  Server with a NULL role (no manage_assignments) — calling both endpoints: GET /status → 403 body
  {'message':'Educator access required for this server','error':'Forbidden'}. The 403 body is the
  EducatorAccessGuard message (educator-access.guard.ts:65), NOT an email-verification claim —
  proving the denial is at the AUTHZ core, not the auth layer."
- process/waves/wave-76/stages/T-8-security.md (§ 1 — Fixture B, emphasis): "VERIFIED, NON-owner
  member ... The 403 body is the EducatorAccessGuard message ... NOT an email-verification claim."

**Assessment:** The T-8 tester explicitly chose a VERIFIED fixture and then confirmed the denial
body text was the EducatorAccessGuard message rather than an email-verification claim. This
deliberate two-step (verified account + body claim check) is the safeguard against a specific
false-closure: if the T-8 probe had used an unverified throwaway account, the endpoint would
return 403 because the auth layer's email-verification validator fires before the EducatorAccessGuard
runs. That 403 looks like an authz denial (correct status code) but proves nothing about the
authz guard — the guard never executed. The claim "non-owner/non-educator is denied" would be
marked as proved when it was only proved that unverified users are denied (which was already true).

This is a structural ambiguity baked into the system architecture: AuthGuard with email verification
required means any unverified session produces a 403 before any downstream guard runs. Every T-8
authz probe on this codebase is therefore at risk of a false-closure if the fixture is unverified.
The fix is two-pronged: (1) use a verified fixture so the auth layer passes and the authz guard is
actually reached; (2) confirm the 403 body carries the target guard's message (not an email-
verification claim), proving execution reached the authz guard.

This is distinct from T-8.md rule 1 ("live-probe the authz path with a verified prod fixture").
Rule 1 prescribes USING a verified fixture. This observation adds the body-claim confirmation step:
even if the fixture is supposedly verified, the 403 body text distinguishes "auth layer fired" from
"authz guard fired." The body check is an independent falsification that rule 1 alone does not
mandate.

**Near-dup check vs T-8.md rules 1-3:**
- Rule 1 prescribes a verified prod fixture. It does NOT prescribe checking the 403 body for
  the target guard's message vs. the email-verification claim. The incremental obligation this
  observation targets is the body-claim confirmation. Not a near-dup — it is a refinement.
- Rules 2-3 are about :id validation (400 not 500) and WS envelope fix. Not near-dups.

**Pre-shaped candidate (HOLD — 1st instance only):**
```
4. At T-8, confirm a 403 denial is from the target authz guard by inspecting the response body claim, not only the status code.
   Why: An unverified fixture's 403 is the auth layer firing; the authz guard may never have run.
```
Rule line = 118 chars. PASS (<=120). Why line = 88 chars. PASS (<=100).
No forbidden tokens. PASS. Near-dup vs T-8 rules 1-3: PASS (incremental; rule 1 covers verified
fixture; this covers body-claim confirmation). Candidate file: T-8.md rule 4.

Note on numbering: wave-73 obs-2 pre-shaped a T-8.md rule 4 candidate (read controller route before
probing). Both are T-8 rule 4 candidates; both are HOLDs. At promotion, the one that reaches the
2nd instance bar first becomes rule 4; the other becomes rule 5. They are not near-dups: wave-73
obs-2 is about route-path inference; this observation is about body-claim confirmation of guard
identity.

**Severity:** warning — the T-8 tester applied this correctly; the value is in naming the pattern
  so future testers do not skip the body-claim confirmation and close a probe with a false-closure.
  The risk on this specific codebase is real because email-verification-required is the default for
  all non-bypass routes; every authz probe has a latent false-closure risk from unverified fixtures.
**Candidate principles file:** T-8.md rule 4.
**Cross-wave recurrence:** FIRST INSTANCE. HOLD pending 2nd confirming wave.
**Promotion flag:** HOLD — 1st instance. Watch for any wave where a T-8 probe marks an authz
  denial as confirmed based on a 403 status code alone, without verifying the response body
  identifies the target authz guard rather than the auth/email-verification layer.

---

## obs-3 — INFORMATIONAL (1st instance): a generated mockup will drift toward genre conventions the brief fences; D-3 dual-reviewers must explicitly verify each fence rather than auditing aesthetics generally

**Source artifacts:**
- process/waves/wave-76/stages/D-3-review-and-adopt/educator-admin-console-reconciliation.md
  (iteration 0→1 matrix): "REVISE + REVISE → aggregate both → D-2 refine (iteration 1). Both
  independently flagged the SAME core drift: the mockup leans into a 'growth dashboard' aesthetic
  the brief §5/§6 explicitly fences."
- process/waves/wave-76/stages/D-3-review-and-adopt/educator-admin-console-reconciliation.md
  (aggregated refine concerns): "1. REMOVE the 7-bar histogram / any chart (brief §6 'NO charts/
  graphs') — replace with scalar count/delta stats. 2. Font: Outfit → Geist (DESIGN-SYSTEM §2).
  3. Motion: cut the 0.8s clipReveal + 2s counter animation ... reduce neon glows to subtle ...
  calm/quiet, not cinematic. ... 8. Oversized stat numerals (text-6xl/5xl) → cap at DS §2 scale."
- process/waves/wave-76/stages/D-1-brief/educator-admin-console-brief.md (§6 fences): "NO charts/
  graphs/time-series viz ... NO B2B2C / institution-partnership UI ... NO editing/mutation."
- process/waves/wave-76/stages/D-3-review-and-adopt/educator-admin-console-reconciliation.md
  (iteration 1→2 matrix): "APPROVE + REVISE — concerns are mechanical (not aesthetic)"
  (iteration 2→3): "APPROVE + APPROVE — design converged after 2 refine iterations."

**Assessment:** The brief §5/§6 explicitly fenced the "growth dashboard" aesthetic (no charts,
no cinematic motion, no oversized stat display numerals, Geist-only), modeling the brief around
the calm/academic ServerPlanPanel idiom. The aidesigner's first-pass mockup drifted to the opposite
pole: a 7-bar histogram, an 0.8s clip-reveal animation, a 2s counter animation, text-6xl/5xl stat
numerals, the Outfit typeface, and neon glows. This is not a subtle deviation — it is a convergence
to the "analytics dashboard" genre default, exactly what the brief was written to prevent.

Both dual reviewers independently identified the same drift (identical trigger, same set of fence
violations), which validates the dual-review structure. Two refine iterations resolved it. The
iteration-1 REVISE was mechanical (off-set icon, numeral size), not aesthetic — the aesthetic
correction was complete after one iteration. The convergence pattern is: the generator applies
genre defaults; the fence-aware reviewer catches them; the refined output is brief-faithful.

**Is a new rule needed here?** This is the first time in the archive that the "mockup drifts into
explicitly fenced genre aesthetic" pattern has been formally named. The dual-review mechanism
worked as designed. The question is whether a rule that says "explicitly verify each fence" adds
anything over "the D-3 reviewers review the brief" which is already the stage mandate.

Assessment: the class is real (the first-pass drift was total, not incremental), the briefs WILL
include genre fences when the output domain has a strong genre default (analytics, e-commerce,
gaming HUD), and the current stage mandate says "review against brief" but does not specifically
call out "verify each §6 fence line by line." A rule that makes the fence-enumeration step explicit
(not assumed under general review) reduces the chance a reviewer approves a partly-drifted output
after a mostly-aesthetic pass. However, this is the design-block analog of the principles, and
there is no `DESIGN-PRINCIPLES.md` file in the principles set — the design system lives in
`design/DESIGN-SYSTEM.md` and the review format is embedded in the stage file. A rule here would
go to a non-existent file.

Given this, the observation is flagged as INFORMATIONAL and 1st-instance. A 2nd wave where both
reviewers independently catch the same genre-fence violation in a generated mockup would elevate
this to a meaningful candidate — but the target file (DESIGN-PRINCIPLES.md or a D-block annotation)
does not yet exist. The value right now is naming the pattern so future synthesis can detect a
2nd instance.

**Severity:** informational — the mechanism (dual-review) caught the drift and resolved it in 2
  iterations; no defect shipped; the resulting mockup passed all fences with high scores.
**Candidate principles file:** none (DESIGN-PRINCIPLES.md does not exist; not a BUILD/PRODUCT/
  T-layer class). Flag for future consideration if design-layer principles are formalized.
**Cross-wave recurrence:** FIRST INSTANCE. HOLD pending 2nd confirming wave AND target file
  existence.
**Promotion flag:** HOLD — 1st instance, no target file.

---

## obs-4 — INFORMATIONAL: status check on all standing held candidates

| origin | class | wave-76 status |
|--------|-------|----------------|
| wave-75 obs-1 (HOLD — 1st instance) | BUILD-16 candidate: assign endpoint guard by trust level, not by nearest-controller copy | NOT CONFIRMED as 2nd instance. Wave-76 selected AuthGuard correctly; karen's HIGH was about predicate delegation (different class). HOLD maintained. |
| wave-75 obs-2 (HOLD — 1st instance) | PRODUCT-6 candidate: shape seam by async/callback contract, not mock convenience | NOT CONFIRMED. No new DI seam for a fenced future integration. HOLD maintained. |
| wave-73 obs-1 (HOLD — 1st instance) | T-4.md rule 1 candidate: prove hook fires by persisted DB row, not call site | NOT CONFIRMED. Analytics is a read-only aggregate service; no side-effect write hook. HOLD maintained. |
| wave-73 obs-2 (HOLD — 1st instance) | T-8.md rule 4 candidate: read controller route before probing | NOT CONFIRMED. T-8 probed correct routes without 404 inference error. HOLD maintained. |
| wave-72 obs-1 (HOLD — 1st instance) | CJS bundle scan: grep built SPA bundle for require( before merge | NOT CONFIRMED. No CJS-in-browser-bundle failure this wave. HOLD maintained. |
| wave-71 obs-1 (HOLD — 1st instance) | Route every mutation through the state owner | NOT CONFIRMED. Wave-76 frontend is a read-only analytics console; no optimistic mutation path. HOLD maintained. |
| wave-70 obs-2 (HOLD — 1st instance) | Realtime fan-out for a gated write must be downstream of the gate | NOT CONFIRMED. No websocket fan-out. HOLD maintained. |
| wave-70 obs-3 (HOLD — 1st instance) | Backend list endpoint must include display fields if UI renders rows by name | NOT CONFIRMED. Analytics endpoint returns roleId/roleName as role metadata (not user display names); no display-field gap. HOLD maintained. |

**Severity:** informational (status check only).
**Candidate principles file:** none.
**Promotion flag:** NO.

---

## Summary table

| id | title (short) | severity | recurrence | candidate file | disposition |
|----|---------------|----------|------------|----------------|-------------|
| wave-75 obs-1 verdict | BUILD-16 guard-by-trust-level | informational | NOT CONFIRMED (different class: authz predicate vs. guard type) | none | HOLD maintained |
| wave-75 obs-2 verdict | PRODUCT-6 seam-by-async-contract | informational | NOT CONFIRMED (no new fenced seam) | none | HOLD maintained |
| wave-73 obs-1 verdict | T-4.md: prove hook fires by persisted row | informational | NOT CONFIRMED (read-only analytics, no write hook) | none | HOLD maintained |
| wave-73 obs-2 verdict | T-8.md: read controller route before probing | informational | NOT CONFIRMED (correct routes probed) | none | HOLD maintained |
| obs-1 | Implement guard's owner/role predicate via shared RBAC service, not inline re-query | warning | FIRST INSTANCE | BUILD-PRINCIPLES.md rule 16 | HOLD — 1st instance |
| obs-2 | Confirm a T-8 authz 403 by response body claim, not status code alone | warning | FIRST INSTANCE | T-8.md rule 4 | HOLD — 1st instance |
| obs-3 | Generated mockup drifts to genre defaults the brief fences; D-3 must check each fence explicitly | informational | FIRST INSTANCE | none (no DESIGN-PRINCIPLES file) | HOLD — 1st instance, no target file |
| obs-4 | Status check: all standing HOLDs maintained; no new confirming instances | informational | -- | none | STATUS CHECK ONLY |

**Observations emitted (knowledge-synthesizer): 4 (obs-1, obs-2, obs-3, obs-4; plus 4 held-candidate
  verdicts)**
**Severities: 2 warning (obs-1, obs-2), 2 informational (obs-3, obs-4)**

---

## Promotion-candidate assessment

**Genuine promotion candidates this wave: 0.**

- **obs-1** (BUILD-PRINCIPLES.md rule 16 candidate — authz predicate via shared RBAC service):
  HOLD — 1st instance only. Karen's HIGH finding is high-value: the failure mode (re-deriving a
  security-critical predicate that a shared audited service already implements) is not covered by
  any existing BUILD rule. The class is generalizable: any future guard (or service method) that
  re-queries owner_id + member→role→capability inline when RbacService.can already resolves it
  is a confirming instance. The distinction from wave-75 obs-1 (BUILD-16 HOLD, guard trust-level
  selection) is clean. Both are BUILD candidates; both are 1st-instance HOLDs; both would be
  rule 16 depending on which is promoted first. Needs a 2nd independent wave where a guard
  re-derives owner/role inline, caught at P-4 or B-6.

- **obs-2** (T-8.md rule 4 candidate — body-claim confirmation of authz guard identity):
  HOLD — 1st instance only. The class is specific to this codebase's architecture (email-
  verification-required as default means unverified fixtures 403 before any authz guard runs)
  and to the T-8 testing discipline. The candidate is a genuine refinement of rule 1 (verified
  fixture → also check the body to confirm guard identity), not a near-dup. Needs a 2nd independent
  wave where a T-8 probe produces or risks a false-closure because the 403 body is not checked.
  Wave-73 obs-2's T-8.md rule 4 candidacy (read controller route before probing) is different
  and coexists without conflict; numbering resolves at promotion time.

- **obs-3** (DESIGN-PRINCIPLES — generated mockup genre drift):
  HOLD — 1st instance, no target file. The dual-review mechanism caught and corrected the drift
  in 2 iterations; no defect shipped. The class is real and recurrent in AI-generated design
  (generators apply genre defaults; fences in briefs require explicit per-fence audit). However,
  without a DESIGN-PRINCIPLES.md file in the principles set, there is no valid promotion target.
  If a design-layer principles file is created in a future wave, this observation should be
  revisited. A 2nd wave where both reviewers independently catch the same genre-fence violation
  would then constitute a confirming instance.

- **All other standing HOLDs (wave-73 obs-1, obs-2; wave-75 obs-2; wave-72 obs-1; wave-71
  obs-1; wave-70 obs-2, obs-3):** not confirmed this wave. Maintain.
