# Wave 49 — B-1 Contracts
typescript-pro: packages/shared/src/study-timer.ts — StudyTimerSchema {serverId, phase[work|break], runState[idle|running|paused], endsAt:string|null, remainingMs, running, updatedBy} + STUDY_TIMER_PHASES/RUN_STATES consts + STUDY_TIMER_UPDATE_EVENT ('study-timer:update', {serverId,timer}) + STUDY_TIMER_PRESENCE_EVENT ('study-timer:presence', {serverId,viewers[],count}). No body schemas (controls are param-only). shared+api typecheck clean (web TS6310 = direct-tsc artifact, pre-existing, not this change).
```yaml
skipped: false
files: [packages/shared/src/study-timer.ts, packages/shared/src/index.ts]
typecheck: clean
```
