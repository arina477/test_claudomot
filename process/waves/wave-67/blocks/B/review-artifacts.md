# Wave 67 — B-block review artifacts
**Block:** B (Build)
**Wave topic:** M11 server discovery bundle #1 — public-server schema + GET /servers/discover + /discover UI + one-click public join
**Block exit gate:** B-6
**Status:** gate-passed
## Stage deliverables
| Stage | Deliverable file | Status | Notes |
|---|---|---|---|
| B-0 | stages/B-0-branch-and-schema.md | done | servers +3 cols + migration 0024 (7cdf2c0); local apply→CI/deploy |
| B-1 | stages/B-1-contracts.md | done | DiscoverServer Zod (shared) |
| B-2 | stages/B-2-backend.md | done | discover + public-join (is_public gate); 752/752 |
| B-3 | stages/B-3-frontend.md | done | /discover page+join, 574/574; standalone-route deviation (verify at B-6/T) |
| B-4 | stages/B-4-wiring.md | done | typecheck 4/4; routes registered |
| B-5 | stages/B-5-verify.md | done | lint clean; web 574 + api 752; builds ok |
| B-6 | stages/B-6-review.md | done | attempt2 APPROVED (1 rework); /review 18 findings → fixed(1b68663)+deferred; re-verify APPROVED |
## Block-specific context
- **Spec contract:** seed tasks row 609c9bdd (3 blocks A/B/C); pointer stages/P-2-spec.md
- **Branch name:** wave-67-server-discovery
- **claimed_task_ids:** [609c9bdd, 37b78777, e363dac2]
- **New deps:** none  **New env vars:** none
- **Schema changes:** servers += is_public(default false)/description/topic + Drizzle-generated migration (B-0)
- **Design canonical:** design/server-discover.html (D-3 adopted)
- **CARRIES (P-4 + D-3):** is_public join gate SERVER-SIDE (reject non-public 404/403, T-8 must exercise); opt-in visibility (no backfill); honest empty-state as hard test; §8 primary buttons = dark-on-emerald; D-3 impl notes (results-count line, skeleton height, nav-glow token, aria-describedby)
## Open escalations carried into gate
none
## Gate verdict log
<appended by fresh head-builder spawn at B-6>
