# D-3 Gate Verdict — Wave 34 (Design block)

**Gate:** D-3 Review & adopt (Phase 2 — head-designer independent)
**Reviewer:** head-designer (fresh spawn; not the D-1/D-2 author, not the Phase-1 reviewers)
**Gaps under gate:** (1) screen-share-tile · (2) audio-only-state
**Artifacts:** `design/staging/screen-share-tile.html`, `design/staging/audio-only-state.html`
**Phase-1 verdicts:** screen-share-tile APPROVE/APPROVE (REVISE→refine-iter1→APPROVE) · audio-only-state APPROVE/APPROVE

---

## VERDICT: APPROVED

Both design gaps clear the D-3 bar. Both are bounded extensions of the adopted voice-study-room in-room surface, both are token-clean against DESIGN-SYSTEM.md (zero invented hex), both cover all brief-declared in-scope states, both hold dark-theme WCAG-AA contrast with designed focus/keyboard/live-region a11y, both honor every §10 keep-OUT, and neither introduces a blessable new reusable token. The Phase-1 residual nits are confirmed cosmetic and carry to B-block as build-fold items — none is a gate-blocking design defect.

---

## Per-gap gate result

### Gap 1 — screen-share-tile — APPROVED

| Heuristic | Result | Evidence |
|---|---|---|
| Token discipline (H-D-07) | PASS | Config maps 1:1 to §1/§4/§5. No invented hex; `hover:bg-emerald-400` removed at refine. |
| Prior-art continuity | PASS | Control cluster (mic/cam/screencast/leave, emerald focus rings, `shadow-pop`), tile fill/border, avatar language all match voice-study-room in-room tile+control language. |
| Screen-share dominance | PASS | `flex-1 min-h-0` share region owns ~85–90% canvas height; strip `shrink-0 h-[60px] md:h-[72px]`. Avatars demoted to overflow-scroll strip + `+N` badge. `max-w-[1000px] mx-auto` centered at 1440+, `w-full` fills below. |
| Clean revert | PASS | State 1 is the unchanged grid; share region simply absent from that DOM — no orphan tile. |
| All in-scope states | PASS | no-share, sharing-active, share-loading (`aria-busy`), own-share (triple-signalled: in-canvas panel + Stop Presenting + emerald `aria-pressed=true` + self-ring). |
| Dark-theme a11y | PASS | Labeled region `aria-label="Screen shared by Alice T."`; real `<button>` `aria-pressed` false→true; live-region `role=status aria-live=polite` with concrete announce string; focus-visible emerald rings; `prefers-reduced-motion` honored. |
| Keep-OUT / scope | PASS | No annotation, no multi-share grid, no quality selector, no window-picker UI, no recording. |

**Build-fold carries (non-blocking):**
- BF-1 Own-share decorative glow `bg-accent-emerald/5 blur-[120px]` (`:347`) is off-scale/un-tokenized. Prefer `--glow-subtle` or an emerald hairline in build.
- BF-2 `inner-hairline` shadow (`inset 0 1px 0 rgba(255,255,255,0.05)`, config `:64`) is a genuinely-new inset-hairline depth cue NOT in §5. It does not fragment the palette (no new color). Keep it a local build decision; do NOT promote to DESIGN-SYSTEM unless a second surface demonstrates reuse.
- BF-3 Stop-announce copy not shown (start-announce is). Trivial implementer mirror of the demonstrated pattern.
- BF-4 Own-share permission-denied / picker-cancel path — follow-up, not in brief §3's required four.

### Gap 2 — audio-only-state — APPROVED

| Heuristic | Result | Evidence |
|---|---|---|
| Token discipline (H-D-07) | PASS | Config maps 1:1 to §1/§4/§5. No invented hex; `danger` declared but correctly unused (degrade is amber, not danger). |
| Prior-art continuity | PASS | Auto banner genuinely REUSES the amber ConnectionStateIndicator semantic (§8 / §1 `--connection-reconnecting`): amber dot + "Poor connection" + `role=status aria-live=polite`. Not a new degraded style. |
| Audio-only calm | PASS | Amber (secondary accent), not danger. "Video paused locally to protect call quality" explains WHY. Mic-active reassurance. Real restore button in every state. Calm register matches prior-art. |
| Auto vs manual distinction | PASS | Auto = amber (system/bandwidth); manual = neutral surface (`ph-video-slash`, member-driven). Correct that manual is NOT amber. |
| All in-scope states | PASS | normal-hidden (no pixels by definition), auto, manual, restoring (disabled in-flight button + `aria-disabled`). |
| Dark-theme a11y | PASS | Every banner `role=status aria-live=polite`; real focusable `<button>` restore with emerald focus ring; disabled state dual-signalled; state in text+icon not color-alone; text-secondary sub-copy passes AA on surface-900. |
| Responsive (§5) | PASS | Text swaps + mic pill→icon on `sm:`; dedicated <375px proof block; `min-w-0`+`truncate`+`flex-shrink-0` prevent overflow. |
| Keep-OUT / scope | PASS | No per-track granular controls, no custom bandwidth-heuristic UI, no quality-tier selector, no persisted cross-session preference UI. |

**Build-fold carries (non-blocking):**
- BF-5 Auto banner uses `shadow-pop` where §5 reserves `shadow-pop` for modals/popovers and wants `shadow-sm` for inline cards. Switch to `shadow-sm` in build.
- BF-6 Restoring indicator uses `shadow-[0_0_15px_rgba(16,185,129,0.1)]` — off-scale arbitrary shadow. Prefer a `--glow-subtle`-family token in build.
- BF-7 (C1) Restoring state drops the "Mic active" reassurance; the audio invariant still holds — propagate the mic indicator for continuity.
- BF-8 (C2) Two icon-only mic affordances (Manual `sm:hidden` `:287`, responsive-proof `:376`) lack `aria-label`; propagate the labelled auto-state pattern (`:208`) in build.
- BF-9 (C3) `.tooltip-trigger` / `.tooltip` classes are inert placeholders — wire real tooltips per §8 Tooltip primitive or drop the classes.

---

## Independent checks beyond Phase 1

- **Full token cross-check** against DESIGN-SYSTEM §1/§4/§5 on both files: every hex, rgba, shadow, and radius traces to a token. Confirmed — Phase-1 "zero invented tokens" is accurate.
- **New-primitive scan (Action 8):** the only genuinely-new primitive across both files is `inner-hairline` (screen-share). It is a one-off inset depth cue, not a color, not yet demonstrated reusable across ≥2 surfaces. It does NOT meet the promote-to-source bar. **No token is blessed into DESIGN-SYSTEM.md this wave.** Both designs otherwise reuse existing primitives — matches the stated expectation (NO new token).
- **Adjacent-screen coherence:** both surfaces sit on the voice-study-room in-room canvas and reuse its header/control-cluster/tile/avatar chrome. No clash with persistent rail/sidebar. Consistent.
- **Nit-severity judgement:** all nine build-fold items are cosmetic, a11y-polish, or follow-up scope — none removes a required state, fragments the palette, fails contrast, or breaks keyboard/focus. Correct to carry, not block.

---

## Next action

PROCEED_TO_B — hand both adopted staging artifacts to head-builder with the nine build-fold carries (BF-1 … BF-9) attached to the implementation task. `inner-hairline` stays a local build decision (BF-2); revisit for promotion only if a second surface reuses it.

---

```yaml
head_signoff:
  verdict: APPROVED
  stage: D-3
  reviewers:
    screen-share-tile:
      plan-design-review: APPROVE   # REVISE pass1 → refine-iter1 → APPROVE (mean 8.7→9.3)
      ui-ux-pro-max: APPROVE
    audio-only-state:
      plan-design-review: APPROVE
      ui-ux-pro-max: APPROVE
  gaps_cleared: [screen-share-tile, audio-only-state]
  failed_checks: []
  new_tokens_blessed: []            # inner-hairline noted, NOT promoted — one-off, no demonstrated reuse
  build_fold_carries:
    screen-share-tile: [BF-1-decorative-glow, BF-2-inner-hairline-local, BF-3-stop-announce-copy, BF-4-picker-denied-followup]
    audio-only-state: [BF-5-shadow-pop-to-sm, BF-6-restoring-offscale-shadow, BF-7-restoring-mic-reassurance, BF-8-mobile-mic-arialabel, BF-9-inert-tooltip-classes]
  rationale: >
    Both gaps are token-clean bounded extensions of the adopted voice-study-room in-room
    surface, cover all brief-declared in-scope states, hold dark-theme AA contrast with
    designed focus/keyboard/live-region a11y, reuse existing primitives (amber
    ConnectionStateIndicator semantic for degrade; control-cluster/tile/avatar language for
    screen-share), keep the screen-share tile dominant with clean revert and the audio-only
    state calm/explains-why with a real restore path, and honor every keep-OUT. No blessable
    new reusable token. All Phase-1 residual nits are confirmed cosmetic build-fold items,
    not gate-blocking design defects.
  next_action: PROCEED_TO_B
  verdict_complete: true
  rework_attempt_cap_remaining: 2
```
