# Wave 81 — V-block Gate Verdict (Phase 1, Attempt 1)

**Verdict: APPROVED**
**Head-verifier agentId:** head-verifier (V-block gate, wave-81)
**Block:** V (Verify) · **Gate:** V-3 · **Mode:** automatic (founder bug-fix phase)
**Merge commit:** e659b0acbad56e4e1cffaa29a9b200c2209bb267 (PR #100, MERGED 2026-07-09) · LIVE
**Live web:** https://web-production-bce1a8.up.railway.app

---

## Verdict summary

The founder's /settings/profile scroll bug is **genuinely fixed, deployed, and LIVE-proven** — not asserted. Both V-1 reviewers (Karen source-claim, jenny spec-conformance) are sound and evidence-backed; I independently re-verified their load-bearing claims against live prod and the merge tree rather than rubber-stamping. The V-2 ACCEPT-WITH-NOTE disposition of the service-worker (SW) stale-cache gap (F-T5-1) is **correct, not green-by-suppression**. The study-timer CI stabilization is a **real fix, not a skip/suppression**. No REWORK-worthy gap; no reviewer false-negative; no suppressed blocking finding.

---

## Judgment 1 — Karen + jenny sound + founder bug ACTUALLY fixed & PROVEN LIVE

**SOUND. Bug fixed and proven live.** Independent re-verification this session:

- **Live index.html → new bundle** `assets/index-R5obJ0iu.js` (curl prod) — deploy is genuinely correct, C-2 SUCCESS @ e659b0a is not false-green.
- **Deployed bundle carries the fix** — the `h-dvh overflow-y-auto` FullPageScroll class token IS present in the live `index-R5obJ0iu.js`.
- **FullPageScroll body verified on merge tree** (`git show e659b0a`): exactly `h-dvh overflow-y-auto` + optional className; NO transform/filter/contain/will-change — so LandingPage's `position:fixed` nav still resolves to the viewport (no containing block reparenting). Correctly-layered.
- **The make-or-break (scroll to the bottom-most field):** jenny's AC1 evidence is LIVE T-5 (1280×720, authed fixture A) — /settings/profile content over-fills by 1017px; wrapper scrollTop 0→1017 (exact max, reachedBottom); "Save academic identity" button moved from top=1439 (719px below fold) → in-viewport (top=422/bottom=458). The bottom-most save is reachable and usable. T-9 aggregate independently confirms the founder bug FIXED LIVE (scrolled top→bottom to the save button). This is behavioral proof, not assertion.
- Karen's 6/6 APPROVE (globals.css app-shell lock UNCHANGED, /app + /discover correctly NOT wrapped, additive change, CI 7/7 green on merge) all reconcile with the live/tree evidence.

Both reviewers reached APPROVE by independent methods (Karen: source truth + antipattern catalog; jenny: spec-intent conformance) and converge. No false-negative either way.

## Judgment 2 — THE CRUX: SW stale-cache disposition (ACCEPT-WITH-NOTE vs REWORK)

**ACCEPT-WITH-NOTE is CORRECT. Not green-by-suppression.**

I fetched live `sw.js` directly. Decisive evidence, all confirmed in one payload:
- `self.skipWaiting()` — present
- `e.clientsClaim()` — present
- `e.cleanupOutdatedCaches()` — present
- precache manifest lists ONLY the NEW bundle `assets/index-R5obJ0iu.js` (revision:null, hashed-immutable) + the new `index.html` (revision c7d0362…). The old bundle is NOT in the live precache manifest.
- Old bundle `index-AVNFN-ve.js` still returns HTTP 200 (immutable CDN asset — this is precisely what lets a *stale already-registered* SW serve it on the first post-deploy hit, and equally why it's a one-cycle transient, not a durable lock).

**Why this is a legitimate close and not a suppressed founder-facing miss:**
- The fix IS deployed, referenced by live index.html, and precached. Delivery is not broken.
- The stale window is **exactly one navigation** and **self-heals**: a returning client's old SW may serve stale on its first hit, then background-fetches the new SW → `skipWaiting` skips the wait → `clientsClaim` takes control → `cleanupOutdatedCaches` purges → the next navigation/reload serves the fix. Worst case for the founder: open once → reload once → scrolls. This is the deployed reality, not a hopeful claim — I verified the mechanism in the live artifact.
- F-T5-1 is a **spec GAP** (the spec scoped the fix at the React-component layer and never mentioned the PWA SW-delivery layer), **not a code DRIFT** (the implementation does exactly what the spec asked). jenny's GAP-vs-DRIFT classification is correct.
- The founder-directed bar ("the founder actually experiences the fix") IS met: the fix is genuinely delivered; the residual is a single first-hit staleness that auto-resolves. A forced hard-reload-on-update would be gold-plating on a mechanism that already auto-heals.
- V-2 pairs the accept with the right safety net: a **founder note** (hard-refresh once if it doesn't scroll on first open) + a **fast-follow SW-update toast task** (ef37743b, wave_id NULL / seedable) that reconciles the pre-existing "Service-worker cache-bust on deploy" backlog item. That is disciplined dispositioning, not suppression.

An in-wave SW fix is NOT required for the founder to receive the fix. REWORK on this crux would be over-engineering.

## Judgment 3 — study-timer CI stabilization (real fix vs skip/suppression)

**LEGITIMATE. Real stabilization, bundled soundly.**

Independent audit of `study-timer.test.tsx` on the merge tree:
- **37 active `it`/`test` blocks; 0 `.skip`, 0 `.only`, 0 `xit`/`xdescribe`, 0 `.todo`.** Nothing disabled or excluded.
- Real techniques with documented rationale: `configure({ asyncUtilTimeout: 5000 })` (CI-robust global waitFor timeout), `vi.useFakeTimers({ shouldAdvanceTime: true })` in beforeEach with `vi.useRealTimers()` teardown, derived-state reads wrapped in `waitFor`. The inline comments explain the fake-clock-vs-waitFor-polling deadlock being solved — correct root-cause stabilization, not retry-masking or green-by-suppression.
- The `test` check that was RED at C-1 (flake) is GREEN on the merged commit; CI run 29008456214 = 7/7 SUCCESS. The C-1 REJECT → fix-up → re-green sequence is real.
- Bundling it into the wave is sound: it unblocks all future PRs (the flaky check gated every merge) and is a genuine fix, not a scope dodge.

## Judgment 4 — REWORK-worthy gap / suppressed blocking finding / would founder NOT see the fix?

**None.**
- No reviewer false-negative: Karen and jenny converge from independent axes; I re-derived their key claims live.
- The only suppressed item (F-T2-1, no standalone ProfilePage-root unit) is genuine noise — the FullPageScroll root is unit-tested, ProfilePage/SettingsPrivacy wrap-coverage was added at B-6, and the behavior is LIVE-proven at T-5. Suppress is correct.
- Would the founder NOT see the fix? No. The fix is live, in the deployed bundle, and the SW auto-heals within one navigation. Worst case is a single reload, covered by the founder note.

---

## Disposition

- **Blocking findings:** 0
- **F-T5-1 (SW stale-cache):** ACCEPT-WITH-NOTE — self-healing one-navigation transient (skipWaiting + clientsClaim + cleanupOutdatedCaches verified LIVE); fast-follow toast task ef37743b (seedable, wave_id NULL) + founder hard-refresh note. NOT a blocker.
- **F-T2-1 (no ProfilePage-root unit):** noise, suppress.
- **Study-timer stabilization:** legitimate, keep.
- **Founder note (carry to N / founder-facing):** "The /settings/profile scroll fix is live. If it doesn't scroll on your first open, reload once — the app auto-updates after."

**VERDICT: APPROVED.** Founder bug genuinely fixed + proven live; triage sound; no green-by-suppression. Wave 81 may proceed to L-block.
