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
| B-6 | ... | done | APPROVE; 3 CRITICAL+1 HIGH CSP-origin gaps fixed 8d3366f3 |

## Block-specific context
- **Spec:** task 9535895f (DB); BOARD Option B. **Branch:** wave-84-token-xss-hardening. **claimed_task_ids:** [9535895f].
- **New deps:** none. **Schema:** none.
- **LOAD-BEARING (BOARD + P-4):** the web CSP must (a) allow connect-src to the api origin over https AND wss (else the 4 Socket.IO namespaces break), (b) allowlist Google Fonts (style-src fonts.googleapis.com + font-src fonts.gstatic.com — the ONLY external resource), (c) be derived EMPIRICALLY vs the built SPA (Vite may need style-src 'unsafe-inline'). Served by `serve -s dist` (NOT vite preview). T-8 proves 0 CSP-violation console errors + cross-origin fetch + 4 WS namespaces live.

## Gate verdict log
<B-6>

## Build-block exit handoff
```yaml
build_block_status:    complete
branch:                wave-84-token-xss-hardening
stages_run:            [B-0, B-2, B-3, B-4, B-5, B-6]
stages_skipped:        [B-1 (no contracts)]
review_verdict:        APPROVE
last_commit_sha:       8d3366f3
ready_for_ci:          true
flakes_documented:     [assignments.test.tsx (pre-existing socket-timing flake, NOT in wave diff; passes on re-run — C-1 may re-run once)]
```
## ⚠️ C-BLOCK DEPLOY ACTIONS (LOAD-BEARING — miss these and prod breaks)
```yaml
c2_env_actions:
  - "Set ACCESS_TOKEN_VALIDITY=900 on the supertokens CORE Railway service + redeploy (AC2 short TTL — B-2; not settable in SDK)."
  - "Set VITE_LIVEKIT_URL (= api service's LIVEKIT_URL, the *.livekit.cloud host) as web BUILD-TIME env before the web deploy — else voice signaling is CSP-blocked (F3)."
  - "Confirm/set VITE_STORAGE_ORIGIN (= api's AWS_ENDPOINT_URL host, Tigris) as web build-time env — else attachments/avatars CSP-blocked (F1/F2). .env.example defaults to fly.storage.tigris.dev; verify vs actual."
  - "VITE_SENTRY_DSN already set on web deploy → CSP auto-derives the Sentry ingest origin."
c2_deploy: "BOTH api (Session.init header) AND web (CSP + header) changed → deploy BOTH services."
t8_live_gate: "prove on the deployed web app: attachments load, avatars load, voice connects, error-reporting works, 0 CSP-violation console errors, cross-origin fetch + 4 WS namespaces intact."
```
