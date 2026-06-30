# L-1 — Docs (wave-11)

**Block:** L (Learn), stage L-1 (∥ L-2). Mode: per `.autonomous-session`. head-learn owns the block.
**Wave:** persistent verified prod test fixture (user-id 21984eb2; POST /servers 201 proof; creds gitignored). V-APPROVED. PR#22.
**Scope:** ops / test-infra. Config/docs/script-only diff — no app code, no migration, C-2 deploy correctly skipped.

## Action 1 — CHANGELOG entry

**No CHANGELOG entry added — skip, cited.** Wave-11 shipped zero user-facing change: the deliverable is a persistent verified prod test account used internally to live-verify authed paths. No new/changed/fixed/removed/deprecated user-facing surface. Per the brief's judgment clause, the CHANGELOG has **no `Internal` section** (only `Added` / `Fixed` under `[Unreleased]`), so no entry is warranted and inventing an `Internal` section for a single test fixture would be noise. The CHANGELOG remains a release-note of user-facing change; the fixture's record lives in `command-center/testing/test-accounts.md` (gitignored) and the wave transcript.

- `changelog_entry_added: false`
- Verification: `grep -ni internal CHANGELOG.md` → no match; CHANGELOG `[Unreleased]` carries only `### Added` / `### Fixed`.

## Action 2 — Milestone delta

Milestone touched (via `tasks.milestone_id` on the claimed task `4a2ad286`):

| milestone | title | status before | status after |
|---|---|---|---|
| `6198650e-f4e0-44dc-9b0a-6550f01f9f82` | M3 — Real-time messaging | in_progress | in_progress (no transition) |

Child-task counts after L-2 marked `4a2ad286` done:

```
done_count = 1   open_count = 3
```

`open_count = 3` (> 0) → **M3 stays `in_progress`; no `done` transition.** Mechanical, no judgment escalation needed.

The 3 open M3 child tasks are all carried tech-debt / M2-forward primitives, NOT messaging-feature scope:

| task (short) | status | nature |
|---|---|---|
| `46f16288` Add browser E2E coverage for the authed create-server flow | todo | carried test-debt |
| `25523fb0` Add a real-Postgres mid-transaction-failure rollback test for create-server | todo | carried test-debt |
| `d058283d` Rotate permanent server invite_code (owner-gated regenerate) | todo | M2-deferred feature |

**M3's actual real-time-messaging feature scope is UNDECOMPOSED** — zero messaging-feature tasks exist under M3. This wave was the test-infra ENABLER: the verified fixture now unblocks live-verifying M3's authed message paths (the exact gap that justified wave-11). Combined with the brain fallback threshold (< 3 open feature-bearing tasks), this is a `backlog-stockout` signal for N-1.

**N-1 carry-forward flag — decompose M3's FIRST messaging bundle.** Real-time messaging via Socket.IO per the locked architecture. Likely bundle shape: `messages` table + send/list message API + Socket.IO gateway + message UI; reuses the wave-10 `ChannelPermissionGuard`. The verified fixture enables T-8 live-verification of the authed message paths in that bundle (and the freshly-promoted T-8 rule 1 now mandates it).

- `roadmap_skip_reason: ""` (milestone progressed-but-not-transitioned; delta recorded, not skipped)

## Action 3 — README touchups

**Skip — nothing user-facing changed.** No new CLI command/flag, no new env var, no new install step, no breaking change. Test-account provisioning is an internal mechanism recorded in gitignored `test-accounts.md`.

- `readme_sections_touched: []`

## Action 4 — Commit

FS-side touchups committed in the L-block batch commit (CHANGELOG unchanged; this deliverable + checklist + L-2 artifacts). Milestone delta required no DB write (M3 unchanged). See commit SHA in handoff.

---

```yaml
l_stage_verdict: COMPLETE
verdict_evidence:
  - "CHANGELOG.md: no entry (test-infra, no user-facing change, no Internal section)"
  - "milestones: 6198650e M3 unchanged (in_progress; open_count=3); no transition"
  - "README.md: no change (nothing user-facing)"
changelog_entry_added: false
roadmap_milestones_progressed: [{milestone: "6198650e M3 — Real-time messaging", before: in_progress, after: in_progress}]
roadmap_skip_reason: ""
readme_sections_touched: []
note: "M3 messaging feature scope undecomposed; N-1 flag: decompose M3 first messaging bundle (backlog-stockout). Verified fixture now enables T-8 live-verify of authed message paths."
```

## Exit criteria

- [x] CHANGELOG: no-entry decision recorded with citation (test-infra, no Internal section).
- [x] Milestone delta evaluated; M3 stays in_progress (open_count=3); recorded.
- [x] README skip recorded (nothing user-facing).
- [x] Commit pushed (L-block batch).
- [x] `l_stage_verdict: COMPLETE`.
- [x] checklist L-1 row checked.
