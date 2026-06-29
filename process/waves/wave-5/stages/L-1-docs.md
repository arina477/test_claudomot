# L-1 — Docs (wave-5, M1 hardening)

## Action 1 — CHANGELOG entry
Appended under `[Unreleased]` in `CHANGELOG.md`:
- **Added** (2 bullets): sign-in rate-limiting / abuse protection (#12, #14); browser E2E + protected-branch rules on every change (#12, #15).
- **Fixed** (1 bullet): accurate /health version reporting + the startup crash that took the live API offline (#13).

Keep-a-changelog discipline: rate-limiting is preventive in-same-wave on the auth flow → **Added**, not **Security** (Security section is reserved for shipped-then-patched vulnerabilities). Version-path boot-crash was a defect fixed in-wave → **Fixed**. Terse, 3 bullets, present-tense, user-facing, PR-cited.

## Action 2 — Milestone delta
Milestone touched: **M1 — Foundation: app shell, auth & profiles** (`5a6efc9e-9de7-4594-a75d-d45e30d9a417`, in_progress).

After L-2 marked the 5 complete wave-5 tasks `done`:
- M1 child-task counts: **10 done / 2 open** (verified: `SELECT count(*) FILTER (...) FROM tasks WHERE milestone_id='5a6efc9e...'` → `10|2`).
- `open_count = 2 > 0` → **no mechanical milestone transition fires.** M1 remains `in_progress`. No `milestones` row edited at L-1.

**The 2 remaining open M1 tasks are both FOUNDER-OPS, not engineering:**
| Task | Title | Status | Blocker |
|---|---|---|---|
| `84e09891` | Set Railway Bucket creds + verify avatar upload live | in_progress | founder-supplied Railway Bucket creds (avatar CODE shipped: server-side 2MB + presign + 503-graceful; only the live-upload verification is blocked) |
| `a1299e88` | Verify a Resend domain for transactional email | todo | founder DNS verification in the Resend console |

**M1's engineering is essentially complete.** Both remaining items need founder action in third-party consoles (creds / DNS), not code. This is a milestone-disposition judgment call.

**Disposition NOT decided at L-1 — flagged for N-1.** Under `automatic` mode the milestone-disposition judgment-call routes to BOARD (`L-1-roadmap-delta-wave-5`); the conservative, non-edit default (leave M1 in_progress, defer the close/keep decision to N-1) is taken here because N-1 owns milestone disposition + the M2 promotion decision. open_count > 0 means no mechanical close was warranted regardless.

**Flag for N-1 (verbatim):** "M1 engineering done; 2 founder-ops items remain (`84e09891` Railway Bucket creds, `a1299e88` Resend DNS) — N-1 decide: keep M1 open until founder provides, OR close M1 as engineering-complete + track the 2 founder-ops items separately, then promote M2 (servers/messaging — the core wedge)." Default if N-1 takes no action: M1 stays in_progress.

## Action 3 — README touchups
**SKIPPED.** Nothing new on README's user-facing surface this wave — rate-limiting, version reporting, CI E2E, and branch-protection are internal/ops changes (no new CLI command, env var, install step, or breaking change). README already accurately describes live accounts + profile customization.

## Action 4 — Commit
FS docs committed (CHANGELOG + L-block deliverables + observations). See commit SHA in L-2 deliverable / git log. Milestone progression required no DB edit (no transition fired).

```yaml
l_stage_verdict: COMPLETE
verdict_evidence:
  - "CHANGELOG.md: [Unreleased] Added +2 bullets, new Fixed section +1 bullet"
  - "milestones row UPDATE: none (M1 open_count=2 > 0, no transition; verified 10 done / 2 open)"
  - "README.md: skipped (no user-facing README-surface change)"
changelog_entry_added: true
roadmap_milestones_progressed: [{milestone: "M1 (5a6efc9e)", before: in_progress, after: in_progress}]
roadmap_skip_reason: ""
readme_sections_touched: []
note: >
  M1 = 10 done / 2 open after wave-5. Both open are FOUNDER-OPS (84e09891 Railway Bucket creds,
  a1299e88 Resend DNS), not engineering. Milestone disposition (keep open vs close-engineering-complete +
  promote M2) flagged for N-1; not decided at L-1. No milestone row edited (open_count > 0).
head_signoff:
  verdict: APPROVED
  stage: L-1
  reviewers: {}
  failed_checks: []
  rationale: >
    Single active block (this wave's claimed tasks all map to M1) captured; CHANGELOG covers every
    shipped surface terse and PR-cited; keep-a-changelog section routing correct (preventive rate-limit
    in Added not Security); milestone delta is mechanically accurate (10 done / 2 open) and the
    disposition judgment is correctly deferred to N-1 rather than force-closing M1 with 2 open
    founder-ops tasks. No blameful language. README skip justified.
  next_action: PROCEED_TO_N-1
```
