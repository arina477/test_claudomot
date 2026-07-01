```yaml
verdict: PROCEED
verdict_source: problem-framer
matched_antipatterns: []
reasoning: |
  Symptom-vs-cause check (MANDATORY) run: the seed's premise is broadly accurate
  but slightly stale, and the framing is sound for a workable-backlog optimization.
  getCoMemberUserIds (presence.service.ts:119-133) does run a co-member scan once
  per connect via getServerIdsForUser + inArray(server_id, serverIds); it is NOT
  per-message. The real query cost is bounded and index-supportable, not a hidden
  presence-architecture rework. It smells like speculative-scale optimization at
  ~0 users, but the task self-scopes as "non-blocking, before multi-server scale"
  M5 workable-backlog debt, so it is not gold-plating dressed as a feature. No
  catalog antipattern cleanly matches; PROCEED with scope-tightening notes below.
proposed_reframe: |
  (not a REFRAME — advisory notes for P-1/P-2 to keep scope honest)

  1. WAVE-14 CLAIM ACCURACY: Still substantially accurate but drifted. The current
     code (presence.service.ts:106-133) issues TWO queries per connect:
       - getServerIdsForUser: SELECT server_id FROM server_members WHERE user_id=$1
         (presence.service.ts:106-113) — NOT index-backed. server_members has only
         UNIQUE(server_id, user_id) (servers.ts:57), which leads with server_id, so
         a user_id-first lookup falls back to a scan. This is the real un-indexed hot
         path, not getCoMemberUserIds.
       - getCoMemberUserIds: SELECT user_id FROM server_members WHERE
         server_id IN (...) (presence.service.ts:123-126) — ALREADY index-supported
         by the leading column of UNIQUE(server_id, user_id); dedup is done in-memory
         (a JS Set), so a SELECT DISTINCT rewrite adds nothing.
     Net: the seed names getCoMemberUserIds as the cost, but the cheaper high-value
     lever is a single index on server_members(user_id) covering getServerIdsForUser.

  2. FREQUENCY, NOT FAN-OUT, IS THE CALL RATE: The query fires per connect/reconnect
     (presence.gateway.ts:140,157), not per message. Wave-26's author-avatar dots are
     a CLIENT-side presence-store consumer; they do not re-invoke this server query, so
     the "wave-26 made it hotter" premise is weak — connect frequency is unchanged by
     wave-26. Don't let the wave-26 framing justify over-scoping this into a
     store/snapshot redesign.

  3. NOT A HIDDEN ARCHITECTURE CHANGE: This is a self-contained backend query
     optimization (add index; optionally memoize per-connect within the handler). The
     in-memory presenceMap/snapshot model (presence.service.ts:44) is untouched and
     out of scope. The O(rows×events) client per-row subscription is the SEPARATE
     unassigned task 07361daf and must stay separate — do not couple (would trip
     antipattern #5).
escalation_reason: |
  (n/a)
sibling_visible: false
```
