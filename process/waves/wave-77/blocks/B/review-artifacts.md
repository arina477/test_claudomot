# Wave 77 — B-block review artifacts

**Block:** B (Build)
**Wave topic:** M13 leg-2 portable academic identity — academic profile fields + self API + cross-server profile-view (fail-closed visibility) + editor + member card
**Block exit gate:** B-6
**Status:** in-progress

## Stage deliverables
| Stage | Deliverable file | Status | Notes |
|---|---|---|---|
| B-0 | process/waves/wave-77/stages/B-0-branch-and-schema.md | done | branch + migration 0030 (262ecdb); C-2 applies to prod |
| B-1 | process/waves/wave-77/stages/B-1-contracts.md | pending | profile contract + PublicProfileSchema |
| B-2 | process/waves/wave-77/stages/B-2-backend.md | pending | self API + cross-server view + fail-closed visibility resolver |
| B-3 | process/waves/wave-77/stages/B-3-frontend.md | pending | editor + member card per design/member-profile-card.html |
| B-4 | process/waves/wave-77/stages/B-4-wiring.md | pending | |
| B-5 | process/waves/wave-77/stages/B-5-verify.md | pending | |
| B-6 | process/waves/wave-77/stages/B-6-review.md | pending | |

## Block-specific context
- **Spec contract:** tasks row 10a68f9e (DB); spec at process/waves/wave-77/stages/P-2-spec.md
- **Branch name:** wave-77-portable-identity
- **claimed_task_ids:** [10a68f9e (seed), a51e281d, bf0ad2a8, a98286cb]
- **New deps:** none. **New env vars:** none.
- **Schema changes this wave:** MIGRATION — nullable academic columns on users (pronouns, bio, institution, program, academic_role, academic_year); no backfill; no pgEnum.
- **Adopted design:** design/member-profile-card.html (D-3 canonicalized).
- **wave_type:** multi-spec → per-spec commits.
- **BINDING carries:** the cross-server visibility resolver (block bf0ad2a8) MUST — mirror dm.service.ts:171-193 shared-server EXISTS for 'server-members' (NOT listServerMembers shortcut); import PROFILE_VISIBILITY from packages/shared/src/privacy.ts:3 (do NOT re-declare literals); FAIL-CLOSED → HIDDEN; user_blocks isBlockedBetween bidirectional; deleted_at suppression; PublicProfile NEVER email. SessionNoVerifyGuard correct (self + public read). No-verification fence (no badge, plain text). B-3 port notes (CDN strip, portal BUILD-14, icons.tsx, aria). Push branch after every stage (BUILD-2).

## Open escalations carried into gate
none

## Gate verdict log
<appended by head-builder at B-6>
