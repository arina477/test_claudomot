# D-3 Adopt — focus-room-panel
- **Canonical:** design/focus-room-panel.html (git mv from staging).
- **Phase-1:** ui-designer APPROVE + accessibility-tester APPROVE (iter 1, after one REVISE→refine: 3 a11y fixes).
- **Phase-2 head-designer:** APPROVED (ab304052) — token-disciplined (zero invented hex, --glow-focus reused), scope-fenced (no voice/history/scheduling/moderation/whiteboard/timer-redesign), 7 states distinct, body-doubling clear (48px named roster vs ambient timer), WCAG AA. No new tokens (.room-card = the brief-permitted class; .roster-grid = layout util).

## B-block note (non-blocking)
- The `.btn` transition value is malformed (`transition: transition-colors 150ms ease`) — a VERBATIM carry from design/study-timer.html's base. Keep for parity in the focus-room panel; it's a pre-existing design-system-base issue (not wave-52-introduced).

```yaml
adoption_complete: true
canonical_path: design/focus-room-panel.html
design_system_tokens_added: []
journey_map_updated: false   # new surface (not route) — annotated at T-9
```
