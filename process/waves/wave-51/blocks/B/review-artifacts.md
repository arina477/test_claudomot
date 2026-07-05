# Wave 51 — B-block review artifacts

**Block:** B (Build) · **Wave topic:** DM surface canonical 3-panel layout fix (gate ChannelSidebar on !dmHomeActive) · **Gate:** B-6 · **Status:** in-progress · **Branch:** wave-51-dm-3panel · **claimed:** [39fc1c5e] · **Design:** design/direct-messages.html (existing canonical, no gap)

## Stage deliverables
| Stage | Deliverable | Status | Notes |
|---|---|---|---|
| B-0 | stages/B-0-branch-and-schema.md | done | branch; SCHEMA SKIP (no schema/migration) |
| B-1 | stages/B-1-contracts.md | skipped | no contract surface change |
| B-2 | stages/B-2-backend.md | skipped | frontend-only (no backend) |
| B-3 | stages/B-3-frontend.md | in-progress | AppShell.tsx gate ChannelSidebar on !dmHomeActive + test |
| B-4 | stages/B-4-wiring.md | pending | repo typecheck |
| B-5 | stages/B-5-verify.md | pending | biome ci . + full suite (BUILD rule-10) |
| B-6 | stages/B-6-review.md | pending | head-builder + /review |

## Block-specific context
- **Spec:** tasks row 39fc1c5e (DB). wave_type single-spec. design_gap_flag false.
- **Branch:** wave-51-dm-3panel. **claimed_task_ids:** [39fc1c5e]. Deps: none. Env: none. Schema: none.
- **Fix:** extend `{!dmHomeActive && ...}` guard (mirror MemberListPanel AppShell.tsx:122) to ChannelSidebar desktop wrapper (64-69) + mobile overlay drawer (82-106).

## MANDATORY B-block carries (from P-4 Phase-2 karen)
- **karen-1 (test rigor):** the B-3 test MUST assert ChannelSidebar ABSENT when dmHomeActive=true for BOTH the desktop wrapper (64-69) AND the mobile drawer (82-106), and PRESENT (no regression) when false. A desktop-only gate would pass a weak test while leaving the mobile leak.
- (head-product advisory) mobile backdrop (72-80) sidebarOpen-gated — karen confirmed sidebarOpen can't be true while dmHomeActive; gating 82-106 sufficient.
- **BUILD rule-10:** B-5 runs the CI-identical `biome ci .` + full test suite before B-6.

## Gate verdict log
<head-builder at B-6>
