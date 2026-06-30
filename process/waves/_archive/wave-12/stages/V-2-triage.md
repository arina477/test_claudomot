# Wave 12 — V-2 Triage
Both APPROVE; no blocking → V-3 fast-fix queue empty. All findings non-blocking:
| Finding | Bucket | Disposition |
|---|---|---|
| null-idempotency-key re-fetch best-effort | non-blocking | UNREACHABLE on prod (UI always sends key); a .returning() cleanup → L follow-up / next M3 wave. |
| no live-socket eviction on RBAC revoke | non-blocking | H2 (join-time gate correct) |
| authed messaging-UI full-browser e2e deferred | non-blocking | two-client Socket.IO probe is the authoritative substitute; below canary DAU |
| CI-PRINCIPLES 2-rule bypass (head-ci-cd at C-2) | process | → L adjudicates (revert or karen-vet); same as wave-9 |
```yaml
findings_blocking: []
fast_fix_queue: []
