# T-8 — Security (wave-30 M5 reminders) — JUDGED-RUN (light pass)

## Applicability decision + reasoning
This is NOT an auth/session/payment wave, so the strict T-8 skip rule would skip. BUT the feature (a) emails real users and (b) runs a cron that reads member data across servers. head-tester JUDGED to run a LIGHT, scoped T-8 pass rather than a blind skip — confirming the 4 security-relevant properties in the SHIPPED code, because "cron reads member data across servers + sends real email" is exactly the class where a query-construction slip leaks one server's data to another, or over-exposes PII. These properties were covered at B-6 + /review; T-8 re-confirms them at source rather than trusting the summary. This is a source-audit pass, NOT active HTTP probing — there is no HTTP surface to probe (the cron has no route), so IDOR/CSRF/rate-limit/guard-stacking probes are structurally inapplicable (F30-T8-a, informational). `auto_promoted: true` (touches the email/notifications boundary), applicable_probes = the scoped property set below + always-on secret grep.

## Property 1 — No cross-server recipient leak (server-scoped query) — PASS
Recipient resolution at `reminder-scan.service.ts:155-175`:
`.from(server_members).innerJoin(users, …).leftJoin(assignment_status, …).where(and(eq(server_members.server_id, assignment.server_id), sql\`${assignment_status.state} IS DISTINCT FROM 'done'\`))`.
The recipient set is structurally bounded to `server_members.server_id = assignment.server_id` — a member of server X can NEVER receive a reminder for an assignment in server Y. No user-supplied input reaches this predicate (server_id comes from the assignment row, not a request). Verified at source. No cross-server leak.

## Property 2 — Send-once / no spam (no email flood) — PASS
`sendReminderIfNew:240-247` gates the email on `INSERT … onConflictDoNothing().returning({id})` against the DB UNIQUE(assignment_id,user_id) constraint (migration 0013). A member receives at most one email per assignment across all ticks/instances/crashes — no re-send loop, no spam. Proven live at T-4 case (c) against real PG.

## Property 3 — No PII over-exposure in email body — PASS
`email.service.ts:43-93` interpolates ONLY: assignment title, UTC-labeled due date, server name. No recipient roster, no other members' data, no cross-server data, no internal IDs, no email addresses of others. Recipient's own address is the `to:` field only. Minimal-disclosure body. Verified at source.

## Property 4 — Resend key server-side only — PASS
`RESEND_API_KEY_AUTH` is read via `process.env` in `email.service.ts:11` (server-side NestJS process). C-2 confirmed the key is present in the **api** Railway service scope (count=1) and NOT in web. web bundle untouched this wave (no client exposure path). The key never crosses to the client.

## Action 5 — Secret / credential leak grep (ALWAYS runs) — PASS
`git diff ac78386..81dc821 -- '*.ts' '*.tsx' '*.env*' | grep -iE 'api[_-]?key|secret|token|password|bearer …'` → the only matches are `RESEND_API_KEY_AUTH` as an env-var NAME (never a value), in log strings and the test's `process.env.RESEND_API_KEY_AUTH = undefined` teardown. Zero committed credentials.

## Action 6 — Triage
Zero critical/high/medium. One informational (F30-T8-a: no HTTP surface → standard probes N/A). No fix-up cycles.

```yaml
test_pattern: active
skipped: false
auto_promoted: true
applicable_probes: [no_cross_server_leak, send_once_no_spam, no_pii_overexposure, key_server_side_only, secret_grep]
auth_smoke: null
csrf_results: null
session_results: null
rate_limit_results: null
secret_grep_findings: []
fix_up_cycles: 0
decision_note: "JUDGED-RUN light source-audit pass (not blind skip) — feature emails real users + cron reads cross-server member data; confirmed 4 security properties in shipped code + always-on secret grep. No HTTP surface → IDOR/CSRF/rate-limit probes structurally N/A."
findings:
  - {severity: INFORMATIONAL, category: surface, description: "No HTTP route on the cron host; standard T-8 request-probes inapplicable (F30-T8-a). Recorded for judged-run completeness.", remediation: "none"}
