# Wave 41 — D-3 Verdict

**Reviewer:** head-designer (fresh spawn)
**Reviewed against:** process/waves/wave-41/blocks/D/review-artifacts.md
**Gap:** member-moderation (educator light-moderation UI — member timeout)
**Staging:** design/staging/member-moderation.html
**Brief:** process/waves/wave-41/stages/D-1-brief/member-moderation-brief.md
**Attempt:** 1  (first gate; both dual reviewers APPROVE at iteration 1)

## Verdict
APPROVED

## Rationale

The mockup is adoptable and clears the D-block bar against every failure mode I own. It is briefed against a real user job (§1: an educator with `moderate_members` times out a member for a bounded duration and can see who is currently timed out) and the surface it lives on is named and correct (§2: the right-hand member roster panel of the shipped `server-channel-view`, in-panel overlay, no new route). It is not a job-less brief and not a pseudo-variant — the design encodes a genuine interaction decision (progressive-disclosure kebab → role=menu popover → duration sub-view, with a distinct back-navigable duration selector rather than a flat list). Token discipline holds: every surface, text, radius, shadow, and accent value maps to a `DESIGN-SYSTEM.md` primitive — surface-950/900/800/700/600/500, hairline/hover borders, the three text tiers, `--accent-emerald` (presence/focus/success), `--accent-amber` (`#f59e0b`, the muted/timed-out indicator per the warning mapping), `--danger` `#ef4444` as fill/border ONLY, and critically `--danger-text` `#f87171` for danger text sitting on the `danger/10` tint (the "Time out member" item, the error-view body, the warning glyph) — which is exactly the AA remediation the design system documents (6.30:1 vs. `#ef4444`'s failing 3.93:1 on that tint). No new token is introduced; `design_system_tokens_added` is empty as expected. The popover reuses the shipped `role="menu"` surface pattern (`bg-study-700`, radius-md, `shadow-pop` = the shipped `0 8px 24px rgba(0,0,0,0.5)`, hairline ring) — no new popover system is forked. The member row faithfully extends the shipped roster: `p-1.5 rounded-md`, `space-y-0.5` rows, `mb-3` uppercase-muted group headers, `gap-3` avatar+name, the `-bottom-0.5 -right-0.5 w-3 h-3` presence dot in a surface-toned ring — the two prior blockers (row-spacing fidelity + presence-ring + a11y arrow-key menu nav + `sr-only` muted text) are resolved. Hierarchy reads at a glance without AI-slop: the roster is the dominant content, the kebab is a quiet hover/focus affordance (not an always-on loud control), the destructive action is restrained danger-on-tint rather than a full red fill, and the timed-out state is a calm amber glyph with a soft glow plus a name-tint and grayscale avatar — academic and low-noise, not a Discord mod-hammer. All in-scope states from §3 are present and reachable in one artifact: default (moderator vs. the Pane-5 non-moderator view that correctly shows the public muted badge but NO controls), menu-open (Time out / Remove timeout branching on `data-is-muted`), duration popover (5m/1h/1day), timed-out (amber `speaker-x` + muted tint), loading (inline spinner on the acting item), and error (cannot-moderate-above-you inline sub-view, menu stays, row unchanged). Focus and keyboard are designed, not left to the browser: `glow-focus` emerald ring on every interactive element, roving-tabindex arrow-key/Home/End menu nav, Esc-close with focus return to the trigger, outside-click close, and `aria-haspopup`/`aria-expanded`/`role=menu`/`sr-only` labels. It is coherent with the persistent chrome — the same server rail, channel sidebar, canvas, and member-panel `study-900` fill and 14px header rhythm as adjacent shipped screens. Two intentional divergences from the shipped roster (row hover `bg-study-800` where the shipped roster uses `bg-study-700`, and a `group-hover` recolor of the presence-dot ring to stay seamless with the hovered row) are both DESIGN-SYSTEM surface tokens applied to a differently-toned panel context and read as fidelity refinements, not fragmentation — they do not fork the theme. The four reviewer handoff annotations (aria-label on `role=menu`; `prefers-reduced-motion` guard on popover/spin animations; `transitionend` in place of `setTimeout` for the close-race; a unique id for the injected muted icon — which the JS already does via `anim-icon-${id}`) are all B-block implementation polish, not design-system or contrast defects, and are correctly non-blocking for adoption. No blocking accessibility finding remains; danger contrast, focus states, and keyboard operability all pass at the design level.

## Canonicalization
- **Canonical target:** design/member-moderation.html  (`git mv` from design/staging/member-moderation.html)
- **DESIGN-SYSTEM.md token additions:** none (all values map to existing primitives; `--danger-text` reuse is the documented on-tint remedy, not a new token)
- **user-journey-map update:** not required — no new route/screen; in-panel overlay on the existing server-channel-view member panel
- **B-block handoff (non-blocking a11y polish, carry into Build):**
  1. Add `aria-label` to the `role="menu"` popover container.
  2. Add a `prefers-reduced-motion` guard disabling `popover-enter/exit`, `chill-spin`, and the WAAPI view-switch (DESIGN-SYSTEM §6 requires it).
  3. Replace the `setTimeout(…, 150)` close teardown with a `transitionend` listener to avoid the animation/close race.
  4. Keep the injected muted-icon id unique per member (already done via `anim-icon-${state.activeRowData.id}`) — verify no collision when re-muting the same row.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3
