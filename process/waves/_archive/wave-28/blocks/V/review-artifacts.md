# Wave 28 — V-block review artifacts

**Block:** V (Verify)
**Wave topic:** Invite-code rotate — owner-ONLY `POST /servers/:id/invite-code/rotate` regenerating CSPRNG `servers.invite_code` (LIVE: api-production-b93e.up.railway.app, merge 8996230)
**Block exit gate:** V-3
**Status:** gate-passed

## Stage deliverables
| Stage | Deliverable file(s) | Status | Notes |
|---|---|---|---|
| V-1 | stages/V-1-{karen,jenny,summary}.md | done | karen APPROVE + jenny APPROVE (live deployed state) |
| V-2 | stages/V-2-triage.md | done | 0 blocking; F28-T8a spec-gap→fast-fix; F28-T8b + count-typo noise |
| V-3 | stages/V-3-fast-fix.md | done | head-verifier APPROVED; F28-T8a spec reconciled to 201 (0 code LOC); gate-passed |

## Block-specific context
- **Wave topic:** owner-ONLY rotate endpoint invalidating leaked permanent invite links (CSPRNG regenerate).
- **T-block findings handed off:** 2 LOW (findings-aggregate.md) — F28-T8a (spec AC says "200", live returns 201 NestJS @Post default) + F28-T8b (403-vs-404 existence oracle, B-6 accepted-debt).
- **Karen verdict:** APPROVE.
- **jenny verdict:** APPROVE.
- **In-scope fast-fix candidates:** pending — set at V-2.
- **Out-of-scope findings re-routed to B:** pending.
- **Fast-fix cycles run:** 0

## Open escalations carried into gate
- M5 park-or-key fork (founder decision) — founder-pending since digest 2026-07-01; record-only carry, not a wave blocker.

## Gate verdict log
<appended by fresh head-verifier spawn at V-3 Action 1>

## Block-exit handoff
```yaml
verify_block_status:    complete
karen_verdict:          APPROVE
jenny_verdict:          APPROVE
triaged_findings:
  blocking_resolved:    []
  non_blocking_tagged:  [F28-T8a (spec reconciled to 201 in-wave, no task row)]
  noise_suppressed:     2   # F28-T8b existence-oracle accepted-debt + karen 6-vs-7 count typo
fast_fix_cycles:        1   # 0 code LOC (spec-doc reconciliation)
ready_for_learn:        true
```
