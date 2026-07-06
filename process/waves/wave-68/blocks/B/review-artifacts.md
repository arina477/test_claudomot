# Wave 68 — B-block review artifacts
**Block:** B (Build)
**Wave topic:** M11 publish-write-half — owner-gated PATCH /servers/:id (publish toggle + description/topic) + server-settings Overview UI + discover memberCount:0 fix (+live-DB test)
**Block exit gate:** B-6
**Status:** gate-passed
## Stage deliverables
| Stage | Deliverable file | Status | Notes |
|---|---|---|---|
| B-0 | stages/B-0-branch-and-schema.md | done | branch + claim; NO schema change (columns exist from wave-67) |
| B-1 | stages/B-1-contracts.md | done | UpdateServer Zod |
| B-2 | stages/B-2-backend.md | done | owner-gated PATCH + memberCount LEFT-JOIN + live-DB test; 764/764 |
| B-3 | stages/B-3-frontend.md | done | net-new Overview settings + pre-populate fix; 596/596 |
| B-4 | stages/B-4-wiring.md | done | typecheck 4/4; PATCH registered |
| B-5 | stages/B-5-verify.md | done | lint clean; web 596 + api 764; builds ok |
| B-6 | stages/B-6-review.md | done | APPROVED; /review→fixed(dc34e41+9af167d, 1 rework); AC9 CI-integration carry |
## Block-specific context
- **Spec contract:** seed tasks row 2bd37c4c (single-spec, 8 ACs); pointer stages/P-2-spec.md
- **Branch name:** wave-68-publish-directory
- **claimed_task_ids:** [2bd37c4c]
- **New deps:** none  **New env vars:** none  **Schema changes:** NONE (is_public/description/topic exist from wave-67 migration 0024)
- **CARRIES (P-4):** (1) owner-authz SERVICE-side — updateServer copies the servers.service.ts:408 owner-ONLY gate (non-owner → 403, row unmodified; hard AC + test; T-8 exercises live). (2) memberCount fix = LEFT JOIN+GROUP BY + a MANDATORY pg-harness LIVE-DB test (real count, the guard the mocked unit test lacked). (3) B-3 SCOPE (karen): the Overview settings surface does NOT exist — BUILD IT NET-NEW (new component + entry/route), reuse DS form primitives + isOwner pattern (ServerRolesPage.tsx:675) + design/server-settings.html tab chrome; do NOT touch the Roles page. If a real design gap surfaces mid-build → B-block design-gap fallback (re-enter D-1).
## Open escalations carried into gate
none
## Gate verdict log
- **B-6 Phase 1 (head-builder, Attempt 1): APPROVED.** All 8 ACs satisfied. Owner-authz gate holds server-side (non-owner → 403, row unmodified; asserted in both mocked unit + real-Postgres integration tiers). memberCount LEFT JOIN + GROUP BY fix correct; live-DB spec exists (pg-harness, real Postgres, seeds 0/1/2 members). opt-in/unpublish + partial-PATCH no-clobber + read-contract extension (ServerSummaryWithInvite → sole producer findServerDetail) sound; no Dexie migration gap (blob store, no new indexed fields). Reuse discipline clean, no scope creep. Verdict: process/waves/wave-68/blocks/B/gate-verdict.md.
- **Gate-env note (NOT a defect):** integration tier could not run here — `ECONNREFUSED 127.0.0.1:5433` (harness Postgres not up in sandbox), identical across all 19 integration files. HARD handoff to C-block: CI must run `test:ci` against the provisioned harness DB and prove the wave-68 live-DB tests execute GREEN (not skip) — closes AC9.
- Local B-5 gate (author-reported, spot-verified): api unit 119/119 servers re-run green in gate; web 596/596, api 764/764, typecheck 4/4, biome clean, both builds ok.
