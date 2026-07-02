# Wave 34 — V-3 Fast-fix
## Fast-fix (F-34-AUDIO-TOGGLE, blocking)
- **Fix:** wired enterManual() to a control-cluster "Audio-only" toggle (VoiceStudyRoom.tsx) + aria-label `|| 'Someone'` fallback (F-34-ARIA fold). 5 new tests. livekit-integration.
- **Land:** PR #48 → CI 7-green → merge 6ddaddb → deploy web.
- **FALSE-GREEN DEPLOY caught (karen + jenny V-3-reverify REJECT):** the first web deploy (9b257db7) was a GraphQL `serviceInstanceDeployV2` REDEPLOY of a NON-git-connected service → re-served the STALE pre-fast-fix bundle (served index-Bv_FSPoS.js had 0 `audio-only-toggle-btn`). digest-diff gate was invalid (rebuild → new digest from SAME source). 
- **Corrected deploy (head-ci-cd):** `railway up --service web` (CLI-push, BUILDS the local 6ddaddb tree) → new bundle index-BkNvqunA.js CONTAINS `audio-only-toggle-btn`(1) + `Switch to audio-only`(1) — served-bundle content assertion PASSES. Confirmed 3x (head-ci-cd + jenny + orchestrator curl).
## Re-verification (V-3 Action 2e)
- **karen:** V-3-reverify REJECT was ONLY the deploy false-green (served bundle stale) — now RESOLVED (served bundle contains the toggle, verified 3x). Source-claim (toggle wired, aria-fix, tests, no regression) was PASS at V-3-reverify. Concern factually cleared.
- **jenny FINAL: APPROVE** — spec-2 MET PROVEN-LIVE. Drove the live manual path: toggle→aria-pressed+banner("MIC ACTIVE")→restore→clears (screenshot). AC1 manual MET live, AC2/3 MET, AC4 audio-never-dropped MET, AC5 MET (non-determinism gone). keep-out clean. M6 metric "graceful audio-only degrade" SATISFIED → M6 can CLOSE.
## L-2 lesson (recorded): non-git Railway services must deploy via `railway up` (CLI-push build), NOT a GraphQL snapshot redeploy; served-bundle content assertion (grep live /assets/index-*.js for a change-unique marker) > digest-diff.
```yaml
skipped: false
queue_items_processed: 1
queue_items_fixed: 1
fast_fix_rounds: 1
re_verification: {karen: RESOLVED (deploy false-green cleared), jenny: APPROVE}
cap_escalation: false
