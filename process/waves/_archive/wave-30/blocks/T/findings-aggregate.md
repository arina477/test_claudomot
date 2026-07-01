# Wave 30 — T-block findings aggregate

Canonical V-2 input. All findings from T-1..T-9, severity-tagged, with evidence. This wave is a backend cron + email arc (M5 reminders), LIVE in prod. Two LOW/INFORMATIONAL non-blocking findings; zero critical/high.

---

## F30-T4-a — Email HTML render path not exercised by the integration tier (LOW, coverage-gap)

- **Layer:** T-4 integration (also T-2 unit boundary)
- **Severity:** LOW / non-blocking (coverage honesty, not a defect)
- **Boundary:** `EmailService.sendAssignmentReminder` HTML assembly.
- **Description:** `reminder-scan.spec.ts` replaces `emailService.sendAssignmentReminder` wholesale with a capture array and sets `RESEND_API_KEY_AUTH = undefined`. This is a legitimate collaborator stub at the network boundary (NOT mock-the-SUT — the LEFT JOIN, INSERT-RETURNING, and window math all execute for real against Postgres). Consequence: the HTML string assembly + UTC date formatting in `email.service.ts:43-93` is NOT covered by the integration test; it is covered only by the 4 `sendAssignmentReminder` unit tests (T-2). The integration tier asserts recipient selection (to-address + opts payload), which is the correctness-critical surface; the render is a leaf.
- **Evidence:** `apps/api/test/integration/reminder-scan.spec.ts:146-154` (stub); `email.service.ts:43-96` (uncovered by integration).
- **Why not blocking:** the send-decision logic (who gets reminded, once) is fully real-PG proven; email body is deterministic string interpolation with no branching beyond the null-key no-op, unit-covered. head-tester manually inspected the HTML: inline-styled, table-based, no external assets, no broken tags, exposes only title/due/serverName.
- **Disposition suggestion for V-2:** accept as documented coverage boundary. Optional future: a render-snapshot unit assertion (subject + body contains title/due/server, no `undefined`).

## F30-T8-a — No HTTP surface to probe; standard T-8 probes structurally inapplicable (INFORMATIONAL)

- **Layer:** T-8 security
- **Severity:** INFORMATIONAL (no action)
- **Description:** The reminder feature exposes NO HTTP route — NotificationsModule is a pure `@Cron` host (`providers` + `imports` only, no `controllers`). Standard T-8 probes (IDOR, CSRF, rate-limit, guard-stacking) are structurally inapplicable: there is no request to attack. Recipient scoping is enforced structurally in the query (`eq(server_members.server_id, assignment.server_id)`), not by a request-time guard — a cross-server leak would be a query-construction bug, audited clean at source. Secret grep (always-runs) returned zero credential leaks; only `RESEND_API_KEY_AUTH` as an env-var name appears in the diff.
- **Evidence:** `notifications.module.ts` (no controllers); `reminder-scan.service.ts:169-175` (server-scoped recipient WHERE); secret grep on `ac78386..81dc821` -> 0 leaks.
- **Disposition:** no V-2 action. Recorded for completeness of the T-8 judged-run.

---

## Carried context for V-2 (not new findings)

- **B-6 tracked follow-up 4905dc3a** (at-least-once retry / delivery guarantee) is ALREADY FILED at B-6 — do NOT re-file. Current design is send-once via `INSERT ON CONFLICT DO NOTHING RETURNING`: if the email network call fails AFTER the reminder row commits, the row still blocks a retry (at-most-once, not at-least-once). Deliberate, documented tradeoff for the single-instance Railway api; the row is the send-ledger. V-2 may reference 4905dc3a; it is not a wave-30 T-block finding.
- **Playwright MCP chrome-absent (67881a58)** — not applicable this wave (no E2E/layout stage ran); no bundled-chromium substitute needed.

## Summary

| Severity | Count |
|---|---|
| Critical | 0 |
| High | 0 |
| Medium | 0 |
| Low | 1 (F30-T4-a) |
| Informational | 1 (F30-T8-a) |

**findings_total: 2 - findings_critical: 0 - findings_high: 0**
