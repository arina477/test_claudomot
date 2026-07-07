# Wave 72 — B-block review artifacts

**Block:** B (Build)
**Wave topic:** Account self-deletion / right-to-erasure (M10 first slice) — soft-delete + PII scrub + session-revoke + both-doors re-auth block + owned-server guard + Danger-Zone UI
**Block exit gate:** B-6
**Status:** in-progress

## Stage deliverables

| Stage | Deliverable file | Status | Notes |
|---|---|---|---|
| B-0 | process/waves/wave-72/stages/B-0-branch-and-schema.md | done | schema ran: users.deleted_at (migration 0027) |
| B-1 | process/waves/wave-72/stages/B-1-contracts.md | done | DeleteAccount DTO authored (task e11f8746) |
| B-2 | process/waves/wave-72/stages/B-2-backend.md | pending | account-deletion.service + POST /profile/delete + both re-auth doors + owner guard (task 9658fb0b) |
| B-3 | process/waves/wave-72/stages/B-3-frontend.md | pending | Danger-Zone UI per settings-privacy.html Panel 5 (task 898490b1) |
| B-4 | process/waves/wave-72/stages/B-4-wiring.md | pending | |
| B-5 | process/waves/wave-72/stages/B-5-verify.md | pending | |
| B-6 | process/waves/wave-72/stages/B-6-review.md | pending | |

## Block-specific context

- **Spec contract:** `tasks` row 9658fb0b-567a-44f7-b873-c8d110e7d391 (DB); spec at process/waves/wave-72/stages/P-2-spec.md
- **Branch name:** wave-72-account-deletion
- **claimed_task_ids:** [9658fb0b-567a-44f7-b873-c8d110e7d391, e11f8746-e85f-4900-ac82-a08c50f147d3, 898490b1-e658-4968-adfd-e75a85c75864]
- **New deps added this wave:** none (SuperTokens SDK already present)
- **New env vars added this wave:** none
- **Schema changes this wave:** users.deleted_at (timestamptz nullable) + Drizzle migration
- **B-1 fast-path approved:** false (contract surface changes — new DTO)
- **Files implemented (cumulative):** <updated at B-2, B-3, B-4>
- **Deviations from plan logged this block:** none

## Carry-forward from P-4 gate (builder must honor)

1. **B-2 AppModule registration:** PrivacyModule was NOT yet registered in AppModule (deferred prior wave). The delete endpoint's module MUST be registered in AppModule this wave — else POST /profile/delete never mounts. Verify route is reachable, not just defined.
2. **Both re-auth doors (hard AND):** signIn override AND session-verify guard, each rejecting deleted_at IS NOT NULL. Ignore P-3 Approach §2 stale "and/or" phrasing (non-binding; spec AC is source of truth).
3. **avatar_key in scrub set:** post-delete users.avatar_key IS NULL.
4. **Owned-server guard = data-integrity/UX justification** (not a phantom FK — soft-delete UPDATEs the owner row, FK never fires).
5. **T-8 must exercise:** no-IDOR own-account-only; re-auth blocked on BOTH doors (fresh-login AND replayed-session); owner-block 409 + server list; PII-scrub no-residue incl. avatar_key.

## Open escalations carried into gate

none

## Gate verdict log

<appended by fresh head-builder spawn at B-6 Action 1; one entry per attempt>
