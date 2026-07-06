```yaml
verdict: PROCEED
verdict_source: problem-framer
matched_antipatterns: []
reasoning: |
  Symptom-vs-cause: the symptom (assignments panel + class calendar render BLANK
  offline instead of last-loaded content) is fixed at the correct CAUSE layer —
  the read path has no local persistence. Verified in code: AssignmentsPanel.loadAssignments
  (.catch -> setLoadStatus('error'), blank) and ClassCalendar listSessions (.catch, line 495)
  both go straight to an error state with no cached fallback, unlike useDm.ts which already
  implements the getCached/putCached write-through + catch-fallback pattern this wave mirrors.
  Every seed claim is true against the code: StudyHallDB is at .version(2) with v1 re-stated
  VERBATIM and an explicit CRITICAL comment on cumulative-declarative deletion; api.listAssignments(serverId)
  -> AssignmentListResponse and api.listSessions(serverId, from, to) -> ScheduledSessionListResponse
  both exist with the exact scoping the seed names (serverId for assignments; serverId + from/to
  date-window for sessions, GET /servers/:serverId/scheduled-sessions?from=&to=); DTOs (Assignment,
  ScheduledSession with id/serverId/startsAt/endsAt) exist in @studyhall/shared and match the
  proven DTO-intersection cache-type pattern (CachedDmMessage = DmMessage & {cachedAt}).
  No antipattern matches: this is a proven-pattern extension to two real, shipped read surfaces,
  not premature abstraction, wrong-layer, or demo-path tunnel vision.
proposed_reframe: |
  (n/a — PROCEED)
escalation_reason: |
  (n/a — PROCEED)
sibling_visible: false
```

## Framing review detail (problem-framer, wave-63 / M12 bundle #2)

**(1) Approach soundness — YES.** "Dexie v3 + read-through helpers + wire into the 2 academic
read paths, mirroring bundle-#1" is the right approach. The substrate is exactly as claimed
(`apps/web/src/features/sync/db.ts` v2, `cache.ts` getCached/putCached pattern, `types.ts`
DTO-intersection). The wire-in target `useDm.ts` demonstrates the precise mirror: fetch ->
write-through putCached -> on catch, getCached fallback -> render last snapshot.

**(2) Focus-room / study-timer exclusion — CORRECT.** `studyTimerSocket.ts` and
`FocusRoomPanel.tsx` are Socket.IO-only ephemeral presence/live state — "all mutations go
through the socket-only path (no REST)", join/leave room verbs, no IndexedDB / Dexie / REST
list endpoint. There is no persisted, re-readable snapshot to cache; caching a stale live
roster would be misleading, not useful. The exclusion is right on the merits (this is
re-readable-content caching, not live-state caching), not merely a scope-trim.

**(3) Assignments + schedule are the right two surfaces — CORRECT.** These are the two
persisted academic REST surfaces that exist. The suggested alternative "study-group data" has
NO surface in the codebase (no `listGroups` / `StudyGroup` / `/groups` in api.ts or apps/web/src).
Assignments + schedule are also the surfaces M12's success metric names, so the pairing is
metric-aligned, not arbitrary.

**(4) v2->v3 verbatim-restate migration risk — CORRECTLY FLAGGED as load-bearing.** db.ts
already carries the CRITICAL comment ("omitting a table in a later version deletes it and all
its data") and v2 already re-states all v1 tables verbatim. The seed's DATA-LOSS GUARD (v3
must re-state channels/messages/outbox/dmConversations/dmMessages + the 2 new tables, with a
v1->v2->v3 preservation test) is the correct highest-risk item and is explicitly called out.
This is the one place a silent regression would destroy shipped user data; the test assertion
is the right mitigation.

**(5) Cache scoping vs real endpoints — SOUND.** serverId key for assignments matches
`GET /servers/:serverId/assignments`. serverId + date-window for sessions matches
`GET /servers/:serverId/scheduled-sessions?from=&to=` (server "expands weekly occurrences in
the window") — the P-2/P-3 spec should ensure the cache key or read strategy accounts for the
window-dependent, occurrence-expanded response (a naive by-id cache could serve a snapshot
expanded for a different window). Not a framing defect — a spec-level note to carry forward;
mirrors the same createdAt-window concern already handled in the message cache. Does not block
PROCEED.

**Cross-check vs PRODUCT-PRINCIPLES rules 1 & 2:** every seed claim about what exists was
verified in code (rule 1); the named entities (listAssignments/listSessions, the two panels,
the Dexie singleton) are the real read boundaries the offline symptom occurs at, not merely
present-but-wrong targets (rule 2).

Disposition: **PROCEED** to P-1.
