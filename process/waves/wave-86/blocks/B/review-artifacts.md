# Wave 86 — B-block review artifacts
**Block:** B (Build) · **Wave topic:** explicit header-correct antiCsrf + cookie-forged-POST regression test + CSRF-safety docs · **Block exit gate:** B-6 · **Status:** in-progress
## Stage deliverables
| Stage | Deliverable | Status | Notes |
|---|---|---|---|
| B-0 | stages/B-0-branch-and-schema.md | in-progress | branch; no deps/schema |
| B-1 | stages/B-1-contracts.md | pending | SKIP |
| B-2 | stages/B-2-backend.md | pending | supertokens-integration: explicit antiCsrf + regression test + docs |
| B-3 | stages/B-3-frontend.md | pending | SKIP (no UI) |
| B-4/5/6 | ... | pending | |
## Block-specific context
- Spec: task f8fb8023 (REFRAMED). Branch wave-86-anticsrf-explicit. claimed [f8fb8023].
- **CARRY:** set antiCsrf EXPLICITLY (NONE vs VIA_CUSTOM_HEADER — supertokens-integration determines vs supertokens-node@24; NOT VIA_TOKEN) + doc comment; a cookie-only-forged-POST regression test (rejected 401/403) — the load-bearing guard; document CSRF-safety-by-header-transport + wave-84 migration cross-ref + ws-auth handshake safety. security-scope: T-8 live forged-POST + antiCsrf verify.
## Gate verdict log
<B-6>
