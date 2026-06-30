# Wave 14 — V-1 Summary
- **Karen REJECT** — presence infra VERIFIED live (files/exports/registration/routes/deploy/no-migration all true); typing CLAIMED-WORKING-BUT-FAKE. F-4 CONFIRMED at presence.gateway.ts:381-386: emitTypingActive calls getTypers(channelId, selfUserId) (excludes ACTOR) then broadcasts that one list to the whole room → every recipient gets the typer stripped → sole-typer recipients get []. Coverage theater: gateway.spec mocks getTypers, never asserts a recipient sees the actor.
- **jenny REJECT** — /presence MATCHES, member-list MATCHES, typing DRIFTS (impl bug not spec gap; same root cause). Self-exclusion applied per-broadcast instead of per-recipient. Deployed code == traced code (no post-T fix). Fix: per-recipient exclusion (emit full list + client self-filter by userId, OR socket.broadcast.to(room) from actor's socket, OR per-socket list).
```yaml
karen_verdict: REJECT
karen_findings_count: 1   # F-4 (typing); all else VERIFIED
jenny_verdict: REJECT
jenny_findings_count: 1   # typing DRIFT
spec_drift_count: 1
spec_gap_count: 0
findings: [F-4-typing-broadcast-composition-DRIFT-blocking]
```
