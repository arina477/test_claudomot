# Wave 15 — D-3 Verdict

**Reviewer:** head-designer (fresh spawn, agentId head-designer@D-3-phase2)
**Reviewed against:** process/waves/wave-15/blocks/D/review-artifacts.md
**Attempt:** 1  (first gate)

## Verdict
APPROVED

## Rationale

All three @mention design gaps clear the bar against their D-1 briefs, and I verified every load-bearing claim against the staging file directly rather than trusting the reviewer summaries. (1) The **mention-autocomplete popover** renders all in-scope states — results list, keyboard-active row, empty ("No members match"), and loading skeleton — reproduces `--shadow-pop` (`0 8px 24px rgba(0,0,0,0.5)`) exactly, sits on `study-800`/`study-900` elevated surfaces, and mirrors the reaction-popover open/close family per brief §8. (2) The **inline mention-pills** are genuinely distinct from each other and from the reaction-pill: self-mention uses `bg-emerald-500/10 text-emerald-300 ring-emerald-500/30` (the "this concerns you" academic accent), other-mention uses a muted `bg-study-700 text-zinc-100` chip, and both use `rounded-md` inline geometry — clearly separable from the `rounded-full h-7` reaction capsule, so no confusion risk. (3) The **unread-mention badge** is an emerald `rounded-full` count pill (`bg-emerald-500 text-study-950`) on the channel-sidebar row with a before/after clears-on-view pair and an emphasized channel name, distinct from a generic unread dot, and carries a proper `aria-label` ("2 unread mentions"). Token discipline is clean: every color, radius, and shadow traces to a DESIGN-SYSTEM primitive (the only raw hex in the file are the Tailwind palette definitions at the config head and the pre-existing scrollbar-thumb CSS) — no invented hex in markup. Contrast meets WCAG AA on all wave-15 text surfaces by calculation (self-pill ~5.8–9.6:1, other-pill 13.6–15.2:1, badge 7.8–8.1:1, empty-state `zinc-400` 7.02:1); the two genuine regressions introduced in the iteration-1 demo states (empty-state at `zinc-600`/`zinc-500`, skeleton at `study-700/80`) were caught by reviewer B and remediated in iteration 2 — DESIGN-PRINCIPLES rule 1 functioning exactly as intended. Structural integrity holds: all 9 `<article>` message rows are present including the tombstone (`aria-label="Deleted message"`, L301), confirming the v2 restoration of the 3 rows an earlier compose pass had dropped, and the 3 mention surfaces coexist without disturbing them. Visual hierarchy reads at a glance, spacing follows the system rhythm, and the surfaces are coherent with the adjacent rail/sidebar/composer chrome they compose onto. The adopted design introduces no new token — presence and emerald are already tokenized — so no DESIGN-SYSTEM addition is warranted. The Phase-1 dual-reviewer pair both returned APPROVE on iteration 2 within the 3-cycle cap, satisfying the matrix path to this gate.

## Token additions
No token additions. Self-mention emerald emphasis, the unread emerald badge, and the popover elevation all reuse `--accent-emerald`, `--shadow-pop`, `--radius-full`, `--radius-md`, and the `study`/`zinc` surface/text primitives already defined in `design/DESIGN-SYSTEM.md`. No new shadow class, radius variant, or color role required.

## Journey-map
No new route or screen. All three surfaces enhance the existing `design/server-channel-view.html` page (composer popover + message-row pills + sidebar badge). Action 7 entry not required at D-3; the behavioral additions (autocomplete picker, mention-pill rendering, unread-mention badge clear-on-view) fold into the T-9 Journey regeneration as enhancements to the already-mapped server-channel-view flow.

## Notes (non-blocking, for B-block)
- `aria-activedescendant` on the autocomplete `role="listbox"` — carry to B-block implementation (reviewer B minor, non-blocking).
- Reviewer A residual notes N2 (autocomplete inner-list padding sub-grid) and N3 (narrow-breakpoint sidebar badge-clip risk) are cosmetic/implementation concerns — developer handoff, do not block adoption.
- The `text-zinc-600` `ph-prohibit` icon at L303 is pre-existing decorative tombstone iconography (paired with the "This message was deleted" text label, so not a color-only signal); not a wave-15 mention surface and not the remediated empty-state — out of scope for this gate, no regression introduced this wave.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3
