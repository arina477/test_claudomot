# Wave 3 — T-block review artifacts
**Block:** T · **Wave topic:** Auth frontend (6 pages + display_name profile + /me verify-exemption), live · **Gate:** T-9 · **Status:** in-progress
| Stage | Pattern | Status | Notes |
|---|---|---|---|
| T-1 Static | ci-verified | done | PR#5+#6 CI green (lint+typecheck) |
| T-2 Unit | ci-verified | done | 27/27 web (AppShell 10 + auth-pages 17) + api specs |
| T-3 Contract | ci+live | done | Profile + MeResponse + SuperTokens /auth; live /me+/profile verified |
| T-4 Integration | active(live) | done | C-2: signup→users row, /me 200 unverified, /profile GET+PATCH |
| T-5 E2E | active-partial | done | live core curl-verified (C-2); full browser click-through deferred (Chrome MCP needs 'chrome' channel — CI chromium job c51589cd) |
| T-6 Layout | active-partial | done | 6 pages built from mockups + RTL render tests; live pixel-diff deferred (same browser limit) |
| T-7 Perf | n/a | skipped | not heavy (web bundle 623KB baseline) |
| T-8 Security | active | done | HIGH PATCH-crash RESOLVED (fix-forward PR#7/#8); csrf+session PASS; rate-limit tracked; secrets clean |
| T-9 Journey | active | pending | gate |
## Context
- wave_type: ui, auth. Live: web (login/signup pages 200) + api (/profile + /me-unverified-200 + verify-exemption). Security-scope gate → T-8 mandatory.
- Browser-E2E limitation (wave-1 known): Playwright MCP needs Google 'chrome' channel (absent) → CI chromium job c51589cd is the fix. Covered here by RTL (27/27) + live curl.
