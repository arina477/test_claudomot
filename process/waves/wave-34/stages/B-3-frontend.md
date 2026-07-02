# Wave 34 — B-3 Frontend (livekit-integration)
- **VoiceStudyRoom.tsx** (rewrite) — screen-share: toggleScreenShare→setScreenShareEnabled; useTracks([ScreenShare]) → RemoteShareView prominent tile (aria-label "Screen shared by <name>", max-w-[1000px] mx-auto), OwnShareView, ScreenShareLoading, AvatarStrip (demoted), sr-only screen-share announcer (role=status). audio-only: AudioOnlyBanner (auto amber / manual / restoring, mic-active reassurance in ALL states incl restoring, restore button). To adopted designs screen-share-tile.html + audio-only-state.html.
- **useAudioOnlyFallback.ts** (new) — ConnectionQualityChanged, POOR_DEBOUNCE_MS=3000, pause/resume video subscriptions (setSubscribed) — audio NEVER touched (invariant); manual + auto-restore-on-Good (manual wins, no auto-restore); 11 unit tests.
- **icons.tsx** — ScreencastIcon/WifiLowIcon/VideoCameraIcon/MonitorIcon/StopIcon. **livekit.md** — appended ConnectionQuality/setSubscribed + canPublishSources-widening patterns (doc carry).
- 13 new component tests + 11 hook tests. Build-fold nits (D-3 BF): tokenized glow, mic-reassurance-in-restoring, shadow-sm on auto banner, mobile mic aria-label, inert tooltip removed.
## Deviation (WATCH → V-1 jenny): `enterManual()` hook API exists + wired into RoomView (destructured) but NO dedicated "go audio-only" button in the control cluster — the adopted audio-only-state.html design showed only the auto-trigger + restore, not a manual-entry toggle, though brief §6 + mvp-thinner named a control-cluster manual toggle. So the manual-opt-in AC is PARTIALLY met (state renders + enterManual capability exists; UI entry point absent). V-2 triage: small B-3 add of the toggle button OR non-blocking follow-up. Not blocking the build (auto-fallback + restore + screen-share all work).
```yaml
skipped: false
specialists_spawned: [livekit-integration]
files_implemented: [apps/web/src/shell/VoiceStudyRoom.tsx, apps/web/src/shell/useAudioOnlyFallback.ts, apps/web/src/shell/useAudioOnlyFallback.test.tsx, apps/web/src/shell/voice-study-room.test.tsx, apps/web/src/shell/icons.tsx, command-center/dev/SDK-Docs/LiveKit/livekit.md]
designs_consumed: [design/screen-share-tile.html, design/audio-only-state.html]
deviations: [{change: "manual audio-only toggle button not wired (enterManual exists, no UI button)", plan_said: "manual opt-in toggle in control cluster (brief §6, mvp in-scope)", why: "adopted design showed only auto+restore, no manual-entry control", adjudication: "accept-carry-V (partial AC; small follow-up or V-3 fast-fix)"}]
simplify_applied: pending-B6
```
