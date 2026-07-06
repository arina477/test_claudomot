# P-0 Frame — wave-65

## Discover
- wave_db_id: 0342c113-572b-4950-bd62-c344f8d5bef9 (wave_number 65, running; milestone backfilled M12)
- Prior-work: wave-64 (offline message attachment media, Dexie v4), wave-63 (offline assignments+schedule read-through), M4 (offline messages cache). This wave is the cold-open READ-PATH keystone unifying them. Cited.
- Roadmap milestone: M12 Offline-first moat (36378340), in_progress. ## Class: product-feature (→ mvp-thinner spawned).
- Spec-contract short-circuit: **no-prior-spec** (seed description was prose).
- Product decisions: none (technical offline-hydration; read-through pattern is a technical default per rule 17). Monetization/pricing remain founder-reserved (untouched).

## Reframe
**Original framing:** wire the message-LIST read path to fall back to the Dexie messages cache on cold offline open (from V-1-jenny wave-64 gap g1).

**problem-framer (round 1): REFRAME** (wrong-layer / false-absent premise) — verified in code by orchestrator:
- The message-list Dexie fallback ALREADY ships: `useMessages.ts:299-316` `.catch → getCachedMessages(db, channelId)`.
- Real cold-offline gate is upstream: `ServerContext.tsx` `fetchServers()` (l.119) + `getServerDetail()` (l.145) `.catch` to error with NO cache fallback → empty sidebar offline → no channel mounts → shipped message fallback unreachable.
- Dexie `channels` cache is dormant (putCachedChannel/getCachedChannel zero production callers); no server-list/server-detail cache exists.

**Reframe applied** (task db3ade72 description rewritten + retitled): fix the SERVER-LIST + CHANNEL-TREE read path in ServerContext.tsx — add write-through (cache server list + server detail on online fetch) + read-through (fall back to Dexie offline), mirroring shipped useDm.ts/AssignmentsPanel/ClassCalendar; wire the dormant `channels` cache + add server-list/server-detail cache table(s) (Dexie vN+1 bump, RULE 11 restate-all-tables). Reuse ConnectionStateIndicator. Leave useMessages.ts untouched.

**Round-2 re-spawn (all against reframed task):**
- problem-framer: **PROCEED** (root cause, right layer, no over-reach — read-only hydration, no offline CREATE/JOIN).
- ceo-reviewer: **PROCEED / HOLD-SCOPE** (keystone; corrected mechanism raises value-to-cost; correctly scoped — refuse to bundle standalone conflict-resolution UI; assignment-media leg blocked).
- mvp-thinner: **OK** ({server LIST, server DETAIL} is the inseparable minimal selectable-channel-offline slice; member/roles/presence/unread NOT in scope; no split).

**Disposition:** REFRAMED → re-reviewed → **PROCEED** to P-1.

**Final framing for P-block:** Read-only cold-offline hydration of the server list + channel tree. Add write-through + read-through in ServerContext.tsx reusing the thrice-shipped Dexie read-through pattern; wire the dormant `channels` cache; add a server-list/server-detail Dexie cache (schema bump — rule 11); reuse ConnectionStateIndicator; graceful empty-state. useMessages.ts untouched. Scope EXCLUDES: offline server create/join, member/roles/presence/unread offline, pagination/scroll-back, outbox/writes, conflict-resolution UI.

**Carry-forward for L-2:** ceo-reviewer flagged — the milestone-decomposition ritual should code-verify "no fallback exists" claims before seeding an offline read-path wave (this seed's premise was false-absent; problem-framer caught it at P-0, one stage late). Candidate observation.

```yaml
n_stage_verdict: COMPLETE
short_circuit: no-prior-spec
roadmap_milestone: 36378340-0ea5-428e-bc94-03750fb103f6
disposition: REFRAMED-then-PROCEED
design_gap_flag: unset  # P-1 sets (likely false — reuses ConnectionStateIndicator, no new UI)
reframe_rounds: 2
```
