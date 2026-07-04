# Wave 46 — V-2 Triage

**Block:** V (Verify) · Stage V-2. Classify every T-block + V-1 finding into blocking / non-blocking / noise. V-2 is the only stage that decides what blocks the wave from shipping.

**Inputs merged + deduplicated:** T-block aggregate (15 rows) + Karen V-1 (0 defects, all confirm) + jenny V-1 (5 defects + coverage note). Overlapping T-findings folded into their jenny counterpart with both citations (no triple-count).

## Triage table

| ID | Source(s) | Sev | Bucket | Disposition |
|---|---|---|---|---|
| **F-A** | jenny V-1 (NEW; orch-confirmed) | CRITICAL | **BLOCKING → B RE-ENTRY** | ~~V-3 fast-fix~~ **RE-ROUTED to B re-entry** per V-3 Phase-1 REWORK. No DM-candidate endpoint exists (grep-confirmed: dm module has no candidate/member GET route; picker's only source is `getServerMembers(serverId)`). Satisfying spec 1ceffdc9 AC2 "entry point" requires a NEW candidate-source (e.g. `GET /dm/candidates`) + a product decision on the candidate set — exceeds fast-fix scope, would be green-by-guessing. |
| **F-C1** | jenny V-1 + T-3 F-C1 + T-5 F3b + T-6 F3c | HIGH | **BLOCKING** | V-3 fast-fix → node-specialist (server DTO displayName fallback → username) |
| **F6** | jenny V-1 + T-5 F6 | HIGH | **BLOCKING** | V-3 fast-fix → react-specialist (dedup optimistic-by-idempotencyKey vs socket echo) |
| **F-I4** | jenny V-1 + T-4 F-I4 | HIGH | **BLOCKING** | V-3 fast-fix → node-specialist (cursor boundary: strict `>` / correct precision keyset) |
| **F7** | jenny V-1 + T-5 F7 | MEDIUM | **BLOCKING → B RE-ENTRY** | ~~V-3 fast-fix~~ **RE-ROUTED to B re-entry with F-A** per V-3 Phase-1 REWORK (V-2's own note: "folds into F-A/F-C1"; the optimistic-author resolution is entangled with the picker/candidate + name-resolution rework). |
| F9 | T-6 | MINOR | NON-BLOCKING | task `39fc1c5e` (M8) — redundant empty channel-sidebar column on DM route |
| F10 | T-6 | LOW | NON-BLOCKING | task `5bcbd27f` (M8) — off-token surface substitutions |
| V1-COV | jenny V-1 | MEDIUM | NON-BLOCKING | task `b84f7be9` (unassigned) — userB fixture password wrong (test-tooling gap) |
| F1 | T-1 | LOW | NOISE | test-scaffold type casts in spec file; prod source clean — acceptable unit-mock pattern |
| F2 | T-1 | LOW | NOISE | warn-level noNonNullAssertion guarded by length check; L-2 cleanup candidate, not a defect |
| F3 | T-2 | LOW | NOISE | service fan-out asserts internal emit; wire proven in gateway spec + T-3/T-5 — correct boundary |
| F-C2 | T-3 | LOW | NOISE | optional DTO fields absent — spec-legal, no data loss |
| F-I5 | T-4 | LOW | NOISE | repeated-signin self-invalidation is test-tooling constraint, not a product defect |
| F8 | T-5 | INFO | NOISE | HTTP long-polling (no wss upgrade) — works; Socket.IO transport default, intended |
| F11 | T-8 | LOW | NOISE | idle unauth connects on default `/` namespace carry no DM data; /messaging ns rejects unauth at WS-upgrade — defense-in-depth note, no leak |
| F12 | T-8 | LOW | NOISE | who_can_dm='nobody' gates STARTING new DMs, not muting existing threads — by-design (both are authorized participants) |

## Blocking findings — root-cause classified (Iron Law: no fix without root cause; route to specialist, orchestrator does NOT fix directly)

Per `triage-routing-table.md` → `AGENTS.md`: frontend React logic → `react` (react-specialist); Node/backend logic → `node` (node-specialist). All 5 are logic defects (no schema/contract/migration change), single-to-few files, small — provisional V-3 fast-fix candidates. V-3 enforces the LOC cap at execution and aborts to B re-entry if a fix exceeds it.

- **F-A (CRITICAL) — root cause:** `DmHome.tsx` wires the picker's candidate source to `useServers().selectedId`, but the DM home surface always has `selectedId=null` (choosing a server unmounts DmHome). Secondary root cause: `currentUserId = profile?.username` (a username) is compared against member `userId` (opaque `users.id` text) for self-exclusion — mismatched id spaces. Fix owner: **react-specialist**. Direction: source picker candidates independent of a selected server (caller's DM-able people, e.g. across the caller's servers or a directory endpoint), and key self-exclusion / name resolution on the true `users.id`. HIGHEST-RISK fast-fix — if the fix requires a new endpoint or exceeds the cap, V-3 aborts this one to B re-entry.
- **F-C1 (HIGH) — root cause:** DM DTO mapper (server) returns `displayName = userId` when displayName is unset; the `displayName || username || userId` fallback (wave-29 pattern) was dropped. Fix owner: **node-specialist**. Direction: restore the fallback in the participant/DTO mapper so unset displayName resolves to username. (Also cures the UUID-in-name half of F7's delivered-row appearance.)
- **F6 (HIGH) — root cause:** `useDm.ts:205` socket dedup checks only `kind==='real' && id`; when the M1 fan-out echo (which now includes the sender, per B-6 fix) beats the REST onDelivered reconcile, the optimistic-by-idempotencyKey row is not yet `real`, so a second row appends. Fix owner: **react-specialist**. Direction: dedup the incoming `dm:message` against the pending optimistic row by idempotencyKey (reconcile in place) before appending.
- **F-I4 (HIGH) — root cause:** `encodeCursor` emits the cursor at millisecond ISO precision (`.toISOString()`) but `created_at` is microsecond `timestamptz`; the strict `>` then re-includes the truncated-equal boundary on the ASC page. Fix owner: **node-specialist**. Direction: encode the cursor at full µs precision OR switch to a `(created_at, id)` composite keyset with correct boundary exclusion. (jenny confirmed the duplication half; the "drops last" half did not reproduce — composite id-tiebreaker prevents drops.)
- **F7 (MEDIUM) — root cause:** optimistic row renders "Unknown user" because self is not resolvable in the participant map at optimistic-render time (compounds with F-A's username/userId mismatch + F-C1's name gap). Fix owner: **react-specialist**. Direction: resolve the optimistic row's author from the known current-user profile. Expected to fold into the F-A + F-C1 fixes.

## Non-blocking task rows INSERTed (Action 4)

| task_id | milestone_id | wave_id | title |
|---|---|---|---|
| `39fc1c5e-7fcc-473a-9f50-71cdb53f8759` | M8 (84e17739) | **NULL** | DM route: remove redundant empty channel-sidebar column |
| `5bcbd27f-16f3-4928-a535-c4104da34a19` | M8 (84e17739) | **NULL** | DM off-token surface substitutions |
| `b84f7be9-093c-4bea-bb73-19b73b686a68` | NULL (unassigned) | **NULL** | Fix userB e2e fixture password |

`wave_id` set to NULL on all three (provenance preserved in prose `description` as "Source: wave-46 V-2 …"). Reason: the N-2 seed picker requires `wave_id IS NULL`; a milestone-scoped follow-up left at the producing wave's id would strand (never seedable). `parent_task_id = NULL` → each is a top-level seed candidate N-2 can pick directly.

## Noise suppressions (12) — rationale one-liners above in the triage table. No 3+-across-waves suppression pattern detected this wave for VERIFY-PRINCIPLES promotion.

## Reviewer-split note
Karen APPROVE (claim-truth) + jenny REJECT (semantic) is a legitimate orthogonal split, not a contradiction — recorded in V-1-summary. jenny's F-A is a genuine reviewer-catches-what-the-green-suite-missed: the T-5 E2E reached a thread via a pre-existing/seeded conversation and never exercised cold-start "new user starts their first DM from the DM home." That gap is now the load-bearing blocking finding.

```yaml
findings_input_count: 18   # 15 T-block rows + 5 jenny defects + 1 jenny coverage note, deduped to 16 distinct dispositions
findings_blocking:
  - {id: F-A,   source: jenny,          summary: "Start-DM picker unstartable from DM home (no DM-candidate source; serverId null) + username/userId id-space mismatch", fast_fix_candidate: false, disposition: b-re-entry, reason: "needs new candidate-source endpoint + product decision on candidate set; >20 LOC; green-by-guessing risk"}
  - {id: F-C1,  source: jenny+T-3/T-5/T-6, summary: "displayName returns raw userId UUID; dropped username fallback",                          fast_fix_candidate: true,  owner: node-specialist}
  - {id: F6,    source: jenny+T-5,      summary: "sender's own message double-renders; echo not deduped vs optimistic-by-idempotencyKey",     fast_fix_candidate: true,  owner: react-specialist}
  - {id: F-I4,  source: jenny+T-4,      summary: "cursor boundary re-emitted on ASC page turn (ms-vs-us truncation; inclusive vs strict)",     fast_fix_candidate: true,  owner: node-specialist}
  - {id: F7,    source: jenny+T-5,      summary: "'Unknown user' author on optimistic row (self unresolved at optimistic render)",             fast_fix_candidate: false, disposition: b-re-entry, reason: "entangled with F-A picker/candidate + name-resolution rework"}
findings_non_blocking:
  - {id: F9,     source: T-6,   summary: "redundant empty channel-sidebar column on DM route",       task_id: 39fc1c5e-7fcc-473a-9f50-71cdb53f8759, milestone_id: 84e17739-af5e-4396-beb9-b6f3d6836fc4, wave_id: null}
  - {id: F10,    source: T-6,   summary: "off-token surface substitutions on DM surfaces",            task_id: 5bcbd27f-16f3-4928-a535-c4104da34a19, milestone_id: 84e17739-af5e-4396-beb9-b6f3d6836fc4, wave_id: null}
  - {id: V1-COV, source: jenny, summary: "userB e2e fixture password wrong; blocks 2-client re-drive", task_id: b84f7be9-093c-4bea-bb73-19b73b686a68, milestone_id: null, wave_id: null}
findings_noise:
  - {id: F1,   source: T-1, summary: "test-scaffold type casts",                       rationale: "unit-mock pattern; prod source clean"}
  - {id: F2,   source: T-1, summary: "warn-level noNonNullAssertion",                   rationale: "guarded by length check; L-2 cleanup, not defect"}
  - {id: F3,   source: T-2, summary: "service spec asserts internal emit",              rationale: "wire proven in gateway/T-3/T-5; correct boundary"}
  - {id: F-C2, source: T-3, summary: "optional DTO fields absent",                      rationale: "spec-legal, no data loss"}
  - {id: F-I5, source: T-4, summary: "repeated-signin self-invalidation",              rationale: "test-tooling constraint, not product defect"}
  - {id: F8,   source: T-5, summary: "HTTP long-polling no wss upgrade",               rationale: "Socket.IO transport default; works; intended"}
  - {id: F11,  source: T-8, summary: "idle unauth connects on default / namespace",    rationale: "no DM data; /messaging ns rejects unauth; defense-in-depth note"}
  - {id: F12,  source: T-8, summary: "who_can_dm=nobody doesn't mute existing thread", rationale: "by-design; both are authorized participants"}
fast_fix_queue: [F-C1, F6, F-I4]   # CORRECTED per V-3 Phase-1 REWORK (attempt 1): F-A + F7 removed to B re-entry
b_block_re_entry_required: [F-A, F7]   # F-A CRITICAL needs candidate-source endpoint + product decision (fresh scope); F7 folds into it. Carried as a blocking M8 follow-up seed; wave ships with a KNOWN-CRITICAL entry-point gap flagged at the gate.
```
