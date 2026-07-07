# T-5 — E2E (wave-70) [Pattern B — active, live prod]
ui-comprehensive-tester (Fixture A). All 4 block-flow scenarios PASS (≥2× each, 0 flake).
| # | Scenario | Verdict |
|---|---|---|
| 1 | Block a member (dialog → confirm) | PASS — POST /blocks 201 (blocker server-derived); dialog role=dialog+aria-modal+focus-trap+Esc; **mobile bottom-sheet <640px (anchored bottom, full-width, grab handle)**; danger confirm + ghost cancel; double-click disabled (1 row, no dup) |
| 2 | Own-row: no Block AND no Report (spec-D isSelf) | PASS — own row [] actions; other row [Report, Block, Moderate]. Spec-D regression ABSENT. |
| 3 | Blocked-users settings list (/settings/privacy) | PASS — rows + inline Unblock + empty state (shows UUID not name — known B-6 gap) |
| 4 | Unblock | PASS — DELETE /blocks/:userId 204; row leaves; affordance flips |

## Findings → V-2
- FINDING-1 (MAJOR, UX, B-3): after a successful block, the MEMBER-LIST row still shows "Block" (not "Unblock"/blocked indicator) — persists across reload. NOT a hard FAIL (block persists server-side; the /settings/privacy list DOES reflect it). Real UX inconsistency (re-block with no signal). FIX: cross-reference the blocks set in MemberListPanel to reflect blocked state. → V-2.
- FINDING-2 (LOW): blocked-users list shows raw UUID not display name (the pre-documented B-6 enrichment gap). → V-2.
## Cleanup: both test blocks unblocked; GET /blocks [] + empty-state confirmed.
```yaml
test_pattern: active
skipped: false
testers_spawned: 1
scenarios: [{id:1, verdict:PASS},{id:2, verdict:PASS},{id:3, verdict:PASS},{id:4, verdict:PASS}]
flakes_observed: []
fix_up_cycles: 0
findings:
  - {severity: MAJOR, scenario: block-affordance-state, description: "member-row doesn't reflect blocked state (always 'Block'); server+settings correct → V-2"}
  - {severity: LOW, scenario: blocked-list, description: "UUID not display name (B-6 enrichment gap) → V-2"}
```
