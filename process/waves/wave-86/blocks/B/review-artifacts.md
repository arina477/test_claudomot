# Wave 86 — B-block review artifacts
**Block:** B (Build) · **Wave topic:** explicit header-correct antiCsrf + cookie-forged-POST regression test + CSRF-safety docs · **Block exit gate:** B-6 · **Status:** in-progress
## Stage deliverables
| Stage | Deliverable | Status | Notes |
|---|---|---|---|
| B-0 | stages/B-0-branch-and-schema.md | in-progress | branch; no deps/schema |
| B-1 | stages/B-1-contracts.md | pending | SKIP |
| B-2 | ... | done | antiCsrf:NONE (SDK-verified) + DB-free regression test (85b270de) |
| B-3 | stages/B-3-frontend.md | pending | SKIP (no UI) |
| B-4/5/6 | ... | pending | |
## Block-specific context
- Spec: task f8fb8023 (REFRAMED). Branch wave-86-anticsrf-explicit. claimed [f8fb8023].
- **CARRY:** set antiCsrf EXPLICITLY (NONE vs VIA_CUSTOM_HEADER — supertokens-integration determines vs supertokens-node@24; NOT VIA_TOKEN) + doc comment; a cookie-only-forged-POST regression test (rejected 401/403) — the load-bearing guard; document CSRF-safety-by-header-transport + wave-84 migration cross-ref + ws-auth handshake safety. security-scope: T-8 live forged-POST + antiCsrf verify.
## Gate verdict log
<B-6>

## Build-block exit handoff
```yaml
build_block_status:    complete
branch:                wave-86-anticsrf-explicit
stages_run:            [B-0, B-2, B-4, B-5, B-6]
stages_skipped:        [B-1 (no contracts), B-3 (no UI)]
review_verdict:        APPROVE
last_commit_sha:       b9b31776
ready_for_ci:          true
```
## C-block note
Backend-only (apps/api). No migration. Deploy the API service only at C-2. security-scope: T-8 verifies the explicit antiCsrf posture + a live cookie-only-forged-POST rejection on the deployed api.
