# Wave 80 — B-block exit gate verdict (Phase 1)

- **agentId:** head-builder-1783482864-f6e2c3e5
- **Stage:** B-6 Review (block exit gate)
- **Attempt:** 1
- **Wave topic:** presence (online-status) privacy toggle — `show_presence`, honored server-side (M13 leg-3b, single-spec)
- **Task:** 3038a4bc-8eeb-49aa-ab3c-096e1ff5b8e1
- **Branch:** wave-80-presence-toggle
- **Reviewed diff:** `git diff main...wave-80-presence-toggle` (presence.gateway.ts, presence.service.ts, privacy.service.ts, privacy.module.ts, presence.module.ts, users.ts, migration 0033 + journal + snapshot, privacy.ts, SettingsPrivacyPage.tsx, two-subject integration test, privacy-events.spec.ts)

## VERDICT: APPROVED

The honor holds server-side on all three presence emit paths, the proactive toggle-time emit (the real AC-2 mechanism) is present and correctly wired with no module cycle, and the two-client acceptance test is a genuine two-subject proof, not self-emit theater. The frontend is a real, enabled, accessible toggle (not a disabled-Beta affordance). No silent deviations found; the two logged B-2 deviations and one B-3 deviation are sound.

## Findings against the review checklist

### 1. Honor point — all 3 emit paths gated server-side (CONFIRMED)
- **Online** (`presence.gateway.ts` handleConnection): `show_presence` SELECTed at connect and cached on `socket.data.showPresence`; broadcast gated `if (wentOnline && showPresence)` (gateway ~:184-188). Hidden user never emits online.
- **Offline** (handleDisconnect): reads cached `socket.data.showPresence` (`?? true`), NO disconnect-time DB query — gated `if (wentOffline && showPresence)` (~:230-236). P-4 correction #3 (cache-at-connect) satisfied.
- **Snapshot** (handleConnection, ~:165-181): resolves CO-MEMBERS' flags via `getShowPresenceBatch(coMemberIds)`; `online = visible && isOnline(uid)`. Subject-set is the co-members' flags, NOT the connecting user's — correct per P-4 correction #2. A hidden co-member is reported offline to a connecting peer.
All three are server-side; the client is never trusted for the flag.

### 2. Proactive toggle-time emit (LOAD-BEARING — CONFIRMED)
- `PresenceGateway.onShowPresenceChanged(userId, visible)` (~:272): syncs the cached flag on every live socket for the user (so a later disconnect gates on the current value), then — only if `isOnline(userId)` — emits `presence:online`/`presence:offline` to co-member rooms via fresh `getServerIdsForUser`. No reconnect required. No-op when offline (correct — passive gate covers next connect).
- Wiring is sound and cycle-free: `PrivacyService` calls it via `@Optional() PresenceGateway`; `PrivacyModule` imports `PresenceModule`; `PresenceModule` exports `PresenceGateway`. One-directional (privacy → presence). `@Optional()` lets the pg-only harness construct the service; best-effort try/catch means a presence re-broadcast failure never fails the HTTP response. `getServerIdsForUser` / `getCoMemberUserIds` / `isOnline` all verified present on the service.

### 3. Two-client test honesty (CONFIRMED — not theater)
`presence-show-presence-honor.spec.ts` drives REAL PresenceGateway + REAL PresenceService (in-memory ref-count) + REAL PrivacyService (real Postgres write) through a faithful socket.io Server double with GENUINE room routing (`.to(room).emit()` delivers only to sockets whose `__rooms` Set contains the room). Two distinct subject sockets A and B are registered; the load-bearing assertions are on events **B receives** (`sockB.emit.mock.calls.find(... presence:offline / presence:online for A)`), after A toggles via the real privacy path — WITHOUT A reconnecting. Additional cases: snapshot honor (new peer C does not see hidden A online), inbound-view-unaffected (hidden A still receives B's online), and connected-already-hidden emits neither online nor offline. This is a genuine co-member assertion, satisfying BUILD rule 12 / T-4-T-5 anti-single-client.

### 4. Real working toggle (CONFIRMED)
`SettingsPrivacyPage.tsx` Panel 2 "Show my online status": `<button role="switch" aria-checked={showPresence} aria-labelledby>`, ENABLED (disabled only transiently while `presenceSaving`), emerald `#10b981` on / `#52525b` off (DESIGN-SYSTEM tokens), no Beta badge, no `pointer-events:none`. Auto-saves via `handlePresenceChange` (optimistic + saving/error/success trio, revert-on-failure) — modelled on `handleVisibilityChange`, NOT the disabled whoCanDm affordance. Binary online/offline copy ("appear offline to everyone") — no last-seen framing (P-4 correction #4). GET hydrates `showPresence` (defaults true).

### 5. Cross-cutting (CONFIRMED)
- **Migration:** `0033_wave80_users_show_presence.sql` = `ADD COLUMN show_presence boolean DEFAULT true NOT NULL` — DEFAULT true = no backfill, existing users stay visible. Journal + snapshot committed (idx 33). ORM model `users.ts` adds `boolean('show_presence').notNull().default(true)`.
- **Audit event:** `privacy.service.ts` folds `showPresenceChanged` into the `settingsChanged` no-op gate and adds `showPresenceFrom`/`showPresenceTo` to the PII-free context. `privacy-events.spec.ts` cases 3c-3e assert round-trip, audit from/to, and no-op-suppression. Consistent with profileVisibility/whoCanDm.
- **Repo typecheck 4/4 (B-4):** turbo shared/api/web green — no B-1↔B-2↔B-3 contract drift.
- **Lint/unit/build (B-5):** biome 0 errors (394 files); web 733/733, shared 41/41, api 814/814; turbo build 3/3. Integration (two-subject + privacy-events) run in CI postgres:16 — no local pg server (documented env limit; prod migrate at C-2).
- **handleVisibilityChange full-object fix (B-3):** CORRECT and load-bearing. `UpdatePrivacySchema` is full-replace (3 required fields); the pre-existing visibility handler sent only 2 fields and would 400 under the new schema. Now sends `showPresence` from current state. This prevents a regression to the shipped visibility toggle.
- **Presence consumer regression:** none — online/offline/snapshot payload shapes unchanged (`{ userId }` / `PresenceState`); only the gating condition and snapshot subject-set changed. Default-true fallbacks preserve existing behavior everywhere the flag is absent.
- **Silent deviations:** none found. Logged deviations — (B-1) `showPresence` required full-replace PUT; (B-2) `@Optional()` gateway injection + socket.io Server double; (B-3) full-object visibility fix + biome-format of 2 B-2 test files — are all sound and adjudicated.

### 6. Commit discipline (CONFIRMED)
Per-stage commits, single-spec, all citing wave-80: `c3f7bc6` B-0 schema, `c091589` B-1 contracts, `2ba2f13` B-2 backend, `4c45224` B-3 frontend, plus per-stage docs commits and B-4/B-5. feat commits reference wave-80 in the subject.

## Rework
None.

## Escalation
None.
