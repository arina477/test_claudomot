# D-3 Adopt — voice-study-room

**Wave:** 31 · **Gap:** voice-study-room (audio-first first slice) · **Date:** 2026-07-01

## Adoption

- **Canonical path:** `design/voice-study-room.html` (git mv from `design/staging/voice-study-room.html`, iteration 1 refined artifact).
  - NOTE: the canonical path previously held a stale v9-onboarding-era mockup (full video-conferencing UI, never D-block-vetted, contradicting the audio-first keep-OUT scope). The `git mv -f` overwrote it — the adopted file is the wave-31 audio-first slice, not the onboarding artifact.
- **Adopted rationale (tied to the brief's job):** The brief's user job is connect-on-demand drop-in voice ("leave the study-room door open"). One variant was adopted because an audio-first minimal slice has a single sensible interaction model — Join click → audio tiles + mic/Leave — so the meaningful decision axis is the state machine (pre-join / connecting / in-room / alone / error), rendered as a labeled staging matrix inside the server-channel shell. Divergent layout variants would be pseudo-variation on a deliberately minimal surface. The design renders all 5 in-scope states, is token-clean (zero off-system hex, no amber, no glass, no spring), coheres with `server-channel-view.html` shell chrome, and passes WCAG AA dark-theme contrast (including the danger-on-tint pair, independently recomputed at 5.58–6.62:1).

## Reviewer verdicts

| Phase | Reviewer | Attempt 1 | Attempt 2 (post-refine) |
|---|---|---|---|
| P1-A | `/plan-design-review` | APPROVE | APPROVE |
| P1-B | `ui-ux-tester` (sub for `/ui-ux-pro-max`, documented in review-gate.md) | REVISE | APPROVE |
| P1-supp | `accessibility-tester` (head-designer a11y gate) | FAIL — BLOCKER adjudicated FALSE NEGATIVE (danger-tint is translucent; real contrast ~6.2:1 PASS); 1 valid MAJOR fixed in iter1 | (not re-spawned; adjudicated + fixed) |
| P2 | head-designer (fresh spawn) | — | **APPROVED** (gate-verdict.md) |

Phase 1 reconciled APPROVE/APPROVE on attempt 2. Phase 2 head-designer APPROVED. 1 of 3 refine iterations used.

## Deferred to B-3 (non-blocking; both reviewers + gate agree — NOT design defects)
- Full error cause→copy map (403 access-denied / 404 / 400 / 503 unavailable / generic) per brief §7 — the mockup proves the generic-timeout pattern; variants are copy-swaps.
- Narrow-viewport (<1024) channel-sidebar overlay drawer per brief §5 — shell-owned behavior; the room inherits it.
- Bump mic/Leave control height 40px→≥44px if the desktop app targets touchscreens (§9).
- Visually-hidden "mic on" label on active (non-muted) remote tiles (screen-reader positive signal).
- State-4 empty-copy `<div>` is a non-`<li>` sibling inside the participant `<ul>` — list-semantics tidy (both attempt-2 reviewers flagged; non-blocking).
- Strip the staging eyebrow ("P-1 Decompose · wave-31") and per-state matrix labels from the production `VoiceStudyRoom.tsx`.

## Journey map (Action 7)
Updated — F4 flow line (`command-center/artifacts/user-journey-map.md`) revised to the adopted audio-first first-slice flow + canonical design reference + deferred-scope note. Route `/servers/:id/voice/:channelId` already existed (no new route).

## DESIGN-SYSTEM tokens (Action 8)
None added. Brief was token-reuse-only; the gate-verdict explicitly declined to bless any new token (`danger.tint` is a local alias of the existing `--danger` primitive already documented as a pattern in §1). `design/DESIGN-SYSTEM.md` NOT touched.

---

```yaml
adoption_complete: true
canonical_path: design/voice-study-room.html
design_system_tokens_added: []
journey_map_updated: true
```
