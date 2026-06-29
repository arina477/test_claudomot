# Wave 6 — B-6 Review (gate) — APPROVE
## Phase 1 — head-builder: APPROVED
boot-probe boots COMPILED `node apps/api/dist/src/main.js` (dist path confirmed via nest-cli/tsconfig; the wave-5 crash class a tsx probe would mask). Bounded (seq 30×1s under timeout-minutes:10). Fails on crash (curl -fsS + exit 1 + log dump). Passes on healthy (greps "status":"ok"). PORT present; dummy ST URI lazy (no false-fail); /health @SkipThrottle. postgres mirrors test job. 6 existing jobs untouched. Branch protection live-confirmed: 6 contexts incl boot-probe, strict, 0 approvals, enforce_admins false. Not gold-plated.
## Phase 2 — secret-grep clean (only throwaway test PG password).
```yaml
phase1_head_builder_verdict: APPROVED
phase2: secret-grep clean
final_verdict: APPROVE
```
