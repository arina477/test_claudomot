# Wave 9 — L-1 Docs

> Block: L (Learn), stage L-1 (∥ L-2). Owner: head-learn (sub-agent). Mode: automatic.
> Wave-9 = M2 invite-completion — invite-revoke + permanent-default share + 8a backfill. SHIPPED LIVE (PR#19, merge 371b9fe). V-APPROVED.

## Action 1 — CHANGELOG entry

Appended under `## [Unreleased] → ### Added` (CHANGELOG.md, the two lines following the #18 invites entry):

- Revoke a study server invite link so it stops working, with an honest "this link no longer works" message for anyone who opens a revoked one. (#19)
- The share dialog now defaults to your server's permanent invite link, with one-off limited invites moved to a secondary option. (#19)

Terse, user-facing, present-tense, PR-cited per L-1 house style. No `### Fixed`/`### Security` entries — wave-9 shipped no fixes to previously-released vulnerabilities; the revoke surface is preventive (T-8 covered) and lands in `### Added`.

## Action 2 — Milestone delta

Milestone touched (via `tasks.milestone_id` on the 3 claimed tasks): **M2 — Servers, channels & membership** (`41e61975-c92e-49b1-9ae5-45498dd04925`, `in_progress`).

Child-task count after L-2 closed this wave's bundle:

| done_count | open_count | total |
|---|---|---|
| 11 | 4 | 15 |

`open_count = 4 > 0` → milestone does NOT transition. **M2 stays `in_progress`** (mechanical, no judgment call — no founder/BOARD escalation needed).

M2 progress: **11 done** = create-server slice + invites/join slice (wave-8) + invite-completion slice (wave-9: revoke + permanent-default + 8a backfill). The invites feature is now COMPLETE end-to-end (create → join → revoke).

4 open M2 tasks remain:
- `46f16288` — browser E2E coverage for authed create-server flow
- `4a2ad286` — persistent verified prod test fixture
- `25523fb0` — real-Postgres mid-transaction-failure rollback test for create-server
- `d058283d` — rotate permanent server invite_code (owner-gated regenerate)

**RBAC NOT YET DECOMPOSED** — M2's success-metric clause "members see the right channels per role" is UNMET. RBAC is **wave-10's seed, unconditionally** (BOARD-bound from wave-8 N-1 seed decision: server_members.role_id + channel-level permissions + channel_permission_overrides + owner-lockout safeguard). The 3 M2 test/E2E follow-ups + the rotate-code task remain seed candidates but do NOT preempt RBAC.

**Flag for N-1:** wave-10 N-1 MUST prioritize RBAC decomposition over any remaining/new non-RBAC follow-up (BOARD-bound). `open_count=4` exceeds the brain-fallback stockout threshold (<3), so no `backlog-stockout` flag is raised — the queue has candidates.

## Action 3 — README touchups

SKIPPED. No CLI command/flag, env var, install step, or breaking change shipped. Revoke + share-default are in-app features fully captured in CHANGELOG; no README surface to touch.

## Action 4 — Commit

FS-side closeout batched with the L-2 deliverables + CI-PRINCIPLES adjudication (see L-2-distill.md). Milestone progression was a no-op (no transition), so no DB-side milestone write.

```yaml
l_stage_verdict: COMPLETE
verdict_evidence:
  - "CHANGELOG.md: 2 lines added under [Unreleased]/Added (#19 revoke + permanent-default share)"
  - "milestones: M2 41e61975 — no transition (open_count=4>0, stays in_progress)"
  - "README.md: skipped (no user-facing CLI/env/install/breaking change)"
changelog_entry_added: true
roadmap_milestones_progressed: [{milestone: "M2 (41e61975)", before: "in_progress (8 done)", after: "in_progress (11 done)"}]
roadmap_skip_reason: ""
readme_sections_touched: []
note: "M2 invites feature complete (create→join→revoke). RBAC = wave-10 seed, BOARD-bound, unconditional — flagged for N-1. M2 stays in_progress; 4 open follow-ups remain."
```
