# V-3 — jenny re-verification (wave-34, spec-2 audio-only, post-fast-fix)

**Wave:** 34 · **Block:** V · **Stage:** V-3 (fast-fix re-verification) · **Mode:** automatic
**Reviewer:** jenny (independent spec-vs-deployed-behavior verifier)
**Origin:** my own V-1 REJECT — spec-2 AC1's manual audio-only path was un-invokable (`enterManual()` implemented but never wired to a control). Fast-fix PR #48 (merge `6ddaddb`) wires a control-cluster "Audio-only" toggle to `enterManual()`.
**Claimed prod under review:** web `9b257db7` (claimed built from merge `6ddaddb`), served at `web-production-bce1a8.up.railway.app`. api untouched (web-only fix). LiveKit keys live.
**Authoritative spec:** `tasks` row `61e52c3e` (audio-only), read live from DB this stage.
**Scope discipline:** I verify DEPLOYED BEHAVIOR against SPEC-CONTRACT intent. I do NOT fix. I classify misses as spec-DRIFT vs spec-GAP, and here I additionally surface a DEPLOY-INTEGRITY defect (merged-but-not-deployed).

---

## VERDICT: **REJECT** — the fast-fix is NOT on the deployed web. The served bundle does not contain the audio-only toggle. spec-2 AC1(manual)/AC2/AC3/AC5 remain NOT MET on the live product, unchanged from V-1.

The fast-fix source is correct and merged to `main` (`6ddaddb`), but **the deployed revision `9b257db7` does not contain it**. `9b257db7` was a Railway **redeploy of the stale pre-fast-fix image** (the web service is not git-connected; the redeploy rebuilt the existing source snapshot, not the freshly-merged commit). The live JS bundle a browser executes has the audio-only banner + its internal restore button (both pre-existed the fast-fix) but is **missing the entry toggle** the fast-fix added. Therefore the user-reachable audio-only path still does not exist in production. **M6-close remains BLOCKED.**

---

## What I verified (ground truth: the bytes the browser runs)

The deployed web serves exactly one entry bundle: `GET /` → `/assets/index-Bv_FSPoS.js` (etag `bbefa8ff…`, 1 557 244 bytes). `data-testid` attributes are confirmed NOT stripped in this production build (control-cluster siblings are present), so their absence is dispositive, not a minification artifact.

Marker presence in the LIVE served bundle (`index-Bv_FSPoS.js`, fetched from the prod URL):

| Marker (source-of-truth string) | Origin | LIVE served bundle |
|---|---|---|
| `data-testid="mic-toggle-btn"` | pre-existing control | **present** (1) |
| `data-testid="screen-share-btn"` | pre-existing control | **present** (1) |
| `data-testid="audio-only-banner"` | pre-existing (B-3) | **present** (1) |
| `data-testid="audio-only-restore-btn"` | banner's internal restore (pre-existing) | **present** (1) |
| **`data-testid="audio-only-toggle-btn"`** | **the fast-fix entry toggle** | **ABSENT (0)** |
| **aria-label `"Switch to audio-only"`** | **the fast-fix entry toggle** | **ABSENT (0)** |

The two markers unique to the fast-fix are both absent from the served bundle. `data-testid` non-stripping is proven by the presence of `mic-toggle-btn` / `screen-share-btn` / `join-voice-btn` / `voice-controls` in the same bundle — so `audio-only-toggle-btn`'s absence means the button element is not in the shipped tree, i.e. it will not render for any user.

### Cross-check — the source builds correctly; only the DEPLOY is stale

- Merged source (`6ddaddb:apps/web/src/shell/VoiceStudyRoom.tsx:731-733`) contains the toggle: `data-testid="audio-only-toggle-btn"`, aria-label `'Switch to audio-only'`, `onClick={audioOnlyMode==='manual' ? restore : enterManual}`, `enterManual` destructured at line 410. Wiring is correct in source.
- A local production build of the current tree (HEAD=`6ddaddb`) produced `apps/web/dist/assets/index-B58rI52w.js` (built 13:10Z), which **contains** `audio-only-toggle-btn` (1) + `Switch to audio-only` (1) + banner + restore-btn. So a correct build of the fast-fix DOES ship the toggle; the strings are not tree-shaken.
- The deployed bundle hash (`index-Bv_FSPoS.js`) ≠ the correct-build hash (`index-B58rI52w.js`). The deployed hash is the older, toggle-less build.

**Conclusion:** the fast-fix is real and correct in `main`, but it was never actually built into the deployed image. Merged ≠ deployed.

---

## Root cause of the false-green deploy (DEPLOY-INTEGRITY defect)

The web Railway service is **not git-connected** — `service.repoTriggers.edges = []` (verified via GraphQL). Deploy `9b257db7` metadata: `reason: "redeploy"`, `commitHash: (none — meta carries no git/commit fields)`, `cliCaller: "claude_code"`, `imageDigest: sha256:265659726b…`. A `serviceInstanceDeployV2(serviceId, environmentId)` call on a non-git-connected service **redeploys the currently-configured source snapshot** — it does not pull the newly-merged GitHub commit. So the redeploy rebuilt the same pre-fast-fix source and served the same toggle-less UI.

Why the C-2 fast-fix record (`V-3-fastfix-ci.md`) reported PASS anyway: its "genuine new build" gate asserted only `new image digest ≠ baseline digest` (`265659726b…` ≠ `d23f0a29…`). That inference is **invalid for a non-git redeploy** — a redeploy can yield a different image digest (fresh build layers of the *same* source) without incorporating any new commit. The gate proved "a rebuild happened," not "the rebuild contained `6ddaddb`." The one check that would have caught this — asserting a fast-fix-specific marker (`audio-only-toggle-btn`) is present in the served bundle — was not run. Merge SHA `6ddaddb` and deploy `9b257db7` were never causally linked; the record inferred the link from timing.

This is not a spec defect and not a source defect — it is a **release-integrity gap**: the CI/deploy pipeline for a CLI-push (non-git) Railway service does not build from the merged commit and has no post-deploy content assertion to prove the shipped artifact contains the change.

---

## spec-2 AC-by-AC on the ACTUAL deployed build (unchanged from V-1)

| AC | Spec intent | Deployed evidence (this stage) | Verdict |
|---|---|---|---|
| AC1 | ConnectionQuality→Poor **OR manual toggle** → inbound video unsubscribed, audio uninterrupted | Auto disjunct: still in code, still non-headless-forceable (unchanged). Manual disjunct: **still un-invokable — the toggle is NOT in the served bundle** (`audio-only-toggle-btn` absent live). The fast-fix that would have made it reachable is merged but not deployed. | **NOT MET** (manual path still has no user-reachable trigger in prod) |
| AC2 | Audio-only state surfaced (banner/pill) | `AudioOnlyBanner` present in bundle + gated behind `audioOnlyMode !== null`; but `audioOnlyMode` is only set by (a) the auto path (non-headless) or (b) `enterManual`, which has no deployed trigger. Banner remains correct-but-dead in prod. | **NOT MET live** (unreachable — no deployed path sets the state) |
| AC3 | Restore affordance re-subscribes video | Banner's `audio-only-restore-btn` is in the bundle, but you cannot reach it because you cannot enter the state (downstream of AC1). | **NOT MET live** (unreachable) |
| AC4 | Audio never dropped by the fallback | Unchanged from V-1: PROVEN-LIVE at T-5 S3 (both participants retained MICROPHONE/AUDIO across join/share/stop); hook iterates only `VIDEO_SOURCES=[Camera,ScreenShare]`, audio structurally untouched; 11 hook unit tests corroborate. | **MET** (unchanged) |
| AC5 | LIVE-VERIFIED degrade→restore (non-negotiable) | Could NOT run — the deterministic manual path the fast-fix was meant to provide is absent from the deployed build, so there is no user-drivable entry to the degrade→restore cycle. Auto path remains non-headless. | **NOT MET** (still unverifiable live) |

**Net: AC4 MET (unchanged). AC1/AC2/AC3/AC5 NOT MET live — identical to V-1, because the repair never reached prod.**

### The 5 new component tests — corroborate the SOURCE, not the deploy
`voice-study-room.test.tsx` (+5 tests, in `6ddaddb`) are meaningful component tests against the real `RoomView`: toggle renders in-cluster; click→`enterManual` when mode=null; click→`restore` when mode=manual; `aria-pressed` true/false; banner renders when mode=manual. They pass and prove the WIRING is correct in source. But they run against a mocked hook (`mockAudioOnlyMode`) and against the LOCAL source — they do not (and cannot) prove the DEPLOYED bundle contains the toggle. The gap here is entirely between merge and deploy, which unit/component tests do not cover.

**Classification of live-verifiability:** SOURCE + component-test-corroborated (toggle wiring correct in `6ddaddb`); **NOT PROVEN-LIVE** (toggle absent from the served bundle — cannot be exercised in prod).

---

## M6 metric clause — still NOT satisfied

M6 metric: *"…talk + screen-share, and the room degrades to audio-only gracefully on poor bandwidth."*
- **talk** — w31 ✅ · **screen-share** — w34 PROVEN-LIVE ✅
- **degrades to audio-only gracefully** — **still NO user-reachable path in the deployed build.** The manual toggle (the deterministic fallback) is absent from prod JS; the auto path remains unproven live. A student on weak internet in prod today still has no audio-only fallback they can trigger. **Unchanged from V-1.**

**M6-close remains BLOCKED.** N-block still cannot honestly flip M6 `in_progress→done`.

---

## Recommendations (routing only — I do not fix)

1. **DEPLOY-INTEGRITY repair (CRITICAL, blocks re-verify):** actually deploy merge `6ddaddb` to the web service so the served bundle contains `audio-only-toggle-btn`. Because the service is not git-connected, a plain `redeploy` re-serves the stale snapshot — the deploy must build from the merged commit (e.g. push the built image / trigger a build that checks out `6ddaddb`, per this project's CLI-push model in `railway-deploy.md`). Route to **@head-ci-cd** (owns C-2 deploy + the Railway GraphQL path). This is the same head that authored the false-green record; the fix is on its lane.
2. **Add a post-deploy content assertion (CRITICAL, prevents recurrence):** the deploy gate must assert a change-specific marker is present in the *served* artifact — here, `curl <served bundle> | grep audio-only-toggle-btn` — not merely `new image digest ≠ baseline`. Digest-diff is necessary but not sufficient for a non-git redeploy. Candidate L-2 observation.
3. **After a real deploy lands:** re-run this re-verification. Given the source + component tests already prove the wiring, once the toggle is confirmed in the served bundle I expect the manual path to become live-drivable (enter → inbound video `setSubscribed(false)` + banner + restore → re-subscribe), which would satisfy AC1(manual)/AC2/AC3/AC5 and unblock M6-close. Recommend **@task-completion-validator** drive the toggle end-to-end live post-deploy.
4. **Do NOT close M6** until the toggle is confirmed in the *served* bundle AND the degrade→restore cycle is live-driven via it.

---

```yaml
reviewer: jenny
stage: V-3-reverify
verdict: REJECT
reason: fast-fix merged (6ddaddb) but NOT deployed — served bundle lacks the audio-only toggle
deploy_integrity_defect:
  merged_commit: 6ddaddb
  claimed_deploy: 9b257db7-8ff9-49d1-bd6e-b3f2e805071f
  deploy_reason: redeploy
  service_git_connected: false           # repoTriggers.edges = []
  served_bundle: /assets/index-Bv_FSPoS.js
  served_bundle_etag: "bbefa8ffc080c6b9b68db530c8936c89396ef37a"
  toggle_markers_in_served_bundle:
    "audio-only-toggle-btn": 0           # ABSENT — fast-fix not deployed
    "Switch to audio-only": 0            # ABSENT
    "audio-only-banner": 1               # present (pre-existing)
    "audio-only-restore-btn": 1          # present (pre-existing)
    "mic-toggle-btn": 1                  # present (proves data-testid NOT stripped)
    "screen-share-btn": 1                # present
  correct_build_of_source:
    local_dist_bundle: /assets/index-B58rI52w.js
    "audio-only-toggle-btn": 1           # a correct build DOES ship the toggle
    "Switch to audio-only": 1
  false_green_root_cause: >
    C-2 fast-fix gate asserted only new-image-digest != baseline; that does not prove a
    non-git redeploy incorporated the merged commit. No served-bundle content assertion ran.
spec_2_audio_only:
  task_id: 61e52c3e-689a-4837-9cec-a08f1b051171
  status: PARTIAL                        # unchanged from V-1 — repair never reached prod
  acs: {AC1: NOT_MET, AC2: NOT_MET_LIVE, AC3: NOT_MET_LIVE, AC4: MET, AC5: NOT_MET}
  keep_out: CLEAN
  live_verifiability: SOURCE_AND_COMPONENT_TEST_CORROBORATED_NOT_PROVEN_LIVE
m6_close: BLOCKED
routing:
  - {severity: Critical, to: head-ci-cd, action: "actually build+deploy 6ddaddb to web (non-git service — redeploy re-serves stale snapshot)"}
  - {severity: Critical, to: head-ci-cd, action: "add served-bundle content assertion to deploy gate (grep change-marker), not just digest-diff"}
  - {severity: High, to: task-completion-validator, action: "post-real-deploy: drive toggle end-to-end live (enter->video unsub + banner + restore->resub)"}
next_action: REDEPLOY_THEN_REVERIFY
```

---

## Note on method

I did not need a live browser drive to reject: the toggle is absent from the JS the browser would execute, so it cannot render — a UI drive would only re-confirm its absence. The dispositive evidence is the served-bundle byte content (fetched directly from the prod URL), cross-checked against a correct local build of the same source and against Railway's deploy metadata showing a non-git `redeploy`. Had the toggle been present in the served bundle, I would have driven the manual path live (join voice as `studyhallfixturea`, click the toggle, observe inbound video unsubscribe + banner + restore) to satisfy AC5.
