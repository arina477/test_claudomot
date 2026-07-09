# Wave 81 — T-9 Verdict

**Reviewer:** head-tester (fresh spawn)
**Reviewed against:** process/waves/wave-81/blocks/T/review-artifacts.md + findings-aggregate.md
**Attempt:** 1

## Verdict
APPROVED

## Rationale
The suite is honest and the founder's bug is proven fixed LIVE, not merely asserted. T-5 executes a real scroll on the actual prod /settings/profile page authed as Fixture A, and the evidence is concrete geometry — content over-fills 1280×720 by 1017px, the FullPageScroll wrapper (`h-dvh overflow-y-auto`, root of the page, transform/filter/contain=none) yields maxScroll 1017, and setting scrollTop drives 0→1017 exactly, moving the bottom-most control ("Save academic identity") from 719px below the fold to top=422/bottom=458 inside the viewport. This is a genuine below-the-fold reach, not a self-echo, and the two-client rule is not applicable (no realtime path in a client layout wrapper). I independently confirmed the load-bearing claims against source: FullPageScroll.tsx is exactly `<div class="h-dvh overflow-y-auto{className?}">` with the forbidden-props invariant (transform/filter/contain/will-change) documented and unit-asserted; all five routes (ProfilePage x2 for loading+loaded states, SettingsPrivacyPage, LandingPage, PrivacyPage, TermsPage) mount it as root; and `git show --stat e659b0a` confirms the diff is purely client `.tsx`/`.css`/tests with zero DTO/Zod/controller/schema/service change — so the T-3/T-4/T-7/T-8 skips and the T-8 minimal auth-regression confirm (/app unwrapped, authed settings routes render) are all sound. Coverage layering is correct and not theater: unit asserts the DOM invariant (root === overflow-y-auto container, real components rendered, nothing mocked), which is the honest jsdom-limited proxy, and LIVE E2E proves actual pixel scrollability — the right layer split. **F-T5-1 (HIGH, stale-SW-cache) is correctly classified as a deploy-delivery gap, not a code defect, and I concur with passing the T-gate:** the Railway deploy is genuinely correct (index.html → new bundle index-R5obJ0iu.js carries the fix; C-2 SUCCESS @ e659b0a is not false-green), and nothing in the T-suite is dishonest or hides a broken product — the fix works and is proven. Blocking the T-gate would be the wrong instrument; the suite passed its job. HOWEVER, this is a real user-observable gap that lands on the exact person who reported the bug: any returning user with a registered Workbox SW (including the founder) will be served the stale pre-fix bundle (index-AVNFN-ve.js, 0× h-dvh, bug reproduced LIVE) until the SW update cycle swaps it, and will conclude the fix failed. T-5 already severity-tags it HIGH in findings-aggregate and routes it to V-2 with a concrete disposition menu (workbox skipWaiting/clientsClaim + versioned precache or a reload prompt). That routing is exactly right. The T-gate APPROVAL is therefore conditional on V-2 actually disposing of F-T5-1 — the wave must NOT close as "founder bug fixed" without the delivery gap resolved or the founder explicitly told to hard-refresh/clear cache, because their acceptance re-check will fail on their own machine otherwise. F-T2-1 (low, no standalone ProfilePage root-wrapper unit) is correctly informational — the exact route is covered by the LIVE T-5 plus the sibling SettingsPrivacyPage assertion.

## Rework instructions  (only if REWORK)
n/a — APPROVED.

## Escalation  (only if ESCALATE)
n/a. Note for V-block (non-blocking to T-gate, but a hard carry-forward): **F-T5-1 (HIGH) MUST be dispositioned at V-2 before the wave is declared "founder bug resolved."** The code fix is proven, but returning users (incl. the founder) will see the stale bundle until the service worker updates. V-2 owns the disposition: implement a forced SW update on deploy (workbox `skipWaiting` + `clientsClaim` + versioned precache), or a "new version — reload" prompt, OR — at minimum — surface a founder-facing note that the fix is live and to hard-refresh / clear cache once. Do not let this finding evaporate between blocks.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3
