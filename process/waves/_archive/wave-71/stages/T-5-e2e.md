# T-5 — E2E (wave-71) [Pattern B — active, live prod] — the P0-fix + enrichment proof
ui-comprehensive-tester (Fixture A + B). All 4 scenarios PASS (≥2×, 0 flake).
| # | Scenario | Verdict |
|---|---|---|
| 1 | Member-row Block↔Unblock LIVE toggle (P0 fix) | PASS — after Block→confirm the row flips block-member-btn→unblock-member-btn LIVE (no reload, URL unchanged); full Block→Unblock→Block cycle 2×. POST /blocks 201 {blockedUserId}; DELETE /blocks/:id 204. The exact P0 (row stayed "Block") is FIXED + proven live. |
| 2 | Enriched blocked-users list — real names | PASS — row shows displayName 'studyhallfixtureb' + @studyhallfixtureb + 'ST' avatar initials, NO raw UUID. GET /blocks returns blockedUser{userId,displayName,username,avatarUrl}. Loading skeleton + empty state confirmed. |
| 3 | Own-row suppressed (spec-D isSelf) | PASS — self row no block/report; other row has them. |
| 4 | Cross-surface consistency (shared useBlocks store) | PASS — block from member row appears in settings without refresh; unblock from settings flips member row back to Block. |
0 console errors. Prod cleaned (unblocked B, GET /blocks []).
## Findings → V-2
- MINOR (a11y, not this wave's scope): member-row moderation/block affordances are hover-only + need a wide viewport (~1600px) — intended hover-reveal UX; flag for a future accessibility pass. Non-blocking, → V-2 note.
```yaml
test_pattern: active
skipped: false
testers_spawned: 1
scenarios: [{id:1, verdict:PASS},{id:2, verdict:PASS},{id:3, verdict:PASS},{id:4, verdict:PASS}]
flakes_observed: []
findings:
  - {severity: MINOR, scenario: hover-only-affordance, description: "member-row block/mod affordances hover-only + wide-viewport; a11y future pass → V-2"}
```
