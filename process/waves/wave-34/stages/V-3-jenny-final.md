# V-3 jenny FINAL re-verification — wave-34 spec-2 (audio-only fallback)

**Wave:** 34 · **Block:** V · **Stage:** V-3 (FINAL jenny re-verify) · **Mode:** automatic
**Task:** `61e52c3e-689a-4837-9cec-a08f1b051171` (Audio-only fallback for poor-bandwidth study rooms)
**Prod web:** `https://web-production-bce1a8.up.railway.app` · served bundle `/assets/index-BkNvqunA.js`
**Prod api:** `https://api-production-b93e.up.railway.app` · **LiveKit:** LIVE Railway keys (LiveKit Cloud)
**Merge under test:** `6ddaddb` (V-3 fast-fix — audio-only manual toggle wired into control cluster)

## Verdict: **APPROVE** — spec-2 MET; M6 metric "degrades to audio-only gracefully" satisfied → **M6 can CLOSE**

---

## History resolved

1. V-1 REJECT — `enterManual` implemented but not wired to any user-reachable control.
2. V-3 fast-fix (`6ddaddb`) — wired `audio-only-toggle-btn` into the control cluster (`onClick = manual ? restore : enterManual`).
3. V-3 reverify REJECT (jenny + karen) — **false-green deploy**: served bundle `index-Bv_FSPoS.js` lacked the toggle; a non-git redeploy re-served a stale snapshot.
4. V-3 redeploy — `railway up --service web` from `6ddaddb` (CLI-push, the model this non-git service requires); served bundle flipped to `index-BkNvqunA.js` (markers 1/1).

**Deploy-integrity blocker (my prior REJECT) is RESOLVED and independently re-confirmed this session** — I fetched the live root, extracted the served bundle path `/assets/index-BkNvqunA.js`, and grepped it directly: `audio-only-toggle-btn` ×1, `Switch to audio-only` ×1. The fast-fix code is genuinely in the running product. Not re-rejected on deploy.

## Method — PROVEN-LIVE end-to-end drive against real prod + real LiveKit

Direct playwright-core launch (bundled chromium, `--use-fake-device-for-media-stream --use-fake-ui-for-media-stream`; MCP `chrome` channel absent), fixture A `studyhall-e2e-fixture`, logged into prod `/login → /app`. Provisioned a voice channel `w34-jenny-final-voice` in Fixture Proof Server (`ad62cd12`, app DB — same fixture-provisioning path T-5 used; the T-5 `w34-voice-e2e` channel had been cleaned; channel deleted again after the drive). Joined the room → LiveKit connected LIVE (`voice-controls` rendered).

Observed DOM state transitions (all on the live prod page):

| Step | toggle aria-pressed | toggle aria-label | banner | mic |
|---|---|---|---|---|
| **PRE (joined)** | `false` | `Switch to audio-only` | absent | active |
| **CLICK toggle** | `true` | `Restore video` | **present** — `role=status` `aria-live=polite`, text "Audio-only · MIC ACTIVE · You manually paused your video stream · Restore video" | active (not dropped) |
| **CLICK restore** | `false` | `Switch to audio-only` | **cleared** | active |

Screenshot `/tmp/ao-on.png` shows the amber-less neutral (manual) banner with the "MIC ACTIVE" pill and "Restore video" button, own tile "studyhallfixturea (You)", control cluster (mic · screen-share · audio-only · Leave). The single 401 console line is a benign in-room occupancy poll, unrelated.

## Acceptance-criteria disposition

- **AC1 (manual disjunct — PROVEN-LIVE for entry; unsubscribe mechanism CODE+TEST corroborated):** clicking the toggle live entered audio-only (`enterManual → setMode('manual') → pauseVideoSubscriptions()`), banner appeared, audio uninterrupted. `pauseVideoSubscriptions` calls `setSubscribed(false)` on remote video + screen-share publications only (`Track.Kind.Video`, `VIDEO_SOURCES=[Camera,ScreenShare]`), never audio (`useAudioOnlyFallback.ts:80-89`). Remote-video-pixel pause needs a 2nd publisher; with 1 participant the remote set is empty (no-op), so the observable outcome is the mode+banner transition — verified live. The auto `ConnectionQuality→Poor` disjunct stays intact in code (`:109-154`), untouched. **MET.**
- **AC2 (surfaced state):** audio-only banner rendered live with `role=status aria-live=polite`, clear copy + "Mic active" reassurance. **MET (PROVEN-LIVE).**
- **AC3 (restore affordance):** restore button live re-subscribes video (`restore → resumeVideoSubscriptions → setSubscribed(true)`), banner cleared, toggle reverted. **MET (PROVEN-LIVE for the affordance + state clear; re-subscription mechanism code+test corroborated).**
- **AC4 (audio never dropped):** mic remained active across enter + restore; only-video-sources unsubscribe path proves audio publish/subscribe untouched. **MET.**
- **AC5 (degrade→restore live-verifiable):** the full manual cycle is now deterministically reachable and was driven live on prod — the exact non-determinism V-1 flagged is gone. **MET.**

**keep-out:** CLEAN — no per-track UI, no custom bandwidth heuristics, no quality tiers, no persisted preference.

## M6 disposition

M6 success metric = talk + screen-share + **degrades to audio-only gracefully**. Talk+occupancy shipped w31/w32; screen-share live-verified this wave (T-block); audio-only manual path is now (a) in the served bundle, (b) live-reachable + renders + clickable, (c) enters manual mode + surfaces the banner + restores, all PROVEN-LIVE on prod, with the auto ConnectionQuality path intact in code. The graceful-degrade clause is **satisfied → M6 can CLOSE** (in_progress→done; dispose non-metric child tasks to unassigned queue → pivot to M7).

```yaml
jenny_final_verdict: APPROVE
task_id: 61e52c3e-689a-4837-9cec-a08f1b051171
target_merge: 6ddaddb
served_bundle: /assets/index-BkNvqunA.js
served_bundle_markers: {audio-only-toggle-btn: 1, "Switch to audio-only": 1}   # independently re-confirmed
deploy_blocker: RESOLVED   # not re-rejected
live_drive: PROVEN-LIVE    # prod + LiveKit connect; toggle -> banner -> restore observed in DOM + screenshot
acs: {AC1: MET, AC2: MET, AC3: MET, AC4: MET, AC5: MET}
keep_out: CLEAN
m6_close: UNBLOCKED
next_action: HEAD_VERIFIER_GATE -> N_BLOCK_CLOSE_M6
```
