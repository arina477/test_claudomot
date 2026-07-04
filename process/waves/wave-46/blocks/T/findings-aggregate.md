# Wave 46 — T-block findings aggregate

> Canonical V-2 input. Each T-stage appends findings with severity + evidence.
> T-block surfaces findings; V-2 classifies blocking / non-blocking / noise.

| # | Stage | Severity | Location | Description | Evidence |
|---|---|---|---|---|---|
| F1 | T-1 | LOW | apps/api/src/dm/dm.service.spec.ts:54-590 | 10 test-scaffold type casts (mock/DI); acceptable unit-mock pattern, no prod bypass | bypass grep — prod source clean |
| F2 | T-1 | LOW | apps/api/src/dm/dm.service.ts:436 | warn-level noNonNullAssertion (insertReturning[0]!), guarded by isNewInsert length check; L-2 cleanup | biome ci = 0 err / 2 warn |
| F3 | T-2 | LOW | apps/api/src/dm/dm.service.spec.ts | service fan-out asserts internal `dm.message` emit; wire `dm:message` proven in gateway spec + T-3/T-5. Correct boundary, not a gap | gateway spec dm.message describe |
| F-C1 | T-3 | MEDIUM | DmParticipant.displayName (server) | Returns raw userId UUID when displayName null; should fall back to username. UI renders UUID as name. Thread has a client-side map (M2) but conversation-list/participant fallback still leaks UUID | live probe: displayName==userId for both fixtures |
| F-C2 | T-3 | LOW | DmConversation.unreadCount / presence | Optional fields absent — spec-legal, no data loss | live probe responses |
| F-I4 | T-4 | HIGH | apps/api/src/dm/dm.service.ts encodeCursor/listMessages | ms-vs-µs cursor precision truncation duplicates boundary message on ASC page turn + drops last msg (live-observed). Unit mock structurally cannot catch. Channel path DESC/< is safe; DM ASC/> new this wave | live: page1 last id db17d585 == page2 first id; source-confirmed `.toISOString()` ms truncation vs timestamptz µs |
| F-I5 | T-4 | LOW | auth session handle | Repeated signins self-invalidate prior tokens (~15s) despite 3600s TTL; test-tooling constraint, not a product defect | probe F-5 |
| F6 | T-5 | MAJOR | apps/web/src/shell/useDm.ts:205 | Sender's own message DOUBLE-RENDERS: socket dm:message dedup only checks kind==='real' && id; when M1 fan-out echo beats REST onDelivered reconcile, optimistic row not yet real → appends 2nd row (same server id). Missing optimistic-by-idempotencyKey dedup. Live-observed both directions | tester a2a37ef9: identical data-testid=dm-message-row-<same-id> twice; source-confirmed |
| F7 | T-5 | MAJOR | apps/web/src/shell/DmThread.tsx:54 | 'Unknown user' author on some delivered messages — participantMap.get(authorId) miss; interacts with F6 dup rows + T-3 F1 displayName gap | tester a2a37ef9 live-observed |
| F3b | T-5 | MINOR | DM conversation list + thread header | Raw participant UUID shown instead of display name (= T-3 F1 server-side displayName→userId fallback); picker resolves names correctly (inconsistency) | tester a2a37ef9 |
| F8 | T-5 | INFO | Socket.IO transport | CLIENT A uses HTTP long-polling, no wss upgrade observed — works; confirm intended | tester a2a37ef9 resource timing |
| F9 | T-6 | MINOR | DM route app shell (4-column) | Redundant empty channel-sidebar column (260px) persists on DM route; canonical DM is 3-panel. Narrows thread pane at 1024 (thread=372px, wrapping). Cosmetic, not broken | tester ac5f937e geometry probe |
| F10 | T-6 | LOW (off-token) | server rail / picker modal / disabled-send | Adjacent surface substitutions: rail surface-950 vs canonical 900; modal card surface-800 vs 900; disabled-send surface-700 vs canonical emerald-50%. All on dark palette, no invented hex | tester ac5f937e getComputedStyle |
| F3c | T-6 | MINOR | DM thread header / message names | Long UUID display names wrap 2 lines at 1024 (= T-3 F1 displayName gap; real names would be short + truncate) | tester ac5f937e |
| F11 | T-8 | LOW | Socket.IO default `/` namespace | Accepts idle unauth connects (no handlers/data); DM-carrying /messaging ns correctly rejects unauth at WS-upgrade (ws-auth.ts next(Unauthorized)). No DM leak. Defense-in-depth note | pentester aa8b17b5 C1 + source ws-auth.ts:66/91 |
| F12 | T-8 | LOW | who_can_dm policy semantics | 'nobody' gates STARTING new DMs, not muting a pre-existing thread (A can still send to existing CONV_AB). By-design; both are authorized participants. UX-expectation note | pentester aa8b17b5 B2 |
