# Wave 81 — P-block review artifacts

**Block:** P (Product)
**Wave topic:** Fix unscrollable /settings/profile (+ /settings/privacy) — standalone full-page routes clipped by the locked-body overflow:hidden (root-caused).
**Block exit gate:** P-4
**Status:** in-progress

## Stage deliverables
| Stage | Deliverable file | Status | Notes |
|---|---|---|---|
| P-0 | process/waves/wave-81/stages/P-0-frame.md | done | discovery + reframe (bug already root-caused) |
| P-1 | ... | done | |
| P-2 | ... | done | |
| P-3 | ... | done | |
| P-4 | process/waves/wave-81/stages/P-4-gemini-review.md | pending | |

## Block-specific context
- **Wave topic:** unscrollable /settings/profile fix (founder directive 2026-07-09)
- **Spec-contract short-circuit verdict:** no-prior-spec
- **Roadmap milestone:** NONE — roadmap complete (14/14 done); founder bug-fix phase. Task milestone_id NULL.
- **design_gap_flag:** false (scroll-container fix on existing pages) (likely false; a layout/scroll fix to existing adopted pages)
- **claimed_task_ids:** [2340d2d3] — final at P-2
- **Tier-3 product decisions resolved this wave:** none (bug fix)
- **Autonomous mode active during P-block:** automatic

## Open escalations carried into gate
- Root cause verified: globals.css html/body overflow:hidden + ProfilePage/SettingsPrivacyPage min-h-screen with no internal scroll container → content past viewport clipped. Fix = per-page (or shared) scroll container (h-screen overflow-y-auto). Preserve 6px dark scrollbar (DS §9). Verify LIVE scroll to bottom-most field.

## Gate verdict log
<appended by fresh head-product spawn at P-4 Action 1>
