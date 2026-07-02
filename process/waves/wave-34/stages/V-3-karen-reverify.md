# V-3 Karen Re-verification — audio-only fast-fix (wave-34)

**Agent:** karen (V-3 re-verification, post-fast-fix)
**Scope:** verify the V-1 blocking finding (audio-only fallback not user-reachable — `enterManual` unwired) was genuinely fixed AND genuinely shipped to the live web deploy. NOT spec conformance (jenny's lane). No fixing.
**Target:** merge `6ddaddb` (PR #48) / claimed web deploy `9b257db7`.

---

## VERDICT: REJECT

**The fast-fix is correct in source and passes tests, but it is NOT serving on the live web deploy.** The revision actually being served by `https://web-production-bce1a8.up.railway.app/` is the PRE-fast-fix build. The V-3-fastfix-ci.md claim that a fresh digest (`9b257db7`) carrying the fix is the latest serving revision is contradicted by the live bundle. This is a false-green deploy: CI + merge are real, the deploy step did not land the fix in front of users.

The single blocking condition this fast-fix exists to clear — audio-only fallback *user-reachable* — is still NOT reachable by a real user on the live site, because the control that reaches it is not in the served bundle.

---

## Claim → evidence

### Claim 1 — the toggle is wired (source). TRUE.
`apps/web/src/shell/VoiceStudyRoom.tsx` on merge `6ddaddb`:
- Line 410: `const { mode: audioOnlyMode, restoreState, restore, enterManual } = useAudioOnlyFallback();` — `enterManual` is now destructured (git diff confirms it was previously `{ mode, restoreState, restore }` only; the "future use" comment was removed).
- Lines 727–748: a `<button data-testid="audio-only-toggle-btn">` with `aria-pressed={audioOnlyMode === 'manual'}`, `aria-label` = `'Restore video'`/`'Switch to audio-only'`, and `onClick={audioOnlyMode === 'manual' ? restore : enterManual}` — enterManual() when off, restore() when on.
- Confirmed on the merge tree via `git show 6ddaddb`. **PASS.**

### Claim 2 — aria-label `|| 'Someone'` fallback shipped (source). TRUE.
`VoiceStudyRoom.tsx:830` on `6ddaddb`: `const sharerName = trackRef.participant?.name || trackRef.participant?.identity || 'Someone';` — changed from `??` to `||`, so empty-string names fall through to 'Someone'. Confirmed on merge tree. **PASS.**

### Claim 3 — 5 new component tests shipped, real assertions. TRUE.
`apps/web/src/shell/voice-study-room.test.tsx` on `6ddaddb` adds exactly 5 tests: toggle renders; click→`enterManual` (mode=null); aria-pressed=false/label="Switch to audio-only"; aria-pressed=true + banner (mode=manual); click→`restore` (mode=manual).
- Mocks are real: `mockEnterManual`/`mockRestore` are `vi.fn()` wired into `vi.mock('./useAudioOnlyFallback')` (lines 124–132) and reset in beforeEach — not dangling.
- Ran the suite live: **34/34 passed** (`vitest run`), all 5 new toggle tests among them with genuine `toHaveBeenCalledTimes` / `toHaveAttribute` assertions. **PASS.**

### Claim 4 — deployed web `9b257db7` SUCCESS, fresh digest, web root 200. FALSE (as it concerns the fix being served).
- Web root: `curl -> HTTP 200`. **PASS (server up).**
- BUT the served JS bundle does NOT contain the fast-fix. The live site serves exactly one bundle `/assets/index-Bv_FSPoS.js` (etag `bbefa8ff…`, x-railway-edge iad1). Grepping the served bytes:
  - `audio-only-toggle-btn`: **0 occurrences**
  - `Switch to audio-only`: **0 occurrences**
  - `audio-only-banner`: 1 (this is the PRIOR wave-34 B-block auto-fallback banner)
  - `screen-share`/`ScreenShare`: 4 (also prior B-block work)
  - `data-testid`: 84 total, incl. `join-voice-btn` + `voice-controls` — so **testids are NOT stripped in prod**; the toggle testid's absence is real, not a minifier artifact.
  - The one `Restore video` string in the served bundle traces to `VoiceStudyRoom.tsx:1297` (pre-existing auto-fallback restore button `isRestoring ? 'Restoring' : 'Restore video'`) — served context `"span",{className:"hidden sm:inline",children:r?"Restoring":"Restore video"}` — NOT the new toggle's `aria-label` conditional (which would also require `"Switch to audio-only"`, absent).
- **Cross-check that the fix IS deployable (isolates the failure to the deploy step, not the code):** fresh production build of the current `6ddaddb` tree → bundle `index-B58rI52w.js` — grep shows `audio-only-toggle-btn`: 1, `Switch to audio-only`: 1. The code compiles into a bundle carrying the markers. The served bundle (`index-Bv_FSPoS.js`) differs in hash and lacks them.
- **Conclusion:** the served web revision is the pre-fast-fix build (consistent with C-2 baseline `e211f14d`, 12:27). Deployment `9b257db7` is either not the serving revision or did not build from `6ddaddb`. The "fresh digest serving" claim in V-3-fastfix-ci.md is not observable on the live bundle. **FAIL — false-green deploy.**

### Claim 5 — no regression; fast-fix is web-UI-only. TRUE.
`git diff 6ddaddb~1 6ddaddb --name-only`: exactly two files — `apps/web/src/shell/VoiceStudyRoom.tsx` (+56/−4) and `voice-study-room.test.tsx` (+76). No `api/**`, no hook logic (`useAudioOnlyFallback.ts` untouched), no migration. The screen-share logic, the token grant, and the audio-never-dropped invariant are outside the diff — untouched. **PASS (no regression to passing work).**

---

## Why REJECT despite 4/5 claims passing

The fast-fix's entire reason to exist is jenny's V-1 REJECT: audio-only fallback not *user-reachable* because `enterManual` was unwired. Source-wiring + green tests prove the control exists in code. But "user-reachable" is a property of the **running product**, and the running product is not serving the control. A user on the live site today still cannot reach manual audio-only. The blocking finding is therefore NOT cleared in the only environment where it matters. Green tests against a bundle that isn't the one being served is acceptance-by-assertion, not shipped behavior.

## What has to happen before this can flip to APPROVE
(Not fixing — stating the gate.) Re-run the web deploy from `6ddaddb` and re-verify the SERVED bundle contains `audio-only-toggle-btn` + `Switch to audio-only` (grep the live `/assets/index-*.js`), not just that a deployment id reports SUCCESS. The C-2 anti-false-green contract must assert bundle content of the served revision, not only deployment-state + digest inequality — a fresh digest that built from the wrong ref or isn't the serving edge still passes those checks, as happened here.

## Routing
Deploy-landed-but-not-serving is a CI/CD-domain defect → **head-ci-cd** (re-trigger web deploy from `6ddaddb`, confirm serving revision by bundle content). Not an orchestrator fix. Iron Law: root-cause the deploy discrepancy (wrong ref built? serving edge pinned to `e211f14d`? build cache?) before redeploying.

```yaml
karen_reverify_verdict: REJECT
target_merge: 6ddaddb
claims:
  toggle_wired_source: PASS
  aria_label_someone_fallback: PASS
  five_new_tests_real: PASS   # 34/34 vitest green, mocks real
  deployed_and_serving_fix: FAIL   # served bundle index-Bv_FSPoS.js lacks audio-only-toggle-btn + "Switch to audio-only"; fresh build of 6ddaddb (index-B58rI52w.js) contains both
  no_regression_web_only: PASS
blocking: "V-1 finding (audio-only not user-reachable) NOT cleared on live deploy — control absent from served bundle; false-green deploy"
route_to: head-ci-cd
next_action: REDEPLOY_WEB_FROM_6ddaddb_THEN_REVERIFY_SERVED_BUNDLE
```
