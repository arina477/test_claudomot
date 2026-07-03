# Wave 38 — T-block findings aggregate

## T-5 E2E findings
- MAJOR F1 (frontend, pre-existing): profile-settings entry button dead → avatar UI unreachable by real users. Backend crux PASSES; UI entry unwired (wave-4 era). Route to frontend.
- INFRA F2: Playwright MCP chrome-channel misconfig; testers used bundled chromium workaround. Host-side fix.
- LOW F3: orphaned oversize objects pre-confirm-reject (documented known-debt).
All 7 acceptance criteria PASS live in prod (crux AC3 anon-GET-200 render proven 2×).
