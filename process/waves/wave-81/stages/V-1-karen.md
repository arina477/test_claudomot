# V-1 Karen — wave-81 source-claim verification (LIVE deployed state)

**Verdict: APPROVE**
**Merge commit:** e659b0acbad56e4e1cffaa29a9b200c2209bb267 (PR #100, MERGED 2026-07-09T09:33Z)
**Live web:** https://web-production-bce1a8.up.railway.app (HTTP 200)
**Axis:** source-claim verification + antipattern catalog. Spec conformance = jenny (not evaluated here).

Findings: 6 load-bearing claims verified — **6 APPROVE, 0 REJECT**. SW stale-cache delivery gap F-T5-1 **CONFIRMED real** (bounded, one-navigation window; not a code defect, correctly V-2-routed).

---

## Claim 1 — Files exist on merge tree — APPROVE

- `apps/web/src/shell/FullPageScroll.tsx` EXISTS on e659b0a. Component body (verbatim):
  `<div className={\`h-dvh overflow-y-auto${className ? \` ${className}\` : ''}\`}>{children}</div>`
  NO transform / filter / contain / will-change. Confirmed by full `git show`.
- 5 pages wrapped (real path is `apps/web/src/pages/`, not `routes/` as the prompt guessed — files verified there):
  - `pages/ProfilePage.tsx` — imports FullPageScroll (L23); **BOTH returns** wrapped: loading return L391–458, main return L468–1084. min-h-dvh inner root.
  - `pages/SettingsPrivacyPage.tsx` — L33 import, wrap L246–755, min-h-dvh L248.
  - `pages/PrivacyPage.tsx` — L8 import, wrap L12–146, min-h-dvh L14.
  - `pages/TermsPage.tsx` — L8 import, wrap L12–166, min-h-dvh L14.
  - `pages/LandingPage.tsx` — L7 import, wrap L11–271, min-h-dvh L13.
- `globals.css` at `apps/web/src/styles/globals.css`: `html{height:100%;overflow:hidden}` (L55–57) + `body{height:100%;overflow:hidden}` (L61–63) present. **UNCHANGED by this PR** — file absent from `--stat`, `git diff e659b0a~1 e659b0a -- styles/globals.css` empty.
- `apps/web/src/shell/study-timer.test.tsx` present on merge tree (verified below).

## Claim 2 — Wrong-layer fix NOT done — APPROVE

- globals.css app-shell lock intact (Claim 1): `html`/`body` `overflow:hidden` still present, unchanged.
- `git grep -l FullPageScroll` on e659b0a returns ONLY the 5 pages + their tests + the component. `shell/AppShell.tsx` and `pages/DiscoverShell.tsx` (the /app, /discover routes) are NOT wrapped.
- Why that is correct: `AppShell.tsx` L52 has its own scroll architecture — `<div className="flex h-full w-full overflow-hidden">` (columnar inner-scroll shell). It does NOT need the wrapper; wrapping it would double-lock. The fix is scoped to exactly the standalone `min-h-dvh` pages that lacked an inner scroll container.

## Claim 3 — No containing-block trigger; LandingPage fixed nav safe — APPROVE

- FullPageScroll sets only `h-dvh overflow-y-auto` + optional className. Component doc-comment explicitly forbids transform/filter/contain/will-change with the exact reparenting rationale ("would reparent LandingPage's position:fixed navbar to this element instead of the viewport, breaking the sticky nav").
- LandingPage nav is `className="fixed top-0 z-50 w-full"` (L18) rendered INSIDE `<FullPageScroll>`. Because the wrapper establishes no containing block, `position:fixed` still resolves against the viewport → sticky nav preserved. Claim holds.

## Claim 4 — Deployed WEB bundle contains the fix — APPROVE (both sub-claims confirmed)

- Live `/` → `index.html` references `/assets/index-R5obJ0iu.js`.
- Fetched that bundle live (2,062,651 bytes): **8× `h-dvh`, 32× `overflow-y-auto`**, and the co-located token `h-dvh overflow-y-auto` (the FullPageScroll class string) is present. The NEW bundle carries the fix. Deploy is genuinely correct — C-2 SUCCESS @ e659b0a is NOT false-green.
- SW stale-cache delivery gap: **CONFIRMED (see F-T5-1 below).**

## Claim 5 — CI 6/6 (actually 7/7) required green on merged commit — APPROVE

- Run **29008456214** — all checks SUCCESS: lint, typecheck, **test**, build, secret-scan, boot-probe, e2e.
- PR #100 `statusCheckRollup`: 7× conclusion=SUCCESS; state=MERGED; mergeCommit.oid = e659b0a.
- The `test` check that was RED at C-1 (study-timer flake) is now GREEN. The C-1 REJECT → B-stage fix-up → re-green sequence is real (the merge squash-commit message documents the C-1 REJECT; final run is green).

## Claim 6 — Antipattern check — APPROVE (both sub-claims clean)

**Study-timer test = real stabilization, NOT suppression:**
- 37 active `it(`/`test(` blocks; **0 `.skip`, 0 `.only`, 0 `xit`/`xdescribe`, 0 retry-masking / `it.each` retry.** Nothing disabled or skipped.
- Genuine techniques: `configure({ asyncUtilTimeout: 5000 })` (L62, CI-robust global waitFor timeout with a documented rationale comment), `vi.useFakeTimers({ shouldAdvanceTime: true })` in beforeEach (L196/L216) with `vi.useRealTimers()` teardown (L190/L227), and every derived-state read wrapped in `await waitFor(...)` (phase-pill, btn-*, timer-display, roster, error state). The comment block explains the fake-clock-vs-waitFor-polling deadlock being solved — this is a correct stabilization, not a green-by-suppression.

**FullPageScroll fix is additive:**
- No scroll behavior removed from any page that relies on the app-shell. globals.css lock untouched; AppShell/DiscoverShell untouched. Change only ADDS a scroll viewport to 5 pages that were clipping content. No regression surface introduced.

---

## F-T5-1 — Stale Workbox SW precache delivery gap — CONFIRMED (real, bounded, correctly V-2-routed)

**The gap is real.** The app is a Vite-PWA / Workbox app. Live `index.html` ships `registerSW.js`, which registers `/sw.js`. Fetched live `sw.js` (1,282 bytes): a Workbox precache that does `precacheAndRoute([...])` and, critically, `registerRoute(new NavigationRoute(createHandlerBoundToURL("index.html")))` — **all navigations are served from the precached index.html**, which pins the bundle hash. A returning client still running the PREVIOUS service worker serves the OLD precached index.html + OLD bundle (T-5 identified it as `index-AVNFN-ve.js`) and will still see the /settings/profile bug until its SW updates. So both halves of Claim 4 hold simultaneously: the deploy is correct AND returning users can transiently be served the pre-fix bundle. Founder may re-open the page, still not scroll, and wrongly conclude the fix failed.

**Nuance the live probe adds (bounds the severity):** the CURRENTLY-served `sw.js` already contains `self.skipWaiting()` + `e.clientsClaim()` + `e.cleanupOutdatedCaches()`, and its precache manifest points at the NEW `assets/index-R5obJ0iu.js` (revision:null hashed asset) + a fresh `index.html` revision. That means once the new SW is fetched (background update on next visit/navigation) it activates IMMEDIATELY and purges outdated caches — the stale window is a single navigation/reload, not a permanent lock. The T-5 write-up proposed skipWaiting/clientsClaim as remediation "to add"; live state shows it is ALREADY present. The residual gap is only the one-cycle SW-update latency (a returning user's first post-deploy navigation may still hit the old SW before the new one claims). Real, but self-healing on the next load — not a permanent stale-serve.

**Disposition:** deploy-delivery gap, not a code defect; does not block the source-claim gate. Correctly classified HIGH and carried to V-2 by T-5/T-6/T-9 (T-9: "V-2 must dispose of F-T5-1 before the wave closes as founder-bug-resolved"). Karen concurs with that routing.

---

## Summary

All 6 load-bearing claims APPROVE against the live merge tree + live prod. Fix is real, correctly-layered (app-shell lock intact, /app + /discover not wrongly wrapped), additive, and no-containing-block-safe for LandingPage's fixed nav. The deployed new bundle carries the fix (8× h-dvh / 32× overflow-y-auto live). CI 7/7 green on the merged commit; the study-timer stabilization is genuine (37 tests, 0 skipped, fake-timers + waitFor + asyncUtilTimeout — not suppression). F-T5-1 stale-SW gap is CONFIRMED real but bounded to a one-navigation self-healing window (live sw.js already has skipWaiting/clientsClaim/cleanupOutdatedCaches) and is correctly routed to V-2. **VERDICT: APPROVE.**
