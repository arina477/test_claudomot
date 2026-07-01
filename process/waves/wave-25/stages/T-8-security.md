# Wave 25 — T-8 Security — SKIPPED (auth probes); secret-grep run

## Skip decision
`wave_type` = [backend, ui], does NOT include `auth`. No auth/payments/sessions/RBAC/account/password/OAuth/token surface. Auto-promotion check: no T-8 principles `auth_boundary_paths` declared; the wave touched `messages.service.ts` (editMessage, a PATCH endpoint) but did NOT modify its authz guard, session, cookie, or CSRF handling — it wrapped the mention-diff writes in a `db.transaction`. Not an auth-boundary change → **not auto-promoted**. Auth/CSRF/session/rate-limit probes skipped.

## Action 5 — Secret / credential grep (ALWAYS runs)
`git diff` on the wave's `.ts/.tsx/.env` diff for `api_key|secret|token|password|bearer`: **0 matches** (excluding the inline `RAILWAY_TOKEN`/`Project-Access-Token` env references used at deploy, never committed). Clean — no committed credential.

## XSS note (informational — reviewed, no new surface)
The wave renders user message content around mention pills. B-6 /review confirmed the trailing text (`part.slice(1+slug.length)`) renders as a React `{trailing}` text node → auto-escaped. Tokenization changed, but the RENDERING mechanism (React text nodes, escaped) is unchanged — **no new XSS surface**. Not a T-8 finding.

```yaml
test_pattern: active
skipped: true
skip_reason: "wave_type not auth; no auth/session/CSRF/RBAC surface changed; messages.service.ts authz guard unmodified (only mention-diff wrapped in txn); no auth_boundary_paths declared → not auto-promoted."
auto_promoted: false
applicable_probes: [secret_grep]
secret_grep_findings: []              # 0 matches — clean
fix_up_cycles: 0
findings: []
```

## Exit
Non-auth wave; auth probes skipped; secret-grep clean; no new XSS surface. → T-9 gate.
