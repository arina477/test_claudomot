# L-1 — Docs (wave-8, M2 invites/join)

> Owner: head-learn (L-block gate). Mode: automatic. Concurrent with L-2.

## Action 1 — CHANGELOG entry

Appended under `## [Unreleased] → ### Added`, after the wave-7 (#17) line:

> - Invite people to your study server with a shareable link, and join a server from an invite after a quick preview of where you're headed. (#18)

CHANGELOG.md line ~26. One line, terse, user-facing, PR-cited per house style.

## Action 2 — Milestone delta

Touched milestone: **M2 — Servers, channels & membership** (`41e61975-c92e-49b1-9ae5-45498dd04925`, `in_progress`).

DB state after L-2 closed the 4 claimed tasks:

| metric | value |
|---|---|
| done_count | 8 |
| open_count | 3 |
| total | 11 |

`open_count = 3 > 0` → **M2 stays `in_progress`** (mechanical, no judgment-call ambiguity; no BOARD escalation under automatic mode).

- M2 progress: **2 bundles shipped** — wave-7 (create server + owner membership + General category + #general channel; 4 tasks) and wave-8 (two-tier invites + verified atomic join + invite-join page + share UI; 4 tasks) = **8 tasks done**.
- The 3 open M2 tasks are the wave-7 L-2 carry-forward follow-ups (verified-prod-fixture `4a2ad286`, real-PG mid-txn rollback test `25523fb0`, browser-E2E-for-create-server `46f16288`) — testing-infra debt, not feature scope.
- **M2 remaining feature scope (NOT yet decomposed into tasks):** RBAC/roles, channel-level visibility per role, kick/ban, server-settings, invite-revoke endpoint/UI, plus the 8a backfill + 8b permanent-default drifts queued this wave as follow-ups.

### Flag for N-1 (next-bundle decomposition)

M2 needs its **next bundle decomposed**. The M2 success metric ("organizer invites cohort → members join → see channels **per role**") is only partly satisfied: invites/join are live, but the "see channels per role" clause requires RBAC/roles. Recommended next bundle (N-1 Action 7 → milestone-decomposition-ritual):

1. **RBAC/roles** (natural next — completes the success-metric clause: roles + channel-level visibility per role), OR
2. **Server management** (invite-revoke + kick/ban + server-settings).

RBAC/roles is the stronger candidate (directly closes the M2 success metric).

## Action 3 — README touch

README.md line 16: extended the live-features sentence with invite/join:

> Share an invite link to bring others in, and join a server from an invite after previewing it.

Surgical; detail stays in CHANGELOG.

## Action 4 — Commit

FS-side touchups committed + pushed to main (single batched docs commit; see L-block closeout commit). Milestone progression is DB-side (no FS write needed — M2 stays in_progress).

---

```yaml
l_stage_verdict: COMPLETE
verdict_evidence:
  - "CHANGELOG.md:~26 (Added: invites/join #18)"
  - "milestones M2 41e61975: no transition (open_count=3 > 0; stays in_progress)"
  - "README.md:16 (invite/join sentence)"
changelog_entry_added: true
roadmap_milestones_progressed:
  - {milestone: "M2 — Servers, channels & membership", before: in_progress, after: in_progress}
roadmap_skip_reason: ""
readme_sections_touched: ["live-features paragraph (line 16)"]
note: "M2 = 8 done / 3 open / 11 total. 3 open = wave-7 testing-infra follow-ups. M2 feature scope (RBAC/roles, kick/ban, settings, invite-revoke) not yet decomposed — flagged for N-1 next-bundle (RBAC/roles recommended to close the success metric)."
```
