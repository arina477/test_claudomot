verdict: OK
verdict_source: mvp-thinner
milestone_id: 36378340-0ea5-428e-bc94-03750fb103f6
milestone_title: M12 — Offline-first moat
milestone_class: product-feature
milestone_success_metric: |
  A student working fully offline can access ALL their StudyHall content — not just
  recent channel messages (the shipped M4 wedge) but assignments, study-group data,
  and previously-loaded media — and when the same item is edited from two places
  while offline, a clear conflict-resolution UI reconciles on reconnect with zero
  data loss. Deepens the offline wedge into a moat: coverage extends from messages
  to the full content surface.
mvp_critical_status: |
  Milestone in_progress. 8 of 10 M12 tasks done (Dexie DM/assignment/schedule/media
  caches + their read-through offline-serve paths all shipped). 1 blocked (assignment
  attachment media, 10e7543f). This wave's seed (db3ade72) is the last shipped-substrate
  cold-offline READ gap, REFRAMED: the message-list Dexie fallback (useMessages.ts) already
  ships; the true cold-offline gate is one layer upstream in ServerContext.tsx — the server
  LIST + channel-TREE read path has no Dexie fallback, so offline the sidebar renders nothing
  selectable and the shipped message fallback is never reached. The metric's
  "conflict-resolution UI" clause remains entirely unbuilt — a separate future M12 slice,
  not this wave's scope.

ok_rationale: |
  Re-spawn after P-0 REFRAME. The GOAL is unchanged (cold-offline previously-viewed channel
  content + wave-64 media reachable) but the MECHANISM moved upstream to ServerContext.tsx's
  server-list + channel-tree read path. I re-ran the trace test against the reframed ACs and
  probed all three candidate split axes; every AC traces cleanly to the metric's
  "previously-loaded media … working fully offline" clause for the COLD-open case, and the
  reframed slice is the minimal coherent keystone with no splittable non-mvp-critical heft.

  Axis (a) server LIST cache vs server DETAIL (channel-tree) cache — INSEPARABLE CORE, both
  kept. Trace test on deferring DETAIL: offline the sidebar shows server icons but selecting
  one yields a null channel tree → no channel becomes selectable → useMessages never mounts →
  cached messages + wave-64 media never render → metric's "reachable cold" claim breaks.
  Trace test on deferring LIST: no servers render at all, same break. Verified in code:
  ServerContext.tsx fetchServers() (l.102-122) and the getServerDetail() effect (l.130-149)
  are the two and only two reads on this path; both currently .catch to an error state with no
  Dexie read. Neither is nice-to-have — the smallest subset that makes "a channel becomes
  selectable offline" true is exactly {LIST, DETAIL}.

  Axis (b) offline caching of MEMBER lists / roles / presence / unread-counts — ABSENT from
  the proposed scope, nothing to peel. Verified in code: ServerContext's read path fetches ONLY
  getServers() + getServerDetail() (channel tree); member-list, presence dots, and typing are
  separate components on the wave-14 /presence namespace, not touched by this reframe. The
  reframe adds no member/role/presence/unread cache. This is the axis that WOULD have carried
  splittable heft if the wave reached for it — it does not.

  Axis (c) multi-server caching vs currently-selected-only — NOT additive heft, kept. The
  write-through on getServers() caches the server list as a unit (you cannot cache "the list"
  without its entries); server DETAIL caches accumulate naturally per visited server as the
  user navigates. This IS the cold-open promise ("launch offline, see my workspace"), and it
  carries no deep per-server metadata (no members/roles reached). Nothing separable.

  Implementation mechanisms are not additive scope: reuse of the shipped read-through pattern
  (useDm.ts, AssignmentsPanel.tsx, ClassCalendar.tsx), wiring the DORMANT Dexie `channels`
  cache (putCachedChannel/getCachedChannel exist with zero prod callers), the new
  server-list/server-detail cache table + Dexie vN+1 schema bump (rule-11 restate-all-prior-
  tables verbatim), reuse of the shipped ConnectionStateIndicator, and the graceful empty-state
  (required so a channel with no cache does not crash the cold open) are all the single
  cold-offline hydration mechanism, not peelable features.

  Out of scope and correctly not proposed (so nothing to split out): useMessages.ts is left
  untouched (its fallback already ships); no offline server CREATE/JOIN; write/outbox behavior;
  the conflict-resolution UI clause (a separate future M12 slice). Peeling any proposed AC
  would either break the "channel selectable / media reachable cold" claim or leave an
  incoherent fragment. OVER-CUT does not apply — the reframed slice is already the minimal
  selectable-channel-offline keystone, coherent and valuable as-is, not below a viable floor.
floor_constraint_active: false
floor_constraint_detail: |
  n/a — OK was reached on genuine well-classification, not because a floor blocked a THIN.
  No peel-off was proposed, so no residual-LOC / floor calculation was needed.

sibling_visible: false
