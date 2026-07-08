# Wave 80 — B-block review artifacts

**Block:** B (Build)
**Wave topic:** presence (online-status) privacy toggle — show_presence, honored server-side in the presence broadcast (proactive toggle-time emit)
**Block exit gate:** B-6
**Status:** gate-passed

## Stage deliverables
| Stage | Deliverable file | Status | Notes |
|---|---|---|---|
| B-0 | stages/B-0-branch-and-schema.md | done | 1 migration (postgres-pro) |
| B-1 | stages/B-1-contracts.md | done | typescript-pro (privacy.ts +showPresence) |
| B-2 | stages/B-2-backend.md | done | backend-developer (persist+audit; presence honor + PROACTIVE toggle-time emit + batch snapshot) |
| B-3 | stages/B-3-frontend.md | done | react-specialist (SettingsPrivacyPage real toggle) |
| B-4 | stages/B-4-wiring.md | done | |
| B-5 | stages/B-5-verify.md | done | |
| B-6 | stages/B-6-review.md | done | |

## Block-specific context
- **Spec contract:** tasks row 3038a4bc (DB); spec at process/waves/wave-80/stages/P-2-spec.md (+ P-4 BINDING CORRECTIONS)
- **Branch name:** wave-80-presence-toggle
- **claimed_task_ids:** [3038a4bc]
- **New deps added this wave:** none
- **New env vars added this wave:** none
- **Schema changes this wave:** 1 migration — users.show_presence boolean NOT NULL DEFAULT true (no backfill)
- **Files implemented (cumulative):** <B-2/B-3>
- **Deviations from plan logged this block:** none

## Open escalations carried into gate
- P-4 BINDING corrections: (1) PROACTIVE toggle-time presence emit (privacy→presence; the real AC-2 mechanism — passive gating fails the two-client test); (2) snapshot batch co-member flags; (3) cache show_presence on socket.data at connect; (4) binary online/offline (no last-seen); (5) truthfulness (online-broadcast only, not activity rosters); (6) T-9 journey-map add.
- LOAD-BEARING: two-client honor test (single-client = coverage theater); showPresence-only (no sendReadReceipts).

## Gate verdict log
<appended by fresh head-builder spawn at B-6 Action 1>
