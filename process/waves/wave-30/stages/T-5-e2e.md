# T-5 — E2E (wave-30 M5 reminders) — SKIPPED

## Skip decision
**SKIPPED.** Per dispatcher skip rule (T-5 skips when the wave has no user-visible behavior change).

The reminders arc is a backend `@Cron` scan + transactional email. There is NO app screen, NO route, NO browser-driven user flow introduced or changed. B-3 Frontend was skipped at build; `git diff ac78386..81dc821 -- 'apps/web/**'` is empty. Nothing renders in the SPA for a Playwright swarm to drive. The user-observable outcome (an email lands in the member's inbox) is not headless-browser-testable and is proven at the real-PG integration tier (T-4: recipient selection + send-once) plus unit (T-2: email composition).

```yaml
test_pattern: skipped
skipped: true
skip_reason: "No user-visible UI / no browser flow — backend cron + email, no app screen or route. B-3 skipped, apps/web diff empty."
findings: []
