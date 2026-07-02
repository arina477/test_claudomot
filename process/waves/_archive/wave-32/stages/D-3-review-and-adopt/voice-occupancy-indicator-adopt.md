# D-3 Adopt — voice-occupancy-indicator

- **Canonical path:** design/voice-occupancy-indicator.html (git mv from design/staging/)
- **Phase 1 verdicts:** /plan-design-review APPROVE (brand 10, a11y 10, responsive 10) · /ui-ux-pro-max APPROVE (§9 9/9, tokens+icons clean) — after 2 refine iterations.
- **Phase 2 verdict:** head-designer APPROVED (agentId afed325a1ed952d0b, attempt 1) — verified count-chip byte-match :272-275↔prior-art :278-281, zero invented tokens, no keep-OUT leakage, dark-theme a11y clean.
- **Journey-map (Action 7):** SKIPPED — the occupancy indicator is a component on the EXISTING voice pre-join surface (no new route/screen). T-9 Journey will register the affordance + the GET /channels/:channelId/voice/participants endpoint into F4 (jenny P-4 carry).
- **DESIGN-SYSTEM tokens (Action 8):** NONE — head-designer blessed no new token; reuses existing Avatar/Badge/Empty-state primitives.
- **B-block build-polish carries (non-gating):** snap off-4px-grid `-space-x-[10px]`/`py-[9px]` to scale; optional desktop "studying now" visual cue; loading-skeleton avatar-count parity; primitive-instance mapping (Avatar/Badge).

```yaml
adoption_complete: true
canonical_path: design/voice-occupancy-indicator.html
design_system_tokens_added: []
journey_map_updated: false
```
