# Wave 81 — T-5 E2E (LIVE Playwright, authed as Fixture A)

**Pattern B — Active-execution.** Executed live via Playwright (chrome-headless-shell) against prod `https://web-production-bce1a8.up.railway.app`, authed as Fixture A (session cookies persisted; snapshot showed "Fixture A" / @studyhallfixturea profile loaded — no re-login needed). Viewport constrained to **1280×720** so every full-page route over-fills the viewport. NEVER browser_close'd (rule 5). Browser context left open.

## Scenarios (each ⇄ an AC in task 2340d2d3)

| id | criterion_ref | route | verdict | evidence |
|---|---|---|---|---|
| S1 | /settings/profile scrolls to bottom (FOUNDER BUG) | /settings/profile | **PASS** (after SW-cache bust — see F-T5-1) | scrollTop 0→1017 (reachedBottom); "Save academic identity" btn moved from top=1439 (719px below fold) to top=422/bottom=458 → academicSaveVisible=true; "Accent colour" heading visible at top=539 |
| S2 | /settings/privacy scrolls to bottom | /settings/privacy | PASS | wrapper overflow-y-auto, transform:none; scrollHeight 25617; scrolled to bottom; last element "Delete account" (top 25500 → visible after scroll) |
| S3 | LandingPage scrolls, fixed nav stays put | / | PASS | wrapper overflow-y-auto/transform:none/contain:none; scrollTop 0→1121 (bottom); header position:fixed stayed top=0 before AND after scroll (navStayedAnchored=true) |
| S4 | shell routes /app no double-scroll (NOT wrapped) | /app | PASS | root child = `flex h-full flex-col overflow-hidden` (unchanged app-shell); 0 FullPageScroll wrappers on /app |

## LOAD-BEARING PROOF (S1 — the founder's exact bug)
On a 1280×720 viewport, ProfilePage content = 1737px (over-fills by 1017px). The FullPageScroll wrapper `<div class="h-dvh overflow-y-auto">` is the ROOT of the page: `overflow-y: auto`, height 720px, scrollHeight 1737, maxScroll 1017, and `transform/filter/contain = none` (fixed-nav invariant intact). Setting `wrapper.scrollTop = scrollHeight` moved scrollTop 0→1017 (exact max) and brought the bottom-most interactive control — the **"Save academic identity" button** — from 719px below the fold into full view (top 422, bottom 458 < 720). The founder can now reach and use every field including the last save button. **Bug fixed.**

## CRITICAL FINDING — stale service-worker cache masks the fix for returning users

On FIRST load of the deployed page (fresh Playwright context, no prior visit), the browser was served a STALE bundle and the bug REPRODUCED:
- Loaded script: `assets/index-AVNFN-ve.js` (888 bytes) — 0× h-dvh / overflow-y-auto / min-h-screen. NO FullPageScroll wrapper. DOM chain: button→form→section→main→`div.min-h-screen`(h1737)→`div#root`(h720, overflow:VISIBLE)→body(overflow:hidden). Content past 720px clipped + unreachable — the founder's bug, LIVE.
- Root cause: the app is a **PWA with a Workbox precache service worker**. `caches.keys()` returned `workbox-precache-v2-…` + `api-cache`. The SW served the old precached `index-*.js` even though `index.html` at `/` already references the NEW bundle `assets/index-R5obJ0iu.js` (2.06 MB, containing 8× h-dvh / 32× overflow-y-auto / 7× min-h-dvh — the fix).
- After `navigator.serviceWorker` unregister + `caches.delete` of both caches + reload, the page served `index-R5obJ0iu.js`, the FullPageScroll wrapper appeared, and S1–S3 all PASS.

**Impact:** the Railway deploy is genuinely correct (index.html + new bundle carry the fix; C-2's SUCCESS @ e659b0a is not false). BUT any user (incl. the founder) who visited before this deploy has a registered SW that will serve the stale pre-fix bundle until the SW's update cycle swaps it — so the founder may re-open /settings/profile, still not scroll, and conclude the fix failed. This is a deploy-delivery gap, not a code defect. Route to V-2 for disposition (workbox `skipWaiting`/`clientsClaim` + precache-versioning / a "new version — reload" prompt, or forced SW update on deploy).

```yaml
test_pattern: active
skipped: false
testers_spawned: 1   # orchestrator-driven live Playwright (single authed context); scenarios partitioned by route
scenarios:
  - {id: S1, criterion_ref: "profile scroll-to-bottom (founder bug)", verdict: PASS, evidence_path: "wave81-t5-profile-scrolled-bottom.png + inline geometry"}
  - {id: S2, criterion_ref: "privacy scroll-to-bottom", verdict: PASS, evidence_path: "inline geometry (Delete account reached)"}
  - {id: S3, criterion_ref: "landing scroll + fixed nav anchored", verdict: PASS, evidence_path: "inline geometry (nav top=0 pre/post)"}
  - {id: S4, criterion_ref: "shell /app not wrapped, no double-scroll", verdict: PASS, evidence_path: "inline (root=flex h-full overflow-hidden, 0 wrappers)"}
flakes_observed: []
fix_up_cycles: 0
findings:
  - {severity: high, scenario: S1, description: "F-T5-1 stale Workbox SW precache serves the OLD pre-fix bundle (index-AVNFN-ve.js) to returning users; fix present in new bundle (index-R5obJ0iu.js) + index.html but SW must update before users see it. Deploy-delivery gap, not code defect. Route V-2."}
```

## Prod-clean note
No profile/privacy data mutated. Scroll tests read geometry + set scrollTop only (no field edits, no PUT). SW unregister + cache-delete affect ONLY the Playwright browser context (ephemeral), not prod server state. Fixture A profile untouched.
