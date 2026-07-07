# T-5 — E2E (wave-69) [Pattern B — active, live prod]
Testers: 2× ui-comprehensive-tester (partitioned: submission flow / inbox resolve loop). Prod web+api. Fixture A (owner of Fixture Proof Server ad62cd12).

## Scenario verdicts
| # | Scenario | criterion | verdict |
|---|---|---|---|
| 1 | Report a message (submit) | C-AC1 | PASS (mechanics) — POST /reports 201, correct target_type+id, reporter_id server-derived (NOT in body), success toast, dialog closes, double-submit disabled |
| 2 | Report a member (submit) | C-AC1 | PASS (mechanics) |
| 3 | Report a server (/discover) | C-AC1 | BLOCKED — /discover cold-start empty; affordance code-verified (non-blocker) |
| 4 | Validation + chrome | C-AC1/3 | PASS — empty-reason blocked (aria-invalid), Esc closes, focus-trap wraps, <640px bottom-sheet, 0/300 counter |
| 5 | Owner inbox visible+populated | C-AC2 | PASS (API-proven) — GET /servers/ad62cd12/reports owner→200, rows target/reason/reporter/time |
| 6 | Resolve dismiss → row leaves | C-AC2/3 | PASS (API-proven) — POST …/resolve {action:dismiss}→200, status→dismissed+resolved_by, leaves ?status=open list |
| 7 | Moderator-gate (negative) | C-AC2 | PASS (API-proven) — non-mod B → 403 "moderate_members required"; owner A → 200 |
| 8 | Inbox loading/empty (visual) | C-AC2 | BLOCKED — shared-Chrome-profile lock contention (test-infra, not product) |

## Findings → V-2
- **F1 (MAJOR, B-3 frontend defect) — own-content Report-affordance leak.** The message Report button appears on the user's OWN messages, and the member list shows Report on the user's own row (spec intent: non-own only). ROOT CAUSE (code-confirmed): `apps/web/src/shell/MainColumn.tsx:343` passes `currentUserId={profile?.username ?? null}` (a username string) but `MessageList` computes `isOwn` by comparing currentUserId against `msg.authorId` (a UUID) → isOwn ALWAYS false. Side effects: own-message Edit affordance missing; Delete shows the moderator-variant label; own content reportable. `profile?.userId` exists (used at MainColumn.tsx:296). FIX: one line — `currentUserId={profile?.userId ?? null}`. NON-SECURITY (backend stamps reporter_id from session; self-reports are harmless data; literal AC met). Pre-existing wiring bug exposed by the new report affordance. → V-2 classify (blocking→V-3 one-line fast-fix, or bug-frontend tag).
- (RESOLVED, not a finding) tester-2 raised whether the inbox fetches open-only — VERIFIED: ReportInbox.tsx:611 calls getServerReports(serverId, 'open') → ?status=open. Correct; dismissed reports do not persist.
- **F2 (LOW, test-infra — NOT product)** — all Playwright MCP instances share one Chrome profile; parallel testers serialize on the exclusive lock, blocking the visual portion of tester-2. Recommend --isolated profiles. No product impact.

## Cleanup carry
Tester-1 filed 5 test reports (status:open) on the fixture server: 305f4b95, cd0a2d04, ae76e5ea (message), ca337bbe, 75ec1fb4 (member→B). Tester-2 dismissed its own b01338a2. → clean up open test reports at T-block end (prod-clean rule).

```yaml
test_pattern: active
skipped: false
testers_spawned: 2
scenarios:
  - {id: 1-2, criterion_ref: C-AC1, verdict: PASS}
  - {id: 3, criterion_ref: C-AC1, verdict: BLOCKED-discover-empty}
  - {id: 4, criterion_ref: C-AC1/3, verdict: PASS}
  - {id: 5-7, criterion_ref: C-AC2/3, verdict: PASS-api-proven}
  - {id: 8, criterion_ref: C-AC2, verdict: BLOCKED-browser-lock}
flakes_observed: []
fix_up_cycles: 0
findings:
  - {severity: MAJOR, scenario: report-affordance, description: "own-content report leak — MainColumn.tsx:343 currentUserId=username should be userId; isOwn always false; → V-2"}
  - {severity: LOW, scenario: test-infra, description: "shared Chrome profile serializes parallel testers"}
```
