# Wave 38 — T-block findings aggregate

## T-5 E2E findings
- MAJOR F1 (frontend, pre-existing): profile-settings entry button dead → avatar UI unreachable by real users. Backend crux PASSES; UI entry unwired (wave-4 era). Route to frontend.
- INFRA F2: Playwright MCP chrome-channel misconfig; testers used bundled chromium workaround. Host-side fix.
- LOW F3: orphaned oversize objects pre-confirm-reject (documented known-debt).
All 7 acceptance criteria PASS live in prod (crux AC3 anon-GET-200 render proven 2×).

## T-8 Security findings (all headline controls PASS; secret-grep clean)
- LOW FIND-1: GET /users/:userId/avatar 500s on NUL-byte/malformed userId (missing UUID validation) → add ParseUUIDPipe (→400). No data leak.
- LOW FIND-2: POST /profile/avatar/confirm 500s when the own-scoped object was never uploaded (uncaught storage stat) → catch missing-object → 404/400.
PASS: auth-boundary (401 no-session), IDOR (cross-user confirm→400), rate-limit (429 after 120, retry-after 60), presigned scoping (300s, GET-only, tamper-resistant), no enumeration oracle. CSRF N/A (header-based SuperTokens).
