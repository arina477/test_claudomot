# Wave 21 — B-block review artifacts
**Block:** B (Build) | **Wave topic:** M4 wave-2 offline UX (live connection-state + multi-page catch-up loop + tests) | **Gate:** B-6 | **Status:** in-progress
## Stage deliverables
| Stage | Deliverable | Status |
|---|---|---|
| B-0 | stages/B-0-branch-and-schema.md | done | branch + claim; no schema |
| B-1 | stages/B-1-contracts.md | SKIP | no new shared contract (reuse connectionState union + MessagesAfterResponse) |
| B-2 | stages/B-2-backend.md | SKIP | frontend-only, no server change |
| B-3 | stages/B-3-frontend.md | done | useConnectionState + AppHome wiring + catch-up loop + tests |
| B-4 | stages/B-4-wiring.md | done | typecheck + build + boot-probe |
| B-5 | stages/B-5-verify.md | done | |
| B-6 | stages/B-6-review.md | pending | head-builder gate |
## Context
- Branch: wave-21-m4-offline-ux | claimed: [c1dbee64, 94e41695, 2fe6b517]. Frontend-only, no schema/server/dep.
- **P-4 carries (MANDATORY):** (1) useConnectionState SOURCE-PRIORITY: offline IF (window-offline OR socket-offline); else reconnecting IF socket-reconnecting; else online. window-online = re-trigger ONLY (never override to online while socket not connected). + disagreement-case test. (2) catch-up loop: advance cursor from server result.nextCursor OUTSIDE the setRealMessages updater (await between pages — no stale closure); per-page putCachedMessages write-through; opaque cursor (wave-20 V-3); dedup-by-id; MAX_ITERS guard (no silent loss); loop-until-nextCursor-null. (3) REUSE shipped ConnectionStateIndicator + pending/failed UI + getSocketState(3-state) + Dexie/outbox/?after= — NO rebuild (rule 1). (4) gating AC: multi-page recovery NO data loss + dot reflects real socket state — proven via fake-indexeddb (reuse wave-20 harness). (5) floor-EXEMPT (wave-16 precedent).
## Gate verdict log
<appended by head-builder at B-6>
