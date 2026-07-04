# Wave 46 — V-3 Fast-fix

**Block:** V (Verify) · Stage V-3 (gate + same-wave fast-fix loop). Two-phase: Phase 1 fresh head-verifier gate verdict; Phase 2 bounded fast-fix loop (cap 3 rounds).

## Phase 1 — head-verifier gate (fresh spawns)

| Attempt | Verdict | Outcome |
|---|---|---|
| 1 | **REWORK** (V-2) | F-A (CRITICAL) mis-placed on the fast-fix queue — no DM-candidate endpoint exists, so satisfying spec 1ceffdc9 AC2 "entry point" needs a new endpoint + product decision (B re-entry, not a <20 LOC fast-fix). Orchestrator corrected V-2: re-routed F-A + F7 to B re-entry, seeded them as a blocking M8 follow-up bundle (parent 10967558 + sibling 379978a4, wave_id NULL). Bounded queue → [F-C1, F6, F-I4]. |
| 2 | **ESCALATE → BOARD** (`V-3-cap-wave-46`) | Corrected triage is verification-sound, but shipping a LIVE feature with a known-CRITICAL "unstartable through the UI" gap deferred to a follow-up is a revert-vs-accept-known-broken-vs-expedite product/risk call the V-block may not self-certify. Routed to BOARD per V-3 Action 4 (automatic mode). |

### BOARD resolution (`V-3-cap-wave-46`) — 7/7 for Option A (ACCEPT-KNOWN-BROKEN), no vetoes
Keep wave live; fast-fix [F-C1, F6, F-I4] now; F-A + F7 stay the #1 seeded M8 follow-up; advance to Learn after fast-fixes clear + re-verify. Full record: `process/waves/wave-46/escalations/board-V-3-cap-wave-46.md`; founder digest: `process/session/updates/board-digest-2026-07-04.md`. Carried flags: candidate-source ("who's DM-able") is a product/taste decision for the follow-up's P-block (founder-proxy + competitive-analyst); surface "backend solid, entry point deferred" as a known-gap at N-handoff (product-manager).

## Phase 2 — Fast-fix loop (bounded queue [F-C1, F6, F-I4]; Iron Law: routed to specialists, orchestrator did not edit code)

### Round 1
| Finding | Owner | Fix | LOC | typecheck/biome/test |
|---|---|---|---|---|
| F-C1 | node-specialist | `displayName ?? username ?? userId` restored at 3 DM participant-mapper sites + `users.username` selected per query | 6 | clean / clean (pre-existing warn only) / 605 api tests pass |
| F-I4 (r1) | node-specialist | cursor encodes epoch-micros instead of `.toISOString()` | 3 | clean / clean / pass |
| F6 | react-specialist | `dm:message` own-sender echo reconciles the pending optimistic row in place (match by author+content); real-id dedup preserved | 11 | clean / clean / 373 web tests pass |

Commits: `7523c78` (F-C1 + F-I4 r1, shared file apps/api/src/dm/dm.service.ts), `ba79472` (F6, apps/web/src/shell/useDm.ts). CI run 28706513600 = SUCCESS. Re-deployed api+web pinned to `ba794726` (api 2982ea11, web b838e711, both SUCCESS + commitHash match, live 200).

**Round-1 re-verification:** Karen APPROVE (all 3 present, non-stub). jenny APPROVE F-C1 (displayName now username live) + F6 (1 DOM row + 1 server row; echo-race carried by T-5 two-client evidence), but **REJECT F-I4** — still reproduced live (26 emitted/24 unique at limit=10; 15/13 at limit=5; boundary re-emitted at every seam). Root cause: the round-1 fix round-tripped the cursor through a JS Date (millisecond-resolution), so microseconds were irrecoverably lost and the WHERE re-serialized at ms precision — the boundary row (.123456µs) still satisfied `created_at > cursor(.123000)`.

### Round 2 (F-I4 only)
| Finding | Owner | Fix | LOC | typecheck/biome/test |
|---|---|---|---|---|
| F-I4 (r2) | node-specialist | cursor carries `created_at::text` (full-µs string) verbatim; keyset WHERE compares `created_at`/`= created_at` against that literal with the `(created_at,id)` tiebreaker — no JS Date round-trip | ~15 touched / +3 net | clean / clean (pre-existing warn only) / 605 api tests pass |

Commit `c49ae21`. CI run 28706814787 = SUCCESS. Re-deployed api+web pinned to `c49ae21` (api ec3bac32, web 22263eba, both SUCCESS + commitHash match, live 200; migration 0021 untouched).

**Round-2 re-verification:** Karen APPROVE (round-2 source real, non-stub, `.toISOString()` gone from cursor path, full-precision `created_at::text` keyset). jenny APPROVE — same conversation + same method as her round-1 reproduction now yields **25 emitted / 25 unique, zero seam duplicates** at both limit=10 and limit=5; decoded cursors confirmed carrying 6-digit microsecond timestamps. F-I4 resolved live.

## Final state
- **Bounded fast-fix queue [F-C1, F6, F-I4]: all resolved-with-evidence in the deployed state.** Final re-verification: **Karen APPROVE + jenny APPROVE.**
- No finding closed by weakening a test / loosening an assertion (both specialists confirmed; 605 api + 373 web tests pass, unchanged assertions).
- Each fix re-verified against its original failing condition (F-I4 twice, against jenny's exact live reproduction).
- Re-deploy performed for the user-facing fixes; live behavior re-confirmed.
- **F-A (CRITICAL) + F7: B-re-entry, BOARD-approved deferral** — seeded as the #1 M8 follow-up bundle (parent 10967558-f27f-4f47-81be-5b5e5d878259 + sibling 379978a4-0497-449f-8807-4cffe53d1436). Wave ships with this known-critical entry-point gap FLAGGED at the gate + digest + N-handoff — NOT silently dropped, gates a truly-complete DM feature until resolved via B→C→T→V.

```yaml
phase1_head_verifier_verdict: ESCALATE   # attempt 2 → BOARD; attempt 1 was REWORK. BOARD resolved Option A (7/7).
board_decision: {slug: V-3-cap-wave-46, outcome: A-accept-known-broken, tally: "7/7", vetoes: 0}
skipped: false
queue_items_processed: 3          # F-C1, F6, F-I4 (bounded queue after F-A/F7 removed to B re-entry)
queue_items_fixed: 3
queue_items_moved_to_b_re_entry: [F-A, F7]   # seeded as M8 follow-up bundle (10967558 + 379978a4)
fast_fix_rounds: 2                # cap 3; cleared in 2
loc_per_fix: {F-C1: 6, F6: 11, F-I4-r1: 3, F-I4-r2: 15}
commits: [7523c78, ba79472, c49ae21]
re_deploys: [{sha: ba794726, api: 2982ea11, web: b838e711}, {sha: c49ae21, api: ec3bac32, web: 22263eba}]
re_verification:
  karen: APPROVE
  jenny: APPROVE
cap_escalation: true              # to BOARD (disposition of the CRITICAL F-A deferral), NOT a fast-fix-round-cap exhaustion
escalation_destination: board     # resolved: Option A, 7/7
```
