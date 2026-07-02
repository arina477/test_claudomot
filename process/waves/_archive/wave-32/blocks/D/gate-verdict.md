# Wave 32 — D-3 Verdict

**Reviewer:** head-designer (fresh spawn, Phase 2 independent gate)
**Reviewed against:** process/waves/wave-32/blocks/D/review-artifacts.md
**Attempt:** 1  (1 = first gate)

## Verdict
APPROVED

## Rationale

The single gap — the pre-join voice occupancy indicator (`design/staging/voice-occupancy-indicator.html`) — clears the head-designer bar on every heuristic I gate on, and I confirmed the load-bearing claims against source rather than trusting the Phase-1 pair. **Count-chip continuity (prior-art coherence):** the populated-state chip (staging :272-275) is a byte-for-byte class match of the adopted in-room header chip (`voice-study-room.html:278-281`) — `ml-auto flex items-center gap-1.5 px-2 py-1 rounded bg-study-900 border border-border-hairline text-xs font-medium text-text-secondary` + `ph-users` (aria-hidden) + aria-hidden count span — so the pre-join surface reads as a genuine bounded extension of the wave-31 surface, not a stylistic fork. **Token discipline (H-D-07):** the Tailwind config (:30-63) is a copy of the adopted voice-study-room config; every color maps to a DESIGN-SYSTEM §1 token, zero invented hex, zero off-scale type sizes; the only bracketed values are dimensional (`w-[34px]`, `w-[42px]`, `-space-x-[10px]`, `py-[9px]`) — sizing utilities, not color/type/radius/shadow token forks — and the adopted prior-art surface itself already uses bracketed pixel dims (`w-[72px]`/`w-[26px]`/`w-[42px]`), so this is consistent with the established convention. **Keep-OUT/scope:** no in-room concerns leaked — pre-join avatars are plain bordered circles with no per-avatar presence dot (the emerald `animate-ping` at :201 is a staging section-label outside the panel), avatars are `tabindex=0` tooltip-only with `pointer-events-none` and no join affordance, no websocket, no occupancy history (brief §10 clean). **Dark-theme a11y:** all four occupancy regions carry `role="status" aria-live="polite"`; the populated roster is a single contiguous `sr-only` name+count readout (:224) sitting OUTSIDE the `aria-hidden="true"` visual tree (:227), so names survive the <1024 count-only degrade for AT users; every avatar (image, initials fallback, and the `+N` pill) carries `alt`/`aria-label` = display name; the error warning icon is correctly `aria-hidden="true"` and well-formed (:350 — the iteration-1 malformed-attribute defect is genuinely resolved); focus parity is designed via `:focus-within` + `focus-visible:ring-accent-emerald`, not left to browser default; `prefers-reduced-motion` zeroes motion. **Brief fidelity:** all four states render distinctly (loading skeleton, populated cluster + `+4` overflow, calm "door's open" empty, muted fail-soft error) and the Join control is reachable and fully enabled in every state including the error state ("Join Room Anyway"). The three residual items — off-4px-grid arbitrary spacing (`-space-x-[10px]`, `py-[9px]`×4), an optional sighted-desktop "studying now" cue, and loading-skeleton-count (3) vs populated-shown (4) parity — are low-severity, non-gating, and carry to the B-block as build-polish notes, not gate blockers. No new DESIGN-SYSTEM token is introduced or blessed: the design reuses existing primitives (Avatar, Badge/Pill count chip, Empty-state, VoiceRoomTile language) exactly as the brief §4 expected, so Action 8 is a no-op.

## DESIGN-SYSTEM token additions (Action 8)
None. The design introduces no new reusable token; it composes existing §1/§4/§5/§8 primitives. No token blessed. Action 8 must not fire.

## B-block build-polish carries (NON-gating — record, do not block adoption)
- **Off-4px-grid arbitrary spacing.** `-space-x-[10px]` (:230) and `py-[9px]` (:189/:280/:320/:356) sit off the DESIGN-SYSTEM §3 4px base. Snap avatar overlap to `-space-x-2`(8px)/`-space-x-3`(12px) and button padding to `py-2`/`py-2.5`. Cosmetic; `py-[9px]` repeats 4×.
- **Desktop count-meaning cue.** The sighted desktop chip shows a bare `8`; "studying now" lives only in the `sr-only` readout + narrow fallback. A small desktop "studying now" label would put the number's meaning into the sighted hierarchy (brief §11). Optional.
- **Loading-skeleton avatar count.** Loading shows 3 avatar placeholders; populated shows 4 — a minor potential layout nudge on first paint. Reserve the populated footprint / share a max-shown constant in the B-block implementation.
- **Primitive-instance mapping.** The empty-state icon frame, `+N` pill, and error sub-panel are hand-composed rather than declared instances of the §8 Avatar/Badge/Empty-state primitives. Visually correct; a mapping comment or component-instance in code would de-risk future maintenance.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 2
