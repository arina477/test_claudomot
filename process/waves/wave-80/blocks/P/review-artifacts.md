# Wave 80 — P-block review artifacts

**Block:** P (Product)
**Wave topic:** M13 leg-3b — read-receipt & presence privacy toggles in settings. SCOPE HOLE (carried from wave-79 P-0): sendReadReceipts gates a message read-receipt feature that does NOT exist (no "seen-by" on messages; `read_at` in schema is notification-read, not message-receipt). showPresence gates the EXISTING presence service.
**Block exit gate:** P-4
**Status:** in-progress

## Stage deliverables
| Stage | Deliverable file | Status | Notes |
|---|---|---|---|
| P-0 | process/waves/wave-80/stages/P-0-frame.md | done | discovery + reframe (resolve scope hole) |
| P-1 | process/waves/wave-80/stages/P-1-decompose.md | done | |
| P-2 | process/waves/wave-80/stages/P-2-spec.md | done | |
| P-3 | process/waves/wave-80/stages/P-3-plan.md | done | |
| P-4 | process/waves/wave-80/stages/P-4-gemini-review.md | pending | |

## Block-specific context
- **Wave topic:** M13 leg-3b privacy toggles (read-receipt + presence)
- **Spec-contract short-circuit verdict:** no-prior-spec (decomposer prose)
- **Roadmap milestone:** M13 (b7400254) in_progress — leg-3b (last authored M13 leg; after this, founder-disposition point)
- **design_gap_flag:** false (reuses existing SettingsPrivacyPage toggle pattern)
- **claimed_task_ids:** [3038a4bc] (single-task) — final at P-2
- **Tier-3 product decisions resolved this wave:** SCOPE-HOLE resolution (reframe): read-receipts don't exist. Options: descope sendReadReceipts / build read-receipts / ship-preference-only.
- **Autonomous mode active during P-block:** automatic

## Open escalations carried into gate
- SCOPE HOLE: sendReadReceipts has no backing feature. Anti-security-theater lesson (BUILD-17/wave-79): do NOT ship a control that claims to do something it can't (a "send read receipts" toggle that gates nothing would be dishonest UX).

## Gate verdict log
<appended by fresh head-product spawn at P-4 Action 1>
