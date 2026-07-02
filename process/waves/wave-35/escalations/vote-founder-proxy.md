```yaml
vote: APPROVE A
verdict: APPROVE Path A — enforce profile-visibility now, capture who-can-DM as an honestly-labeled deferred preference with a ship-trigger, and amend M7's metric to match the roadmap
seat: founder-proxy
seat_number: 7
grounding_citations:
  - source: product-decisions
    entry: "[2026-Q2] wave-22 — assignment organizer authz reuses manage_channels (dedicated manage_assignments deferred)"
    relevant_quote: "the dedicated flag = a roles-system migration ... net scope, additive + risk-free to add later ... Trigger that flips it MATERIAL: the first non-owner assignment-organizer role ... → add manage_assignments then."
  - source: product-decisions
    entry: "[2026-Q2] wave-28 — invite-code rotate is owner-ONLY (conscious bypass of the reserved manage_server RBAC flag)"
    relevant_quote: "structurally a least-privilege drift from the delegable-RBAC model ... valid but doesn't fire today. Trigger that flips it MATERIAL: the first non-owner manage_server role granted ... a one-line swap, no data migration."
  - source: product-decisions
    entry: "[2026-06-29] N-1 wave-9 seed priority — BOARD binding conditions"
    relevant_quote: "Invite-revoke ... must surface an honest 'this link no longer works' affordance ... and a path to request re-invite."
  - source: founder_bets
    bet: "Academic tools + offline-first win students from Discord"
    relevant_quote: "H1 — desktop MVP (group servers, text channels, real-time messaging) usable by one class cohort."
reasoning: |
  Path A is the founder's own recurring pattern applied to a new surface: when a control is structurally correct
  but has nothing to enforce at 0 users (manage_assignments wave-22, manage_server/invite-rotate wave-28), the
  documented disposition is ship the buildable-now minimal, persist the fuller mechanism, and record an explicit
  trigger that flips it material later — exactly "enforce profile-visibility now, capture who-can-DM as a persisted
  preference, enforce it when DMs (feature #21) ship." The founder bet scopes H1 to group servers/channels/messaging;
  DMs are explicitly H2-deferred on the roadmap, and the founder has consistently honored H2 deferrals (Stripe,
  compliance) rather than expanding a milestone to hit a literal metric clause. The "honestly-labeled preference"
  detail also matches the founder's documented preference for honest affordances over dead/fake controls (wave-9
  honest revoke affordance, wave-23 "honest 403 not a dead button"). Path B — pulling the H2 DM subsystem into the
  last H1 milestone to satisfy a metric literally — is the gold-plating-at-0-users / scope-expansion anti-pattern
  the BOARD and founder-proxy have repeatedly rejected. Amending the metric to reflect the roadmap (not vice versa)
  is consistent with M6/M5 closures being judged against what was actually buildable and shipped.
confidence: high
hardstop_threshold_check: |
  Direct signal present — the wave-22 and wave-28 conflation-deferral entries are near-identical precedent (deferred
  mechanism + documented material-trigger), so no HARD-STOP; grounding is unambiguous, not extrapolated.
```
