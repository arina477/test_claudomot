# Wave-86 L-block observations — knowledge-synthesizer

Append-only. L-2 Distill (karen) reads these; promotes to `*-PRINCIPLES.md` ONLY when an
observation recurs across 2+ waves AND the head-X gate approves (max 1 rule/file/wave). Single-wave
observations stay here until a second wave confirms, UNLESS a strong 1st instance clears the bar on
its own merit (head-X discretion, per the wave-78 BUILD-17 precedent).

---

## Inputs read

Wave-86 deliverables:
- `process/waves/wave-86/stages/P-0-frame.md`
- `process/waves/wave-86/stages/P-2-spec.md`
- `process/waves/wave-86/stages/P-3-plan.md`
- `process/waves/wave-86/stages/B-2-backend.md`
- `process/waves/wave-86/stages/B-6-review.md`
- `process/waves/wave-86/stages/C-2-deploy-and-verify.md`
- `process/waves/wave-86/stages/T-8-security.md`
- `process/waves/wave-86/stages/V-1-karen.md`
- `process/waves/wave-86/stages/V-1-jenny.md`
- `process/waves/wave-86/stages/V-2-triage.md`
- `process/waves/wave-86/stages/V-3-fast-fix.md`

Prior archives:
- `process/waves/_archive/wave-85/blocks/L/observations.md`
- `process/waves/_archive/wave-84/blocks/L/observations.md`
- `process/waves/_archive/wave-83/blocks/L/observations.md`
- `process/waves/_archive/wave-82/blocks/L/observations.md`
- `process/waves/_archive/wave-81/blocks/L/observations.md`
- `process/waves/_archive/wave-84/stages/C-2-deploy-and-verify.md` (Railway bare-deploy cross-check)

Principles files read for de-dup:
- `command-center/principles/BUILD-PRINCIPLES.md` (19 rules)
- `command-center/principles/CI-PRINCIPLES.md` (12 rules)
- `command-center/principles/PRODUCT-PRINCIPLES.md` (6 rules)
- `command-center/principles/VERIFY-PRINCIPLES.md` (4 rules)
- `command-center/principles/test-layer-principles/T-8.md` (5 rules)

**Wave outcome:** Backend-only CSRF-posture legibility wave. SuperTokens `Session.init` now
declares `antiCsrf: 'NONE'` explicitly (correct, non-weakening for header transport). Permanent
regression test `csrf-posture.spec.ts` guards cookie-only forged-POST rejection. CSRF-safety docs
added with wave-84 migration-trigger cross-ref. PR #106 squash-merged, deployed live (api
`a9556248`, deployment `0f38d1fe`). B-6 caught 2 MEDIUM (test not a real tripwire; prod config
mirror) + 1 LOW (doc understated prior default); both FIXED. V-block APPROVED (karen + jenny).
Resolves wave-49 F-2.

---

## De-dup performed against existing rules

- **CI rule 1** (verify deploy via deployment-state endpoint, not /health alone): the `at_new_commit`
  check in C-2 is adjacent but covers correct-revision verification, not the bare-call mechanism
  of obs-1 below. Not a dup.
- **CI rule 2** (probe a new route for 404-to-auth-gated flip): not relevant to obs-1 (auth path
  sanity probe is complementary, not identical). Not a dup.
- **BUILD rule 4** (reproduce one negative path per authz/injection boundary at B-6 Phase-2):
  adjacent to obs-2 (structurally-invalid forged token is theater), but rule 4 speaks to AUTHZ
  boundary reproduction, not to test-token validity for a transport-layer guard. Not a dup.
- **BUILD rule 19** (enumerate security policy outbound surface at B-6 Phase-2): obs-2 concerns
  regression-test construction for a transport-layer guard, not outbound-origin enumeration. Not
  a dup.
- **T-8 rules 1-5**: none covers the "structurally-valid forged token required for transport-layer
  guard tests" or "security config value from SDK source not old-finding wording" classes. No dup.

---

## obs-1 — Railway bare `serviceInstanceDeploy` (no commitSha) redeploys the PINNED prior commit, not main HEAD

**Finding:**

Wave-86 C-2 records: a bare `serviceInstanceDeploy` call with no `commitSha` redeployed pinned
commit `5cb5e789` (wave-84 HEAD), producing a SUCCESS deploy at an IDENTICAL imageDigest. The api
service did not auto-track main HEAD. Only after re-triggering with explicit `commitSha=a9556248`
did the wave-86 HEAD deploy correctly. The C-2 note: "this api service does not auto-track main
HEAD on a bare serviceInstanceDeploy — pass commitSha."

Wave-84 C-2 records the identical stale-deploy class. After PR #104 merged (wave-84 code at
`5cb5e789`), the api still served STALE wave-83 commit `dd24a7d6`. The fix was
`serviceInstanceDeployV2(commitSha)` at merge HEAD `5cb5e789`. C-2 records: "api off stale
wave-83 commit" as the prior HOLD being resolved. The wave-84 L-block did not elevate this to
a named obs — it subsumed the stale-deploy event into the obs-2 "build-time env var threading"
narrative, not as a standalone Railway bare-deploy mechanism.

The mechanism is now cleanly named in wave-86 C-2: a bare call (no commitSha) redeploys whatever
commit was pinned by the last successful deploy, not the current main HEAD. Wave-84 encountered
the same stale-commit-from-bare-call outcome. This is a 2-wave recurrence of the same mechanism.

**Recurrence evidence:**
- FIRST NAMED INSTANCE: `process/waves/wave-86/stages/C-2-deploy-and-verify.md` notes block
  (bare call → pinned commit `5cb5e789`, same imageDigest; resolved with explicit commitSha)
- CONFIRMING INSTANCE: `process/waves/_archive/wave-84/stages/C-2-deploy-and-verify.md`
  `rollback_targets.api` (prior live SUCCESS at stale `dd24a7d6`; resolved via
  `serviceInstanceDeployV2(commitSha)` at `5cb5e789`). See also wave-84 `api_not_stale: true`
  / `note: "Scoped api Dockerfile build succeeded ... wave-84 header-transport change now IN
  production"` confirming the bare-call mechanism was the stale source.

Wave-84's L-block did not record this as a standalone obs; it appeared embedded in obs-2. Wave-86
is the first wave where the mechanism is explicitly named and documented as a distinct C-2 finding.
The 2-wave recurrence bar is met by the two C-2 artifacts (wave-84 and wave-86), even though
wave-84 did not produce a formal L-obs.

**Severity:** strong — a bare call succeeded and returned `SUCCESS` at the stale commit with an
identical imageDigest. Without the at-new-commit check the stale deploy would have been
indistinguishable from a correct one and passed C-2. The stale code would have reached production
as the "latest" wave's code.

**Candidate principles file:** CI-PRINCIPLES.md (rule 13 — currently no rule covering this)

**Pre-shaped rule for promotion (karen must verify char counts before appending):**

```
13. Pass an explicit commitSha to serviceInstanceDeploy; a bare call redeploys the pinned prior commit, not main HEAD.
   Why: Railway pins the last-deployed commit, so a bare call returns green SUCCESS on stale code.
```

PROMOTED as CI-PRINCIPLES.md rule 13. Karen REJECTED the first Why wording (full line 102 > 100
after the linter measured the 3-space indent + `Why:` prefix); cap-1 karen rewrite trimmed the
causal text to a 98-char full line. Deterministic linter PASS (rule 118 ≤ 120, why 98 ≤ 100,
2 lines, no forbidden tokens).

**Promotion status:** PROMOTED — 2-wave recurrence bar met (wave-84 C-2 + wave-86 C-2, both via
Railway GraphQL `serviceInstanceDeploy`; both resolved by passing an explicit commitSha; both would
have silently shipped stale code without the at-new-commit check). Karen APPROVED on substance;
head-learn (this L-block owner) applied after linter PASS.

---

## obs-2 — A security-config value must be chosen against the ACTUAL SDK behavior + transport mode, not old-finding wording

**Finding:**

The wave-86 seed (citing wave-49 F-2) asked for `antiCsrf: 'VIA_TOKEN'`. P-0 reframed: `VIA_TOKEN`
is a cookie-mode value — a wrong, not merely stale, choice after wave-84 pinned header transport.
The supertokens-integration specialist verified against `supertokens-node@24.0.2` source that in
header mode `getAccessTokenFromRequest` reads ONLY the Authorization header; a cookie-only request
yields `accessToken=undefined -> UNAUTHORISED` before any antiCsrf check is consulted; `antiCsrf`
is never reached. `NONE` is therefore correct and non-weakening; `VIA_TOKEN` would have been
inert-but-misleading; `VIA_CUSTOM_HEADER` would have been a footgun (SDK THROWS if run with
`antiCsrf: VIA_CUSTOM_HEADER` and `antiCsrfCheck !== false` on a non-cookie transport).

The root cause: the old finding (wave-49) was authored before wave-84 changed token transport to
header mode. The literal finding wording (`VIA_TOKEN`) was taken as a specification rather than
re-verified against the installed SDK + current transport. P-3 plan already noted "NEVER VIA_TOKEN
(cookie-mode value; the seed's wrong ask)." B-2 then verified the correct value (`NONE`) directly
against SDK source.

The generalizable obligation: when a security-config value is named in a seed or old finding,
verify its correctness against the INSTALLED SDK version and the CURRENT transport/mode before
adopting it. An old finding's cited value predates later architectural changes and can be wrong
or dangerous on the current stack.

**Source artifacts:**
- `process/waves/wave-86/stages/P-0-frame.md` §Reframe (VIA_TOKEN = wrong value for header
  transport; corrected to likely NONE)
- `process/waves/wave-86/stages/B-2-backend.md` (`via_custom_header_footgun` field; SDK-verified
  against supertokens-node@24.0.2)
- `process/waves/wave-86/stages/P-2-spec.md` (AC1 reframed: "NOT VIA_TOKEN")
- `process/waves/wave-86/stages/V-1-jenny.md` §Drift-vs-gap ("building NONE here is conformance
  to the reframed spec, not a gap against the superseded seed")

**Recurrence check:** Wave-84 obs-3 (HOLD, 1st, informational) recorded a different class: "BOARD
reframe prevented a naive security fix that traded MEDIUM XSS for HIGH auth-reliability regression."
That is about P-0 BOARD routing preventing an architecturally harmful option; it is not the same as
"verify a security-config VALUE against SDK source + current transport before adopting old-finding
wording." The wave-84 obs-3 is adjacent but distinct. No prior L-obs names the "security config
value chosen from old finding without re-verifying against installed SDK + current mode" class.
FIRST INSTANCE.

**Severity:** warning — adopting `VIA_TOKEN` would have shipped a misleading config (inert but
wrong-label, creating audit confusion); `VIA_CUSTOM_HEADER` would have been a runtime THROW
footgun on a future cookie-transport migration. Neither was live-dangerous today, but the error
class (config value sourced from an old finding, not re-verified) is repeatable on any SDK upgrade
or transport change.

**Candidate principles file:** BUILD-PRINCIPLES.md (rule 20) or PRODUCT-PRINCIPLES.md (rule 7,
as a P-0 verification obligation)

**Disposition:** HOLD — 1st instance. Clean and falsifiable (check: was the security config value
verified against the installed SDK source and the current transport/mode, or copied from an old
finding?). Pre-shaped wording for future confirmation (karen must verify char counts):

```
20. Verify a security-config value against the installed SDK source and current transport mode; do not adopt it from an old finding verbatim.
    Why: A finding's cited value predates SDK upgrades and transport changes; it can be inert, wrong, or a runtime footgun.
```

Rule line = 138 chars — OVER the 120-char limit. Tighter:

```
20. Verify a security-config value against the installed SDK and current transport; do not copy it from an old finding verbatim.
    Why: An old finding's value predates later SDK or transport changes and can be inert, wrong, or a footgun.
```

Rule line = 126 chars — still over. Continue tightening:

```
20. Verify a security-config option against the installed SDK + current transport; never take the value from an old finding verbatim.
    Why: A finding predates SDK upgrades and mode changes; the named value can be wrong or a runtime footgun.
```

Rule line = 132 chars — over. Karen must author a conforming sub-120-char form at distill time.

---

## obs-3 — A CSRF-guard test must use a structurally-valid forged token; a garbage token passes under any transport pin

**Finding:**

B-6 Phase-2 adversarial review (finding 2a, rated MEDIUM) caught that `csrf-posture.spec.ts`
initially used a structurally-garbage string as the forged `sAccessToken` cookie value. The test
was green under the `'header'` transport pin — but ONLY because every value, valid or garbage, is
rejected under header mode (the transport gate fires before any cookie parse). A transport pin flip
to `'any'` would also have kept the test green, because the SDK would attempt to read the cookie
and then reject it for being structurally invalid — not for transport reasons. This means the test
would NOT have caught a silent regression where header transport was downgraded to `'any'` or
`'cookie'`: both the before-fix and after-fix state would return `UNAUTHORISED` for a garbage
token regardless of transport pin. The guard was structurally green-by-construction, not a real
tripwire.

The fix (commit b9b31776): `buildStructurallyValidAccessTokenJwt()` constructs a real v3 JWT
header/payload/sig. Under `'header'` transport this is STILL rejected (transport gate fires
first). Under `'any'` transport, the valid cookie IS read and passes the transport gate, reaching
the verification layer (→ `TRY_REFRESH_TOKEN`). The CONTROL block proves this: the same
structurally-valid cookie returns `TRY_REFRESH_TOKEN` under `'any'` vs `UNAUTHORISED` under
`'header'`. A pin flip to `'any'` therefore BREAKS the header-block assertions (the expected
`UNAUTHORISED` becomes `TRY_REFRESH_TOKEN`). This is a genuine tripwire; the garbage-token
version was not.

The generalizable rule: a transport-layer guard test must use a structurally-valid token (or
credential) in the forged request. If the token is structurally garbage, the test passes under
ANY transport pin because the SDK's parse/validate layer rejects the garbage before transport
logic matters, making the test insensitive to the exact regression it guards.

**Relationship to wave-85 obs-3:** Wave-85 obs-3 (HOLD, 1st, informational) was: "when a fix is
value-equivalent to the bug on a simple path, assert the surfaces the fix adds, not the equivalent
output." That is about assertion target selection when a fix is value-equivalent to the bug. The
wave-86 class is: the forged credential in a transport-layer guard test must be structurally
viable so the test is actually sensitive to the transport pin. Adjacent (both about test theater
avoidance) but mechanically distinct: wave-85 is about what to assert; wave-86 is about how to
construct the input so the test is sensitive to the guard.

**Source artifacts:**
- `process/waves/wave-86/stages/B-6-review.md` (finding 2a MEDIUM: "forged cookie structurally-
  garbage -> guard stayed green under a header->any pin flip"; FIXED b9b31776 — structurally-
  valid JWT + 'any'-transport control block; verified tripwire fires on pin flip)
- `process/waves/wave-86/stages/V-1-karen.md` §2 (VERIFIED: `buildStructurallyValidAccessTokenJwt()`
  at `:116-129`; 'any'-transport CONTROL block at `:272-300` proving same cookie IS read under
  'any'; genuine tripwire, not stale-green)
- `process/waves/wave-86/stages/V-1-jenny.md` §AC2 (structurally-valid access-token JWT; 'any'-
  transport control proving pin is load-bearing)

**Recurrence check:** No prior L-obs names the "structurally-invalid forged credential in a
transport-layer guard test = green-by-construction, not a real tripwire" class. Wave-85 obs-3
is the closest prior but is a distinct class (value-equivalence on the simple path vs structural
validity of the forged input). FIRST INSTANCE.

**Severity:** warning — the test was caught at B-6 Phase-2 before merge. Without the mandatory
Phase-2 pass, a garbage-token guard would have shipped green and never caught a transport-pin
regression. This is the same "caught-only-by-mandatory-Phase-2" pattern as BUILD rule 4.

**Candidate principles file:** T-8.md (rule 6) — this is a T-8 security test construction rule,
more specific than the general BUILD layer. Could also be BUILD-PRINCIPLES.md (rule 20) if framed
as a general security-test authoring principle.

**Disposition:** HOLD — 1st instance. Clean and falsifiable (check: does the forged credential in
a transport-layer guard test pass structural validation at the credential-parse layer? If not, the
test is insensitive to the transport pin and is green-by-construction). Pre-shaped wording for
future confirmation (karen must verify char counts):

```
6. In a transport-layer security guard test, use a structurally-valid forged credential; a garbage value is green under any transport pin.
   Why: A structurally invalid credential is rejected at parse before transport logic; the test cannot detect a pin regression.
```

Rule line = 135 chars — over. Tighter:

```
6. Use a structurally-valid forged token in a transport-layer guard test; a garbage token is rejected at parse before transport logic runs.
   Why: A parse-rejected token passes under any transport pin, making the test insensitive to pin regressions.
```

Rule line = 138 chars — still over. Continue tightening:

```
6. Use a structurally-valid forged token in any transport-layer guard test; a garbage token stays green on a transport pin flip.
   Why: A parse-rejected token is rejected before transport logic; it cannot detect a transport regression.
```

Rule line = 126 chars — over. Karen must author a conforming sub-120-char form at distill time.

---

## Standing-HOLD status check (from wave-85 and earlier)

| origin | class | wave-86 status |
|---|---|---|
| wave-85 obs-1 (HOLD, warning, partial 2nd) | Optimistic-update revert must restore a captured prior snapshot, not assume the opposite | NOT CONFIRMED. Backend-only wave; no frontend optimistic-write surface. HOLD maintained. |
| wave-85 obs-2 (HOLD, warning, 1st) | Failed async write needs a VISIBLE error for sighted users; sr-only announce serves AT only | NOT CONFIRMED. No frontend UI change. HOLD maintained. |
| wave-85 obs-3 (HOLD, informational, 1st) | When a fix is value-equivalent to the bug on the simple path, assert surfaces the fix adds | NOT CONFIRMED as the same class. Wave-86 obs-3 is adjacent (test theater) but mechanically distinct (forged-credential structural validity vs assertion target). Both held independently. |
| wave-85 obs-4 (HOLD, informational, 1st) | Dismiss-timer useEffect callback dep must be useCallback-stable to prevent timer re-arming | NOT CONFIRMED. No timer-driven component this wave. HOLD maintained. |
| wave-84 obs-2 (HOLD, warning, partial 2nd) | Build-time env var threading through ALL build invocation paths at authoring time | NOT CONFIRMED. No new VITE_ env var or Dockerfile ARG change this wave. HOLD maintained. |
| wave-84 obs-3 (HOLD, informational, 1st) | BOARD reframe prevented naive security option trading severity | NOT CONFIRMED as the same class. P-0 here was a ceo-reviewer PROCEED (SCOPE-REDUCTION), not a BOARD Tier-3 escalation. Wave-86 obs-2 (security-config value from old finding) is adjacent but distinct. HOLD maintained. |
| wave-83 obs-C1-direct-push (HOLD, strong 1st) | `HEAD:main` from feature branch bypasses CI gate | NOT RECURRED. C-1 used a normal squash-merge PR path (PR #106). HOLD maintained. |
| wave-83 obs-3-live-verify-config-wave (HOLD, informational, 1st) | Config-only live probe substitutes for pending CI within bounded scope | NOT CONFIRMED. CI ran fully and was required; C-2 had no CI-outage context. HOLD maintained. |
| wave-82 obs-1 (HOLD, strong 1st) | Trace SDK source to confirm fix is decisive in real failure path, not just net-additive-safe | PARTIALLY ADJACENT. Wave-86 B-2 DID trace supertokens-node@24.0.2 source to confirm antiCsrf is never consulted under header transport. However this was a correct-verification-positive (trace confirmed the fix), not an instance where the trace caught a no-op fix on the dominant path. The wave-82 class is specifically "trace catches a no-op." Not a confirming 2nd instance. HOLD maintained. |
| wave-82 obs-2 (HOLD, warning, 1st) | Assert resolution on dominant failure path; configure mocks to that path | NOT CONFIRMED. No mock configured to wrong branch. HOLD maintained. |
| wave-82 obs-3 (HOLD, informational, 1st) | All-jobs-uniform-cancel at wall-time with no steps = runner infra timeout | NOT CONFIRMED. No CI infrastructure cancellation event this wave. HOLD maintained. |
| wave-81 obs-2 (HOLD, 1st) | SW-cached SPA serves stale bundle for post-deploy navigation | NOT CONFIRMED. Backend-only wave; no frontend deploy. HOLD maintained. |
| wave-80 obs-2 (HOLD, 1st) | Full-replace PUT clobbers concurrent field change | NOT CONFIRMED. No settings PUT surface this wave. HOLD maintained. |
| wave-80 obs-3 (HOLD, 1st) | Realtime toggle must proactively emit state change to peers | NOT CONFIRMED. No realtime feature this wave. HOLD maintained. |

---

## Summary table

| id | title | severity | recurrence | candidate_file | disposition |
|---|---|---|---|---|---|
| obs-1 | Railway bare `serviceInstanceDeploy` (no commitSha) redeploys pinned prior commit, not main HEAD | strong | 2 waves (wave-84 C-2 + wave-86 C-2) | CI-PRINCIPLES.md (rule 13) | **PROMOTE-ELIGIBLE** — 2-wave recurrence bar met; karen + head-ci-cd approval required |
| obs-2 | A security-config value must be verified against the installed SDK + current transport; not taken from old-finding wording | warning | 1st INSTANCE | BUILD-PRINCIPLES.md (rule 20) | HOLD — 1st instance |
| obs-3 | A transport-layer guard test must use a structurally-valid forged token; a garbage token stays green under any transport pin | warning | 1st INSTANCE | T-8.md (rule 6) | HOLD — 1st instance |

**Total observations: 3.** One PROMOTE-ELIGIBLE, two HOLD.

obs-1 is the wave's main structural finding and the only one clearing the 2-wave recurrence bar.
The mechanism (bare Railway GraphQL call returns SUCCESS at the pinned prior commit) is clean,
consistently documented across wave-84 and wave-86 C-2 deliverables, and falsifiable (at-new-commit
check detects it). The pre-shaped CI rule is sub-120 chars; karen must re-verify counts before
appending to CI-PRINCIPLES.md.

obs-2 and obs-3 are both genuine 1st instances with clear mechanics and pre-shaped rules, but both
require a 2nd wave to confirm. obs-3 has a partially confirming relationship to the B-6 Phase-2
mandatory-review chain (BUILD rule 4 confirming context), but the specific class (structural validity
of the forged credential, not just reproducing a negative path) is novel. Karen should note both as
candidates for quick confirmation if a future SDK-config wave or transport-layer security test wave
appears.
