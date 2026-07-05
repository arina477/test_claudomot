# Wave 49 — P-3 Plan
## Approach
- **Timer entity + compute-on-read service (1387d845).** NEW server_study_timer (single row per server, anchors only). Service derives remaining/phase from run_state + ends_at + now() — **chosen over** a stored decrementing counter (rejected: needs a tick loop, drifts) and over ephemeral/compute-from-rule (rejected: mutable interactive state can't derive from a fixed rule, per problem-framer). Failure domain: new table + module; membership-gated writes.
- **Auto-advance = broadcast-on-transition (832b83b7).** One-shot idempotent transition at ends_at (a keyed one-shot timeout re-armed on state change, OR lazy-on-read crossing ends_at — B-block picks; MUST be idempotent + self-healing). **Chosen over** per-server setInterval/@nestjs/schedule loop (REJECTED — wrong-layer, N-loops, restart-fragile, multi-instance double-fire; problem-framer forbade). Self-healing: phase always re-derivable from anchors.
- **Fan-out + ephemeral presence (cb81bf03).** Reuse messaging.gateway per-server room + WS session validation for study-timer:update; add an in-memory presence map (who's viewing the live timer) → study-timer:presence. No persistence. **Chosen over** a persisted attendance table (REJECTED — ephemeral body-doubling presence, not attendance/history; ceo guardrail).
- **Widget (c3daf6d3).** New server-view surface (D-block); countdown to authoritative endsAt + controls + presence roster.
## Data / API / deps
- Data: NEW server_study_timer + ONE migration. No other schema change.
- API: POST /servers/:serverId/study-timer/{start,pause,resume,reset} + GET (all assertMember); socket study-timer:update + study-timer:presence.
- Deps: none (Drizzle/NestJS/Socket.IO/@nestjs/websockets present).
## File-level steps
- **B-1 Contracts:** packages/shared/src/study-timer.ts (StudyTimerSchema + control + socket-event types) — **typescript-pro**.
- **B-1 Schema (B-0):** apps/api/src/db/schema/study-timer.ts + index + migration — **node-specialist**.
- **B-2 Backend:** apps/api/src/study-timer/ (module/service[compute-on-read]/controller[membership-gated]) + gateway study-timer:update + presence emit + app.module — **node-specialist**. (832b83b7 transition logic lives here — broadcast-on-transition, no loop.)
- **B-3 Frontend (after D-block):** apps/web/src/shell/ StudyTimerWidget + presence roster + socket subscription + api client — **react-specialist**.
- **B-4/B-5:** typecheck; biome 0; unit (compute-on-read remaining/phase, idempotent transition, membership authz) + integration (timer service ↔ real PG) + widget tests; smoke.
## Specialists (AGENTS.md): node-specialist, typescript-pro, react-specialist ✓.
## Parallelization: B-1 schema→contracts → B-2 backend → D-block (widget/presence design) → B-3 frontend. D BEFORE B-3.
## Self-consistency: every AC→step; specialists assigned; design_gap_flag=true→D; no deps; model-pin bound in B-2 (832b83b7). Clean.
```yaml
p_stage_verdict: COMPLETE
design_gap_flag: true
specialists: [node-specialist, typescript-pro, react-specialist]
schema_change: true
migration_count: 1
next: P-4
