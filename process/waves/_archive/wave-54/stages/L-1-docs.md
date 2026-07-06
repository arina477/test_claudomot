# L-1 — Docs (wave-54)

Verify-and-harden wave. Backend-only (internal `WS_GENERIC_ERROR` constant + regression-lock
tests across study-timer / messaging / presence Socket.IO gateways). Merged PR #69, LIVE.

## Action 1 — CHANGELOG
Added 1 bullet under **Changed** (CHANGELOG.md:94, #69):
> Real-time study rooms, messaging, and presence now share one plain error reply for bad input and
> are covered by durable tests that confirm they never leak internal details while still refusing
> unauthorized requests, so the protection can't silently regress. (no visible change) (#69)

Section rationale: **Changed**, not **Security**. The info-disclosure class was already closed at
#68 (wave-53). Wave-54 is hardening + test coverage (canonical error constant + regression-lock
proving class stays closed + authz preserved), NOT a patch for a vuln that shipped to users. House
style matches the existing test-hardening entries (CHANGELOG.md:92-93, "no visible change").

## Action 2 — Milestone delta
Touched milestone: M8 `84e17739-af5e-4396-beb9-b6f3d6836fc4` (Educator tools & deeper academics).
- Pre-close: done=34, open=8. Post-close (c52a7a52 done): done=35, open=7.
- open_count=7 > 0 → M8 stays `in_progress`. NO transition. Mechanical no-op (automatic mode, zero
  ambiguity → no BOARD). No `milestones` UPDATE, no product-decisions append.
- open_count=7 ≥ 3 → NOT a backlog-stockout flag for N-1.
- STRATEGIC FLAG for N-1: next seed = `344eabde` (who_can_dm='server-members' privacy control),
  flagged HIGH priority. M8 headline scope long shipped; open tail = DM-polish + security/scale
  hardening stragglers, no net-new headline scope. Milestone-disposition judgment deferred to N-1.

## Action 3 — README
SKIPPED — backend-only. No new env var, CLI command/flag, install step, or breaking change.

## Action 4 — Commit
- `docs: L-1 wave-54 closeout (changelog)` → 278210f, pushed to origin/main.

---

```yaml
l_stage_verdict: COMPLETE
verdict_evidence:
  - "CHANGELOG.md:94"
  - "README.md commit: (skipped — backend-only)"
changelog_entry_added: true
roadmap_milestones_progressed: [{milestone: "M8 (84e17739)", before: in_progress, after: in_progress}]
roadmap_skip_reason: ""
readme_sections_touched: []
note: "M8 stays in_progress (open=7 post-close); mechanical no-op, no transition. Next-seed flag for N-1: 344eabde (who_can_dm privacy control), HIGH priority. CHANGELOG entry is Changed (not Security): hardening + test coverage of an already-closed class."
```
