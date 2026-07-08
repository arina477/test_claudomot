# Wave 80 — B-2 Backend (load-bearing presence honor) — task 3038a4bc — commit 2ba2f13

backend-developer. All P-4 corrections implemented.

## Files
- presence.service.ts: +getShowPresence(userId) + getShowPresenceBatch(userIds) (batch co-member lookup, absent→true).
- presence.gateway.ts: 3 emit gates + proactive method.
- privacy.service.ts: persist show_presence + audit + fire proactive emit.
- privacy.module (imports PresenceModule) / presence.module (exports PresenceGateway).
- tests: presence.service.spec + privacy.service/controller.spec (3-field + showPresence 400/boolean) + privacy-events integration (round-trip/audit/no-op) + pg-harness insertFixtureUser showPresence param + NEW presence-show-presence-honor.spec (two-subject).

## The 3 emit paths + proactive emit (enforcement)
1. **Online (:189):** handleConnection SELECT adds show_presence, cached on socket.data.showPresence; broadcast gated `if (wentOnline && showPresence)`.
2. **Offline (:239):** reads cached socket.data.showPresence (NO disconnect query); gated `if (wentOffline && showPresence)`.
3. **Snapshot (:169-181):** batch-resolves CO-MEMBERS' flags via getShowPresenceBatch(coMemberIds); a hidden co-member reported offline regardless of in-memory state (correct subject-set = co-members, not the connecting user).
4. **Proactive onShowPresenceChanged (:272, THE REAL AC-2 MECHANISM):** on a show_presence flip for a connected user, syncs cached flag on all live sockets + emits presence:offline (hide) / presence:online (un-hide) to co-member rooms — updates a watching peer WITHOUT a reconnect. No-op if user not online.

## Audit + wiring
privacy.service persists show_presence in the same UPDATE, tracks showPresenceChanged independently, folds into settingsChanged no-op gate, adds showPresenceFrom/To to the PII-free audit context; after audit, calls presenceGateway.onShowPresenceChanged (best-effort try/catch — never fails the HTTP response).

## Results
- tsc clean; 814 api unit tests pass (78 in touched modules). Integration (privacy-events + presence-honor two-subject) authored + tsc-clean + collected; deferred to CI postgres:16 (no local pg server). Binary online/offline (no last-seen).
- **Deviations (both ACCEPTED — sound):** (1) cross-module wiring = @Optional() PresenceGateway injected into PrivacyService (one-directional, no cycle; @Optional keeps the pg-only unit harness constructing PrivacyService working; integration passes the real gateway); (2) two-subject test drives the REAL gateway+service+privacy+real-Postgres + a faithful in-memory socket.io Server double with GENUINE room routing (.to(room).emit delivers only to joined sockets), asserting events the co-member socket B RECEIVES (not self-emits) — socket.io-client isn't a dep + SuperTokens WS-auth absent in CI. Not coverage theater.

```yaml
skipped: false
fast_path_active: false
specialists_spawned: [backend-developer]
files_implemented: [apps/api/src/presence/presence.service.ts, apps/api/src/presence/presence.gateway.ts, apps/api/src/privacy/privacy.service.ts, apps/api/src/presence/presence.module.ts, apps/api/src/privacy/privacy.module.ts, apps/api/test/integration/presence-show-presence-honor.spec.ts, apps/api/test/integration/privacy-events.spec.ts]
deviations: [{change: "@Optional() PresenceGateway into PrivacyService", adjudication: accepted}, {change: "socket.io Server double w/ real room routing for two-subject test", adjudication: accepted}]
simplify_applied: true
```
