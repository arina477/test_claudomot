# Wave 70 — B-block review artifacts

**Block:** B (Build)
**Wave topic:** M14 user-to-user Block — substrate + DM HIDE predicate + shared contracts + Block UI + member-row fix
**Block exit gate:** B-6
**Status:** gate-passed

## Stage deliverables
| Stage | Deliverable file | Status | Notes |
|---|---|---|---|
| B-0 | process/waves/wave-70/stages/B-0-branch-and-schema.md | done | user_blocks + migration 0026; 2642a45 |
| B-1 | process/waves/wave-70/stages/B-1-contracts.md | done | shared blocks.ts; 60f3123 |
| B-2 | process/waves/wave-70/stages/B-2-backend.md | done | BlockModule + DM HIDE (5 seams); 3a9c81a |
| B-3 | process/waves/wave-70/stages/B-3-frontend.md | done | block UI + settings + member-row fix; 728c9b7 |
| B-4 | process/waves/wave-70/stages/B-4-wiring.md | done | repo typecheck 4/4; routes registered |
| B-5 | process/waves/wave-70/stages/B-5-verify.md | done | lint clean; 629/629 (flake re-run); build 3/3 |
| B-6 | process/waves/wave-70/stages/B-6-review.md | done | head-builder APPROVED; /review clean (only P3s) |

## Block-specific context
- **Spec contract:** tasks row bc5986a9 (DB); spec at process/waves/wave-70/stages/P-2-spec.md
- **Branch name:** wave-70-user-block
- **claimed_task_ids:** [bc5986a9 (Block backend+DM HIDE, PRIMARY), c8c9742a (shared contracts), 6e4d56b2 (Block UI), cc783559 (member-row fix)]
- **wave_type:** multi-spec (per-spec commits; body cites task_id)
- **New deps added this wave:** none
- **New env vars added this wave:** none
- **Schema changes this wave:** NEW user_blocks table (apps/api/src/db/schema/user-blocks.ts + export) + db:generate migration; UNIQUE(blocker_id,blocked_id) + index(blocker_id). No change to messages/dm/users.
- **B-1 fast-path approved:** false
- **D-3 non-blocking notes (→ B-3):** focus-visible:ring on confirm/dropdown Block trigger; aria-hidden on self-row kebab.
- **P-4 non-blocking carries (→ B-2):** group-DM block semantics (spec-gap 5a); outbox-drain race (5b). Settings-host pin /settings/privacy (→ B-3).

## Open escalations carried into gate
none

## Gate verdict log

**B-6 Phase-1 head-builder verdict (attempt 1): APPROVED.** All 6 security invariants verified in source (no-IDOR on 3 endpoints; DM HIDE at all 5 seams bidirectional + additive; idempotency/guard matrix; no circular DI; spec-D member-row isSelf suppresses Report+Block; 19-case LIVE-DB integration spec real + runs in CI). Multi-spec commit discipline PASS — every claimed task_id has coverage; specs C+D co-location in MemberListPanel RATIFIED (P-3-planned serial, one specialist; wave-69 precedent). Known enrichment gap (blocked-users list renders UUID fallback vs design §7 avatar+name) ACCEPTED as V-2 follow-on — non-security, secondary management surface, safety-critical Block+HIDE core complete. Full verdict: process/waves/wave-70/blocks/B/gate-verdict.md. → Proceed to B-6 Phase-2 (/review).

```yaml
build_block_status:    phase1-approved   # Phase-2 /review + Action-6 discipline pending orchestrator
branch:                wave-70-user-block
stages_run:            [B-0, B-1, B-2, B-3, B-4, B-5, B-6]
stages_skipped:        []
review_verdict:        APPROVE            # Phase-1 head-builder
deviations_logged:
  - "specs C+D co-located in commit 728c9b7 (MemberListPanel shared) — RATIFIED, not split"
  - "spec A across 2 commits (B-0 schema 2642a45 + B-2 backend 3a9c81a), both cite bc5986a9 — allowed"
  - "KNOWN GAP: GET /blocks bare-UUID DTO → blocked-users list UUID fallback — accepted as V-2 follow-on (listBlocks profile enrichment)"
last_commit_sha:       41fb159fe64af08a87bdf7d290f0164d59a391bb
ready_for_ci:          false             # gated on B-6 Phase-2 pass
```
