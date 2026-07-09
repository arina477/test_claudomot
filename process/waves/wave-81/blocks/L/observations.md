# Wave-81 L-block observations — knowledge-synthesizer

Append-only. L-2 Distill (karen) reads these; promotes to `*-PRINCIPLES.md` ONLY when an
observation recurs across 2+ waves AND the head-X gate approves (max 1 rule/file/wave). Single-wave
observations stay here until a second wave confirms, UNLESS a strong 1st instance clears the bar on
its own merit (head-X discretion, per the wave-78 BUILD-17 precedent).

---

## Inputs read

- Wave deliverables: `process/waves/wave-81/stages/` — P-0-frame / P-0-ceo-reviewer /
  P-0-problem-framer, P-1-decompose, P-2-spec, P-3-plan, P-4-gemini-review, B-0/B-1/B-2/B-4/B-5/B-6,
  B-6-review, C-1-pr-ci-merge, C-2-deploy-and-verify, T-1..T-9, V-1-karen, V-1-jenny, V-1-summary,
  V-2-triage, V-3-fast-fix. Blocks: B/C/D/L/N/P/T/V.
- Wave outcome: FullPageScroll wrapper for standalone routes (fixes global body `overflow:hidden`
  clipping `min-h-screen` standalone pages) + study-timer CI-flake stabilization. LIVE @ e659b0a,
  V-block APPROVED, 0 blocking. C-1 journey: 3 study-timer fix-up commits; first head-ci-cd
  over-escalated a fixable required-check failure to a founder pause (corrected to RUNNING); the
  flake was named in the wave briefing but NOT recorded in B-5 `flakes_documented` (empty) →
  ambiguous C-1 single-re-run entitlement.
- Contract cross-check: `claudomat-brain/blocks/ci-cd/stages/C-1-pr-ci-merge.md` Action 8 Step A —
  the single-job re-run allowance is gated ONLY on a match in B-5-verify.md `flakes_documented`;
  "If failing check is NOT in `flakes_documented`, skip Step A" (silent re-run of unknown failures
  masks regressions).
- Prior archives consulted (most recent 5): wave-80 (full-replace-clobber obs-2 HOLD,
  proactive-emit obs-3 HOLD, T-5 co-member obs-4 reinforcement), wave-79, wave-78 (BUILD-17
  fail-closed strong-1st precedent; VERIFY content-in-tree HOLD), wave-77, wave-76.
- Principles files read: CI-PRINCIPLES.md (11 rules), VERIFY-PRINCIPLES.md (4 rules),
  PRODUCT-PRINCIPLES.md (6 rules), BUILD-PRINCIPLES.md (18 rules), T-5.md (3 rules).

**De-dup up front (existing rules this wave touched — assessed, not re-proposed):**
- **CI rule 8** (file a stabilization task for a test that passes alone but fails full-suite parallel
  across 3+ runs) — the study-timer flake IS this family, but rule 8 governs *filing a stabilization
  task*, not *the gate entitlement to a single C-1 re-run*. obs-1 below is about the ledger→re-run
  contract, a different mechanism. Adjacent, not the same rule.
- **PRODUCT antipatterns** (demo-path tunnel-vision / fix-the-reported-instance) — the class-fix
  scope-widening (obs candidate #3) is EXACTLY this antipattern applied correctly by problem-framer;
  the existing antipattern catalogue already covers it. No new rule; the mechanism worked. Not
  promoted (see § Not-promoted).
- **C-block Iron Law + C-1 Action 8 + always-on rule 13** (fixable red check routes to a fix-loop, is
  not a founder pause) — the head-ci-cd over-escalation (candidate #2) was a violation of an EXISTING
  rule, self-corrected to RUNNING, not a missing rule. Not promoted (see § Not-promoted).

---

## obs-1 — A test may claim the C-1 single-re-run flake allowance ONLY if recorded in the B-5 flakes ledger, not merely asserted in a briefing

- **Source:** `C-1-pr-ci-merge.md` §"CI journey" (first head-ci-cd over-escalated; then 3 fix-up
  commits) + `B-5-verify.md` `flakes_documented: []` (empty) + contract
  `claudomat-brain/blocks/ci-cd/stages/C-1-pr-ci-merge.md` Action 8 Step A ("Read ... B-5-verify.md
  § flakes_documented. If failing check matches a documented flake, re-run that single CI job once
  ... If failing check is NOT in flakes_documented, skip Step A"). head-ci-cd flagged the gap.
- **What happened:** The study-timer flake was named in the wave-81 briefing but the wave diff
  touches zero timer code, and B-5's `flakes_documented` was empty. When the required `test` check
  went red, the C-1 gate had no ledger entry to authorize the sanctioned single re-run — the
  briefing mention is not a valid substitute for the ledger row that the stage-file gates on. This
  made the re-run entitlement ambiguous and cost cycles before the correct route-and-fix path.
- **Generalizable?** Yes. Any wave where a flake is known but only mentioned in prose (briefing,
  chat, spec body) and not written into `B-5 flakes_documented` re-creates the same ambiguity at
  C-1. The fix is a discipline: the ledger is the single authoritative source the gate reads.
- **Falsifiable?** Yes. Check: is the failing check present in B-5-verify.md `flakes_documented`? If
  not, the single-re-run allowance does not apply regardless of any briefing text.
- **Severity:** WARNING (cost cycles + ambiguous gate; masked no regression this wave).
- **Candidate file:** CI-PRINCIPLES.md.
- **Disposition:** **STRONG 1st INSTANCE → head-learn CONSIDER for the single CI slot; else HOLD.**
  Distinct from CI rule 8 (task-filing vs re-run-entitlement). head-ci-cd already raised it, which
  strengthens the merit case. First observed instance — no 2nd wave yet — so absent a strong-1st call
  it HOLDs for confirmation. Note the deeper cause: a *pre-existing, wave-unrelated* flake will not
  naturally land in the wave's own B-5 ledger (B-5 records flakes seen during THIS wave's verify), so
  the rule's real teeth are "record any flake you intend to invoke the C-1 allowance for, including
  pre-existing ones, into B-5 before C-1 — not just the briefing."
  Suggested wording (contract-formatted; karen MUST re-verify char limits):

  > ```
  > 12. Claim the C-1 single-re-run flake allowance only for a check recorded in B-5 flakes_documented, never one only named in a briefing.
  >     Why: The C-1 gate reads the ledger, not prose, so an unrecorded flake gets no sanctioned re-run and stalls at the gate.
  > ```

---

## obs-2 — Deployed is not delivered: a service-worker-cached SPA can serve the stale bundle for one navigation after a correct deploy

- **Source:** `V-1-summary.md` (F-T5-1 HIGH→self-healing) + `V-1-karen.md` (deployed bundle
  index-R5obJ0iu.js verified to contain the fix; "SW gap CONFIRMED but bounded ... self-heals in one
  navigation") + `V-1-jenny.md` (SW-cache = spec GAP not DRIFT) + `C-2-deploy-and-verify.md` (Railway
  web SUCCESS @ e659b0a, /settings/profile 200).
- **What happened:** The Railway deploy was correct (deploy-state SUCCESS, merge SHA served, new
  bundle present and referenced). But a Workbox service worker with a precache manifest can hand a
  returning client the PREVIOUSLY cached bundle for the first navigation after deploy, until the new
  SW (skipWaiting + clientsClaim + cleanupOutdatedCaches) activates. Deploy-correctness verification
  (deploy-state SUCCESS + new-route probe, CI rules 1/2/7) does NOT catch this — those prove the
  server is correct, not that a SW-caching client receives the new asset on the next load.
- **Generalizable?** Yes, for any PWA/SW-precached SPA on this stack (Workbox + Railway). A correct
  deploy plus a cache layer between server and client means "deployed" and "delivered to the client"
  are different assertions. Bounded here because the SW self-heals in one navigation and the fix was
  cosmetic-scroll (worst case one reload) — but the general class (SW serving stale JS after deploy)
  can strand a real functional fix for the first post-deploy navigation.
- **Falsifiable?** Yes. Check after deploy: does the SW's precache manifest reference the new bundle
  hash, and does skipWaiting/clientsClaim guarantee activation within one navigation? If the SW lacks
  skipWaiting or the manifest is stale, delivery lags deploy.
- **Severity:** WARNING (self-healing this wave; class can strand a functional fix).
- **Candidate file:** CI-PRINCIPLES.md (deploy-verification family, adjacent to rules 1/2/7) or
  VERIFY-PRINCIPLES.md (deployed-behavior-vs-spec family, adjacent to rule 3).
- **Disposition:** **HOLD — 1st INSTANCE.** Real, novel, generalizable, cited. But (a) it self-healed
  and shipped APPROVE, so it was not costly this wave, and (b) it competes with obs-1 for the single
  CI slot, and obs-1 both cost cycles and was head-flagged. Promote on a 2nd instance where a
  SW/CDN/edge cache actually strands a functional fix past one navigation. If head-learn takes a CI
  slot this wave, obs-1 has priority. Pre-shaped wording for a future promotion (karen re-verify):

  > ```
  > N. After a SUCCESS deploy of a service-worker-cached SPA, verify the SW precache references the new bundle hash and activates within one navigation.
  >    Why: A stale SW serves the old bundle to returning clients after a correct deploy, so deployed does not equal delivered.
  > ```

---

## obs-3 — Real-timer component tests (live setInterval + synchronous derived reads) flake under CPU saturation; stabilize with fake timers plus polled derived reads

- **Source:** `C-1-pr-ci-merge.md` fix-up commits 740d27f (fake timers — the 1s setInterval ran
  unowned → 15-min hang + waitFor flake, root cause: real-timer open handle), 69a9c43 (clock race in
  configure-error assertions), b0f4c57 (the decisive fix: derived-state assertions read synchronously
  after `act(fireEvent.change)` but under CPU saturation the commit lags → wrap reads in `waitFor` +
  `configure({asyncUtilTimeout:5000})`) + `V-1-karen.md` ("study-timer is a REAL stabilization,
  0 skipped/.only/retry-masking").
- **What happened:** A component test driving a real `setInterval` and reading derived state
  synchronously after an act() had two failure modes: (1) an unowned real timer leaving an open
  handle → suite hang, and (2) a read racing the React commit under CPU saturation → intermittent
  assertion failure. Both are the same root class: real time + synchronous derived-state reads in a
  test that assumes commits are instantaneous. The stable form is fake timers to own the clock, plus
  `waitFor`-polled reads so the assertion waits for the commit rather than racing it.
- **Generalizable?** Plausibly, for any component with a live interval/timeout + derived-state reads.
  But it is narrow (unit/T-2 test-authoring technique, single component type) and this is the only
  sighting. It is also arguably already covered by general RTL discipline (own the clock; poll async
  derived state) rather than being a StudyHall-specific rule.
- **Falsifiable?** Yes. Check: does a timer-driven component test use fake timers, and are
  derived-state assertions wrapped in `waitFor` rather than read synchronously after act()?
- **Severity:** INFORMATIONAL→WARNING (caused a 15-min CI hang; but a general RTL technique).
- **Candidate file:** a future T-2 (unit) test-layer principle (no T-2.md exists yet) — NOT T-5
  (this is a jsdom unit test, not a Playwright E2E).
- **Disposition:** **HOLD — 1st INSTANCE + no target file.** Too narrow and too close to standard RTL
  practice to promote as a StudyHall-specific rule on merit; and there is no T-2.md to receive it.
  Carry; promote only if a 2nd timer-component flake recurs and a T-2 layer file exists.

---

## Not-promoted (assessed and explicitly declined — no new rule)

- **head-ci-cd over-escalation of a fixable required-check failure to a founder pause.** Real event
  (`C-1-pr-ci-merge.md` §"CI journey"), corrected to RUNNING. But this is a VIOLATION of an existing
  rule (C-block Iron Law + C-1 Action 8 route-and-fix + always-on rule 13's measured-pause
  discipline: a fixable, wave-unrelated red check routes to a specialist fix-loop, not a pause), not
  a missing one. No new principle would prevent it; the existing contract already prohibits it. The
  correct L-2 disposition is a discipline note, not a rule. (Note: obs-1 is the promotable half of
  this same journey — the ledger gap is what MADE the entitlement ambiguous.)
- **Class-fix over instance-fix (widen a bug fix to the whole class when the fix is a no-op on
  unaffected members).** The founder reported one page; problem-framer widened to the shared
  FullPageScroll wrapper across all standalone routes (`P-0-problem-framer.md` §Scope). This is
  correct and valuable — but it is the EXISTING PRODUCT antipattern "demo-path tunnel-vision /
  fix-the-reported-instance" applied correctly, which problem-framer explicitly cited and rejected.
  The catalogue already covers it; the mechanism worked as designed. No new rule.

---

## Standing-HOLD status check (priors that could have gained a 2nd data point)

- **wave-80 obs-2 (full-replace-clobber, HOLD 1st):** NOT CONFIRMED. Wave-81 has no backend write /
  PUT / concurrent-edit surface (frontend-only scroll fix + test stabilization). HOLD maintained.
- **wave-80 obs-3 (proactive-emit realtime privacy toggle, HOLD 1st):** NOT CONFIRMED. No realtime
  or cross-module emit surface this wave. HOLD maintained.
- **wave-80 obs-4 / T-5 rule 3 family (co-member two-client realtime):** NOT CONFIRMED. No realtime
  E2E this wave. Reinforcement-only status unchanged.
- **CI flake-ledger prior:** NONE existed before this wave — obs-1 is the FIRST instance of the
  flake-ledger→re-run-entitlement class, not a 2nd data point on a standing HOLD.

---

## Summary table

| # | Candidate | Severity | Recurrence | Target file | Disposition |
|---|---|---|---|---|---|
| obs-1 | C-1 single-re-run allowance requires a B-5 flakes_documented entry, not a briefing mention | warning | 1st INSTANCE | CI-PRINCIPLES.md | STRONG 1st — head-learn CONSIDER (takes the CI slot); else HOLD |
| obs-2 | Deployed ≠ delivered: SW-cached SPA serves stale bundle for one navigation post-deploy | warning | 1st INSTANCE | CI-PRINCIPLES.md or VERIFY-PRINCIPLES.md | HOLD — 1st instance (CI slot priority to obs-1) |
| obs-3 | Real-timer component tests need fake timers + waitFor-polled derived reads | informational | 1st INSTANCE | future T-2.md (none exists) | HOLD — 1st instance + no target file |
| — | head-ci-cd fixable-check→founder-pause over-escalation | — | — | none (existing Iron Law) | NOT PROMOTED — violation of existing rule |
| — | class-fix over instance-fix | — | — | none (existing PRODUCT antipattern) | NOT PROMOTED — existing antipattern applied correctly |

**Recommendation to head-learn / L-2 karen:** At most ONE promotion this wave, and only obs-1 is a
credible strong-1st (head-ci-cd-flagged, cost real cycles, distinct from CI rule 8, contract-cited).
If head-learn declines the strong-1st bar, promote nothing and carry obs-1/obs-2/obs-3 as HOLDs. No
standing HOLD from wave-80 reached a promotable 2nd instance.
