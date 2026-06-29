# Wave 7 — T-block review artifacts
**Block:** T · **Wave topic:** M2 servers/channels (LIVE) · **Gate:** T-9 · **Status:** in-progress
| Stage | Status | Notes |
|---|---|---|
| T-1 Static | done | CI lint/typecheck green (PR#17) |
| T-2 Unit | done | 133 tests (79 api: txn-atomicity/member-scoping-403/list-filter; 54 web: rail/modal/sidebar) |
| T-3 Contract | done | POST/GET /servers + /:id; shared Zod |
| T-4 Integration | done | create-server verified LIVE (C-2): 201+list+#general |
| T-5 E2E | done | CI playwright e2e green (PR#17) |
| T-6 Layout | active | new rail/sidebar/create-modal UI |
| T-7 Perf | skip | not heavy |
| T-8 Security | active | MANDATORY — auth-gated create + member-scoping access control |
| T-9 Journey | active | gate + journey-map regen (new servers UI) |
## Context: security gate APPLIES. Live (C-2): 401 unauthed, 403 unverified+non-member, 201 verified, member-scoping enforced. L-flag: no persistent verified prod test fixture.
