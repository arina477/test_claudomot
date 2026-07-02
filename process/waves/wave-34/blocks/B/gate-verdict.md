# Wave 34 — B-6 Review — head-builder gate verdict

**Block:** B (Build) — voice finish: screen-share (2-layer grant+client) + audio-only fallback
**Gate:** B-6 (block-exit)
**Reviewers spawned (independent, non-author):** code-reviewer, code-quality-pragmatist
**Verdict:** REWORK (bounded, itemized — 2 MAJOR resource leaks on the live-verify-critical path)

---

## What was verified against reality (not deliverable claims)

### 1. Two-layer screen-share genuinely works — PASS
- **Grant layer:** `voice-token.service.ts:140-144` — `canPublishSources` widened `[MICROPHONE]` → `[MICROPHONE, SCREEN_SHARE, SCREEN_SHARE_AUDIO]`. Camera still excluded (audio + screen-share only). Header comments (:19-20, :31) swept post-widen (no stale "microphone only").
- **Spec assertion updated in the SAME change:** `voice-token.service.spec.ts:~157` asserts `canPublishSources` === `['microphone','screen_share','screen_share_audio']` + a new positive test for member-grant-includes-screen_share. Grant + assertion move together — no drift, no red.
- **RBAC gate UNCHANGED and runs BEFORE the mint:** `voice-token.service.ts:98-101` (`canViewChannelById` → 403 uniform default-deny) executes before token mint at :127-146. Non-members still cannot mint. Grant is MEMBER-scoped. Confirmed by code-reviewer with no security defects.
- **Client 2-layer:** `VoiceStudyRoom.tsx` — publish via `setScreenShareEnabled` (:451-472); subscribe/render prominent remote tile via `useTracks([ScreenShare])` (:415) → `RemoteShareView` (max-w-[1000px] mx-auto, :784); own/remote filtering by identity (:428-434) is correct (own share renders OwnShareView, not a self-echo); revert path returns to avatar grid.

### 2. Audio-never-dropped invariant (LOAD-BEARING) — PASS
- `useAudioOnlyFallback.ts:80,93` — both pause/resume loops gate on `rPub.kind === Track.Kind.Video && VIDEO_SOURCES.includes(rPub.source)` (Camera + ScreenShare only). Audio publications are never enumerated for `setSubscribed`.
- **Negative-path repro test EXISTS (BUILD rule 4):** `useAudioOnlyFallback.test.tsx:298` — `'audio publications are NEVER touched by pause or restore (audio invariant)'`; `mockAudioPublication.setSubscribed` asserted `.not.toHaveBeenCalled()` at :134 and :176. Both independent reviewers confirm the invariant holds.

### 3. Manual-toggle deviation — ADJUDICATED: ACCEPTABLE V-CARRY (not rework)
`enterManual()` exists in the hook API + is tested at the hook level; `VoiceStudyRoom.tsx:411` deliberately does NOT wire it to a control-cluster button (comment :408-410). Brief §6 + mvp-thinner named a manual toggle, but the adopted design `audio-only-state.html` showed ONLY auto-trigger + restore — no manual-entry control.
**Ruling:** the metric is "degrades to audio-only gracefully." The auto (debounced Poor) + restore path fully satisfies that metric independent of any manual button. The manual-opt-in AC is therefore NOT materially unmet — the graceful-degrade behavior ships. Design fidelity argues against inventing a control the adopted design omitted. Accepted as a small V-carry / follow-up. **Explicitly OUT of the rework surface** (keeps rework minimal; avoids gold-plating). Note carried: the manual-mode banner branch (neutral border / video-slash icon / "You manually paused" copy) is currently unreachable UI until a button wires `enterManual` — V-block/M7 disposition.

### 4. Design fidelity — PASS
- Both adopted designs exist: `design/screen-share-tile.html`, `design/audio-only-state.html`.
- Component tokens are drawn from the adopted files' token sets: amber `#f59e0b` (auto banner), emerald `#10b981`, surfaces `#0a0a0b`/`#121214`, borders `rgba(255,255,255,0.06)`, `max-w-[1000px]`, "Live Share"/"Presenting" labels. **Zero invented tokens.** Screen-share tile is dominant + avatar strip demoted; audio-only banner has amber-auto / calm-manual / mic-active reassurance / restore, all per design.

### 5. Debounce / flapping — PASS
- `POOR_DEBOUNCE_MS=3000` (:52); Poor arms a debounce only if none pending AND `modeRef.current===null` (:112); Good/Excellent cancels a pending timer (:124-127); timer callback re-checks mode before committing (:116). **Manual-wins-over-auto-restore:** auto-restore fires only when `modeRef.current==='auto'` (:129), never clearing a `manual` mode. All test-covered.

### 6. /simplify — PASS (no MVP-scope over-engineering)
code-quality-pragmatist: **no blocking over-engineering.** Hooks + state machine are proportionate to a 5-state voice room. Nits only (folded into rework where cheap): duplicated "Mic active" pill (`VoiceStudyRoom.tsx:1154-1182` — identical span in both branches of a pointless conditional), misleading `resumeVideoSubscriptions` docstring (:87-99 claims "only prior-subscribed" but re-subscribes all — MVP-fine, comment should match), duplicated `getInitials` (:504 & :994). No scale gold-plating (no Redis/queue/multi-replica). No schema. No new deps.

### 7. Other deviations — none silent. B-3 manual-toggle is the only declared deviation (adjudicated in #3).

---

## Why REWORK (the two blocking-for-this-gate items)

Both independent reviewers cleared security, contract, and the audio invariant. code-reviewer surfaced **2 MAJOR resource-lifecycle leaks** — not logic/security/contract defects, but both land on the exact path the T-block is about to LIVE-VERIFY (2-participant remote-share start→stop→revert + degrade→restore). I will not forward a known media/timer leak into the mandatory live test.

**RW-1 (MAJOR) — remote-share `<video>` attached without detach.** `VoiceStudyRoom.tsx:793-799`: ref callback calls `trackRef.publication.track.attach(el)` with no matching `detach()` on unmount / track-ref change. Media-element leak on every remote-share start/stop cycle; leaves LiveKit holding a removed DOM node. The SDK doc (`livekit.md:269`) documents `<VideoTrack>` as the lifecycle-managed path. **Fix:** return a cleanup from the ref callback calling `track.detach(el)`, OR swap to `@livekit/components-react` `<VideoTrack>`. Exercised directly by the T-block live test.

**RW-2 (MAJOR) — restore() timer not ref-tracked / not cleared.** `useAudioOnlyFallback.ts:161-171`: `setTimeout(1000)` has no ref handle and no unmount cleanup. Restore-then-Leave within 1s fires `setMode`/`setRestoreState` on an unmounted hook (update-on-unmounted). Every other timer in the file is ref-tracked + cleared; this is the lone exception. **Fix:** store in a ref, clear in the effect cleanup + at the top of `restore()`.

**Fold-in while in there (cheap, non-blocking on their own):** dedup the "Mic active" pill (`VoiceStudyRoom.tsx:1154-1182`); correct the `resumeVideoSubscriptions` docstring to match behavior (`useAudioOnlyFallback.ts:87-99`).

**Out of scope for this rework (do NOT expand):** manual-toggle button (V-carry per #3); `getInitials` dedup / `roomRef` simplification (optional nits, defer). Keep the rework surface to RW-1 + RW-2 + the two fold-ins. Re-run typecheck/lint/build + the voice test suites; the existing 789 stay green (the fixes are lifecycle-only, no assertion changes expected beyond possibly asserting detach/timer-clear).

Route both to **livekit-integration** (the implementing specialist) via the triage table — orchestrator does not fix directly.

---

## Carries into T / V / N

- **T-block LIVE-VERIFY MANDATORY (ceo NON-NEGOTIABLE):** 2-participant real test against live Railway LiveKit — one publishes a real screen-share, the other sees the prominent tile, sharer stops → tile reverts cleanly (no orphan/leak — RW-1 must be fixed first); poor-bandwidth degrade → audio continues → restore re-subscribes video. Not mock-only.
- **T-8 token-grant re-probe:** members mint a grant including `screen_share`[+`_audio`]; non-member still uniform-403; secret stays server-side.
- **V-block:** manual-toggle disposition (wire `enterManual` to a control-cluster button + reachability of the manual-mode banner branch) — small follow-up or V-3 fast-fix, founder-facing UX call if surfaced.
- **N-block:** after live-verify passes, M6 metric is MET → close M6 (in_progress→done, dispose non-metric child tasks to unassigned queue) → pivot to M7.

---

```yaml
head_signoff:
  verdict: REWORK
  stage: B-6
  reviewers:
    code-reviewer: "security CLEAN; audio-invariant + state machines CLEAN; 2 MAJOR resource leaks (restore-timer unmount, remote-share video attach-without-detach)"
    code-quality-pragmatist: "no blocking over-engineering; nits only (duplicated Mic-active pill, misleading resume docstring, dup getInitials)"
  failed_checks:
    - "B-2/B-3 implement: remote-share <video> attach() without detach() — media-element leak (VoiceStudyRoom.tsx:793-799) [RW-1]"
    - "B-2/B-3 implement: restore() setTimeout not ref-tracked/cleared — update-on-unmounted leak (useAudioOnlyFallback.ts:161-171) [RW-2]"
  passed_checks:
    - "2-layer screen-share grant + spec assertion updated in same change; RBAC gate unchanged, member-scoped, runs before mint"
    - "audio-never-dropped invariant holds + negative-path test present (useAudioOnlyFallback.test.tsx:298)"
    - "design fidelity: both adopted designs consumed, zero invented tokens"
    - "debounce 3s + manual-wins-over-auto-restore correct and tested"
    - "no scale gold-plating, no schema, no new deps; independent (non-author) review completed"
  adjudications:
    manual_toggle_deviation: "ACCEPTABLE V-CARRY — graceful-degrade metric met by auto+restore; adopted design omitted the manual control; enterManual capability exists + hook-tested. NOT part of rework surface."
  rationale: >
    Contract/security/migration are clean (no firing-grade failure): the token grant widened with its
    spec assertion in the same change, RBAC gate unchanged and member-scoped, secret server-side, audio
    invariant test-guarded, design-faithful with zero invented tokens, no scale gold-plating. The manual-
    toggle deviation is an accepted V-carry, not a materially-unmet AC. REWORK is scoped strictly to two
    same-class resource-lifecycle leaks (remote-share <video> attach-without-detach; restore() timer not
    cleared) that both land on the T-block's mandatory 2-participant live-verify path — I will not forward
    known media/timer leaks into the live test. Too small and well-scoped to ESCALATE, too real to APPROVE.
    Two cheap fold-in nits ride along; the manual toggle and other optional nits stay out to keep the
    surface minimal.
  next_action: REWORK_B (route RW-1 + RW-2 + 2 fold-ins to livekit-integration; re-run typecheck/lint/build + voice suites; re-gate B-6)
  verdict_complete: true
  rework_attempt_cap_remaining: 2
```
