# D-2 Variants — voice-study-room

**Wave:** 31 · **Gap:** voice-study-room (audio-first first slice) · **Mode:** automatic

## Staging file
`design/staging/voice-study-room.html` (committed) — 26,283 bytes, self-contained (Tailwind CDN + Phosphor CDN + Geist Google Fonts; no local assets).

## Generation approach
Single `/aidesigner` generate pass (Recipe 1, non-streaming REST). Prompt assembled from: the full D-1 brief, prior-art excerpts (server-channel-view shell chrome lines 1-120 + invite-join CTA/focus-ring lines 100-200), the full DESIGN-SYSTEM.md, and a hard-scope block re-stating all 5 mandated states + the KEEP-OUT list. HTTP 200, `.content` extracted cleanly.

## Variant design decision
One variant generated (audio-first minimal slice has one sensible interaction model: connect-on-demand Join → in-room audio tiles + mic/Leave). The brief's decision axis is the state-machine (pre-join / connecting / in-room / alone / error), not competing layouts — so the staging file renders all 5 states as a labeled vertical staging matrix (invite-join "all states shown" convention) inside the 3-pane shell chrome. Generating divergent layout variants would be pseudo-variation on a deliberately minimal surface.

## Self-review against brief (pre-D-3 sanity, not a substitute for the gate)
- 5 states present + labeled: pre-join (L214), connecting (L243, aria-busy+spinner+sr-only), in-room populated (L271, audio tiles + own "(You)" tile + mic aria-pressed + Leave), in-room alone (L356, "No one else here yet — the door's open." + own tile), error (L409, role=alert + ph-warning-circle + Try again). ✓
- Audio-first tiles: avatar-initials/name only, NO camera. Emerald presence dot explicitly annotated "Not a speaking ring". ✓
- Token discipline: `study-*` namespace maps 1:1 to `--surface-*` hex; accent-emerald/danger/danger-text/danger-tint/shadows/glow-focus/glow-danger all match DESIGN-SYSTEM §1/§5 exactly. NO amber. NO glassmorphism/backdrop-blur. Default easing cubic-bezier(0.25,0.1,0.25,1) — no spring. prefers-reduced-motion respected. ✓
- KEEP-OUT scan (grep): only false-positives — "reconnect" inside font `preconnect`, "camera/screen-share" inside the KEEP-OUT negation prose. No actual leakage. ✓
- Focus discipline: `.focus-ring`/`.focus-ring-danger` on every interactive control; emerald glow-focus / danger glow-danger. Real `<button>`s. aria-pressed on mic; aria-busy on connecting; role=alert on error; aria-live on empty. ✓
- DESIGN-PRINCIPLE 1 (muted-on-dark contrast): danger-on-tint uses `--danger-text` #f87171 per §1. ✓

## /aidesigner warnings
None (HTTP 200, clean .content).

## Note for D-3 reviewers
The retry icon rendered as `ph-arrow-counter-clockwise` (a real Phosphor name; the brief suggested-list was non-exhaustive). Not a defect — flagging for the icon-name audit.
