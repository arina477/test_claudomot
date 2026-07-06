# P-0 Frame — wave-63 (M12 offline-first moat, bundle #2)

## Discover
- wave_db_id: 5bae8b83-8d21-4875-a391-c5aa41c3cb31 (wave_number 63, running)
- Prior-work: extends bundle #1 (wave-62, shipped — Dexie v2 DM cache) + M4 (done). Same read-cache pattern.
- Roadmap milestone: M12 (36378340, in_progress, Class=product-feature) — offline moat, bundle #2 (the ACADEMIC content the metric names). Wave milestone backfilled.
- Spec short-circuit: seed has a detailed acceptance section but no fenced YAML head → treat no-prior-spec, full P-1..P-3.
- wave_type: multi-spec (3 claimed tasks: seed + 2 siblings).

## Reframe
- Framing: extend the proven offline read-cache to ACADEMIC content — Dexie v3 substrate (cachedAssignments + cachedScheduledSessions + helpers, reusing bundle #1) + wire the assignments panel (35c57942) + class schedule (42e0a265) read paths.
- **problem-framer PROCEED:** symptom-vs-cause PASS (AssignmentsPanel loadAssignments .catch→error blank; ClassCalendar listSessions .catch:495 — both dead-end, unlike useDm's cache fallback). All seed claims verified in code: api.listAssignments(serverId)→AssignmentListResponse + api.listSessions(serverId,from,to)→ScheduledSessionListResponse EXIST with exact scoping (serverId; serverId+from/to window, server expands weekly occurrences); Assignment/ScheduledSession DTOs in @studyhall/shared; db.ts v2 already has the verbatim-restate discipline+comment. Scoping calls CORRECT: focus-room/study-timer exclusion right (ephemeral Socket.IO, no REST/persisted snapshot); study-group data has NO surface in codebase (no listGroups/StudyGroup/`/groups`); v2→v3 migration flagged. CARRY-FORWARD (P-2/P-3): the SESSIONS cache key must account for the window-dependent occurrence-EXPANDED response — a naive by-id cache could serve a snapshot expanded for a different from/to window.
- **ceo-reviewer PROCEED (HOLD-SCOPE):** right headline slice — assignments is the coursework surface the bet (ad1a3685) rests on ("student doing coursework on bad wifi still sees assignments" = the bet's falsifier flipped to a capability); schedule is the time-anchored pair. Read-first sequencing correct (coverage falsifies the bet; conflict/write is a later bundle — deferral NOT a P-4 hole). N-1 FLAG: queue offline STUDY-GROUP DATA as M12 bundle #3 (remaining metric clause). Downstream bar: clean Dexie v3 migration; cache-only degradation strictly when disconnected (no stale-over-live).
- **mvp-thinner OK:** tight; both siblings mvp-critical (metric names assignments + study-group data; scheduled-sessions IS the persisted study-group leg). Schedule NOT splittable — both tables ride the SAME v3 verbatim-restate migration; splitting forces a wasteful separate v4 re-paying that data-loss risk. Shared-substrate bundling is risk-minimizing. No orphan schema.
- Mediation: none.
- **Disposition: PROCEED (multi-spec).** design_gap_flag expected FALSE (reuses shipped offline UI + existing assignments/schedule surfaces). P-1 confirms.

## Carry-forward
- P-2/P-3/B: (1) SESSIONS cache must account for the window-dependent occurrence-expanded response (not naive by-id); (2) Dexie v2→v3 .version(3).stores() re-states ALL v1+v2 tables VERBATIM (channels/messages/outbox/dmConversations/dmMessages) + preservation test [HIGHEST-RISK, 2nd instance of the lesson]; (3) cache-only degradation strictly when disconnected (no stale-over-live).
- N-1: bundle #3 = offline study-group data (ceo-reviewer).
