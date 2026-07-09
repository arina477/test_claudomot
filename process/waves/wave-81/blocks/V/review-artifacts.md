# Wave 81 — V-block review artifacts
**Block:** V (Verify) · **Wave topic:** /settings/profile scroll fix (FullPageScroll) + study-timer CI stabilization · LIVE e659b0a · **Gate:** V-3 · **Status:** in-progress
## Stage deliverables
| Stage | Deliverable | Status | Notes |
|---|---|---|---|
| V-1 | ... | done | both APPROVE |
| V-2 | ... | done | 0 blocking; SW accept-with-note |
| V-3 | stages/V-3-fast-fix.md | pending | |
## Block-specific context
- T-block findings: 2 — **F-T5-1 (HIGH, deploy-delivery): Workbox SW serves stale pre-fix bundle to returning users (incl. founder) → they may still see the bug**; F-T2-1 (LOW, no standalone ProfilePage-root unit).
- Founder bug verified FIXED LIVE (scroll top→bottom, save button reachable) once the new bundle loads.
- Karen/jenny verdicts: pending.
## Open escalations carried into gate
- **F-T5-1 is the crux:** the fix is deployed+correct but a service-worker precache delivers the OLD bundle on first load until the SW updates. Pre-existing infra issue (matches the backlog item "Service-worker cache-bust on deploy"). For a FOUNDER-DIRECTED fix, the founder must actually SEE the fix → V-2 must decide: fix the SW cache-bust in-wave (V-3 fast-fix if small: Workbox skipWaiting+clientsClaim / versioned precache / reload prompt) OR fast-follow + a founder hard-refresh note.
## Gate verdict log
<V-3>
