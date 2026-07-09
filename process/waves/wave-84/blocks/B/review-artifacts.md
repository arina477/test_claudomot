# Wave 84 — B-block review artifacts

**Block:** B (Build) · **Wave topic:** session-token XSS-hardening (header-explicit + short TTL + rotation + cross-origin-safe web CSP) · **Block exit gate:** B-6 · **Status:** in-progress

## Stage deliverables
| Stage | Deliverable | Status | Notes |
|---|---|---|---|
| B-0 | stages/B-0-branch-and-schema.md | in-progress | branch; no deps/schema |
| B-1 | stages/B-1-contracts.md | pending | SKIP (no contract surface) |
| B-2 | ... | done | getTokenTransferMethod header; TTL->C-block core env |
| B-3 | ... | done | web header + Vite CSP plugin (empirically verified) |
| B-4 | ... | done |
| B-5 | ... | done | api 821 + web 773 + build + biome green |
| B-6 | stages/B-6-review.md | pending | |

## Block-specific context
- **Spec:** task 9535895f (DB); BOARD Option B. **Branch:** wave-84-token-xss-hardening. **claimed_task_ids:** [9535895f].
- **New deps:** none. **Schema:** none.
- **LOAD-BEARING (BOARD + P-4):** the web CSP must (a) allow connect-src to the api origin over https AND wss (else the 4 Socket.IO namespaces break), (b) allowlist Google Fonts (style-src fonts.googleapis.com + font-src fonts.gstatic.com — the ONLY external resource), (c) be derived EMPIRICALLY vs the built SPA (Vite may need style-src 'unsafe-inline'). Served by `serve -s dist` (NOT vite preview). T-8 proves 0 CSP-violation console errors + cross-origin fetch + 4 WS namespaces live.

## Gate verdict log
<B-6>
