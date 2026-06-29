# Wave 10 — L-1 Docs

**Block:** L (Learn), stage L-1 (∥ L-2). Mode: `automatic`. head-learn owns the block.
**Wave:** M2 RBAC capstone (roles + `can()` permission engine + channel-permissions + owner-lockout + role-management UI). SHIPPED LIVE via PR#20 + V-3 fast-fix PR#21. V-APPROVED, 176 tests.

## Action 1 — CHANGELOG entry

Appended one line under `## [Unreleased] → ### Added` (CHANGELOG.md line 29):

> Server roles and permissions: assign roles to members, choose which roles can see which channels, and owner-protection that stops a server from being left without an owner. (#20, #21)

Section choice: **Added** (new feature from the spec contract). Preventive security (RBAC server-side re-derivation, owner-lockout invariant) ships in the same wave → stays in Added per the L-1 Security-section rule (Security section is for shipped-then-patched vulns only; none here). Terse, one line, cites both PRs.

## Action 2 — Milestone delta (M2 — `41e61975-c92e-49b1-9ae5-45498dd04925`)

**Assessment: M2 is FEATURE-COMPLETE — success metric MET — but NOT transitioned here. Flagged for N-1.**

DB rollup after L-2 closed the 4 claimed tasks:

| metric | count |
|---|---|
| done_count | 15 |
| open_count | 4 |
| cancelled | 0 |

`open_count = 4 ≠ 0`, so the mechanical auto-transition condition (every child terminal) is NOT met. The 4 open rows are tech-debt / M3-forward primitives, NOT feature gaps:

| task id | status | nature |
|---|---|---|
| `4a2ad286-c068-406b-a2b3-4fee2a4d528b` | todo | verified-prod test fixture (cross-cutting test-infra debt) |
| `46f16288-4c13-4d8c-ad68-6925d1f51d84` | todo | browser E2E for authed create-server flow (test debt) |
| `25523fb0-edef-46e4-928b-55e78495d181` | todo | real-Postgres mid-txn rollback test (test debt) |
| `d058283d-a979-4528-9cd6-3ff48b4cfbc1` | todo | rotate permanent invite_code (M3-forward feature) |

**Feature-completeness verdict (recorded, not transitioned):** M2's success metric — "members join and see the right channels per role" — is now MET across the 4 shipped bundles (servers/channels, invites/join, invite-complete, RBAC). The RBAC bundle closed the "right channels per role" clause (channel-visibility-per-role live, owner-protection live). The 4 open tasks do NOT block M2's FEATURE completion.

**Why NOT transitioned here (mode-aware judgment routing):** closing M2 is a strategic milestone-disposition coupled to the M2→M3 pivot (real-time messaging — the next core milestone, which reuses `ChannelPermissionGuard`). That pivot is a strategic milestone boundary and possibly a founder touchpoint (as the M1→M2 pivot was). L-1 does NOT own that call; it is an N-1 trigger (`backlog-stockout` / milestone-disposition). The mechanical auto-transition gate did not fire (`open_count > 0`), so no `degenerate`/BOARD escalation is forced at L-1 either. **Recorded for N-1, no `milestones` row written.**

### Flag for N-1 (verbatim hand-off)

> M2 feature-complete + success-metric MET; the remaining open tasks are tech-debt + M3-forward primitives. N-1 decides: close M2 (reassign the tech-debt / M3-forward tasks to M3 or a hardening milestone) + promote M3 (real-time messaging — the next core milestone, reuses the `ChannelPermissionGuard`). The M2→M3 pivot is a strategic milestone boundary — possibly a founder touchpoint (like the M1→M2 pivot was). Also: pull `4a2ad286` (verified prod fixture) as a HIGH-priority wave-11 SEED task before any further authed-feature wave (see L-2 obs-1 — 4-wave recurrence); and carry the M3-deferred member-list endpoint + guard/owner-lockout route-wiring as M3-onboarding tasks.

## Action 3 — README touchups

**Skipped.** Nothing in the README surface changed (no new CLI command/flag, no new env var, no new install step, no breaking change). RBAC is an in-app feature; user-facing detail lives in the CHANGELOG entry.

## Action 4 — Commit

FS-side docs batched into the L-block closeout commit (CHANGELOG + principles promotions + deliverables). No `milestones` DB write (Action 2 deferred to N-1).

```yaml
l_stage_verdict: COMPLETE
verdict_evidence:
  - "CHANGELOG.md:29 (Added — RBAC roles & permissions, #20 #21)"
  - "milestone M2 41e61975: feature-complete assessment recorded, NOT transitioned (open_count=4; strategic M2→M3 pivot reserved for N-1)"
changelog_entry_added: true
roadmap_milestones_progressed: []        # M2 assessed feature-complete but transition deferred to N-1
roadmap_skip_reason: "M2 transition is a strategic milestone-disposition + M2→M3 pivot; auto-transition gate not met (open_count=4); flagged for N-1, possible founder touchpoint"
readme_sections_touched: []
note: "M2 SUCCESS-METRIC MET / FEATURE-COMPLETE across 4 bundles; 4 open tasks are tech-debt + M3-forward, non-blocking. N-1 owns close+pivot. 4a2ad286 recommended as wave-11 seed."
```

## Exit criteria

- [x] CHANGELOG entry appended (line 29).
- [x] Milestone delta resolved: assessed feature-complete, transition correctly deferred to N-1 with documented reason.
- [x] README: skip recorded (nothing user-facing in README surface).
- [x] Commits pushed (L-block batch).
- [x] `l_stage_verdict: COMPLETE`.
- [x] checklist L-1 row checked.

---

```yaml
head_signoff:
  verdict: APPROVED
  stage: L-1
  reviewers: {}
  failed_checks: []
  rationale: >
    Every active block's user-facing change is captured in one terse, blameless CHANGELOG
    line citing #20/#21. The milestone delta is handled with correct restraint: M2 is
    assessed feature-complete (success metric MET, 15/19 done, the 4 open are tech-debt /
    M3-forward) but NOT transitioned, because the M2 close is a strategic disposition coupled
    to the M2→M3 pivot that N-1 owns (and the mechanical auto-transition gate did not fire,
    open_count=4). No silent block skip; README skip recorded with reason. A clean, explicit
    N-1 flag carries the close+pivot decision and the 4a2ad286 wave-11-seed recommendation.
  next_action: PROCEED_TO_L-block-exit
```
