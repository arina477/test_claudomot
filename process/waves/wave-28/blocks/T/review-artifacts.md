# Wave 28 — T-block review artifacts

**Block:** T (Test)
**Wave topic:** owner-ONLY `POST /servers/:id/invite-code/rotate` — CSPRNG regenerate of permanent `servers.invite_code` to invalidate a leaked permanent invite link. Backend-only (apps/api), no schema/migration, no UI.
**Block exit gate:** T-9
**Status:** gate-passed

## Stage deliverables

| Stage | Deliverable file | Pattern | Status | Notes |
|---|---|---|---|---|
| T-1 | process/waves/wave-28/stages/T-1-static.md | ci-verified | done | typecheck+lint green on 6eb62e4 (run 28532913181); 0 bypasses in code diff |
| T-2 | process/waves/wave-28/stages/T-2-unit.md | ci-verified | done | 402 unit pass; rotate service+controller specs audited; 23505-retry test proven non-theater |
| T-3 | process/waves/wave-28/stages/T-3-contract.md | skipped | done | no shared contract surface (inline DTO, B-1 skipped, no Zod/OpenAPI) |
| T-4 | process/waves/wave-28/stages/T-4-integration.md | ci-verified | done | 7 real-PG rotate cases EXECUTED nonzero in CI (CI-rule-5 verified); AC1-5 |
| T-5 | process/waves/wave-28/stages/T-5-e2e.md | skipped | done | no user-visible UI (regenerate-link UI keep-OUT); C-2 did 404→401 route liveness |
| T-6 | process/waves/wave-28/stages/T-6-layout.md | skipped | done | non-UI wave |
| T-7 | process/waves/wave-28/stages/T-7-perf.md | skipped | done | not heavy; single owner-gated endpoint |
| T-8 | process/waves/wave-28/stages/T-8-security.md | active | done | LIVE authz matrix: unauth 401, non-owner 403, owner 2xx, old-link 404, new-link 200, CSPRNG proven |
| T-9 | process/waves/wave-28/stages/T-9-journey.md | active | gate | block-exit gate + annotation-only journey regen |

## Block-specific context

- **Wave topic:** owner-ONLY invite-code rotation (leaked-permanent-link invalidation).
- **wave_type:** single-spec / backend (auth-adjacent → T-8 fires; auto-promoted to auth for T-8 purposes via auth-boundary touch).
- **Stages skipped (with reasons):** T-3 (no contract surface), T-5 (no UI), T-6 (non-UI), T-7 (not heavy).
- **Cumulative findings count:** 2 (both LOW/non-blocking → V-2).

## Findings aggregation

Findings written incrementally to `process/waves/wave-28/blocks/T/findings-aggregate.md`. Aggregate is the canonical V-2 input.

## Open escalations carried into gate

none

## Gate verdict log

<appended by fresh head-tester spawn at T-9 Action 0>

---

## Gate verdict log
- Attempt 1 (head-tester fresh spawn arina-89ejyn-t9-gate): **APPROVED**. All non-skipped layers prove a security-observable outcome with concrete non-fabricated evidence; T-4 CI-rule-5 nonzero-execution verified; T-8 live non-owner-403 is a genuine load-bearing authz probe. 2 LOW findings → V-2, no critical/high.

## Block exit / handoff
```yaml
test_block_status:    complete
stages_run:           [T-1, T-2, T-4, T-8, T-9]
stages_skipped:
  - {stage: T-3, reason: "no contract surface — inline DTO, B-1 skipped, no Zod/OpenAPI/shared-type/SDK"}
  - {stage: T-5, reason: "no user-visible UI — regenerate-link UI keep-OUT; backend endpoint"}
  - {stage: T-6, reason: "non-UI wave — no visual/layout surface"}
  - {stage: T-7, reason: "not heavy — single owner-gated endpoint, no bundle/perf surface"}
findings_total:       2
findings_critical:    0
findings_aggregate:   process/waves/wave-28/blocks/T/findings-aggregate.md
journey_regen:        annotation-only (no UI touched; rotate endpoint annotated, wave-9 rotation-gap closed)
ready_for_verify:     true
```
