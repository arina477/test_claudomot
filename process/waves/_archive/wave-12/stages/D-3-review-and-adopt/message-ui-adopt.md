# D-3 Adopt — Message UI (wave-12)

**Adopted variant:** V1 → canonicalized to `design/server-channel-view.html`
**Adopted at:** 2026-06-30
**Gap id:** message-ui (task d999d29c) · **Block:** d999d29c

## Adoption rationale (tied to the brief's user job)

The brief's job: *a student types a message in a study channel and the cohort sees it confirm in real time, with honest send-status when the network is flaky.* V1 is adopted because it is the only composition that renders all nine in-scope states on the existing 3-pane shell while encoding the load-bearing decision — **send-status legibility** — on multiple non-color axes (opacity + amber left-border + clock-icon + text for pending; danger border/tint + warning-icon + text + Retry for failed). That directly serves the offline-first wedge: the optimistic pending→sent/failed→retry loop is the visible face of the outbox. A single variant (not a fan-out) is correct here because the design system §8 fully specifies MessageRow/MessageComposer; alternative "variants" would have been restyles of one settled structure (pseudo-variants), which the gate forbids.

## What was adopted

- **MessageRow** — sent / pending (60% dim on avatar+name+body, full-opacity amber status) / failed (danger tint + Retry `<button>`). 8px row rhythm, `rounded-md`.
- **MessageComposer** — auto-grow textarea, study-900 fill, emerald focus ring, Enter-to-send + Shift+Enter newline hint, send disabled-when-empty / emerald-when-typing / spinner-when-sending.
- **MessageList** — `role="log" aria-live="polite"`, newest-at-bottom, loading-older `role="status"` affordance, empty-channel state.

## Token discipline

**No new design token introduced.** Every color/spacing/radius/shadow maps to an existing `design/DESIGN-SYSTEM.md` token (surfaces 950–600, accent-emerald/amber, danger #ef4444, border-hairline, radius-md/full, shadow-sm/pop, glow-focus). Verified by Reviewer B's token audit (zero invented hex) and a direct grep of the canonical file. → **DESIGN-SYSTEM.md unchanged.** `design_system_updates: []`.

## Consistency with adjacent chrome

The adopted view reuses the canonical 3-pane shell (server rail, channel sidebar, channel header, member list, minimal dark scrollbar) verbatim, so it is consistent with every adjacent `server-*` screen. Connection cue reuses the existing `role="status"` indicator pattern. No chrome regression.

## Accessibility posture (dark-theme, mandatory at adoption)

accessibility-tester audit run BEFORE adoption (review-gate Reviewer B). Every text/control pair clears WCAG AA on the dark canvas (lowest content pair: composer placeholder zinc-300 = 4.62:1; disabled send 3.2:1 within the UI ≥3:1 allowance). Failed-row text hardened to red-300 (~8.6:1) to remove a borderline 4.06:1 estimate. Focus states designed (not browser-default) on composer/send/retry/drawer-toggle; keyboard reach + ARIA roles complete; reduced-motion honored.

## Deferred (bug-design tag candidates — not blocking)

None newly surfaced. The §10 non-goals (reactions/threads/mentions/attachments/presence-typing/edit-delete) remain owned by later M3 waves' P-1.
