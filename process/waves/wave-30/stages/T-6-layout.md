# T-6 — Layout (wave-30 M5 reminders) — SKIPPED

## Skip decision
**SKIPPED.** Per dispatcher skip rule (T-6 fires on UI waves only; wave_type=backend, no app UI touched).

No app screen, component, or visual surface changed. The one HTML artifact this wave produces is the reminder EMAIL body (`email.service.ts`), which is NOT a Playwright-layout / visual-regression surface (email clients render server-composed inline HTML; no diff-baseline tooling applies). Per the task's explicit guidance, a lightweight email-render sanity check (subject/body/no-broken-HTML/PII-scope) was performed under T-2 instead of spinning up the layout swarm: inline-styled table-based light HTML, DOCTYPE+charset+viewport present, no external assets, no unclosed tags, exposes only title/due/server. Result: clean.

```yaml
test_pattern: skipped
skipped: true
skip_reason: "No app UI. Email HTML is not a layout-diff surface — sanity-checked lightweight under T-2 (clean) per task guidance, not the Playwright layout swarm."
findings: []
