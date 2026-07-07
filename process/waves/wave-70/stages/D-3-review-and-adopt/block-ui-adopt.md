# D-3 Adopt — block-ui (wave-70, M14)
**Canonical path:** design/block-ui.html (git mv from staging).
## Reviewer verdicts (Phase 1, iteration 2)
- /plan-design-review (ui-designer): APPROVE (3 iter-1 items fixed — Tab-trap, danger-btnHover #991b1b, danger.text #f87171 registered; no regression).
- /ui-ux-pro-max (accessibility-tester): APPROVE (7 points confirmed in code; brief §9 all MET; WCAG AA).
## Gate (Phase 2, head-designer, agentId a8399b2fd14f044c6): APPROVED
All 8 checks verified in actual code (danger #b91c1c confirm / toast role=alert+status+aria-live really present / real Tab-Shift+Tab focus-trap / portal-safe bottom-sheet / --text-secondary informational / no self-row block affordance / tokens+Phosphor+Geist / §9 met). No token blessing (danger.* exist from wave-69).
## Cycle history
- Cycle 1: REVISE + APPROVE (A11y-1 Tab-trap + 2 token-class mismatches).
- Cycle 2: APPROVE + APPROVE → head-designer APPROVED.
## Non-blocking notes → B-block (B-3):
- confirm button + dropdown Block trigger lack explicit focus-visible:ring (--glow-focus); browser default ring applies. Add in B-3.
- self-row kebab lacks aria-hidden. Add in B-3.
## Journey-map delta: added the /settings/privacy blocked-users surface + the block affordance (Action 7).
```yaml
adoption_complete: true
canonical_path: design/block-ui.html
design_system_tokens_added: []
journey_map_updated: true
```
