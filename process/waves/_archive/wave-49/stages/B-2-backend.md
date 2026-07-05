# Wave 49 — B-2 Backend
node-specialist: apps/api/src/study-timer/ (service/controller/module/gateway/service.spec) + test/integration/study-timer.integration.spec.ts + app.module.
- **BINDING MODEL confirmed (all 3):** (a) NO per-server setInterval/@nestjs/schedule loop — one-shot setTimeout keyed to ends_at, cleared/re-armed on state change, onModuleDestroy clears all; (b) presence EPHEMERAL in-memory (timerPresence Map + socketPresenceIndex; NO DB writes, rebuilt from live sockets); (c) COMPUTE-ON-READ — remainingMs derived (ends_at-now running / paused_remaining_ms paused / 0 idle), no stored counter.
- **Auto-advance (832b83b7):** one-shot setTimeout → doPhaseAdvance IDEMPOTENT (UPDATE WHERE run_state='running' AND ends_at=expected → 2nd trigger finds new ends_at → 0 rows no-op) + SELF-HEALING (selfHealIfOverdue on read walks 25/5 forward from started_at → phase re-derivable even if emit missed / after restart).
- **Presence (cb81bf03):** join_timer_room (membership check→room join→presence add→emit current state [reconnect reconcile]→broadcast presence); leave/disconnect→remove→broadcast. Multi-tab deduped.
- **Authz:** assertMember (non-member 403 on all ops); getTimerForRoom skips redundant check (gateway checks at join).
- Tests: 26 unit + 12 integration (skips locally no test-PG, runs in CI); 637 total pass. biome 0, tsc clean.
- Deviations: doPhaseAdvance/getTimerForRoom made public (integration test + reconnect); none material.
- **Commit coupling (B-6):** 832b83b7 transition logic is in study-timer.service.ts (coupled with 1387d845 spine, one file) → 1387d845 commit cites both refs; gateway reconnect emit in cb81bf03 commit.
```yaml
skipped: false
files: {1387d845_832b83b7: [study-timer.service.ts, controller, module, service.spec, integration.spec, app.module], cb81bf03: [study-timer.gateway.ts]}
tests: {new: 26, total: 637}
model_confirmations: {no_timer_loop: true, presence_ephemeral: true, compute_on_read: true}
typecheck: clean
biome: "0 errors"
