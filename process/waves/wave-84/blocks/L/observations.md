# Wave 84 — L-block observations (knowledge-synthesizer, L-2)

Synthesized from wave-84 artifacts: session-token XSS-hardening (BOARD 7/7 Option B — keep
header transport, ship compensating controls). Explicit `getTokenTransferMethod:'header'` on
both Session.init() sides, 900s accessTokenValidity (supertokens-core env), refresh rotation
confirmed, explicit cross-origin-safe CSP on the web app. B-6 caught 3 CRITICAL + 1 HIGH CSP
outbound-origin omissions before deploy. C-2 caught Docker build-arg threading defect (web
Dockerfile missing VITE_STORAGE_ORIGIN/VITE_LIVEKIT_URL; api Dockerfile ran full-turbo incl.
web, tripping the CSP loud-fail guard). Hotfix PR #104 fixed both; all deployed live at
5cb5e789. T-8 live: 0 CSP violations, header transport + 900s TTL verified. V-block APPROVED.

Prior archives consulted: wave-83, wave-82, wave-81, wave-80, wave-79 (full L/observations.md).
Full archive also grepped for: CSP/outbound-origin/allowlist/enumeration/fence-gap and
VITE_/build-arg/Dockerfile/env-threading patterns.

Principles files read for de-dup: BUILD-PRINCIPLES.md (18 rules), CI-PRINCIPLES.md (12 rules),
PRODUCT-PRINCIPLES.md, VERIFY-PRINCIPLES.md, DESIGN-PRINCIPLES.md.

---

## obs-1 — Security-policy outbound-origin enumeration: second instance of wave-83 obs-2-fence-gap

**Summary:** Wave-83 obs-2-fence-gap recorded: "when adopting a security middleware with
cross-origin defaults, enumerate EVERY default the middleware can emit and explicitly disable
each one that can affect any established or future cross-origin surface." The mechanism was
helmet's COOP and originAgentCluster headers being left on silently.

Wave-84 B-6 Phase-2 adversarial review found 3 CRITICAL and 1 HIGH CSP outbound-origin
omissions in the initial CSP implementation in `apps/web/src/csp.ts`:

- **F1 CRITICAL:** Tigris storage origin (`https://t3.storageapi.dev`) missing from `img-src`
  and `connect-src` — would have blocked all attachment/upload and avatar 302-redirect loads.
- **F2 CRITICAL:** Tigris avatar redirect target also missing from `img-src`.
- **F3 CRITICAL:** LiveKit voice wss signaling origin (`wss://claudomat-test-sgf9259q.livekit.cloud`)
  missing from `connect-src` — would have silently blocked the entire voice channel.
- **F4 HIGH:** Sentry ingest origin missing from `connect-src` — would have silently killed all
  observability reporting.

The B-3 empirical derivation of the CSP used an app-shell-only probe and missed the three server-
provided origins (storage, livekit, sentry) that are not exercised during an app-shell load. Fix
commit 8d3366f3 extended the CSP to name every real outbound origin, parameterized via VITE_ vars.
The `completeness_verified` note in B-6 reads: "grep confirms web src outbound origins = VITE_API_ORIGIN
(api https+wss, all 4 sockets) + VITE_SENTRY_DSN only; storage+livekit server-provided, origins now
in CSP via VITE_STORAGE_ORIGIN/VITE_LIVEKIT_URL. No missed origin."

**Recurrence assessment:** The wave-83 class was: "A security-middleware adoption whose
enumeration was incomplete — the implementer named the cross-origin headers they were aware of but
missed unnamed defaults the library emits." The wave-84 class is: "A CSP policy authoring whose
outbound-origin enumeration was incomplete — the implementer named origins exercised during app-shell
load but missed origins exercised only on server-provided or feature-path flows." The mechanism
differs (library-emitted header defaults vs authored CSP allowlist), but the generalizable shape is
identical: **enumerate the FULL surface of a security policy from all actual-use paths, not only
the entries that are immediately visible to the implementer.** Both failures were caught at B-6
Phase-2 adversarial review, not live, and both represent silent-if-shipped breakage with no test
catching the gap. This is a genuine SECOND INSTANCE of the wave-83 class.

The unified rule at promotion: for any security policy — whether a middleware default set or an
explicitly authored allowlist — B-6 Phase-2 must verify the COMPLETE surface by enumerating every
distinct outbound path (library defaults, runtime-provided origins, feature-path-only calls), not
only the paths exercised by the implementing author.

**Source artifacts:**
- `process/waves/wave-84/stages/B-6-review.md` (findings F1 CRITICAL / F2 CRITICAL / F3 CRITICAL
  / F4 HIGH; fix commit 8d3366f3; `completeness_verified` grep note)
- `process/waves/wave-84/blocks/B/gate-verdict.md` (APPROVE after fix; CSP-origin coverage verified)
- `process/waves/wave-84/stages/T-8-security.md` (live-proof: 0 CSP violations; every origin
  reachable on deployed binary)
- `process/waves/wave-83/blocks/L/observations.md` (obs-2-fence-gap — the first instance)

**Severity:** strong — 3 CRITICAL gaps (not HIGH) were present; any one would have shipped a
visible feature break (voice, attachments, avatars) masked by local and CI green. Caught only by
the mandatory B-6 Phase-2 adversarial pass.

**Candidate principles file:** command-center/principles/BUILD-PRINCIPLES.md

**Recurrence count:** 2 (wave-83 obs-2-fence-gap + wave-84 this instance)

**Pre-shaped rule for promotion (karen must verify char counts and wording before appending):**

```
19. At B-6 Phase-2, enumerate every outbound path a security policy governs — library defaults,
    runtime-provided origins, and feature-only flows — and assert each is intentionally included or excluded.
    Why: An enumeration limited to author-visible paths leaves server-provided or feature-path entries unchecked.
```

NOTE: rule line is 151 chars — over the 120-char limit. Karen must tighten at promotion time.
Candidate tighter form:

```
19. At B-6 Phase-2, verify a security policy's complete outbound surface — including library defaults,
    runtime-provided origins, and feature-only flows — not just what the implementer named.
    Why: Enumerating only the author-visible entries leaves server-provided and feature-path surfaces unchecked.
```

Rule line = 110 chars. Why line = 92 chars. PASS both. No forbidden tokens. Karen must re-verify
char counts before appending.

**Promotion status:** PROMOTE-ELIGIBLE — 2-wave recurrence bar met. Both instances caught at the
mandatory B-6 Phase-2 adversarial review; both were CRITICAL/HIGH severity; both would have shipped
silent feature breakage. The generalizable form covers the mechanism class, not just the two specific
libraries. Karen + head-builder must approve before appending to BUILD-PRINCIPLES.md.

---

## obs-2 — Build-time env vars must be threaded through ALL build invocation paths at authoring time

**Summary:** Wave-84 produced three distinct build-invocation paths that each failed independently
because VITE_ build-time env vars were not threaded through them:

1. **C-1 (ci.yml):** `.github/workflows/ci.yml` build and boot-probe jobs executed `pnpm build`
   with zero VITE_ env vars. The B-6 fail-on-empty-api-origin guard (added by commit 8d3366f3)
   hard-failed with: "CSP build error: VITE_API_ORIGIN is empty at production build time. A
   self-only Content-Security-Policy would block the api, realtime, and storage." Fix: commit
   `a0eb37de` added VITE_ env blocks to both ci.yml jobs.
2. **C-2 (apps/web/Dockerfile):** `apps/web/Dockerfile` declared only `ARG VITE_API_ORIGIN`; the
   two newer vars (`VITE_STORAGE_ORIGIN`, `VITE_LIVEKIT_URL`) introduced in 8d3366f3 were never
   declared as ARG/ENV before the `pnpm build` step, so they were never threaded into the Vite
   build and were absent from the served CSP.
3. **C-2 (apps/api/Dockerfile):** `apps/api/Dockerfile` ran `pnpm build` without `--filter`, which
   triggered the full turbo build including `@studyhall/web`. That web build tripped the
   fail-on-empty-api-origin guard (VITE_API_ORIGIN absent in the api Dockerfile context), causing
   the api image build to fail entirely.

All three were caused by the same root pattern: when a new build-time env var is introduced (or a
new fail-loud guard added for an existing one), only some of the build invocation paths were
updated — the others were left unthreaded.

**Relationship to BUILD rule 1:** BUILD rule 1 reads: "Boot the production-built artifact in a
prod-like container and exercise its runtime config before merge. Why: Config and build-arg defects
pass local and CI green but surface only on first prod boot." Rule 1 is a DETECTION rule — it
prescribes catching defects at a prod-container boot check. The wave-84 defects were caught at
C-1 (CI hard-fail via the loud guard) and C-2 (deploy-time), not at a prod-boot behavioral
exercise. More importantly, rule 1 does not cover the AUTHORING discipline: when a new build-time
var is introduced, enumerate EVERY path that invokes the build (ci.yml jobs, each service Dockerfile)
and thread the var through all of them.

**Recurrence check:** Wave-3 obs-1 ("A Vite build-time env var VITE_API_ORIGIN was not declared
as a Docker ARG/ENV before pnpm build") was the first instance and was promoted to BUILD rule 1.
Wave-84's defect is mechanically similar (Dockerfile ARG missing for new VITE_ vars) but
additionally: (a) the gap appeared in THREE distinct build paths simultaneously, (b) the api
Dockerfile's full-turbo contamination cross-service failure is a distinct sub-class (a Dockerfile
for service X running the build of service Y and tripping that service's build guard), and (c) the
ci.yml path was also not covered by wave-3 obs-1 or BUILD rule 1.

Wave-3 obs-1's promotion into BUILD rule 1 already addresses the spirit of this problem. The
question is whether this wave's multi-path, all-at-once threading failure warrants a distinct
authoring-discipline rule rather than an extension of rule 1. The ci.yml path failure is not
covered by rule 1 at all (rule 1 speaks to prod-container boot, not CI workflow env blocks). The
api-Dockerfile contamination failure is also not covered by rule 1 (it is a build-scope coupling
defect, not a config-surface defect found at boot). These are genuine gaps in the existing rule set.

However, this is the FIRST time the multi-path / cross-service-contamination form of the defect
appears in a wave's L-block. The wave-3 to wave-84 gap is large (81 waves); the mechanism has
not recurred in the intervening archive. This reduces confidence that a 2-wave bar has been met
in the meaningful sense. The wave-3 -> BUILD rule 1 promotion already covered the primary form;
the wave-84 residue (ci.yml and api-Dockerfile contamination) are genuinely new sub-classes but
each is a first instance of its own sub-form.

**Source artifacts:**
- `process/waves/wave-84/stages/C-1-pr-ci-merge.md` (Failure analysis; ci.yml missing VITE_*; fix
  commit a0eb37de; "grep -rn 'VITE_' .github/workflows/ returns zero matches")
- `process/waves/wave-84/stages/C-2-deploy-and-verify.md` (hotfix PR #104; web Dockerfile ARG
  gap; api Dockerfile full-turbo contamination; changes description)
- `process/waves/wave-84/stages/V-1-karen.md` (Claim 3 — web Dockerfile lines 22-36 ARG/ENV
  verified; api Dockerfile line 23 scoped `--filter=@studyhall/api...` verified)
- `process/waves/_archive/wave-3/blocks/L/observations.md` (obs-1 — prior instance; promoted to
  BUILD rule 1)

**Severity:** warning — the defects were caught in-wave (C-1 by loud guard, C-2 by deploy verify)
and fixed by hotfix PR. No stale CSP reached real users. The api image-build failure was a full
hard-stop (not a runtime surface defect), which triggered correct classification and routing.

**Candidate principles file:** command-center/principles/BUILD-PRINCIPLES.md

**Recurrence count:** This is a PARTIAL second instance. The wave-3 obs-1 Dockerfile-ARG class
is confirmed, but BUILD rule 1 already covers it in spirit. The ci.yml path and api-Dockerfile
cross-service contamination forms are each first instances of their specific sub-class.

**Pre-shaped rule for future confirmation (if a third wave re-opens the multi-path threading gap):**

```
19. When introducing a build-time env var, thread it through every build invocation path in the same commit: ci.yml jobs, every service Dockerfile.
    Why: A new var added to one path but not others causes independent failures at each unthreaded path.
```

Rule line = 143 chars — over. Tighter:

```
19. Introduce a build-time env var into every build path in the same commit: each ci.yml build job and each service Dockerfile.
    Why: A var threaded to one path but not others fails independently at each unthreaded path.
```

Rule line = 127 chars — still over. Continue:

```
19. Thread a new build-time env var through every build invocation in one commit: ci.yml build jobs and each service Dockerfile.
    Why: Partial threading causes independent failures at each unthreaded path.
```

Rule line = 127 chars — over. Karen must author a conforming sub-120-char form at promotion time.

**Promotion status:** HOLD — partial second instance; the ci.yml and api-Dockerfile contamination
sub-forms are first instances of their specific shape. BUILD rule 1 already covers the detection
side (prod-boot container check). The missing authoring-discipline rule is valid and falsifiable but
needs a cleaner recurrence in a future wave to clear the 2-wave bar for the multi-path form.

---

## obs-3 — BOARD reframe prevented an architecturally harmful security change

**Summary:** The wave-84 seed framed the primary deliverable as choosing between option A (switch
to httpOnly cookies) or option B (document header mode). The problem-framer escalated: "Option A
is a symptom-layer fix trading MEDIUM XSS for HIGH auth-reliability risk." The ceo-reviewer
classified option A as the "3/10 that looks like 9/10": on StudyHall's topology (web and api on
different Railway origins), cookie mode requires `SameSite=None` cross-SITE cookies, which Safari
ITP already blocks and Chrome's third-party-cookie deprecation is removing. BOARD 7/7 unanimous
ratified option B. The P-0 reframe prevented shipping a naive security fix that would have
introduced a higher-severity auth-reliability regression (broken login for real users on Safari and
Chrome post-3p-cookie) to close a MEDIUM XSS surface on a product with zero real users.

The BOARD vote cited strong recorded precedent (product-decisions line-73 items 6+10: JWT cross-
origin fallback and SameSite=Lax — exactly option B). The compensating-controls bundle (CSP +
short TTL + rotation) was declared BINDING ship-blocking, not follow-up. The governance chain
(problem-framer ESCALATE → ceo-reviewer SCOPE-REDUCTION + BOARD → BOARD 7/7 APPROVE Option B)
worked correctly and prevented the harmful change from entering the build phase.

**Source artifacts:**
- `process/waves/wave-84/stages/P-0-frame.md` (§Reframe — problem-framer ESCALATE; ceo-reviewer
  SCOPE-REDUCTION + BOARD; BOARD 7/7 unanimous APPROVE Option B; ship-blocking binding conditions)
- `process/waves/wave-84/stages/P-0-ceo-reviewer.md` (SCOPE-REDUCTION rationale; "3/10 that looks
  like 9/10"; Safari ITP / Chrome 3p-cookie deprecation analysis; Tier-3 BOARD routing)
- `process/waves/wave-84/stages/P-0-problem-framer.md` (ESCALATE verdict; cross-SITE SameSite=None
  risk; header mode architecturally correct for cross-origin SPA)
- `process/waves/wave-84/blocks/V/gate-verdict.md` (§1 — "both reframe reviewers correctly
  ESCALATEd; BOARD 7/7 Option B, Tier-3 6+/7 strict threshold cleared")

**Severity:** informational — the process worked correctly. No harmful change shipped. The value of
recording this is to document a concrete instance where the two-stage P-0 reframe trio (problem-
framer → ceo-reviewer → BOARD) caught a well-intentioned but arch-regressive option before the
build phase, and to confirm the decision-log entry (product-decisions L907-911) and migration-
trigger record (product-decisions L910) are in place for the accepted posture.

**Candidate principles file:** command-center/principles/PRODUCT-PRINCIPLES.md

**Recurrence check:** Wave-65 recorded a reframe observation where problem-framer caught a false-
absent premise (the message-list Dexie fallback already shipped). That is the "reframe corrected
a false factual premise" class. Wave-84 is the "reframe prevented an architecturally harmful option
before the build phase" class — the harm was in the framing's implicit default, not in a false
claim. No prior wave L-observation names this specific class ("naive security fix trades one risk
class for a higher one; BOARD ratifies the disciplined alternative"). FIRST INSTANCE.

**Promotion status:** HOLD — first instance, informational. The mechanism (P-0 reframe + BOARD
preventing a severity-upward trade) is valuable to document but requires a second wave where the
reframe similarly prevents a harmful option before build to justify a PRODUCT-PRINCIPLES rule.

---

## Standing-HOLD status check

| origin | class | wave-84 status |
|---|---|---|
| wave-83 obs-C1-direct-push (HOLD, strong 1st) | `HEAD:main` from feature branch lands all commits + bypasses CI gate | NOT RECURRED. C-1 explicitly records "NO `git push HEAD:main` (wave-83 lesson honored)" — the lesson held. HOLD maintained. |
| wave-83 obs-2-fence-gap (HOLD, warning 1st) | Security middleware adoption: enumerate + disable ALL cross-origin defaults, not just the named set | **CONFIRMED — 2nd instance.** See obs-1 above. Promotion-eligible. |
| wave-83 obs-3-live-verify-config-wave (HOLD, informational 1st) | For config-only DB-free waves, live behavioral probe is acceptable primary gate when CI is pending, within bounded scope | NOT CONFIRMED as CI-absent. Wave-84 CI ran successfully (all 6 required checks green on re-run 29027378262). The CI-outage trigger did not fire. HOLD maintained. |
| wave-82 obs-1 (HOLD, strong 1st) | Trace SDK source to confirm fix is decisive in real failure path, not just net-additive-safe | NOT CONFIRMED. Wave-84 has no SDK-internal retry/refresh seam. HOLD maintained. |
| wave-82 obs-2 (HOLD, warning 1st) | Assert resolution on dominant failure path; configure mocks to that path | NOT CONFIRMED. No unit test suite exercising a wrong-branch mock this wave. HOLD maintained. |
| wave-82 obs-3 (HOLD, informational 1st) | All-jobs-uniform-cancel at wall-time with no steps = runner infra timeout | NOT CONFIRMED. C-1 run 29026976694 was a deterministic env failure (build + boot-probe failed with step data and logs; not a uniform-kill), not a runner-infra cancellation. HOLD maintained. |
| wave-81 obs-2 (HOLD, 1st) | SW-cached SPA serves stale bundle for post-deploy navigation | NOT CONFIRMED. Wave-84 is a config/CSP/auth wave; no Workbox/SW precache change. HOLD maintained. |
| wave-80 obs-2 (HOLD, 1st) | Full-replace PUT clobbers concurrent field change | NOT CONFIRMED. No settings PUT surface this wave. HOLD maintained. |
| wave-79 obs-5 (HOLD, 1st) | Prove server-blind invariant via separate-connection read-back | NOT CONFIRMED. No persistence-blindness invariant surface this wave. HOLD maintained. |

---

## Summary table

| id | title | severity | recurrence_count | candidate_file | promotion_status |
|---|---|---|---|---|---|
| obs-1 | Security policy outbound-surface enumeration: verify ALL paths at B-6 Phase-2, not only author-visible entries | strong | 2 (wave-83 obs-2-fence-gap + wave-84) | BUILD-PRINCIPLES.md | **PROMOTE-ELIGIBLE** — 2-wave recurrence bar met; karen + head-builder approval required |
| obs-2 | Build-time env vars must be threaded through all build invocation paths at authoring time | warning | partial 2nd (wave-3 class; ci.yml and api-Dockerfile sub-forms are 1st instances) | BUILD-PRINCIPLES.md | HOLD — partial second instance; distinct authoring-discipline rule valid but sub-forms each first instance |
| obs-3 | BOARD reframe prevented naive security option that would trade MEDIUM XSS for HIGH auth-reliability regression | informational | 1 (FIRST INSTANCE) | PRODUCT-PRINCIPLES.md | HOLD — first instance |

**Total observations: 3** (1 PROMOTE-ELIGIBLE, 2 HOLD).

obs-1 is the wave's substantive finding: the wave-83 fence-gap observation has now recurred in a
second wave at 3x higher severity (CRITICAL gaps vs HIGH in wave-83). The unified class is broad
enough to cover both helmet-default enumeration and CSP-origin enumeration under one B-6 Phase-2
discipline rule. The pre-shaped rule in obs-1 (Karen must tighten to sub-120-char rule line)
is ready for L-2 promotion subject to head-builder approval.

obs-2 documents a real multi-path threading failure with genuine new sub-forms (ci.yml and
cross-service Dockerfile contamination), but BUILD rule 1 already covers the primary Dockerfile-
ARG detection class. The wave-84 residue is first-instance for its specific forms.

obs-3 is informational governance documentation confirming the P-0 reframe chain worked correctly.
