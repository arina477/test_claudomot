# D-3 Adopt — create-server

**Canonical path:** `design/create-server.html` (replaced the reverted 3-step wizard)
**Reviewer A (accessibility-tester):** REVISE → resolved in iter1 → APPROVE (re-confirmed)
**Reviewer B (ui-designer):** APPROVE
**head-designer gate verdict:** APPROVED (`process/waves/wave-7/blocks/D/gate-verdict.md`)

Single-step name modal matching `POST /servers {name}`. Six in-scope states + a too-long variant.
Token-clean; keyboard-reachable; dialog ARIA; emerald focus-visible rings.

Journey map: row 11 "Create server" already present; F7 flow prose corrected to single-step (Action 7).

```yaml
adoption_complete: true
canonical_path: design/create-server.html
design_system_tokens_added: [--glow-danger]
journey_map_updated: true   # F7 flow prose corrected (no new route)
```
