# Wave 34 — P-4 Gate Verdict

**Block:** P (Product) — exit gate
**Wave:** 34 — FINAL M6 voice slice: screen-share (two-layer) + audio-only fallback
**Gating head:** head-product (fresh P-4 spawn)
**Milestone:** M6 (8702a335, in_progress, Class=product-feature) — these 2 tasks CLOSE M6's success metric
**wave_db_id:** 1946c399-faf6-40c3-80c9-69aac81531dd
**Mode:** automatic

---

## Verdict: APPROVED

Build-ready. Spec ACs are falsifiable for both blocks; the screen-share two-layer decomposition is correctly specified; the security-scope token-grant widening is correctly scoped (member-only, secret server-side, no new surface); and the live-verification mandate is baked into the ACs, not green-by-assertion. Every load-bearing claim in the plan verifies against the codebase and the LiveKit SDK docs. Proceed to D-block (design_gap_flag=TRUE) then B-block.

---

## Stage-exit checklist (all upstream boxes ticked from concrete artifacts)

**P-0 Frame**
- [x] Concrete user job / root cause: finishing voice (talk + screen-share + graceful audio-only degrade) for the remote-student-on-bad-wifi target. Root cause, not symptom.
- [x] Maps to one live bet + active milestone: M6 (Discord-displacer / in-house voice bet), cited by id.
- [x] Falsifiable: observable signal = M6 success metric (2 participants talk + screen-share renders/reverts + poor-bandwidth degrades/restores, live-verified).
- [x] problem-framer (REFRAME→PROCEED, two-layer catch applied) + ceo-reviewer (PROCEED HOLD-SCOPE) reconciled, not overridden. mvp-thinner (OK, floor_constraint false).

**P-1 Decompose**
- [x] Bundle = seed (screen-share) + one sibling (audio-fallback) — the last 2 unbuilt M6 metric clauses; both must ship together for the M6 metric to hold.
- [x] Every AC mvp-critical (mvp-thinner ruled both critical; expansion candidates keep-OUT, not split — no thinner subset closes M6).
- [x] No task depends on an unbuilt task outside the bundle (audio-fallback falls back from the shipped camera/video track path, not from the screen-share build).

**P-2 Spec**
- [x] ACs enumerated + independently verifiable for BOTH blocks (see § Gate-on findings 1).
- [x] Empty/loading/error/offline states: covered via edge-cases (permission-denied → idle button; sharer disconnect → clean track cleanup; quality flap → debounce; audio-only + incoming share → not auto-subscribed).
- [x] Non-goals explicit: keep-OUT enumerated per block (no annotation/multi-share/quality-selector/custom-picker/recording; no per-track-granularity/custom-heuristics/quality-tiers/persisted-pref).
- [x] Auth/capability surface flagged: token-grant widening → security-scope + T-8 re-probe (see finding 2).
- [x] Full spec contract embedded as fenced YAML at head of primary task e9cd341a.description (verified via DB read).

**P-3 Plan**
- [x] Reuses established architecture: server-side member-gated mint + short-lived room-scoped token (unchanged), @livekit/components-react client (installed w31), static grant (not per-participant dynamic — correctly rejected as over-engineering). No parallel path.
- [x] No unneeded infra: no schema, no new dep, no Redis/multi-replica/billing. Client-heavy; API change is one line + one spec assertion.
- [x] Each plan step maps to a bundle task + observable artifact (B-2 grant → unit assert; B-3 client → screen-share render/revert + audio-fallback; T-block → live 2-participant).

**P-4 Gate**
- [x] Every upstream box ticked from artifact, not inference (all four stage files + DB spec read this turn).
- [x] Load-bearing claims verified (see below) — no reviewer-pool drift unresolved.
- [x] design_gap_flag=TRUE correctly set → D-block handoff (2 new UI surfaces).

---

## Gate-on findings

**1. Spec quality — ACs falsifiable, both blocks: PASS.**
- Screen-share TWO-LAYER correctly specified: (a) token-grant AC ("canPublishSources includes SCREEN_SHARE[+_AUDIO]; client-only publish NOT server-rejected; non-members still can't mint") + (b) the :156 spec-update named explicitly in contracts.api + (c) client publish/subscribe/prominent-tile. Distinct prominent tile is testable (visually emphasized vs avatar tiles; D-block designs it). Clean revert testable (track unpublish → tile removed → normal layout, no orphan/error).
- Audio-fallback: audio-never-dropped invariant is an explicit AC ("Audio is never dropped... local audio publish + remote audio subscription stay active throughout"). Dual trigger (ConnectionQuality→Poor OR manual toggle) specified. Restore path specified (manual affordance OR ConnectionQuality→Good re-subscribes). Debounce on flap in edge-cases.

**2. SECURITY-SCOPE gate (token capability change) — PASS, conditions carried to T-8.**
Verified against codebase:
- (a) Only members get the widened grant: RBAC `canViewChannelById → 403` is Step 1 and FIRST (voice-token.service.ts:94-96), grant-independent. Widening `canPublishSources` does NOT touch the mint gate — the wave-31 uniform-403 gate is unchanged; non-members still can't mint. CONFIRMED.
- (b) Secret stays server-side: token shape unchanged ({token,url}); API secret never crosses to client; only the grant capability widens. CONFIRMED (no client-side secret introduced).
- (c) No new endpoint/attack surface: same voice/token endpoint; no new route. CONFIRMED.
- **T-8 re-probe carried (mandatory):** member token includes screen_share (+ screen_share_audio); non-member → 403. Serialization strings per livekit.md:75/397 = 'screen_share' / 'screen_share_audio'.
- **≥2 Phase-2 iterations rule:** NOT forced pre-emptively. The 2nd iteration is triggered ONLY if the FIRST Phase-2 pass BLOCKs with >2 medium+ findings. Noted as a rule, not a gate condition here.

**3. Live-verification mandate (ceo, LOAD-BEARING) — PASS, baked into ACs.**
Both blocks carry an explicit LIVE-VERIFIED AC marked non-negotiable: screen-share = "real 2-participant test... passes against prod/staging LiveKit, not just mocked unit tests"; audio-fallback = "simulated poor-bandwidth / ConnectionQuality-Poor path... proves inbound video unsubscribes while audio continues, and the restore path re-subscribes." Achievable: LiveKit keys LIVE on Railway (founder-provided this session, both services redeployed); 2 fixtures + real screen-share + simulated ConnectionQuality (organic throttle is non-deterministic → simulate, correctly specified). This is green-by-behavior, not green-by-assertion.

**4. Scope — PASS.**
Override-ship legit: metric-closing (last 2 M6 clauses), mvp-thinner ruled expansion keep-OUT, floor_merge_attempt=0, no BOARD needed (wave-24 do-not-relitigate precedent). keep-OUT present both blocks (no annotation/multi-share/recording; no per-track-granularity/custom-heuristics/quality-tiers/persisted-pref). design_gap_flag=TRUE correct (screen-share tile + audio-only-state UI = 2 new surfaces on the adopted voice-study-room).

**5. Plan soundness — PASS.**
B-2(grant) ∥ D-block → B-3(client) sequencing correct: client publish depends on the grant (else server-rejected) AND the adopted design. livekit-integration routing correct (its domain = exactly LiveKit token + client tracks; in AGENTS.md). SDK surfaces verified real against livekit.md: canPublishSources string serialization ':75/:397', setScreenShareEnabled ':311', ConnectionQuality + setSubscribed referenced. Codebase claims verified: voice-token.service.ts:137 grant, :156 spec assertion, VoiceStudyRoom.tsx:114 video={false}.

**6. M6-close forward flag (ceo) — CARRIED, not a P-4 blocker.**
After this ships + live-verified, M6 metric MET → N-block CLOSES M6 (in_progress→done, dispose non-metric child tasks to unassigned queue per M5-close pattern) → pivot to M7 (privacy/notifications/launch-polish, H1, credential-independent, finishes MVP). Forward flag only; does not gate P-4.

---

## Load-bearing claim verification (this turn, against codebase + SDK docs)

| Claim | Source | Result |
|---|---|---|
| Grant = [TrackSource.MICROPHONE] only; supersedes canPublish; excludes screen_share | voice-token.service.ts:137 (+ comment :135-136) | VERIFIED |
| RBAC 403 gate is FIRST + grant-independent (non-member still 403) | voice-token.service.ts:94-96 | VERIFIED |
| Spec :156 asserts ['microphone'] (the assertion to update) | voice-token.service.spec.ts:156 | VERIFIED |
| Client has video={false}, no screen prop | VoiceStudyRoom.tsx:114 | VERIFIED |
| canPublishSources serializes 'screen_share'/'screen_share_audio' | livekit.md:75, :397 | VERIFIED |
| setScreenShareEnabled(boolean) exists | livekit.md:311 | VERIFIED |
| ConnectionQuality + setSubscribed subscription control real | livekit.md (referenced) | VERIFIED |

No hallucinated surfaces. No spec-vs-bet drift (spec ⊆ M6 metric; keep-OUT holds the wedge). No architecture-blind path. No gold-plating (0-user scale infra absent).

---

## Handoff

- **design_gap_flag: TRUE** → D-block fires next (screen-share prominent tile + audio-only-state banner/pill + restore control; bounded extensions of design/voice-study-room.html, dark-theme tokens).
- Then B-block: B-0 branch → B-1 SKIP → [B-2 grant ∥ D-block] → B-3 client → B-4/5/6.
- **Carried to downstream stages (non-negotiable):**
  1. `security-scope`: T-8 re-probe — member token includes screen_share; non-member 403; secret server-side. (≥2 Phase-2 iterations only if first pass BLOCKs with >2 medium+ findings.)
  2. `live-verification-mandatory`: T-block MUST live-test 2 participants against real LiveKit — screen-share render/revert + poor-bandwidth degrade/restore. No green-by-assertion.
  3. `M6-close→M7`: N-block closes M6 after live-verified ship, pivots to M7. (Forward flag, not this gate's concern.)

---

```yaml
head_signoff:
  verdict: APPROVED
  stage: P-4
  reviewers: {}   # P-4 load-bearing checks performed in-gate against codebase + SDK docs; reframe reviewers (problem-framer/ceo/mvp) reconciled at P-0
  failed_checks: []
  rationale: >
    Multi-spec override-ship (metric-closing M6 slice) is build-ready. Screen-share two-layer
    (token grant + :156 spec update, then client publish/subscribe/prominent-tile) and audio-only
    fallback (dual-trigger, audio-never-dropped invariant, restore path) both carry falsifiable ACs
    including explicit non-negotiable LIVE-VERIFIED ACs. Security-scope token-grant widening verified
    member-only (RBAC 403 gate is grant-independent), secret server-side, no new surface — T-8 re-probe
    carried. Every load-bearing claim verified against voice-token.service.ts:137/:94-96/:156,
    VoiceStudyRoom.tsx:114, and livekit.md:75/311/397. design_gap_flag=TRUE correct. No drift, no
    gold-plating, no architecture-blind path.
  next_action: PROCEED_TO_D-block
  verdict_complete: true
  rework_attempt_cap_remaining: 2
  carried_flags:
    - security-scope: "T-8 re-probe: member token includes screen_share; non-member 403; secret server-side. 2nd Phase-2 iteration only if 1st BLOCKs with >2 medium+ findings."
    - live-verification-mandatory: "T-block live-test 2 participants vs real LiveKit: screen-share render/revert + poor-bandwidth degrade/restore. No green-by-assertion."
    - M6-close-to-M7: "N-block closes M6 (in_progress->done, dispose non-metric children) after live-verified ship, pivots to M7."
  design_gap_flag: true
  handoff: D-block
```

---
## P-4 Phase 2 — reviewer pool (appended by orchestrator)
**karen — APPROVE.** All 7 load-bearing claims VERIFIED against code + installed SDK typings: mic-only grant voice-token.service.ts:137 (canPublishSources supersedes canPublish — problem-framer catch correct); :156 asserts ['microphone'] (reds on widening); RBAC uniform-403 gate :94-100 runs FIRST + grant-independent (members get screen_share, non-members still 403); SDK surfaces real (SCREEN_SHARE/SCREEN_SHARE_AUDIO in grants.ts:14,16,67; setScreenShareEnabled livekit.md:311; ConnectionQualityChanged/connectionQuality/setSubscribed in installed livekit-client typings); VoiceStudyRoom.tsx:114 video=false base; deps installed (w31); livekit-integration AGENTS.md:80. Antipatterns clean (2-layer honored, keep-OUT honored). Non-blocking: SDK doc lacks ConnectionQuality/setSubscribed (livekit-integration append at B-3).
**jenny — APPROVE.** All 6 drift checks MATCH: closes M6 metric exactly (screen-share + audio-fallback = last 2 clauses); token change strictly ADDITIVE (uniform-403 gate + secret-server-side + {token,url} shape all preserved); keys-live decision consistent with live-verify mandate (not re-opening LiveKit decision); journey-map F4:225 ALREADY anticipates screen-share + low-bandwidth-downgrade in its KEEP-OUT (promotion, not new invention — T-9 registers); design_gap TRUE correct; keep-OUT aligns w30 decomposition deferrals. Non-blocking: voice-token.service.ts header comments :19/:30 ("microphone only") go stale post-widening → B-6/L-1 doc sweep.
**Gemini — see exit code above (degradable: UNAVAILABLE=pass).**

### Phase 2 disposition + P-4 FINAL: see below.
Gemini: UNAVAILABLE (degrade-pass).
Phase 2 disposition: PASS (karen APPROVE + jenny APPROVE + Gemini degrade). No BLOCK → security-scope forces no 2nd iteration.

## P-4 FINAL: APPROVED → design_gap_flag=TRUE → D-block
Carries to D/B/T/N: [B-2] update voice-token.service.spec.ts:156 in the same change as the grant widen; sweep stale header comments (voice-token.service.ts:19/:30). [B-3] livekit-integration append ConnectionQuality/setSubscribed to livekit.md (doc gap). [D-block] design the screen-share prominent tile + audio-only-state banner/restore. [T-block] live-verify NON-NEGOTIABLE (2-participant real screen-share render/revert + poor-bandwidth degrade/restore). [T-8] re-probe member token includes screen_share, non-member 403. [N-block] close M6 (metric met) → M7. [T-9] register screen-share tile + audio-only state in F4.
