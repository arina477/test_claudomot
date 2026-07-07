# Wave 73 — B-block review artifacts

**Block:** B (Build)
**Wave topic:** M10 privacy-events audit log — privacy_events table + AppendPrivacyEvent service + 4 non-blocking after-commit write hooks + "Your privacy activity" read list
**Block exit gate:** B-6
**Status:** in-progress

## Stage deliverables

| Stage | Deliverable file | Status | Notes |
|---|---|---|---|
| B-0 | process/waves/wave-73/stages/B-0-branch-and-schema.md | done | privacy_events (migration 0028) |
| B-1 | process/waves/wave-73/stages/B-1-contracts.md | done | privacy-event DTO (task 03940edd) |
| B-2 | process/waves/wave-73/stages/B-2-backend.md | done | service + 4 hooks + read endpoint + live-DB test (task 156aa2ee) |
| B-3 | process/waves/wave-73/stages/B-3-frontend.md | pending | "Your privacy activity" panel (task 5a2521bc) |
| B-4 | process/waves/wave-73/stages/B-4-wiring.md | pending | |
| B-5 | process/waves/wave-73/stages/B-5-verify.md | pending | |
| B-6 | process/waves/wave-73/stages/B-6-review.md | pending | |

## Block-specific context

- **Spec contract:** tasks row 156aa2ee (DB); pointer at process/waves/wave-73/stages/P-2-spec.md
- **Branch name:** wave-73-privacy-audit-log
- **claimed_task_ids:** [156aa2ee, 03940edd, 5a2521bc]
- **New deps added this wave:** none
- **New env vars added this wave:** none
- **Schema changes this wave:** privacy_events table (reports.ts idiom, no pgEnum, actor_id text FK no-cascade, jsonb context, (actor_id, created_at desc) index) + Drizzle migration

## Carry-forward from P-4 gate (builder must honor)
1. **updatePrivacy blind-UPDATE:** PrivacyService.updatePrivacy UPDATEs without reading old values — B-2 must PRE-READ (or reuse getPrivacy) to populate {visibilityFrom,visibilityTo} for the privacy_settings_changed context.
2. **PII discipline:** minimal-non-PII context enforced by convention only — B-2 must ensure NO display_name/email/message-body/token in any of the 4 hook payloads; the LIVE-DB per-seam integration test should ALSO assert no-PII in the written row.
3. **Per-seam LIVE-DB assertion (highest risk):** B-6/V verify each hook FIRES at its seam (a real privacy_events row after each of the 4 real actions), never hook-presence.
4. **Best-effort non-blocking:** a logging failure MUST NOT fail/rollback the underlying user action (mirror deleteAccount's post-commit best-effort revoke idiom).
5. **security_scope_flag=true:** new session-guarded read route + privacy hooks → T-8 tightened gate.

## Open escalations carried into gate

none

## Gate verdict log

<appended by fresh head-builder spawn at B-6 Action 1>
