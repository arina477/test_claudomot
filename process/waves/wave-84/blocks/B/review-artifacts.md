# Wave 84 — B-block review artifacts

**Block:** B (Build) · **Wave topic:** session-token XSS-hardening (header-explicit + short TTL + rotation + cross-origin-safe web CSP) · **Block exit gate:** B-6 · **Status:** in-progress

## Stage deliverables
| Stage | Deliverable | Status | Notes |
|---|---|---|---|
| B-0 | stages/B-0-branch-and-schema.md | in-progress | branch; no deps/schema |
| B-1 | stages/B-1-contracts.md | pending | SKIP (no contract surface) |
| B-2 | stages/B-2-backend.md | pending | api Session.init: tokenTransferMethod header + accessTokenValidity 900 |
| B-3 | stages/B-3-frontend.md | pending | web Session.init header + cross-origin-safe CSP (empirical, +Google Fonts allowlist) |
| B-4 | stages/B-4-wiring.md | pending | |
| B-5 | stages/B-5-verify.md | pending | |
| B-6 | stages/B-6-review.md | pending | |

## Block-specific context
- **Spec:** task 9535895f (DB); BOARD Option B. **Branch:** wave-84-token-xss-hardening. **claimed_task_ids:** [9535895f].
- **New deps:** none. **Schema:** none.
- **LOAD-BEARING (BOARD + P-4):** the web CSP must (a) allow connect-src to the api origin over https AND wss (else the 4 Socket.IO namespaces break), (b) allowlist Google Fonts (style-src fonts.googleapis.com + font-src fonts.gstatic.com — the ONLY external resource), (c) be derived EMPIRICALLY vs the built SPA (Vite may need style-src 'unsafe-inline'). Served by `serve -s dist` (NOT vite preview). T-8 proves 0 CSP-violation console errors + cross-origin fetch + 4 WS namespaces live.

## Gate verdict log
<B-6>
