# Wave 29 — B-block review artifacts

**Block:** B (Build) | **Wave topic:** Presence/members code-debt — displayName empty-fallback fix (`??`→`||`) + DELETE dead ServerMembersResponseSchema | **Block exit gate:** B-6 | **Status:** gate-passed | **wave_type:** single-spec | **branch:** wave-29-presence-members-debt

## Stage deliverables
| Stage | Deliverable file | Status | Notes |
|---|---|---|---|
| B-0 | stages/B-0-branch-and-schema.md | in-progress | branch + claim; schema SKIP (no migration) |
| B-1 | stages/B-1-contracts.md | done | deleted schema+type+both barrels; 0 consumers; shared typecheck green (2c18c22) |
| B-2 | stages/B-2-backend.md | done | ||-fix ×2 sites + 5 unit tests (407 pass); biome clean (c6e8491) |
| B-3 | (skipped) | skipped | backend-only wave (design_gap_flag=false; no UI) |
| B-4 | stages/B-4-wiring.md | done | typecheck 4/4 (deletion safety-net green) + lint 0-err + build 3/3 |
| B-5 | stages/B-5-verify.md | done | 407 unit pass + build 3/3; backend-only (no dev-smoke UI) |
| B-6 | stages/B-6-review.md | done | head-builder APPROVED + /review no P0/P1/P2; APPROVE |

## Block-specific context
- **Spec contract:** tasks row d23a0740 (primary, single-spec); spec at stages/P-2-spec.md + d23a0740.description.
- **Branch:** wave-29-presence-members-debt (from main 104ac6d).
- **claimed_task_ids:** [d23a0740].
- **New deps/env:** none. **Schema changes:** none (no DB migration; part 2 is a shared-package Zod deletion, not a DB change).
- **Sequencing:** B-1 does NOT skip (real deletion) → B-1 (typescript-pro) → B-2 (node-specialist), no fast-path.

## Binding B-block carries (P-4)
- **LOCKED operator form (P-4 REWORK):** replace BOTH `??` with `||` — `r.displayName || r.email.split('@')[0] || r.userId` (servers.service.ts:249) + `userRow?.display_name || userRow?.email?.split('@')[0] || userId` (presence.gateway.ts:125). NOT "swap the middle ??" (that's a SyntaxError); NOT `?? (…||…)` (fails the stored-empty-display_name guard).
- **Barrel deletion:** BOTH index.ts:23 (schema) AND :34 (type) — leaving :34 dangling breaks B-4 typecheck.
- **Grep-verify zero consumers** before deleting (align-if-consumer-found deviation path).
- **BUILD rule 7/8:** local verify uses `biome check`; run the formatter before commit (rule 8 pre-commit-gate spirit).

## Open escalations carried into gate
- M5 park-or-key fork + M6 alternative (founder digest A/B) — founder-pending; record-only carry, not a wave blocker.
- **L-1 carry (jenny):** append the wave-28 + wave-29 under-floor override-ship entries to product-decisions.md (wave-28 gap).

## Gate verdict log: <appended by head-builder at B-6>

## Block-exit handoff
```yaml
build_block_status: complete
branch: wave-29-presence-members-debt
stages_run: [B-0, B-1, B-2, B-4, B-5, B-6]
stages_skipped: [D-block (design_gap_flag=false), B-3 (backend-only)]
review_verdict: APPROVE
deviations_logged: ["subagent commit-trailer branding nit (Sonnet 4.6) → L awareness"]
fix_up_commits: []
last_commit_sha: c6e8491
ready_for_ci: true
```
