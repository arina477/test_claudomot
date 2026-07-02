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

---

# B-6 Review — ATTEMPT 2 (re-gate after REWORK)

**Verdict:** APPROVED
**Scope of this attempt:** confirm resolution of RW-1 (media-element leak) + RW-2 (restore-timer leak) + the two fold-in nits. Everything PASSED at attempt-1 (2-layer screen-share, member-scoped grant, RBAC-before-mint, audio-never-dropped invariant, design fidelity, debounce/manual-wins, no gold-plating, independent review) stands — re-confirmed, not re-litigated.

## RW-1 — remote-share `<video>` attach() without detach() — RESOLVED
- Manual `<video ref={attach}>` with hand-rolled `track.attach(el)` is **GONE**. Codebase-wide grep for `.attach(` under `apps/web/src/shell/` returns zero matches — no manual attach without detach remains anywhere.
- Replaced by the SDK-managed `<VideoTrack trackRef={trackRef}>` from `@livekit/components-react` (import `VoiceStudyRoom.tsx:40`; used `:795-799` inside `RemoteShareView`). The component owns the attach/detach lifecycle — no leaked DOM node on remote-share start/stop cycles. Matches the documented lifecycle-managed path (`livekit.md:269`).
- **Prominent-tile design fidelity intact:** `RemoteShareView` still renders the dominant region `max-w-[1000px] mx-auto` (:784-785), surface `#0a0a0b`, border `rgba(255,255,255,0.06)`, emerald `#10b981` "Live Share" indicator with subtle-pulse — per `design/screen-share-tile.html`. `object-contain` on the video. Zero invented tokens. The swap is lifecycle-only; the tile is unchanged visually.

## RW-2 — restore() setTimeout not ref-tracked / not cleared — RESOLVED
- `restoreTimerRef` declared (`useAudioOnlyFallback.ts:73`).
- **Cleared before a new one is armed** at the top of `restore()` (:172-175) — idempotent re-entrancy safe.
- **Nulled on fire** inside the timer callback (:182).
- **Cleared on unmount** in the effect cleanup (:149-152), alongside the existing `poorTimerRef` clear — the lone exception attempt-1 flagged is now consistent with every other timer in the file.
- **New regression test present + green:** `useAudioOnlyFallback.test.tsx:298` — `'restore() timeout is cleared on unmount — no setState on unmounted component'`: enters manual → restore() → unmount before the 1 s fires → `vi.advanceTimersByTime(2000)` asserted `.not.toThrow()`. Directly guards the update-on-unmounted path.

## Fold-in nits — RESOLVED
- **"Mic active" pill:** the pointless duplicate-in-both-branches conditional is collapsed. The two remaining elements (`VoiceStudyRoom.tsx:1149-1160` desktop text pill `hidden sm:flex`; `:1180+` mobile icon badge `sm:hidden`) are legitimate responsive-variant siblings, not the duplication flagged at attempt-1. Correctly resolved.
- **`resumeVideoSubscriptions` docstring:** now reads "Re-subscribe to all remote video + screen-share publications … LiveKit ignores the call if already subscribed" (`useAudioOnlyFallback.ts:91-92`) — matches actual behavior; the misleading "only prior-subscribed" claim is gone.

## Audio-never-dropped invariant — RE-CONFIRMED (still load-bearing, still guarded)
- Both pause/resume loops still gate on `rPub.kind === Track.Kind.Video && VIDEO_SOURCES.includes(rPub.source)` (Camera + ScreenShare only); audio publications never enumerated for `setSubscribed` (`useAudioOnlyFallback.ts:84,97`). The negative-path invariant test survives at `useAudioOnlyFallback.test.tsx:324`. The RW-2 fix is timer-lifecycle only — no change to the invariant logic.

## Authoritative checks (re-run this attempt)
- `pnpm -w typecheck` → **4/4 packages successful** (shared + web + api), zero errors.
- `cd apps/web && npx vitest run` → **322 passed / 322 (19 files)**, zero failures. Includes the new RW-2 unmount guard and the audio invariant test. The single `act(...)` stderr in `voice-occupancy.test.tsx` is a pre-existing non-fatal warning in an unrelated test (test passes) — not introduced by this rework, not a regression.

## Carries into T / V / N (unchanged from attempt-1, re-stated for handoff)
- **T-block LIVE-VERIFY MANDATORY (ceo NON-NEGOTIABLE):** 2-participant real test against live Railway LiveKit — one publishes real screen-share, the other sees the prominent tile; sharer stops → tile reverts cleanly with no orphan/leak (RW-1 now fixed — verify no leaked media element across start→stop→revert cycles); poor-bandwidth degrade → audio continues → restore re-subscribes video.
- **T-8 token-grant re-probe:** members mint a grant including `screen_share`[+`_audio`]; non-member still uniform-403; secret stays server-side.
- **V-block:** manual-toggle disposition (wire `enterManual` to a control-cluster button + reachability of the manual-mode banner branch) — accepted V-carry, small follow-up / V-3 fast-fix, founder-facing UX call if surfaced.
- **N-block:** after live-verify passes, M6 metric MET → close M6 (in_progress→done, dispose non-metric child tasks to unassigned queue) → pivot to M7.

## Next
Phase 2 `/review` runs next.

```yaml
head_signoff:
  verdict: APPROVED
  stage: B-6
  attempt: 2
  reviewers:
    code-reviewer: "attempt-1 findings (2 MAJOR resource leaks) both resolved; no new defect introduced by the lifecycle-only fixes"
    code-quality-pragmatist: "attempt-1 nits (Mic-active dup conditional, misleading resume docstring) resolved; no new over-engineering"
  resolved_this_attempt:
    - "RW-1: manual <video> attach()-without-detach GONE (zero .attach( in apps/web/src/shell); replaced by SDK-managed <VideoTrack> at VoiceStudyRoom.tsx:795; prominent-tile design fidelity intact"
    - "RW-2: restore() timer ref-tracked (restoreTimerRef), cleared-before-arm + nulled-on-fire + cleared-on-unmount (useAudioOnlyFallback.ts:73,149-152,172-175,182); new unmount regression test at :298 green"
    - "fold-in: Mic-active pointless conditional collapsed (remaining desktop/mobile pair are responsive variants); resumeVideoSubscriptions docstring corrected to match behavior"
  re_confirmed:
    - "audio-never-dropped invariant holds; negative-path test intact (useAudioOnlyFallback.test.tsx:324)"
    - "2-layer screen-share, member-scoped grant, RBAC-before-mint, debounce/manual-wins, design fidelity, no gold-plating — all attempt-1 PASSES stand"
  checks:
    typecheck: "PASS — 4/4 packages, zero errors"
    web_tests: "PASS — 322/322 (19 files); includes RW-2 unmount guard + audio invariant"
  rationale: >
    Both attempt-1 REWORK items are genuinely resolved in code, not just claimed. RW-1: the hand-rolled
    attach()-without-detach is gone entirely (grep-verified zero manual attach in the shell tree), replaced
    by the SDK's lifecycle-managed <VideoTrack> — no media-element leak into the mandatory T-block live test;
    prominent-tile design tokens unchanged. RW-2: the restore timer is now ref-tracked and cleared on every
    exit path (arm, fire, unmount) consistent with the file's other timers, with a dedicated regression test
    proving no setState-on-unmounted. Both fold-in nits fixed; the audio invariant and all attempt-1 passes
    re-confirmed. Typecheck clean, 322/322 web tests green. No new issue surfaced. Both leaks off the
    live-verify-critical path — APPROVED.
  next_action: PROCEED_TO_C (Phase 2 /review runs next; then C-block PR & CI)
  verdict_complete: true
  rework_attempt_cap_remaining: 1
```
