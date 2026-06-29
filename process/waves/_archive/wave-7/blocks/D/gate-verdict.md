# Wave 7 — D-3 Verdict

**Reviewer:** head-designer (fresh spawn, delegated owner of the wave-7 D-block recovery)
**Reviewed against:** process/waves/wave-7/blocks/D/review-artifacts.md
**Attempt:** 1 (first gate)

## Verdict
APPROVED

## Rationale

Both design gaps clear the bar. This was a recovery of two canonical designs lost in a worker
restart against a known, previously-APPROVED target; both were re-derived from the spec
(`POST /servers {name}`; `GET /servers`; `GET /servers/:id`) and the existing visual language in
`design/direction.html` + `design/app-home.html`.

**Gap 1 — create-server (`design/staging/create-server.html`).** Correctly re-scoped from the
reverted, data-model-ahead 3-step wizard (icon upload + template picker + channel editor) to a
single-step name modal that matches the API exactly: one server-name input → Create, with the
default "General" category + `#general` seeded server-side (the modal does not ask about channels).
All six in-scope states render (default, valid-input, validation-error, loading, server-error,
success) plus a dedicated too-long (>100) variant. The dual-reviewer pass returned ui-designer
APPROVE and accessibility-tester REVISE on one BLOCKING focus-state defect (state-3 error input
lacked a visible focus indicator, WCAG 2.4.7); that defect — and every non-blocking concern — was
resolved in iteration 1 (1 of 3 cap) and re-confirmed. Token discipline is clean: every hex/rgba
maps to a DESIGN-SYSTEM token; the only repeated derived value is the error-state focus ring
`rgba(239,68,68,0.4)`, which mirrors the existing `--glow-focus` pattern exactly.

**Gap 2 — server-rail-sidebar (`design/staging/server-rail-sidebar.html`).** Regenerated the
app-shell rail + channel sidebar against real data with full state coverage (rail
loading/empty/loaded; sidebar no-server/loading/loaded/error), `#general` visible under a "General"
category, and a + create affordance at the rail bottom. Both reviewers returned APPROVE. Critically,
the prior-art AA failure the brief flagged is fixed: category headers use `--text-secondary`
(≈7:1 on `--surface-900`), not the faint `text-zinc-500`/`--text-muted`. Scope is held — NO M3
chrome (no composer, message list, voice, presence, or member list); the content pane is an inert
out-of-scope placeholder.

Both designs are keyboard-reachable with visible emerald focus-visible rings, correct dialog/list
ARIA, and are consistent with the persistent chrome in adjacent screens.

## Design-system token addition (blessed)

Add **`--glow-danger: 0 0 0 2px rgba(239,68,68,0.4)`** to `design/DESIGN-SYSTEM.md` § 5 Elevation.
Reusability rationale: this is the danger-semantic analogue of the existing `--glow-focus` emerald
ring, applied to every error-state / invalid form control across the app (not a one-off). It was
already present in the prior create-server config; promoting it to source converts an inline
pattern into a named token and prevents future fragmentation. This is the ONLY token added; no
other new colors, spacings, radii, or shadows were introduced.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3
